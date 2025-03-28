"use client";

import React, { useState } from "react";
import { Audiowide } from "next/font/google";

const audiowide = Audiowide({
    weight: "400",
    subsets: ["latin"],
});

export default function Banksy() {
    const [userInput, setUserInput] = useState<string>("");
    const [botResponse, setBotResponse] = useState<string>("");

    const sendUserInput = () => {
        try {
            fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: userInput }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error("Error from bot response:", data.error);
                        setBotResponse("Internal server error");
                        return;
                    }

                    setBotResponse(data.response);
                });
        } catch (error) {
            console.error("Error sending user input:", error);
            setBotResponse("Internal server error");
        }
    };

    return (
        <div className="h-full w-full bg-gray-950 p-8 flex justify-center items-center">
            <div className="w-full h-full grid grid-cols-[300px_auto]">
                <div className="w-full h-full bg-gray-700 rounded-l-lg flex flex-col justify-center items-center p-4">
                    <div className={`w-full h-auto mb-auto flex justify-center items-center ${audiowide.className} text-2xl text-white`}>
                        Banksy
                    </div>
                </div>

                <div className="w-full h-full bg-gray-900 rounded-r-lg grid grid-rows-2">
                    <div className="w-full h-full flex justify-center items-center text-white font-sans font-medium text-lg text-center p-4">
                        {botResponse}
                    </div>

                    <div className="w-full h-full flex flex-col gap-y-4 justify-center items-center p-4">
                        <input type="text" name="plaibot-user-input" id="plaibot-user-input" className="w-full h-12 bg-white p-2 rounded-lg" onChange={(e) => setUserInput(e.target.value)} />

                        <button className="w-auto h-auto p-2 px-6 bg-blue-600 text-white capitalize font-bold text-xl rounded-full cursor-pointer hover:bg-blue-700" onClick={sendUserInput}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}