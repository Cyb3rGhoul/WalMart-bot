import React, { useState, useEffect } from "react";
import { Bot, User, Paperclip } from "lucide-react";
// import { TbBrandWalmart  } from 'react-icons/tb';
import ReactMarkdown from "react-markdown";
import axios from "axios";
import ApiService from "../services/apiService.js";

const Message = ({
  message,
  isBot,
  timestamp,
  isTyping = false,
  file,
  sessionId,
  setMessages
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ADD THIS FUNCTION to check if file is an image and create preview
  const getFilePreview = (file) => {
    if (file && file.type && file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 animate-fade-in">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          {/* <TbBrandWalmart className="w-4 h-4 text-white" /> */}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const sendToWalmart = async (groceryList) => {
    console.log("groceryList", groceryList);

    try {
      // Check if Chrome extension is available
      if (
        typeof window !== "undefined" &&
        window.chrome &&
        window.chrome.runtime &&
        window.chrome.runtime.sendMessage
      ) {
        window.chrome.runtime.sendMessage(
          "gfinhlnfmicdjmdepahmocjaamjahcdh", // Replace with actual extension ID
          {
            action: "SEND_GROCERY_LIST",
            groceryList: groceryList.map((item) => ({
              name: item.name,
              quantity: item.quantity,
            })),
          },
          (response) => {
            if (window.chrome.runtime.lastError) {
              console.log(
                "Extension not found. Please install the Walmart Grocery Extension."
              );
            } else {
              console.log("Grocery list sent to Walmart! Check your new tab.");
              console.log(timestamp);
              //call recommendation api
              axios
                .post(
                  "http://127.0.0.1:5050/recommend",
                  { groceryList },
                  { withCredentials: true }
                )
                .then(async (response) => {
                  console.log(
                    "Recommendation API response:",
                    response.data.recommendations
                  );
                  const result = await ApiService.generateResponse(
                    response.data.recommendations,
                    sessionId
                  );
                  console.log(result.message);
                  const botMessage = {
                    id: Date.now(),
                    text: result.message,
                    isBot: true,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  };
                  setMessages((prev) => [...prev, botMessage]);
                })
                .catch((error) => {
                  console.error("Error calling recommendation API:", error);
                });
            }
          }
        );
      } else {
        // Fallback for testing without extension
        console.log("Chrome extension not available.");
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  useEffect(() => {
    console.log(message);
    if (message && message.includes("json")) {
      try {
        // Extract only JSON content
        let cleaned =
          message.match(/\[.*\]/)?.[0] ||
          message.replace(/```json|```/g, "").trim();
        const groceryList = JSON.parse(cleaned);
        console.log("grocerylist",groceryList);
        sendToWalmart(groceryList);
      } catch (e) {
        console.log("Failed to parse grocery list JSON:", e);
      }
    }
    // eslint-disable-next-line
  }, [message]);

  if (message && message.includes("json")) {
    return null;
  }

  return (
    <div
      className={`flex items-start space-x-3 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${isBot ? "" : "flex-row-reverse space-x-reverse"}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
          isBot
            ? "bg-gradient-to-br from-blue-500 to-blue-600"
            : "bg-gradient-to-br from-gray-600 to-gray-700"
        }`}
      >
        {/* {isBot ? <TbBrandWalmart className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />} */}
      </div>
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
          isBot
            ? "bg-white border border-gray-100 rounded-2xl rounded-tl-md"
            : "bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl rounded-tr-md"
        } px-4 py-3 shadow-sm`}
      >
        {file && (
          <div
            className={`mb-2 p-2 rounded-lg border ${
              isBot
                ? "bg-gray-50 border-gray-100"
                : "bg-gray-800/50 border-gray-600"
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Paperclip
                className={`w-3 h-3 ${
                  isBot ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs ${
                  isBot ? "text-gray-600" : "text-gray-300"
                }`}
              >
                {file.name}
              </span>
              <span
                className={`text-xs ${
                  isBot ? "text-gray-500" : "text-gray-400"
                }`}
              >
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            {getFilePreview(file) && (
              <div className="mt-2">
                <img
                  src={getFilePreview(file)}
                  alt="Uploaded image"
                  className="max-w-48 max-h-48 rounded-lg border border-gray-200 object-cover shadow-sm"
                />
              </div>
            )}
          </div>
        )}
        <div
          className={`text-sm leading-relaxed ${
            isBot ? "text-gray-800" : "text-white"
          }`}
        >
          {<ReactMarkdown>{message}</ReactMarkdown> || ""}
        </div>
        {timestamp && (
          <p
            className={`text-xs mt-2 ${
              isBot ? "text-gray-400" : "text-gray-300"
            }`}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
};

export default Message;
