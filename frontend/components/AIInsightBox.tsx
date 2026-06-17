"use client";

import { useState } from "react";
import { Lightbulb, Zap } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/utils/config";

interface ActionProp {
  label: string;
  actionType: string;
  targetUserIds: string[];
}

export function AIInsightBox({ insight, action }: { insight: string, action?: ActionProp }) {
  const [isExecuting, setIsExecuting] = useState(false);
  
  if (!insight) return null;

  const handleAction = async () => {
    if (!action) return;
    
    setIsExecuting(true);
    toast.loading("Executing action...");
    try {
      const res = await fetch(`${API_URL}/api/action/send-giftcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: action.targetUserIds,
          action_type: action.actionType
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.dismiss();
        toast.success(data.message || "Action executed successfully!", {
          style: { background: '#ffffff', border: '1px solid #14b8a6', color: '#14b8a6' }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to execute action");
    }
  };

  return (
    <div className="relative mt-4 p-4 bg-white border border-gray-100 rounded-xl overflow-hidden group transition-all">
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <Lightbulb size={16} className="text-teal-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-teal-700 mb-1 tracking-wide uppercase">AI Insight</h4>
            <p className="text-gray-700 text-[15px] leading-relaxed">
              {insight}
            </p>
          </div>
        </div>
        
        {action && (
          <div className="flex-shrink-0 flex items-center mt-3 sm:mt-0">
            <button 
              onClick={handleAction}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors shadow-sm"
            >
              <Zap size={16} />
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
