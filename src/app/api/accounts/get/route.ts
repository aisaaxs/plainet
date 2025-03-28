import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const accounts = await prisma.account.findMany();

    return NextResponse.json({ accounts: accounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}