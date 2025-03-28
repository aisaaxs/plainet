import { NextRequest, NextResponse } from "next/server";
import { client } from "../../../../utils/plaidClient";
import prisma from "../../../../utils/prismaClient";
import { pinecone } from "../../../../utils/pineconeClient";
import { openAI } from "../../../../utils/openaiClient";

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
    }

    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
    const openAIModel = process.env.OPENAI_EMBEDDING_MODEL;
    if (!pineconeIndexName || !openAIModel) {
      console.error("Missing required environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const existingAccounts = await prisma.account.findMany({
      select: { accountId: true },
    });
    if (!existingAccounts.length) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 });
    }
    const existingAccountIds = new Set(existingAccounts.map((account) => account.accountId));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 730);
    const endDate = new Date();

    const plaidResponse = await client.transactionsGet({
      access_token,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count: 100 },
    });
    const transactions = plaidResponse.data?.transactions || [];

    const filteredTransactions = transactions.filter((tx) =>
      existingAccountIds.has(tx.account_id)
    );
    if (!filteredTransactions.length) {
      return NextResponse.json(
        { message: "No new transactions for existing accounts." },
        { status: 200 }
      );
    }

    const upsertOperations = filteredTransactions.map((tx) => ({
      where: { transactionId: tx.transaction_id },
      update: {
        accountId: tx.account_id,
        amount: tx.amount,
        date: new Date(tx.date),
        authorizedDate: tx.authorized_date ? new Date(tx.authorized_date) : null,
        category: tx.category?.[0] || null,
        subCategory: tx.category?.[1] || null,
        categoryId: tx.category_id || null,
        merchantName: tx.merchant_name || null,
        merchantLogoUrl: tx.logo_url || null,
        paymentChannel: tx.payment_channel || null,
        pending: Boolean(tx.pending),
        currencyCode: tx.iso_currency_code || null,
        transactionType: tx.transaction_type || null,
        website: tx.website || null,
        updatedAt: new Date(),
        personalFinanceCategory: tx.personal_finance_category
          ? tx.personal_finance_category.toString()
          : null,
        personalFinanceCategoryIconUrl: tx.personal_finance_category_icon_url || null,
      },
      create: {
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        date: new Date(tx.date),
        authorizedDate: tx.authorized_date ? new Date(tx.authorized_date) : null,
        category: tx.category?.[0] || null,
        subCategory: tx.category?.[1] || null,
        categoryId: tx.category_id || null,
        merchantName: tx.merchant_name || null,
        merchantLogoUrl: tx.logo_url || null,
        paymentChannel: tx.payment_channel || null,
        pending: Boolean(tx.pending),
        currencyCode: tx.iso_currency_code || null,
        transactionType: tx.transaction_type || null,
        website: tx.website || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        personalFinanceCategory: tx.personal_finance_category
          ? tx.personal_finance_category.toString()
          : null,
        personalFinanceCategoryIconUrl: tx.personal_finance_category_icon_url || null,
      },
    }));

    await prisma.$transaction(
      upsertOperations.map((op) => prisma.transaction.upsert(op))
    );

    const transactionDescriptions = filteredTransactions.map((tx) =>
      [
        `Transaction ID: ${tx.transaction_id}`,
        `Account ID: ${tx.account_id}`,
        `Amount: ${tx.amount} ${tx.iso_currency_code || "N/A"}`,
        `Date: ${new Date(tx.date).toLocaleString()}`,
        `Authorized Date: ${tx.authorized_date ? new Date(tx.authorized_date).toLocaleString() : "N/A"}`,
        `Category: ${tx.category?.[0] || "Uncategorized"}`,
        `Subcategory: ${tx.category?.[1] || "N/A"}`,
        `Personal Finance Category ID: ${tx.category_id || "N/A"}`,
        `Merchant Name: ${tx.merchant_name || "Unknown Merchant"}`,
        `Payment Channel: ${tx.payment_channel || "N/A"}`,
        `Pending: ${tx.pending ? "Yes" : "No"}`,
        `Transaction Type: ${tx.transaction_type || "N/A"}`,
        `Website: ${tx.website || "N/A"}`,
      ]
        .join("\n")
        .trim()
    );

    const embeddingResponses = await Promise.all(
      transactionDescriptions.map((desc) =>
        openAI.embeddings.create({
          model: openAIModel,
          input: desc,
        })
      )
    );

    const pineconeUpserts = filteredTransactions.map((tx, index) => ({
      id: tx.transaction_id,
      values: embeddingResponses[index]?.data[0]?.embedding || [],
      metadata: {
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        date: new Date(tx.date).toISOString(),
        authorizedDate: tx.authorized_date
          ? new Date(tx.authorized_date).toISOString()
          : "N/A",
        category: tx.category?.[0] || "N/A",
        subCategory: tx.category?.[1] || "N/A",
        categoryId: tx.category_id || "N/A",
        merchantName: tx.merchant_name || "N/A",
        merchantLogoUrl: tx.logo_url || "N/A",
        paymentChannel: tx.payment_channel || "N/A",
        pending: Boolean(tx.pending),
        currencyCode: tx.iso_currency_code || "N/A",
        transactionType: tx.transaction_type || "N/A",
        website: tx.website || "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        personalFinanceCategory: tx.personal_finance_category
          ? tx.personal_finance_category.toString()
          : "N/A",
        personalFinanceCategoryIconUrl: tx.personal_finance_category_icon_url
          ? tx.personal_finance_category_icon_url.toString()
          : "N/A",
      },
    }));

    const pineconeIndex = pinecone.index(pineconeIndexName);
    await pineconeIndex.namespace("transactions").upsert(pineconeUpserts);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Plaid transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}