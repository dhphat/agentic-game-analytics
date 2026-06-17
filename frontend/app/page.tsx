"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { DataDashboard, DataPayload } from "@/components/DataDashboard";
import { AlertWidget } from "@/components/AlertWidget";
import { motion, AnimatePresence } from "framer-motion";

import { Menu, Plus, MessageSquare, X, Trash2 } from "lucide-react";
import { API_URL } from "@/utils/config";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload?: DataPayload;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export default function Home() {
  const [language, setLanguage] = useState<"en" | "vi">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("analytics_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }
  }, []);

  // Save to localStorage when sessions change
  useEffect(() => {
    localStorage.setItem("analytics_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Save current messages to active session
  useEffect(() => {
    if (messages.length === 0 || !currentSessionId) return;
    
    setSessions(prev => {
      const sessionExists = prev.some(s => s.id === currentSessionId);
      
      if (!sessionExists) {
        const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? "..." : "");
        return [{ id: currentSessionId, title, messages, updatedAt: Date.now() }, ...prev];
      } else {
        return prev.map(s => s.id === currentSessionId ? { ...s, messages, updatedAt: Date.now() } : s);
      }
    });
  }, [messages, currentSessionId]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(Date.now().toString());
    setIsSidebarOpen(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  // Suggested questions from the last AI response, or defaults
  const lastPayload = messages.length > 0 ? messages[messages.length - 1]?.payload : undefined;
  const suggestedQuestions = lastPayload?.suggestedQuestions || (language === "vi" ? [
    "Cho tôi xem doanh thu theo hạng VIP",
    "/predict churn",
    "Có lỗi nghiêm trọng nào gần đây không?"
  ] : [
    "Show me revenue by VIP tier",
    "/predict churn",
    "Are there any critical bugs reported recently?"
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const lastPayloadObj = messages.length > 0 ? messages[messages.length - 1]?.payload : undefined;
      const lastSql = lastPayloadObj?.sql;
      
      let contextUserIds: string[] = [];
      for (let i = messages.length - 1; i >= 0; i--) {
        const payloadData = messages[i]?.payload?.data;
        if (Array.isArray(payloadData) && payloadData.length > 0) {
          const ids = payloadData.map((d: any) => d.user_id || d.USER_ID).filter(Boolean);
          if (ids.length > 0) {
            contextUserIds = ids.slice(0, 50);
            break;
          }
        }
      }

      let endpoint = `${API_URL}/api/chat`;
      let fetchOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language, last_sql: lastSql, last_user_ids: contextUserIds }),
      };

      if (text.trim().toLowerCase() === "/predict churn") {
        endpoint = `${API_URL}/api/predict-churn?language=${language}`;
        fetchOptions = { method: "GET" };
      }

      const res = await fetch(endpoint, fetchOptions);

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "vi" ? "Đây là kết quả phân tích:" : "Here is your analysis:",
        payload: data,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: language === "vi" ? "Xin lỗi, đã có lỗi xảy ra kết nối với máy chủ." : "Sorry, an error occurred connecting to the server." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isSplash = messages.length === 0;

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-transparent text-gray-900">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-2xl border-r border-gray-100/50 shadow-2xl md:shadow-none transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0 ml-0" : "-translate-x-full md:-ml-72"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100/50">
          <button 
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2.5 px-4 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus size={18} />
            {language === "vi" ? "Cuộc trò chuyện mới" : "New Chat"}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden ml-2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
            <div 
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === session.id ? "bg-white border-teal-100 shadow-sm shadow-teal-100/50" : "border-transparent hover:bg-gray-50/80 hover:border-gray-100"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <MessageSquare size={16} className={currentSessionId === session.id ? "text-teal-500" : "text-gray-400"} />
                <div className="flex-1 overflow-hidden">
                  <p className={`truncate text-sm font-medium ${currentSessionId === session.id ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {new Date(session.updatedAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => deleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center p-6 text-gray-400 text-sm mt-10">
              {language === "vi" ? "Chưa có lịch sử trò chuyện" : "No chat history"}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col h-full flex-1 relative min-w-0 transition-all duration-300">
        {/* Background Waves */}
        <div className={`absolute inset-0 pointer-events-none bg-waves-base bg-waves-cool transition-opacity duration-1000 ${isLoading ? "opacity-0" : "opacity-100"}`}></div>
        <div className={`absolute inset-0 pointer-events-none bg-waves-base bg-waves-warm transition-opacity duration-1000 ${isLoading ? "opacity-100" : "opacity-0"}`}></div>

      {/* Alert Widget */}
      <AlertWidget language={language} />

      {/* Top Header & Language Toggle */}
      <header className="absolute top-0 w-full p-6 md:p-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-xl backdrop-blur-md transition-all shadow-sm border border-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 cursor-default select-none" style={{ fontFamily: "'Google Sans', 'Product Sans', sans-serif" }}>
            <span className="font-light text-gray-900 tracking-tight text-lg hidden sm:inline">Agentic</span>
            <span className="font-light tracking-tight text-lg animate-gradient-text px-0.5">
              Game Analytic
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full p-1 shadow-sm">
          <button 
            onClick={() => setLanguage("en")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${language === "en" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-900"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage("vi")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${language === "vi" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-900"}`}
          >
            VI
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 w-full max-w-5xl mx-auto pt-24 md:pt-28">
        
        <AnimatePresence mode="wait">
          {isSplash ? (
            <motion.div 
              key="splash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center px-4 -mt-20"
            >
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-gray-800 mb-8 text-center" style={{ fontFamily: "'Google Sans', 'Product Sans', sans-serif" }}>
                {language === "vi" ? "Bạn muốn biết thông tin gì?" : "What do you want to know?"}
              </h1>
              <div className="w-full max-w-2xl relative z-40">
                <ChatInput 
                  onSend={handleSend} 
                  isLoading={isLoading} 
                  placeholder={language === "vi" ? "Hỏi bất cứ điều gì..." : "Ask anything..."}
                  defaultSuggestions={suggestedQuestions}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 custom-scrollbar">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                  >
                    <MessageBubble role={msg.role} content={msg.content} />
                    {msg.payload && (
                      <div className="mt-4 pl-0 md:pl-12">
                        <DataDashboard payload={msg.payload} />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 pl-12 text-gray-500 font-medium text-sm mt-4"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2">{language === "vi" ? "Đang suy nghĩ..." : "Thinking..."}</span>
                  </motion.div>
                )}
                <div className="h-32" ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area */}
              <div className="p-6 md:pb-12 sticky bottom-0 w-full flex justify-center">
                <ChatInput 
                  onSend={handleSend} 
                  isLoading={isLoading} 
                  placeholder={language === "vi" ? "Hỏi thêm..." : "Ask follow up..."}
                  defaultSuggestions={suggestedQuestions}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  </div>
  );
}
