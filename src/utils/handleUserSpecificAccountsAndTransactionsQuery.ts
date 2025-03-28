import { openAI } from "./openaiClient";
import { handleUserSpecificAccountsQuery } from "./handleUserSpecificAccountsQuery";
import { handleUserSpecificTransactionsQuery } from "./handleUserSpecificTransactionsQuery";

export async function handleUserSpecificAccountsAndTransactionsQuery(query: string): Promise<string> {
  try {
    const [accountsResponse, transactionsResponse] = await Promise.all([
      handleUserSpecificAccountsQuery(query),
      handleUserSpecificTransactionsQuery(query),
    ]);

    const combinedContext = `
        User Query: "${query}"

        Account Information:
        ${accountsResponse}

        Transaction Information:
        ${transactionsResponse}

        Please understand the query and the intent, and then use the account and transaction information to provide a helpful response.
    `.trim();

    const finalResponse = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: "You are a helpful personal finance assistant." },
        { role: "user", content: combinedContext }
      ],
      max_tokens: 200,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    return finalResponse.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't find the relevant information.";
  } catch (error) {
    console.error("Error in handleUserSpecificAccountsAndTransactionsQuery:", error);
    return "There was an error processing your accounts and transactions query.";
  }
}