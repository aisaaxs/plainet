import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import PlaidLinkComponent from "../components/plaidLink";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "PlaiNet",
  description:
    "An AI-Powered Personal Finance Tool, authored by Anitej Isaac Sharma",
};

async function getAccounts() {
  const res = await fetch(`http://localhost:3000/api/accounts/get`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch accounts");
  }
  return res.json();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let hasAccounts = false;

  try {
    const data = await getAccounts();
    hasAccounts = data?.accounts && data.accounts.length > 0;
  } catch (error) {
    console.error("Error fetching accounts in RootLayout:", error);
  }

  return (
    <html lang="en">
      <body className="antialiased w-screen h-screen grid grid-rows-[60px_auto]">
        <Navbar />
        {hasAccounts ? children : <PlaidLinkComponent />}
      </body>
    </html>
  );
}