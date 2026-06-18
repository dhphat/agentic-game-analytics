"use client";

import React, { useState } from "react";
import { Maximize2, X } from "lucide-react";

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const formatDate = (val: string) => {
    if (typeof val === 'string' && val.includes('T00:00:00')) {
      return val.split('T')[0];
    }
    return val;
  };

  const renderTable = (isFull: boolean) => (
    <div className={`w-full overflow-x-auto ${isFull ? "max-h-[70vh]" : "max-h-80"} transition-all duration-300 custom-scrollbar`}>
      <table className="w-full text-sm text-left text-gray-700 dark:text-slate-300 relative">
        <thead className="text-xs text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-900/70 border-b border-gray-200 dark:border-slate-850 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-6 py-4 font-semibold tracking-wider whitespace-nowrap">
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-slate-800/80 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
              {columns.map((col) => {
                  if (col === "risk_score" && typeof row[col] === 'number') {
                    const score = row[col];
                    const colorClass = score > 80 ? "bg-red-500" : score > 50 ? "bg-orange-500" : "bg-teal-500";
                    return (
                      <td key={col} className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="w-10 font-medium">{score.toFixed(1)}%</span>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${colorClass}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col} className="px-6 py-4 whitespace-nowrap">
                      {typeof row[col] === 'number'
                        ? col.includes('usd') || col.includes('revenue') 
                          ? `$${row[col].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                          : row[col].toLocaleString()
                        : formatDate(row[col])}
                    </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="w-full mt-4 bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
        {renderTable(false)}
        {data.length > 5 && (
          <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 flex justify-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <Maximize2 size={14} />
              Xem toàn bộ dữ liệu
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950/40">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200">Chi tiết dữ liệu</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-250 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-0">
              {renderTable(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
