"use magnet";
import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import React from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string | React.ReactNode;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? "bg-gray-100 border border-gray-200 text-gray-600" 
            : "bg-teal-50 border border-teal-100 text-teal-600"
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed soft-shadow ${
          isUser 
            ? "bg-gray-100 text-gray-800 rounded-tr-sm" 
            : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
        }`}>
          {content}
        </div>
        
      </div>
    </div>
  );
}
