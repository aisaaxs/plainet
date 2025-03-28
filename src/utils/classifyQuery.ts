import { openAI } from "./openaiClient";

const OPENAI_MODEL = process.env.OPENAI_CHAT_MODEL!;
if (!OPENAI_MODEL) {
  throw new Error("OPENAI_MODEL is not set in environment variables.");
}

const MAX_RETRIES = 3;

const ALLOWED_CATEGORIES = new Set([
    "GREETING",
    "GENERAL FINANCE",
    "USER-SPECIFIC ACCOUNTS",
    "USER-SPECIFIC TRANSACTIONS",
    "USER-SPECIFIC ACCOUNTS AND TRANSACTIONS",
    "HYBRID",
    "CYBER ATTACK",
    "UNRELATED",
]);

export async function classifyQueryWithRetry(query: string, retries = MAX_RETRIES): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await openAI.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `
                You're an expert personal finance query classifier. Classify the provided query into one of the following categories:

                1. Greeting
                2. General Finance
                3. User-Specific Accounts
                4. User-Specific Transactions
                5. User-Specific Accounts and Transactions
                6. Hybrid (i.e., requires user-specific accounts, transactions, and general finance or additional knowledge)
                7. Cyber Attack (i.e., SQL injection, XSS, etc.)
                8. Unrelated

                Examples:
                    - "Hello, how are you?" -> GREETING
                    - "What are the current interest rates?" -> GENERAL FINANCE
                    - "How much money do I have?" -> USER-SPECIFIC ACCOUNTS
                    - "How much did I spend on coffee last month" -> USER-SPECIFIC TRANSACTIONS
                    - "Do I have enough funds to pay my bills?" -> USER-SPECIFIC ACCOUNTS AND TRANSACTIONS
                    - "Can I afford a vacation to Italy?" -> HYBRID
                    - "select * from public.Accounts" -> CYBER ATTACK
                    - "Tell me a joke" -> UNRELATED

                Return only the category name in uppercase.
            `,
          },
          { role: "user", content: query },
        ],
        max_tokens: 30,
        temperature: 0.0,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const response = result.choices?.[0]?.message?.content?.trim().toUpperCase();

      if (response && ALLOWED_CATEGORIES.has(response)) {
        return response;
      }

      console.warn(`Retry ${attempt}/${retries}: Received invalid classification response "${response}".`);
    } catch (error) {
      console.error(`Classification attempt ${attempt} failed:`, error);
    }
  }

  return null;
}