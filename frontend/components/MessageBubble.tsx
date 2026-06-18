"use client";
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
            ? "bg-gray-100 border border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" 
            : "bg-teal-50 border border-teal-100 text-teal-600 dark:bg-teal-950/30 dark:border-teal-900/50 dark:text-teal-400"
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed soft-shadow ${
          isUser 
            ? "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100 rounded-tr-sm" 
            : "bg-white border border-gray-100 text-gray-700 dark:bg-slate-900/55 dark:border-slate-800/80 dark:text-slate-200 rounded-tl-sm"
        }`}>
          {content}
        </div>
        
      </div>
    </div>
  );
}
