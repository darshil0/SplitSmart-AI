import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AssignmentMap,
  ChatMessage,
  ReceiptData,
  DistributionMethod,
  ItemOverridesMap,
  ReceiptItem,
  HistoryEntry,
  ItemManualSplitsMap,
} from "./types";
import {
  parseReceiptImage,
  processChatCommand,
} from "./services/geminiService";
import ReceiptDisplay from "./components/ReceiptDisplay";
import ChatInterface from "./components/ChatInterface";
import SummaryDisplay from "./components/SummaryDisplay";
import ReceiptUploader from "./components/ReceiptUploader";
import WalkthroughModal from "./components/WalkthroughModal";
import HistorySection from "./components/HistorySection";
import TestDashboard from "./components/TestDashboard";
import {
  Split,
  User,
  HelpCircle,
  Receipt as ReceiptIcon,
  MessageSquare,
  PieChart as PieChartIcon,
  History as HistoryIcon,
  Beaker,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const App: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [itemManualSplits, setItemManualSplits] = useState<ItemManualSplitsMap>({});
  
  // Fixed history state - single source of truth
  const [history, setHistory] = useState<{ 
    assignments: AssignmentMap; 
    itemManualSplits: ItemManualSplitsMap;
    receiptData: ReceiptData | null;
    timestamp: number;
  }[]>(() => {
    try {
      const saved = localStorage.getItem("splitSmartHistory");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isCurrentSplitSaved, setIsCurrentSplitSaved] = useState(false);
  const [itemOverrides, setItemOverrides] = useState<ItemOverridesMap>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [userNameError, setUserNameError] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>("PROPORTIONAL");
  const [activeMobileTab, setActiveMobileTab] = useState<"receipt" | "chat" | "summary" | "history">("receipt");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showTestLab, setShowTestLab] = useState(false);
  
  // Undo/Redo state
  const historyRef = useRef(history);
  const historyIndexRef = useRef(0);

  // Sync history refs
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = Math.max(0, history.length - 1);
  }, [history]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("splitSmartHistory");
      if (saved) {
        const parsed = JSON.parse(saved) as typeof history;
        setHistory(parsed);
        if (parsed.length > 0) {
          const latest = parsed[parsed.length - 1];
          setAssignments(latest.assignments);
          setItemManualSplits(latest.itemManualSplits);
          setReceiptData(latest.receiptData);
          setIsCurrentSplitSaved(true);
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("splitSmartHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }, [history]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "init",
          role: "assistant",
          content: "Welcome to SplitSmart! Please upload a receipt to get started.",
          timestamp: Date.now(),
        },
      ]);
    }

    const hasSeenWalkthrough = localStorage.getItem("splitSmartWalkthrough");
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
      localStorage.setItem("splitSmartWalkthrough", "true");
    }
  }, [messages.length]);

  const allParticipants = useMemo(() => {
    const people = new Set<string>();
    if (userName && isNameSet) people.add(userName);
    Object.values(assignments).forEach((names) => {
      names?.forEach((name) => people.add(name));
    });
    return Array.from(people).sort();
  }, [assignments, userName, isNameSet]);

  const canUndo = useMemo(() => historyIndexRef.current > 0, []);
  const canRedo = useMemo(() => historyIndexRef.current < history.length - 1, []);

  const pushToHistory = useCallback((newAssignments: AssignmentMap, newManualSplits: ItemManualSplitsMap) => {
    setHistory(prev => {
      // Truncate future history
      const newHistory = prev.slice(0, historyIndexRef.current + 1);
      return [
        ...newHistory,
        {
          assignments: newAssignments,
          itemManualSplits: newManualSplits,
          receiptData,
          timestamp: Date.now(),
        }
      ];
    });
    historyIndexRef.current = history.length;
    setIsCurrentSplitSaved(false);
  }, [receiptData]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = history[historyIndexRef.current];
      setAssignments(state.assignments);
      setItemManualSplits(state.itemManualSplits);
      setReceiptData(state.receiptData);
      setIsCurrentSplitSaved(historyIndexRef.current < history.length - 1);
    }
  }, [history]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < history.length - 1) {
      historyIndexRef.current += 1;
      const state = history[historyIndexRef.current];
      setAssignments(state.assignments);
      setItemManualSplits(state.itemManualSplits);
      setReceiptData(state.receiptData);
      setIsCurrentSplitSaved(historyIndexRef.current < history.length - 1);
    }
  }, [history]);

  const handleSaveToHistory = useCallback((entry: HistoryEntry) => {
    // Already tracked in main history
    setIsCurrentSplitSaved(true);
  }, []);

  const handleDeleteHistoryEntry = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter((_, index) => index !== parseInt(id));
      // Adjust current index
      if (historyIndexRef.current >= newHistory.length) {
        historyIndexRef.current = Math.max(0, newHistory.length - 1);
      }
      return newHistory;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      setHistory([]);
      historyIndexRef.current = 0;
      setAssignments({});
      setItemManualSplits({});
      setReceiptData(null);
      setIsCurrentSplitSaved(false);
    }
  }, []);

  const handleNameSubmit = useCallback(() => {
    const trimmedName = userName.trim();
    if (trimmedName) {
      if (!isNameSet) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Hi ${trimmedName}! I'll assign items to you when you say "I" or "me".`,
            timestamp: Date.now(),
          },
        ]);
        setIsNameSet(true);
      }
      setUserNameError(false);
    } else {
      setUserNameError(true);
      setIsNameSet(false);
    }
  }, [userName, isNameSet]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    const userMsgId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        role: "assistant",
        content: "Analyzing your receipt... this might take a moment.",
        timestamp: Date.now(),
      },
    ]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const data = await parseReceiptImage(reader.result as string);
          
          // Reset state and push to history
          const newHistory = [{
            assignments: {},
            itemManualSplits: {},
            receiptData: data,
            timestamp: Date.now(),
          }];
          
          setHistory(newHistory);
          historyIndexRef.current = 0;
          setReceiptData(data);
          setAssignments({});
          setItemManualSplits({});
          setItemOverrides({});
          setDistributionMethod("PROPORTIONAL");
          setIsCurrentSplitSaved(false);
          
          // Update messages
          setMessages(prev => prev.map(msg => 
            msg.id === userMsgId 
              ? { ...msg, content: `Found ${data.items.length} items! Tell me who ordered what.` }
              : msg
          ));
          
          setActiveMobileTab("receipt");
        } catch (error) {
          console.error("Receipt parsing failed:", error);
          setMessages(prev => prev.map(msg => 
            msg.id === userMsgId 
              ? { ...msg, content: "Sorry, I couldn't read that receipt. Please try a clearer image." }
              : msg
          ));
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload failed:", error);
      setIsUploading(false);
    }
  };

  const handleUpdateItem = useCallback((updatedItem: ReceiptItem) => {
    if (!receiptData) return;
    const newItems = receiptData.items.map((item) =>
      item.id === updatedItem.id ? updatedItem : item,
    );
    const newSubtotal = newItems.reduce((acc, item) => acc + item.price, 0);
    const newReceiptData = {
      ...receiptData,
      items: newItems,
      subtotal: newSubtotal,
      total: newSubtotal + receiptData.tax + receiptData.tip,
    };
    setReceiptData(newReceiptData);
    pushToHistory(assignments, itemManualSplits);
  }, [receiptData, assignments, itemManualSplits, pushToHistory]);

  const handleUpdateAssignments = useCallback((itemId: string, names: string[]) => {
    const newAssignments = { ...assignments, [itemId]: names };
    pushToHistory(newAssignments, itemManualSplits);
  }, [assignments, itemManualSplits, pushToHistory]);

  const handleUpdateManualSplits = useCallback((
    itemId: string,
    splits: { [name: string]: number } | null,
  ) => {
    const nextManualSplits = { ...itemManualSplits };
    if (splits === null) {
      delete nextManualSplits[itemId];
    } else {
      nextManualSplits[itemId] = splits;
    }
    pushToHistory(assignments, nextManualSplits);
  }, [assignments, itemManualSplits, pushToHistory]);

  const handleSendMessage = async (text: string) => {
    if (!receiptData || isProcessing) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const { assignments: newAssignments, reply } = await processChatCommand(
        receiptData,
        assignments,
        text,
        userName,
      );
      pushToHistory(newAssignments, itemManualSplits);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Chat processing failed:", error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process that. Try rephrasing!",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentHistoryEntry = history[historyIndexRef.current] || {
    assignments: {},
    itemManualSplits: {},
    receiptData: null,
    timestamp: Date.now(),
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden font-inter">
      {showWalkthrough && (
        <WalkthroughModal onClose={() => setShowWalkthrough(false)} />
      )}

      {showTestLab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Test Lab</h2>
              <button
                onClick={() => setShowTestLab(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                aria-label="Close test lab"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <TestDashboard />
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-xl">
              <Split size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                SplitSmart
              </h1>
              <p className="text-xs text-slate-500 font-medium">AI Bill Splitter</p>
            </div>
          </div>

          <div className="flex flex-col items-start">
            <div className={`flex items-center bg-slate-100/80 px-4 py-2 rounded-2xl border-2 transition-all duration-300 group ${
              userNameError 
                ? "border-rose-400 bg-rose-50/80 shadow-rose-100" 
                : "border-slate-200 hover:border-slate-300 focus-within:border-indigo-400 focus-within:bg-white shadow-lg shadow-indigo-100/50"
            }`}>
              <User 
                size={16} 
                className={`mr-3 transition-colors ${
                  userNameError 
                    ? "text-rose-500" 
                    : "text-slate-500 group-focus-within:text-indigo-600"
                }`} 
              />
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (e.target.value.trim()) setUserNameError(false);
                }}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder-slate-500 w-28 sm:w-36"
                autoComplete="off"
              />
            </div>
            {isNameSet && (
              <span className="text-xs text-slate-500 mt-1 font-medium">
                Ready to split! 👋
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTestLab(true)}
            className={`p-3 rounded-2xl transition-all shadow-sm ${
              showTestLab 
                ? "bg-indigo-600 text-white shadow-indigo-300 hover:shadow-indigo-400" 
                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 bg-white/50"
            }`}
            title="Test Lab (Ctrl+T)"
          >
            <Beaker size={20} />
          </button>
          <button
            onClick={() => setShowWalkthrough(true)}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 bg-white/50 rounded-2xl transition-all shadow-sm"
            title="Help & Walkthrough"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Tab Bar */}
        <div className="lg:hidden bg-white/80 backdrop-blur border-b border-slate-200 px-2 py-2">
          <div className="flex gap-1">
            {[
              { key: "receipt" as const, icon: ReceiptIcon, label: "Receipt" },
              { key: "chat" as const, icon: MessageSquare, label: "Chat" },
              { key: "summary" as const, icon: PieChartIcon, label: "Total" },
              { key: "history" as const, icon: HistoryIcon, label: "History" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveMobileTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                  activeMobileTab === key
                    ? "bg-indigo-500 text-white shadow-indigo-300"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 bg-white/50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Left Panel - Receipt/No Receipt */}
        <div className={`flex-1 lg:w-1/2 overflow-hidden transition-all duration-300 ${
          activeMobileTab !== "receipt" && !receiptData ? "hidden lg:block" : "block"
        }`}>
          <div className="h-full p-6 flex flex-col">
            {!receiptData ? (
              <div className="h-full flex flex-col justify-center items-center gap-8 max-w-md mx-auto">
                <ReceiptUploader onUpload={handleFileUpload} isProcessing={isUploading} />
                {history.length > 0 && (
                  <div className="w-full max-w-md">
                    <HistorySection
                      history={history.map((h, i) => ({
                        id: i.toString(),
                        ...h,
                        name: `Split ${new Date(h.timestamp).toLocaleDateString()}`,
                      }))}
                      onDelete={handleDeleteHistoryEntry}
                      onClearAll={handleClearHistory}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full max-w-2xl mx-auto w-full flex flex-col gap-6">
                <ReceiptDisplay
                  data={receiptData}
                  assignments={currentHistoryEntry.assignments}
                  itemManualSplits={currentHistoryEntry.itemManualSplits}
                  isLoading={isUploading}
                  distributionMethod={distributionMethod}
                  onDistributionChange={setDistributionMethod}
                  itemOverrides={itemOverrides}
                  onOverrideChange={setItemOverrides}
                  onUpdateItem={handleUpdateItem}
                  onUpdateAssignments={handleUpdateAssignments}
                  onUpdateManualSplits={handleUpdateManualSplits}
                  allParticipants={allParticipants}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat & Summary */}
        <div className={`lg:w-1/2 flex flex-col overflow-hidden transition-all duration-300 ${
          activeMobileTab === "receipt" ? "hidden lg:flex" : "flex"
        }`}>
          <div className="flex-1 grid grid-rows-[1fr_auto] h-full">
            {/* Chat */}
            <div className={`overflow-hidden flex flex-col row-start-1 ${
              activeMobileTab === "summary" ? "hidden lg:flex" : "flex"
            }`}>
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                disabled={!receiptData || isUploading}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>

            {/* Summary */}
            <div className={`overflow-hidden flex flex-col row-start-1 lg:row-start-auto ${
              activeMobileTab === "chat" ? "hidden lg:flex" : "flex"
            }`}>
              <SummaryDisplay
                receiptData={receiptData}
                assignments={currentHistoryEntry.assignments}
                itemManualSplits={currentHistoryEntry.itemManualSplits}
                distributionMethod={distributionMethod}
                itemOverrides={itemOverrides}
                onSaveHistory={handleSaveToHistory}
                isSaved={isCurrentSplitSaved}
              />
            </div>

            {/* Mobile History */}
            {activeMobileTab === "history" && (
              <div className="lg:hidden overflow-auto flex-1 p-4 border-t border-slate-200 bg-slate-50/50">
                <HistorySection
                  history={history.map((h, i) => ({
                    id: i.toString(),
                    ...h,
                    name: `Split ${new Date(h.timestamp).toLocaleDateString()}`,
                  }))}
                  onDelete={handleDeleteHistoryEntry}
                  onClearAll={handleClearHistory}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Global Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white/95 p-12 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center gap-6 max-w-sm text-center animate-pulse">
            <div className="relative">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <ReceiptIcon size={32} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 border-4 border-white rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Scanning Receipt
              </h3>
              <p className="text-slate-600 mt-2">AI is extracting items and prices...</p>
            </div>
          </div>
        </div>
      )}

      {/* Undo/Redo Toast - Hidden for now, can be enhanced */}
      {false && (
        <div className="fixed bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 z-[70] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Undo available</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-xl transition-all font-semibold">
                Undo
              </button>
              <button className="px-4 py-2 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-semibold">
                Redo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
