"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap, BellRing, Bell, Minus } from "lucide-react";
import { API_URL } from "@/utils/config";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  title: string;
  description: string;
  severity: "high" | "critical";
  action?: {
    label: string;
    actionType: string;
    targetUserIds: string[];
  };
}

export function AlertWidget({ language }: { language: "en" | "vi" }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await fetch(`${API_URL}/api/anomalies`);
        if (res.ok) {
          const data = await res.json();
          setAnomalies(data.anomalies || []);
        }
      } catch (error) {
        console.error("Failed to fetch anomalies", error);
      }
    };
    
    setTimeout(fetchAnomalies, 2000);
  }, []);

  const handleAction = async (anomaly: Anomaly) => {
    if (!anomaly.action) return;
    
    toast.loading(language === "vi" ? "Đang xử lý..." : "Executing action...");
    try {
      const res = await fetch(`${API_URL}/api/action/send-giftcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: anomaly.action.targetUserIds,
          action_type: anomaly.action.actionType
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.dismiss();
        toast.success(data.message || (language === "vi" ? "Thành công!" : "Success!"), {
          style: { background: '#ffffff', border: '1px solid #10b981', color: '#10b981' }
        });
        setAnomalies(prev => prev.filter(a => a.id !== anomaly.id));
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast.dismiss();
      toast.error(language === "vi" ? "Xảy ra lỗi!" : "Action failed");
    }
  };

  if (anomalies.length === 0) return null;

  return (
    <>
      {/* Mini Toggle Button when hidden */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50 w-12 h-12 bg-white rounded-full border border-gray-200 text-red-500 hover:bg-gray-50 flex items-center justify-center group shadow-md"
          >
            <div className="relative flex items-center justify-center">
              <BellRing size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Widget */}
      <div className="fixed bottom-28 right-4 left-4 md:left-auto md:right-8 z-50 w-auto md:w-full md:max-w-sm flex flex-col-reverse gap-3 pointer-events-none">
        <AnimatePresence>
          {isExpanded && anomalies.map((anomaly, index) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative pointer-events-auto overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm"
            >
              <div className="p-4 flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertTriangle className={anomaly.severity === "critical" ? "text-red-500" : "text-orange-500"} size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className={`font-semibold text-sm ${anomaly.severity === "critical" ? "text-red-600" : "text-orange-600"}`}>
                      {anomaly.title}
                    </h4>
                    <div className="flex gap-1 -mr-2 -mt-2">
                      <button onClick={() => setIsExpanded(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title={language === "vi" ? "Thu gọn" : "Minimize"}>
                        <Minus size={14} />
                      </button>
                      <button onClick={() => setAnomalies(prev => prev.filter(a => a.id !== anomaly.id))} className="p-1 text-gray-400 hover:text-gray-600 rounded" title={language === "vi" ? "Đóng" : "Dismiss"}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{anomaly.description}</p>
                  
                  {anomaly.action && (
                    <button 
                      onClick={() => handleAction(anomaly)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
                    >
                      <Zap size={14} className="text-teal-500" />
                      {anomaly.action.label}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
