"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

export function SQLViewer({ sql }: { sql: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600 font-mono font-medium"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} className="text-gray-400" /> View Generated SQL
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50/50 overflow-x-auto text-[13px] font-mono leading-relaxed">
              <pre>
                <code>
                  {sql.split(" ").map((word, i) => {
                    const upper = word.toUpperCase();
                    if (["SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "DESC", "ASC", "LIMIT", "JOIN", "ON", "AS", "AND", "OR"].includes(upper.replace(/[^A-Z]/g, ''))) {
                      return <span key={i} className="text-teal-600 font-bold">{word} </span>;
                    }
                    if (word.startsWith("'") || word.endsWith("'")) {
                      return <span key={i} className="text-purple-600">{word} </span>;
                    }
                    return <span key={i} className="text-gray-800">{word} </span>;
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
