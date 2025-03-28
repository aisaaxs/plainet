import { NextRequest, NextResponse } from "next/server";
import { classifyQueryWithRetry } from "../../../utils/classifyQuery";
import { handleGreetingQuery } from "../../../utils/handleGreetingQuery";
import { handleGeneralFinanceQuery } from "../../../utils/handleGeneralFinanceQuery";
import { handleUserSpecificAccountsQuery } from "../../../utils/handleUserSpecificAccountsQuery";
import { handleUserSpecificTransactionsQuery } from "../../../utils/handleUserSpecificTransactionsQuery";
import { handleUserSpecificAccountsAndTransactionsQuery } from "../../../utils/handleUserSpecificAccountsAndTransactionsQuery";
import { handleHybridQuery } from "../../../utils/handleHybridQuery";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "A valid 'query' string is required." },
        { status: 400 }
      );
    }

    const category = await classifyQueryWithRetry(query);
    if (!category) {
      return NextResponse.json(
        { error: "Failed to classify query after multiple attempts." },
        { status: 500 }
      );
    }

    if (category === "GREETING") {
      const greetingResponse = await handleGreetingQuery(query);
      return NextResponse.json(
        { category, response: greetingResponse },
        { status: 200 }
      );
    } else if (category === "GENERAL FINANCE") {
        const generalFinanceResponse = await handleGeneralFinanceQuery(query);
      return NextResponse.json(
        { category, response: generalFinanceResponse },
        { status: 200 }
      );
    } else if (category === "USER-SPECIFIC ACCOUNTS") {
        const userSpecificAccountsResponse = await handleUserSpecificAccountsQuery(query);
        return NextResponse.json(
            { category, response: userSpecificAccountsResponse },
            { status: 200 }
        );
    } else if (category === "USER-SPECIFIC TRANSACTIONS") {
        const userSpecificTransactionsResponse = await handleUserSpecificTransactionsQuery(query);
        return NextResponse.json(
            { category, response: userSpecificTransactionsResponse },
            { status: 200 }
        );
    } else if (category === "USER-SPECIFIC ACCOUNTS AND TRANSACTIONS") {
        const userSpecificAccountsAndTransactionsResponse = await handleUserSpecificAccountsAndTransactionsQuery(query);
        return NextResponse.json(
            { category, response: userSpecificAccountsAndTransactionsResponse },
            { status: 200 }
        );
    } else if (category === "HYBRID") {
        const hybridResponse = await handleHybridQuery(query);
        return NextResponse.json(
            { category, response: hybridResponse },
            { status: 200 }
        );
    }

    return NextResponse.json(
        { category, response: "Apologies, but as your financial assistant, I'm only able to help within my set capabilities." },
        { status: 200 }
      );      
  } catch (error) {
    console.error("Error in classification API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}