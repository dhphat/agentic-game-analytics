"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

export function SQLViewer({ sql }: { sql: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-900/85 hover:bg-gray-100 dark:hover:bg-slate-850/80 transition-colors text-xs text-gray-600 dark:text-slate-400 font-mono font-medium"
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
              <pre>
                <code>
                  {sql.split(" ").map((word, i) => {
                    const upper = word.toUpperCase();
                    if (["SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "DESC", "ASC", "LIMIT", "JOIN", "ON", "AS", "AND", "OR"].includes(upper.replace(/[^A-Z]/g, ''))) {
                      return <span key={i} className="text-teal-600 dark:text-teal-400 font-bold">{word} </span>;
                    }
                    if (word.startsWith("'") || word.endsWith("'")) {
                      return <span key={i} className="text-purple-600 dark:text-purple-400">{word} </span>;
                    }
                    return <span key={i} className="text-gray-800 dark:text-slate-300">{word} </span>;
                  })}
                </code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
