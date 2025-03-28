import type { Metadata } from "next";
import "./globals.css";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import PlaidLinkComponent from "../components/plaidLink";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Banksy",
  description:
    "An AI-Powered Personal Finance ChatBot, authored by Anitej Isaac Sharma",
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
      <body className="antialiased w-screen h-screen">
        {hasAccounts ? children : <PlaidLinkComponent />}
      </body>
    </html>
  );
}