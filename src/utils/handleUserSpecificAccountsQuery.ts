import prisma from "./prismaClient";
import { openAI } from "./openaiClient";

export async function handleUserSpecificAccountsQuery(query: string): Promise<string> {
  try {
    const accounts = await prisma.account.findMany();

    if (accounts.length === 0) {
      return "No accounts found in your profile.";
    }

    const accountSummary = accounts.map(account => {
        return `Account "${account.name}" (Official Name: ${account.officialName}) (ID: ${account.accountId}) (account mask: ${account.mask}) has a current balance of ${account.currentBalance} ${account.isoCurrencyCode} and an available balance of ${account.availableBalance} ${account.isoCurrencyCode}`.trim();
    }).join("\n");

    const systemPrompt = `
        You are a personal finance assistant.
        The user wants to know details about their accounts based on the following data:

        ${accountSummary}

        Please answer the query concisely using the above account data.
        Return only the final answer.
    `.trim();

    const result = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 150,
      temperature: 0.5,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const response =
      result.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't retrieve your account information at this time.";
    return response;
  } catch (error) {
    console.error("Error handling user-specific accounts query:", error);
    return "An error occurred while processing your request.";
  }
}