"use client"
import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import React from 'react';
const PlaidLinkComponent = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await axios.post('/api/plaid/create-link-token', {
          client_user_id: 'user_good',
        });
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error('Error generating link token:', error);
      }
    };
    createLinkToken();
  }, []);
  const onSuccess = async (public_token: string) => {
    try {
      const response = await axios.post('/api/plaid/exchange-token', {
        public_token,
      });
      
      if (response.data.error) {
        console.error('Error exchanging public token:', response.data.error);
        return;
      }

      try {
        const { access_token } = response.data;
        if (!access_token) {
          throw new Error("Missing access_token");
        }

        const accountsResult = await axios.post("/api/accounts/store", {
          access_token,
        });
        if (accountsResult.data.error) {
          console.error("Accounts API error:", accountsResult.data.error);
          return;
        }

        const transactionsResult = await axios.post(
          "/api/transactions/store",
          { access_token }
        );
        if (transactionsResult.data.error) {
          console.error("Transactions API error:", transactionsResult.data.error);
          return;
        }

        console.log("Successfully stored financial data.");
        window.location.reload();
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
    }
  };
  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });
  return (
    <div className="w-full h-full bg-gray-950 flex justify-center items-center">
        {linkToken && (
            <button
                onClick={() => ready && open()}
                className={`w-auto h-auto bg-white text-black p-4 px-6 rounded-lg font-bold font-sans text-2xl cursor-pointer transition-colors duration-200 ${
                    ready ? "hover:bg-gray-200" : "opacity-50 cursor-not-allowed"
                }`}
            >
                Connect Bank
            </button>
        )}
    </div>  
  );
};
export default PlaidLinkComponent;