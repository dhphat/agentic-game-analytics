"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

export function SQLViewer({ sql }: { sql: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const highlightSQL = (query: string) => {
    if (!query) return null;
    const lines = query.split("\n");
    const tokenRegex = /(\s+|--.*|'(?:''|[^'])*'|\b[a-zA-Z_][a-zA-Z0-9_]*\b|[-+*/=<>!]+|\d+(?:\.\d+)?|[(),.])/g;

    return lines.map((line, lineIdx) => {
      let match;
      const tokens: string[] = [];
      let lastIndex = 0;

      // Reset regex index for safety
      tokenRegex.lastIndex = 0;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          tokens.push(line.substring(lastIndex, match.index));
        }
        tokens.push(match[0]);
        lastIndex = tokenRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        tokens.push(line.substring(lastIndex));
      }

      const highlightedTokens = tokens.map((token, tokenIdx) => {
        if (/^\s+$/.test(token)) {
          return token;
        }
        if (token.startsWith("--")) {
          return (
            <span key={tokenIdx} className="text-gray-400 dark:text-slate-500 italic">
              {token}
            </span>
          );
        }
        if (token.startsWith("'")) {
          return (
            <span key={tokenIdx} className="text-purple-600 dark:text-purple-400">
              {token}
            </span>
          );
        }
        if (/^\d+(\.\d+)?$/.test(token)) {
          return (
            <span key={tokenIdx} className="text-amber-600 dark:text-amber-500">
              {token}
            </span>
          );
        }

        const upperToken = token.toUpperCase();
        const keywords = [
          "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", 
          "LIMIT", "JOIN", "LEFT", "RIGHT", "INNER", "ON", 
          "AS", "AND", "OR", "DESC", "ASC", "IN", "NOT", "NULL",
          "SUM", "AVG", "COUNT", "MIN", "MAX", "WITH", "LIKE", "HAVING"
        ];

        if (keywords.includes(upperToken)) {
          return (
            <span key={tokenIdx} className="text-teal-600 dark:text-teal-400 font-semibold">
              {token}
            </span>
          );
        }

        return <span key={tokenIdx} className="text-gray-800 dark:text-slate-350">{token}</span>;
      });

      return (
        <div key={lineIdx} className="min-h-[1.25rem] whitespace-pre">
          {highlightedTokens.length > 0 ? highlightedTokens : " "}
        </div>
      );
    });
  };

  return (
    <div className="w-full mt-4 bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-900/85 hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors text-xs text-gray-600 dark:text-slate-400 font-mono font-medium"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} className="text-gray-400 dark:text-slate-500" /> View Generated SQL
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-slate-800"
          >
            <div className="p-4 bg-gray-50/50 dark:bg-slate-950/40 overflow-x-auto text-[13px] font-mono leading-relaxed custom-scrollbar">
              <pre className="whitespace-pre">
                <code>
                  {highlightSQL(sql)}
                </code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
