import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "../types";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Undo2,
  Redo2,
  StopCircle,
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
  onStop?: () => void;
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
  onStop,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Optimized scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth", 
      block: "end" 
    });
  }, []);

  // Auto-scroll on messages or processing change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isProcessing, scrollToBottom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isProcessing) return;
      
      // Ctrl/Cmd + Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      // Escape to clear input
      if (e.key === "Escape") {
        setInputValue("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !isProcessing && !disabled) {
      onSendMessage(trimmed);
      setInputValue("");
    }
  };

  const handleStop = () => {
    onStop?.();
    setInputValue("");
  };

  // Message examples for empty state
  const exampleCommands = [
    "John had the burger",
    "Sarah and I shared the pizza", 
    "Split appetizers between everyone",
    "Remove Mike from drinks"
  ];

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden animate-in zoom-in-95 duration-500">
      {/* AI Assistant Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/25">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-black text-base tracking-tight leading-tight">
              SplitSmart AI
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/25"></div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Live
              </span>
              <span className="text-xs text-slate-400 font-mono">Gemini 1.5 Pro</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo || disabled || isProcessing}
            className={`p-2 rounded-xl transition-all group ${
              canUndo && !disabled && !isProcessing
                ? "text-slate-300 hover:text-white hover:bg-slate-700/50 shadow-md hover:shadow-indigo-500/25"
                : "text-slate-600/50 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last change"
          >
            <Undo2 size={16} className="group-hover:scale-110" />
          </button>
          
          <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
          
          <button
            onClick={onRedo}
            disabled={!canRedo || disabled || isProcessing}
            className={`p-2 rounded-xl transition-all group ${
              canRedo && !disabled && !isProcessing
                ? "text-slate-300 hover:text-white hover:bg-slate-700/50 shadow-md hover:shadow-indigo-500/25"
                : "text-slate-600/50 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last change"
          >
            <Redo2 size={16} className="group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/70 to-white/50 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
      >
        {/* Empty State */}
        {messages.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white/50">
              <Bot size={28} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              No receipt yet?
            </h2>
            <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
              Upload a receipt image on the left, then chat to split items!
            </p>
            <div className="space-y-2">
              {exampleCommands.map((example, i) => (
                <button
                  key={i}
                  onClick={() => !disabled && onSendMessage(example)}
                  className="w-full max-w-sm flex items-center gap-3 p-3 bg-white/60 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl text-sm font-medium text-slate-800 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
                  disabled={disabled}
                >
                  <Sparkles size={14} className="text-indigo-500 flex-shrink-0" />
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300 delay-75 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border-2 font-bold text-xs uppercase tracking-wider ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400 shadow-purple-500/25"
                    : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-200 shadow-white/50"
                }`}
              >
                {msg.role === "user" ? "You" : "AI"}
              </div>

              <div
                className={`max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed shadow-xl backdrop-blur-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tl-2xl"
                    : "bg-white/80 text-slate-900 border border-slate-100/50 rounded-tr-2xl"
                }`}
              >
                <p>{msg.content}</p>
                <div className="mt-2 pt-2 border-t border-white/30">
                  <span className="text-xs opacity-75 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-start gap-3 animate-in fade-in duration-500">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 shadow-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-slate-600 animate-pulse" />
            </div>
            <div className="bg-white/80 border border-slate-100/50 p-5 rounded-3xl rounded-tr-2xl shadow-xl backdrop-blur-sm max-w-[75%]">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm font-medium text-slate-600">Processing...</span>
              </div>
              {onStop && (
                <button
                  onClick={handleStop}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 pt-1 transition-colors"
                >
                  <StopCircle size={12} />
                  Stop
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-gradient-to-t from-white/50 to-transparent border-t border-slate-100/50">
        <div className="relative group">
          <input
            ref={(el) => el?.focus()}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={
              disabled 
                ? "Upload receipt first..." 
                : isProcessing 
                ? "AI is thinking..." 
                : "Type your split command (Ctrl+Enter)"
            }
            disabled={disabled || isProcessing}
            className={`w-full pl-5 pr-14 py-4 text-sm font-semibold transition-all duration-200 ${
              isInputFocused 
                ? "bg-white border-2 border-indigo-500 shadow-xl shadow-indigo-200 ring-4 ring-indigo-50/50" 
                : "bg-white/70 border border-slate-200 hover:border-slate-300 hover:shadow-lg"
            } rounded-3xl focus:outline-none focus:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing || disabled}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all shadow-lg ${
              inputValue.trim() && !isProcessing && !disabled
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        
        {isInputFocused && (
          <div className="absolute bottom-20 left-6 right-6 pointer-events-none opacity-0 group-focus-within:opacity-100 group-focus-within:animate-in fade-in duration-200 pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl text-white text-xs p-3 rounded-2xl border border-white/20 font-mono max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-1">
                <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-xs">Ctrl+Enter</kbd>
                <span>Send</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-xs">Esc</kbd>
                <span>Clear</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;
