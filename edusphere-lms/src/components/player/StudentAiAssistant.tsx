import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend,
  FiX,
  FiCpu,
  FiRotateCcw,
  FiCopy,
  FiCheck,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { aiService } from '../../services/aiService';
import type { AiChatMessage } from '../../types';

interface StudentAiAssistantProps {
  className?: string;
}

export const StudentAiAssistant: React.FC<StudentAiAssistantProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialWelcomeMessage: AiChatMessage = {
    id: 'welcome-init',
    conversationId: 'session',
    sender: 'ai',
    text: "👋 Hi! I'm Student AI — your general-purpose assistant. Ask me anything: programming, math, science, writing, explanations, or general knowledge!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<AiChatMessage[]>([initialWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isSending]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleStartNewChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputMessage('');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: conversationId || 'session',
      sender: 'student',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await aiService.sendMessage({
        message: text,
        conversationId,
      });

      if (res.success && res.data && res.data.message) {
        setConversationId(res.data.conversationId);
        setMessages((prev) => [...prev, res.data!.message]);
      } else {
        throw new Error(res.message || 'Unable to get response from AI.');
      }
    } catch (err: any) {
      const errText =
        err.response?.data?.message ||
        err.message ||
        'AI service is temporarily unavailable. Please try again.';
      const errorMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        conversationId: conversationId || 'session',
        sender: 'ai',
        text: `⚠️ ${errText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Floating AI Launcher Button */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Open Student AI Assistant"
          className="relative group w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400/40 flex items-center justify-center p-0.5"
          aria-label="Toggle Student AI"
        >
          {/* Animated Gradient Glow */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 opacity-70 blur group-hover:opacity-100 transition duration-300 animate-pulse"></span>

          {/* Button Surface */}
          <span className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-slate-900 via-purple-950 to-indigo-900 text-white shadow-inner border border-purple-400/30">
            {isOpen ? (
              <FiX className="w-6 h-6 text-purple-200" />
            ) : (
              <div className="relative flex items-center justify-center">
                <FiCpu className="w-6 h-6 text-purple-300 group-hover:scale-110 transition-transform duration-200" />
                <FiZap className="w-3 h-3 text-amber-300 absolute -top-1.5 -right-1.5 animate-bounce" />
              </div>
            )}
          </span>

          {/* Hover Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-purple-500/30 backdrop-blur-md">
            Ask Student AI
          </span>
        </button>
      </div>

      {/* Floating AI Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[420px] h-[540px] max-h-[calc(100vh-7.5rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-500/20 dark:border-purple-500/30 flex flex-col overflow-hidden backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Student AI Assistant"
          >
            {/* Modal Top Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                  <FiCpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-extrabold tracking-wide text-white">Student AI</h3>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-300/90 font-medium">General-Purpose AI Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset / New Chat */}
                <button
                  onClick={handleStartNewChat}
                  title="Start New Chat"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="New Chat"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Modal"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              {messages.map((msg) => {
                const isStudent = msg.sender === 'student';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isStudent ? 'flex-row-reverse items-end' : 'flex-row items-start'}`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                        isStudent
                          ? 'bg-brand-600 text-white'
                          : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {isStudent ? <FiUser className="w-3 h-3" /> : <FiCpu className="w-3 h-3" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`group relative max-w-[85%] p-3 rounded-2xl transition-all ${
                        isStudent
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-xs shadow-sm'
                          : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed break-words text-[11.5px]">{msg.text}</p>

                      {/* Footer: timestamp + copy */}
                      <div
                        className={`flex items-center gap-1.5 mt-1 text-[9px] ${
                          isStudent ? 'text-indigo-200 justify-end' : 'text-slate-400 justify-between'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isStudent && (
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            title="Copy response"
                            className="opacity-0 group-hover:opacity-100 hover:text-purple-600 dark:hover:text-purple-300 transition-opacity p-0.5"
                          >
                            {copiedId === msg.id ? (
                              <FiCheck className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <FiCopy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Generating Indicator */}
              {isSending && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <FiCpu className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-2xl rounded-bl-xs border border-slate-200 dark:border-slate-700 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-300"></span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-medium">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form & Action Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything (e.g. explain concepts, code, math)..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium transition-all"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputMessage.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl p-2.5 shadow-md shadow-purple-500/20 shrink-0"
                aria-label="Send message"
              >
                <FiSend className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


