import { openAI } from "./openaiClient";
import { pinecone } from "./pineconeClient";
import prisma from "./prismaClient";

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL!;
const TOP_K = 3;

export async function handleUserSpecificTransactionsQuery(query: string): Promise<string> {
  try {
    const embeddingResponse = await openAI.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    if (!queryEmbedding) throw new Error("Failed to generate query embedding.");

    const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
    const denseSearch = await pineconeIndex.namespace("transactions").query({
      topK: TOP_K,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: false,
    });
    const matchedTransactionIds = denseSearch.matches
      ?.map(match => match.metadata?.transactionId)
      .filter(Boolean) as string[];

    const pineconeResults = await prisma.transaction.findMany({
      where: { transactionId: { in: matchedTransactionIds } },
    });

    const fields = [
      "category",
      "subCategory",
      "merchantName",
      "date",
      "authorizedDate",
      "paymentChannel",
      "pending",
      "transactionType",
      "website",
    ];
    const fieldCounts: { [key: string]: { [value: string]: number } } = {};
    fields.forEach(field => { fieldCounts[field] = {}; });
    pineconeResults.forEach(tx => {
      fields.forEach(field => {
        const val = tx[field];
        if (val) {
          fieldCounts[field][val] = (fieldCounts[field][val] || 0) + 1;
        }
      });
    });

    const filters: string[] = [];
    fields.forEach(field => {
      const counts = fieldCounts[field];
      let mostCommonValue: string | null = null;
      let maxCount = 0;
      for (const [val, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonValue = val;
        }
      }
      if (mostCommonValue) {
        filters.push(`"${field}" = '${mostCommonValue}'`);
      }
    });

    const filterPrompt = `
User Query: "${query}"

Pinecone Vector Database Results (JSON):
${JSON.stringify(pineconeResults, null, 2)}

Base Filters (derived from the most common values in the Pinecone results):
${filters.join(", ")}

Transactions Table Schema:

model Transaction {
    id              Int    @id @default(autoincrement())
    transactionId   String @unique
    accountId       String
    account         Account  @relation(fields: [accountId], references: [accountId], onDelete: Cascade)
    amount          Float
    date            DateTime
    authorizedDate  DateTime?
    category        String?
    subCategory     String?
    categoryId      String?
    personalFinanceCategory String?
    personalFinanceCategoryIconUrl String?
    merchantName    String?
    merchantLogoUrl String?
    paymentChannel  String?
    pending         Boolean
    currencyCode    String?
    transactionType String?
    website         String?
    createdAt       DateTime  @default(now())
    updatedAt       DateTime  @updatedAt
}

Instructions:
1. Read and fully understand the user query and its intent.
2. Examine the provided Pinecone results and the base filters.
3. Discard any base filters that are not relevant or could lead to incorrect results for the query.
4. Add any additional filters if needed to better address the query.
5. When considering transaction amounts, remember:
   - Positive amounts represent money leaving the account (expenses).
   - Negative amounts represent money entering the account (income).
   Based solely on the user query, use the appropriate condition (e.g., for spending use: amount > 0).
6. Generate a final SQL WHERE clause that incorporates all relevant filters.
7. The output must include the keyword "WHERE" at the beginning and contain no additional explanation or text.
8. If no filters are applicable, simply return an empty string.

Final Output Format:
WHERE <conditions>

Only output the final WHERE clause exactly as specified.
    `;

    const clauseResponse = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: "You are a SQL expert assisting a finance chatbot." },
        { role: "user", content: filterPrompt }
      ],
      temperature: 0.3,
    });
    
    const finalWhereClause = clauseResponse.choices[0].message.content?.trim();
    console.log("Final WHERE Clause:", finalWhereClause);
    
    const finalQuery = finalWhereClause
      ? `SELECT * FROM public."Transaction" ${finalWhereClause}`
      : `SELECT * FROM public."Transaction"`;
    
    const finalQueryResults = (await prisma.$queryRawUnsafe(finalQuery)) as any[];

    console.log("Final Query Results:", finalQueryResults);
    
    const formattedTransactions = finalQueryResults
      .map((tx: any) =>
        `- [${new Date(tx.date).toLocaleDateString()}] ${tx.transactionId} - $${tx.amount} - ${tx.category || "N/A"}`
      )
      .join("\n");
    
    const responsePrompt = `
User Query: "${query}"

Relevant Transactions:
${formattedTransactions || "No relevant transactions found."}

Based on the transactions above, provide a concise and helpful response that answers the user query.
Include totals, breakdowns, or any calculations if relevant. If no transactions are found, state that clearly.
Note: Negative amounts represent income and positive amounts represent expenses.
    `;
    
    const finalResponse = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: "You are a helpful financial assistant chatbot." },
        { role: "user", content: responsePrompt },
      ],
      temperature: 0.7,
    });
    
    return finalResponse.choices[0].message.content?.trim() ?? "Sorry, I couldn't find relevant transactions.";
  } catch (error) {
    console.error("Error in handleUserSpecificTransactionsQuery:", error);
    return "There was an error processing your transaction query.";
  }
}
