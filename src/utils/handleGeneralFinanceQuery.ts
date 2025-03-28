import { openAI } from "./openaiClient";

export async function handleGeneralFinanceQuery(query: string): Promise<string> {
  try {
    const result = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        {
          role: "system",
          content: `
                You are an expert personal finance assistant specializing in general finance topics. 
                
                Answer queries regarding topics such as interest rates, market trends, economic indicators, financial news, and all sorts of general, non-user-specific topics. 
                
                Provide concise, clear, and accurate information in plain language. Restrict responses to general finance topics only. Response should not be more than 200 words.
          `.trim(),
        },
        { role: "user", content: query },
      ],
      max_tokens: 400,
      temperature: 0.5,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const response =
      result.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't retrieve the information you requested.";
    return response;
  } catch (error) {
    console.error("Error handling general finance query:", error);
    return "I'm sorry, an error occurred while processing your request.";
  }
}