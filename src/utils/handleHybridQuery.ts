import { openAI } from "./openaiClient";
import { handleUserSpecificAccountsQuery } from "./handleUserSpecificAccountsQuery";
import { handleUserSpecificTransactionsQuery } from "./handleUserSpecificTransactionsQuery";

export async function handleHybridQuery(query: string): Promise<string> {
  try {
    const accountsResponse = await handleUserSpecificAccountsQuery(query);
    const transactionsResponse = await handleUserSpecificTransactionsQuery(query);

    const extraContextPrompt = `
        You are an expert finance advisor and analyst.
        Given the query: "${query}"
        Provide a detailed, comprehensive cost breakdown and financial insights relevant to the query.
        Your response must include specific monetary values (in USD or the appropriate currency), percentages, and clear financial metrics.
        
        Note: If the query is travel-related, include average trip costs, airfare, accommodation, food, and other typical expenses. A complete breakdown of costs is required.
        
        If the query is not travel-related, include relevant cost comparisons and expense breakdowns with percentage metrics. A detailed financial analysis is essential.

        Important: Ensure your answer is precise and data-driven, including at least three distinct monetary figures and one percentage metric.
        Return only the final additional context.
    `.trim();

    const extraContextResponse = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: "You are an expert finance advisor and analyst." },
        { role: "user", content: extraContextPrompt }
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const extraContext = extraContextResponse.choices[0].message?.content?.trim() || "";

    const combinedPrompt = `
        User Query: "${query}"

        Account Information:
        ${accountsResponse}

        Transaction Information:
        ${transactionsResponse}

        Additional Financial Context:
        ${extraContext}

        Based on the above information, provide a comprehensive answer to the user query.

        Your answer must include additional financial context as it is or more detailed. Alwyas include specific monetary values, percentage breakdowns, and actionable recommendations.

        Always include the account information at the start of the response, followed by the transaction details, and then the additional financial context.

        Limit responses to a maximum of 300 words.
    `.trim();

    const finalResponse = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: "You are a highly knowledgeable personal finance and travel expert." },
        { role: "user", content: combinedPrompt }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return finalResponse.choices[0].message?.content?.trim() || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in handleHybridQuery:", error);
    return "There was an error processing your hybrid query.";
  }
}
