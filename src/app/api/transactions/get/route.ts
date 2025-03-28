import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const transactions = await prisma.transaction.findMany();

    return NextResponse.json({ transactions: transactions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}