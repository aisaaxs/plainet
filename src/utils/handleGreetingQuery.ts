import { openAI } from "./openaiClient";

export async function handleGreetingQuery(query: string): Promise<string> {
  try {
    const result = await openAI.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL!,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly personal finance assistant. When someone greets you, respond with a warm greeting in a conversational style and ask how you can help.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 50,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const response =
      result.choices?.[0]?.message?.content?.trim() ||
      "Hello! How can I help you with your finances today?";
    return response;
  } catch (error) {
    console.error("Error handling greeting query:", error);
    return "Hello! How can I help you with your finances today?";
  }
}
