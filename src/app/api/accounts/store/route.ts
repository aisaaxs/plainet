import { NextRequest, NextResponse } from "next/server";
import { client } from "../../../../utils/plaidClient";
import prisma from "../../../../utils/prismaClient";

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
    }

    const plaidResponse = await client.accountsGet({ access_token });
    const accounts = plaidResponse.data?.accounts;
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found in Plaid" }, { status: 404 });
    }

    const upsertOperations = accounts.map((account) => ({
      where: { accountId: account.account_id },
      update: {
        availableBalance: account.balances.available ?? 0,
        currentBalance: account.balances.current ?? 0,
        isoCurrencyCode: account.balances.iso_currency_code ?? null,
        mask: account.mask ?? null,
        name: account.name || "Unnamed Account",
        officialName: account.official_name ?? null,
        persistentAccId: account.persistent_account_id ?? "",
        subtype: account.subtype ?? "",
        type: account.type ?? "",
        updatedAt: new Date(),
      },
      create: {
        accountId: account.account_id,
        availableBalance: account.balances.available ?? 0,
        currentBalance: account.balances.current ?? 0,
        isoCurrencyCode: account.balances.iso_currency_code ?? null,
        mask: account.mask ?? null,
        name: account.name || "Unnamed Account",
        officialName: account.official_name ?? null,
        persistentAccId: account.persistent_account_id ?? "",
        subtype: account.subtype ?? "",
        type: account.type ?? "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

    await prisma.$transaction(
      upsertOperations.map((operation) => prisma.account.upsert(operation))
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Plaid accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
