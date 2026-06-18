"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { ArrowRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  defaultSuggestions?: string[];
}

export function ChatInput({ 
  onSend, 
  isLoading, 
  placeholder = "Ask anything...",
  defaultSuggestions = [
    "Show me revenue by VIP tier",
    "Which users are at high risk of churning?",
    "Show me recent 1-star bug reports"
  ]
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const suggestions = input.trim() 
    ? defaultSuggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()))
    : defaultSuggestions;

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto z-40">
      <motion.div 
        className={`relative flex flex-col w-full rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-md border transition-all duration-300 ${
          isFocused 
            ? "border-gray-200 dark:border-slate-700 shadow-sm" 
            : "border-gray-100 dark:border-slate-800/80 hover:border-gray-200 dark:hover:border-slate-700"
        }`}
        initial={false}
        animate={{ borderRadius: isFocused && suggestions.length > 0 ? "16px" : "32px" }}
      >
        <div className="relative flex items-center w-full min-h-[60px] px-2">
          <div className="pl-4 text-gray-400 dark:text-slate-500">
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-500 dark:border-t-slate-300 rounded-full animate-spin inline-block" />
            ) : (
              <Search size={20} strokeWidth={2.5} />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none py-4 px-4 text-gray-808 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 text-lg"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`mr-2 p-2 rounded-full flex items-center justify-center transition-all duration-200 ${
              input.trim() && !isLoading
                ? "bg-black text-white hover:bg-gray-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-600"
            }`}
          >
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Dropdown Suggestions */}
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 dark:border-slate-800/80 overflow-hidden"
            >
              <div className="p-2 pb-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSend(suggestion);
                      setInput("");
                      setIsFocused(false);
                      inputRef.current?.blur();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-gray-700 dark:text-slate-300"
                  >
                    <Search size={16} className="text-gray-400 dark:text-slate-500" />
                    <span className="text-base">{suggestion}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
