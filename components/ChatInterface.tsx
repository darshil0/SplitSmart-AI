import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Undo2,
  Redo2,
} from "lucide-react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  disabled: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  disabled,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Online & Thinking
              </span>
            </div>
          </div>
        </div>

        {/* Undo/Redo Controls */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={onUndo}
            disabled={!canUndo || disabled}
            className={`p-1.5 rounded-lg transition-all ${canUndo && !disabled ? "text-white hover:bg-slate-700" : "text-slate-600 opacity-50 cursor-not-allowed"}`}
            title="Undo assignment change"
          >
            <Undo2 size={16} />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5"></div>
          <button
            onClick={onRedo}
            disabled={!canRedo || disabled}
            className={`p-1.5 rounded-lg transition-all ${canRedo && !disabled ? "text-white hover:bg-slate-700" : "text-slate-600 opacity-50 cursor-not-allowed"}`}
            title="Redo assignment change"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4">
              <Bot size={32} className="text-indigo-400" />
            </div>
            <p className="text-slate-900 font-bold text-sm">
              Ready to help split!
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Try: "John had the burger"
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                msg.role === "user"
                  ? "bg-white border-slate-200 text-slate-600"
                  : "bg-indigo-600 border-indigo-500 text-white"
              }`}
            >
              {msg.role === "user" ? (
                <UserIcon size={14} />
              ) : (
                <Sparkles size={14} />
              )}
            </div>

            <div
              className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-end gap-2 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 border border-indigo-500">
              <Sparkles size={14} />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-slate-100"
      >
        <div className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              disabled ? "Waiting for receipt..." : "e.g., Tom had the salad"
            }
            disabled={disabled || isProcessing}
            className="w-full pl-5 pr-14 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing || disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
