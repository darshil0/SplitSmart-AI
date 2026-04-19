import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  AssignmentMap,
  ChatMessage,
  ReceiptData,
  DistributionMethod,
  ItemOverridesMap,
  ReceiptItem,
  HistoryEntry,
  ItemManualSplitsMap,
  SavedGroup,
  CompleteHistoryState,
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
  Moon,
  Sun,
  Users,
  Save,
  Trash2,
  Share2,
  Plus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HistorySnapshot {
  assignments: AssignmentMap;
  itemManualSplits: ItemManualSplitsMap;
  receiptData: ReceiptData | null;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const loadHistoryFromStorage = (): HistorySnapshot[] => {
  try {
    const saved = localStorage.getItem("splitSmartHistory");
    return saved ? (JSON.parse(saved) as HistorySnapshot[]) : [];
  } catch {
    return [];
  }
};

const App: React.FC = () => {
  // -------------------------------------------------------------------------
  // History — single source of truth
  // FIX: removed the duplicate useEffect that re-loaded history and called
  //      setAssignments / setItemManualSplits / setReceiptData separately,
  //      which created a dual-source state problem. All derived values are
  //      read directly from `history[historyIndex]`.
  // -------------------------------------------------------------------------
  const [history, setHistory] = useState<HistorySnapshot[]>(
    loadHistoryFromStorage,
  );

  // FIX: use plain state instead of a ref for the current index so that
  //      canUndo / canRedo are reactive and never stale.
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    const snapshots = loadHistoryFromStorage();
    return Math.max(0, snapshots.length - 1);
  });

  // Convenience: the snapshot that is currently "active"
  const currentSnapshot = useMemo<HistorySnapshot>(
    () =>
      history[historyIndex] ?? {
        assignments: {},
        itemManualSplits: {},
        receiptData: null,
        timestamp: Date.now(),
      },
    [history, historyIndex],
  );

  const receiptData = currentSnapshot.receiptData;
  const assignments = currentSnapshot.assignments;
  const itemManualSplits = currentSnapshot.itemManualSplits;

  // -------------------------------------------------------------------------
  // Undo / Redo — now purely derived from reactive state
  // FIX: useMemo deps include `historyIndex` and `history.length` so they
  //      recompute correctly on every change.
  // -------------------------------------------------------------------------
  const canUndo = useMemo(() => historyIndex > 0, [historyIndex]);
  const canRedo = useMemo(
    () => historyIndex < history.length - 1,
    [historyIndex, history.length],
  );

  const pushSnapshot = useCallback(
    (
      newAssignments: AssignmentMap,
      newManualSplits: ItemManualSplitsMap,
      newReceiptData?: ReceiptData | null,
    ) => {
      const nextReceiptData =
        newReceiptData !== undefined ? newReceiptData : receiptData;
      setHistory((prev) => {
        // Discard any "future" entries beyond the current index
        const truncated = prev.slice(0, historyIndex + 1);
        return [
          ...truncated,
          {
            assignments: newAssignments,
            itemManualSplits: newManualSplits,
            receiptData: nextReceiptData,
            timestamp: Date.now(),
          },
        ];
      });
      setHistoryIndex((prev) => prev + 1);
      setIsCurrentSplitSaved(false);
    },
    [historyIndex, receiptData],
  );

  const undo = useCallback(() => {
    setHistoryIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("splitSmartHistory", JSON.stringify(history));
    } catch {
      // Quota exceeded — silently ignore
    }
  }, [history]);

  // -------------------------------------------------------------------------
  // Other state
  // -------------------------------------------------------------------------
  const [isCurrentSplitSaved, setIsCurrentSplitSaved] = useState(false);
  const [itemOverrides, setItemOverrides] = useState<ItemOverridesMap>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [userNameError, setUserNameError] = useState(false);
  const [distributionMethod, setDistributionMethod] =
    useState<DistributionMethod>("PROPORTIONAL");
  const [activeMobileTab, setActiveMobileTab] = useState<
    "receipt" | "chat" | "summary" | "history"
  >("receipt");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showTestLab, setShowTestLab] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("splitSmartTheme");
      return (
        saved === "dark" ||
        (!saved &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>(() => {
    try {
      const saved = localStorage.getItem("splitSmartGroups");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [extraParticipants, setExtraParticipants] = useState<string[]>([]);

  // -------------------------------------------------------------------------
  // Theme
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("splitSmartTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("splitSmartTheme", "light");
    }
  }, [isDarkMode]);

  // -------------------------------------------------------------------------
  // Saved groups persistence
  // -------------------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem("splitSmartGroups", JSON.stringify(savedGroups));
  }, [savedGroups]);

  // -------------------------------------------------------------------------
  // One-time initialisation (welcome message + URL share decode)
  // -------------------------------------------------------------------------
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    setMessages([
      {
        id: "init",
        role: "assistant",
        content:
          "Welcome to SplitSmart! Please upload a receipt to get started.",
        timestamp: Date.now(),
      },
    ]);

    const hasSeenWalkthrough = localStorage.getItem("splitSmartWalkthrough");
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
      localStorage.setItem("splitSmartWalkthrough", "true");
    }

    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get("s");
    if (sharedState) {
      try {
        const decoded = JSON.parse(atob(sharedState)) as {
          receiptData: ReceiptData;
          assignments: AssignmentMap;
          itemManualSplits: ItemManualSplitsMap;
          distributionMethod?: DistributionMethod;
        };
        // Push the shared state as the first history snapshot
        setHistory([
          {
            receiptData: decoded.receiptData,
            assignments: decoded.assignments,
            itemManualSplits: decoded.itemManualSplits,
            timestamp: Date.now(),
          },
        ]);
        setHistoryIndex(0);
        if (decoded.distributionMethod) {
          setDistributionMethod(decoded.distributionMethod);
        }
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system",
            content: "Successfully loaded shared split session!",
            timestamp: Date.now(),
          },
        ]);
      } catch {
        console.error("Failed to decode shared state");
      }
    }
  }, []); // intentionally empty — runs once

  // -------------------------------------------------------------------------
  // Derived participants list
  // -------------------------------------------------------------------------
  const allParticipants = useMemo(() => {
    const set = new Set<string>();
    if (userName && isNameSet) set.add(userName);
    extraParticipants.forEach((p) => set.add(p));
    Object.values(assignments).forEach((names) => {
      names.forEach((n) => set.add(n));
    });
    return Array.from(set);
  }, [assignments, userName, isNameSet, extraParticipants]);

  // -------------------------------------------------------------------------
  // History management callbacks
  // FIX: handleDeleteHistoryEntry now uses the snapshot's timestamp as the
  //      stable id rather than its array index, eliminating the index/id
  //      mismatch between App and HistorySection.
  // -------------------------------------------------------------------------
  const handleSaveToHistory = useCallback(() => {
    setIsCurrentSplitSaved(true);
  }, []);

  const handleDeleteHistoryEntry = useCallback(
    (id: string) => {
      // `id` is the snapshot's timestamp (stringified)
      const targetTs = parseInt(id, 10);
      setHistory((prev) => {
        const idx = prev.findIndex((s) => s.timestamp === targetTs);
        if (idx === -1) return prev;
        const next = prev.filter((_, i) => i !== idx);
        // Adjust historyIndex so it remains valid
        setHistoryIndex((ci) => {
          if (ci > idx) return ci - 1;
          if (ci === idx) return Math.max(0, idx - 1);
          return ci;
        });
        return next;
      });
    },
    [],
  );

  const handleShareSession = useCallback(() => {
    if (!receiptData) return;
    const state = {
      receiptData,
      assignments,
      itemManualSplits,
      distributionMethod,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(
        "Shareable link copied to clipboard! Anyone with this link can view and edit this split.",
      );
    });
  }, [receiptData, assignments, itemManualSplits, distributionMethod]);

  const handleClearHistory = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to clear all history? This cannot be undone.",
      )
    ) {
      setHistory([]);
      setHistoryIndex(0);
      setItemOverrides({});
      setIsCurrentSplitSaved(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Name handling
  // -------------------------------------------------------------------------
  const handleNameSubmit = useCallback(() => {
    const trimmedName = userName.trim();
    if (trimmedName) {
      if (!isNameSet) {
        setMessages((prev) => [
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

  // -------------------------------------------------------------------------
  // Receipt upload
  // -------------------------------------------------------------------------
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploading(true);
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "assistant",
        content: "Analyzing your receipt… this might take a moment.",
        timestamp: Date.now(),
      },
    ]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const data = await parseReceiptImage(reader.result as string);

          // Reset history to a single fresh snapshot
          const freshSnapshot: HistorySnapshot = {
            assignments: {},
            itemManualSplits: {},
            receiptData: data,
            timestamp: Date.now(),
          };
          setHistory([freshSnapshot]);
          setHistoryIndex(0);
          setItemOverrides({});
          setDistributionMethod("PROPORTIONAL");
          setIsCurrentSplitSaved(false);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMsgId
                ? {
                    ...msg,
                    content: `Found ${data.items.length} items! Tell me who ordered what.`,
                  }
                : msg,
            ),
          );

          setActiveMobileTab("receipt");
        } catch (error) {
          console.error("Receipt parsing failed:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMsgId
                ? {
                    ...msg,
                    content:
                      "Sorry, I couldn't read that receipt. Please try a clearer image.",
                  }
                : msg,
            ),
          );
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

  // -------------------------------------------------------------------------
  // Item / assignment update handlers
  // FIX: All handlers now call pushSnapshot() with the complete new state so
  //      the displayed data and the history are always in sync.
  // -------------------------------------------------------------------------
  const handleUpdateItem = useCallback(
    (updatedItem: ReceiptItem) => {
      if (!receiptData) return;
      const newItems = receiptData.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      );
      const newSubtotal = newItems.reduce((acc, item) => acc + item.price, 0);
      const newReceiptData: ReceiptData = {
        ...receiptData,
        items: newItems,
        subtotal: newSubtotal,
        total: newSubtotal + receiptData.tax + receiptData.tip,
      };
      pushSnapshot(assignments, itemManualSplits, newReceiptData);
    },
    [receiptData, assignments, itemManualSplits, pushSnapshot],
  );

  const handleUpdateAssignments = useCallback(
    (itemId: string, names: string[]) => {
      const newAssignments = { ...assignments, [itemId]: names };
      pushSnapshot(newAssignments, itemManualSplits);
    },
    [assignments, itemManualSplits, pushSnapshot],
  );

  const handleUpdateManualSplits = useCallback(
    (itemId: string, splits: { [name: string]: number } | null) => {
      const next = { ...itemManualSplits };
      if (splits === null) {
        delete next[itemId];
      } else {
        next[itemId] = splits;
      }
      pushSnapshot(assignments, next);
    },
    [assignments, itemManualSplits, pushSnapshot],
  );

  // -------------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------------
  const handleSendMessage = async (text: string) => {
    if (!receiptData || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const { assignments: newAssignments, reply } = await processChatCommand(
        receiptData,
        assignments,
        text,
        userName,
      );
      pushSnapshot(newAssignments, itemManualSplits);
      setMessages((prev) => [
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
      setMessages((prev) => [
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

  // -------------------------------------------------------------------------
  // HistorySection data — use timestamp as stable id
  // FIX: was using array index as id, causing mismatch with delete handler
  // -------------------------------------------------------------------------
  const historySectionEntries: CompleteHistoryState[] = useMemo(
    () =>
      history.map((snap) => ({
        id: snap.timestamp.toString(),
        assignments: snap.assignments,
        itemManualSplits: snap.itemManualSplits,
        receiptData: snap.receiptData,
        timestamp: snap.timestamp,
        name: `Split ${new Date(snap.timestamp).toLocaleDateString()}`,
      })),
    [history],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className={`h-screen flex flex-col ${
        isDarkMode
          ? "dark bg-slate-950"
          : "bg-gradient-to-br from-slate-50 to-indigo-50"
      } overflow-hidden font-inter transition-colors duration-500`}
    >
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

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-xl">
              <Split size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                SplitSmart
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                AI Bill Splitter
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start">
            <div
              className={`flex items-center bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border-2 transition-all duration-300 group ${
                userNameError
                  ? "border-rose-400 bg-rose-50/80 shadow-rose-100"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-lg shadow-indigo-100/50 dark:shadow-none"
              }`}
            >
              <User
                size={16}
                className={`mr-3 transition-colors ${
                  userNameError
                    ? "text-rose-500"
                    : "text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
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
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="bg-transparent border-none outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-500 w-28 sm:w-36"
                autoComplete="off"
              />
            </div>
            {isNameSet && (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Ready to split! 👋
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-2xl transition-all shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => setShowGroupsModal(true)}
            className="p-3 rounded-2xl transition-all shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            title="Saved Groups"
          >
            <Users size={20} />
          </button>

          <button
            onClick={handleShareSession}
            disabled={!receiptData}
            className={`p-3 rounded-2xl transition-all shadow-sm ${
              !receiptData
                ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            }`}
            title="Share Session"
          >
            <Share2 size={20} />
          </button>

          <button
            onClick={() => setShowTestLab(true)}
            className={`p-3 rounded-2xl transition-all shadow-sm ${
              showTestLab
                ? "bg-indigo-600 text-white shadow-indigo-300 hover:shadow-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            }`}
            title="Test Lab"
          >
            <Beaker size={20} />
          </button>

          <button
            onClick={() => setShowWalkthrough(true)}
            className="p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white/50 dark:bg-slate-900/50 rounded-2xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"
            title="Help & Walkthrough"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main layout                                                          */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-2">
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
                    : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 bg-white/50 dark:bg-slate-800/50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Left panel — receipt or uploader */}
        <div
          className={`flex-1 lg:w-1/2 overflow-hidden transition-all duration-300 ${
            activeMobileTab !== "receipt" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="h-full p-6 pb-24 lg:pb-6 flex flex-col overflow-auto">
            {!receiptData ? (
              <div className="h-full flex flex-col justify-center items-center gap-8 max-w-md mx-auto">
                <ReceiptUploader
                  onUpload={handleFileUpload}
                  isProcessing={isUploading}
                />
                {history.length > 0 && (
                  <div className="w-full max-w-md">
                    <HistorySection
                      history={historySectionEntries}
                      onDelete={handleDeleteHistoryEntry}
                      onClearAll={handleClearHistory}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
                <ReceiptDisplay
                  data={receiptData}
                  assignments={assignments}
                  itemManualSplits={itemManualSplits}
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

        {/* Right panel — chat + summary */}
        <div
          className={`lg:w-1/2 flex flex-col overflow-hidden transition-all duration-300 ${
            activeMobileTab === "receipt" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex-1 grid lg:grid-rows-[1fr_auto] h-full pb-16 lg:pb-0">
            {/* Chat */}
            <div
              className={`overflow-hidden flex flex-col ${
                activeMobileTab === "summary" ||
                activeMobileTab === "history"
                  ? "hidden lg:flex"
                  : "flex"
              }`}
            >
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
            <div
              className={`overflow-hidden flex flex-col ${
                activeMobileTab === "chat" || activeMobileTab === "history"
                  ? "hidden lg:flex"
                  : "flex"
              }`}
            >
              <SummaryDisplay
                receiptData={receiptData}
                assignments={assignments}
                itemManualSplits={itemManualSplits}
                distributionMethod={distributionMethod}
                itemOverrides={itemOverrides}
                onSaveHistory={handleSaveToHistory}
                isSaved={isCurrentSplitSaved}
              />
            </div>

            {/* Mobile-only history tab */}
            {activeMobileTab === "history" && (
              <div className="lg:hidden overflow-auto flex-1 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <HistorySection
                  history={historySectionEntries}
                  onDelete={handleDeleteHistoryEntry}
                  onClearAll={handleClearHistory}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Global uploading overlay                                            */}
      {/* ------------------------------------------------------------------ */}
      {isUploading && (
        <div className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white/95 p-12 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center gap-6 max-w-sm text-center">
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
              <p className="text-slate-600 mt-2">
                AI is extracting items and prices…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Groups modal                                                         */}
      {/* ------------------------------------------------------------------ */}
      {showGroupsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Saved Groups
                </h2>
              </div>
              <button
                onClick={() => setShowGroupsModal(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto max-h-[60vh] space-y-4">
              {allParticipants.length > 0 && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3">
                    Save Current Group
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Group Name (e.g. Friday Lunch)"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const name = (e.target as HTMLInputElement).value.trim();
                          if (name) {
                            setSavedGroups((prev) => [
                              ...prev,
                              {
                                id: Date.now().toString(),
                                name,
                                participants: allParticipants,
                              },
                            ]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (
                          e.currentTarget.previousSibling as HTMLInputElement
                        );
                        const name = input.value.trim();
                        if (name) {
                          setSavedGroups((prev) => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              name,
                              participants: allParticipants,
                            },
                          ]);
                          input.value = "";
                        }
                      }}
                      className="bg-indigo-600 text-white p-2 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Available Groups
                </p>
                {savedGroups.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No groups saved yet.
                  </p>
                ) : (
                  savedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          {group.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {group.participants.join(", ")}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setExtraParticipants((prev) => [
                              ...new Set([...prev, ...group.participants]),
                            ]);
                            alert(
                              `Group "${group.name}" participants added!`,
                            );
                            setShowGroupsModal(false);
                          }}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setSavedGroups((prev) =>
                              prev.filter((g) => g.id !== group.id),
                            )
                          }
                          className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
