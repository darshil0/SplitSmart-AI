import React from "react";
import { CompleteHistoryState } from "../types";
import {
  Calendar,
  Users,
  ShoppingBag,
  Trash2,
  Clock,
  ArrowLeftRight,
  TrendingUp,
  Search,
  MapPin,
} from "lucide-react";

interface HistorySectionProps {
  history: CompleteHistoryState[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onRestore?: (id: string) => void;
  currentIndex?: number;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onDelete,
  onClearAll,
  onRestore,
  currentIndex = -1,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase();
    return history.filter(entry => {
      const dateStr = new Date(entry.timestamp).toLocaleDateString().toLowerCase();
      const participants = Object.values(entry.assignments).flat().map(p => p.toLowerCase());
      const venue = entry.receiptData?.venue?.toLowerCase() || "";
      
      return dateStr.includes(query) || 
             participants.some(p => p.includes(query)) ||
             venue.includes(query);
    });
  }, [history, searchQuery]);

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white/50 dark:border-slate-700 mb-6 flex items-center justify-center">
          <Clock size={28} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          No splits saved yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
          Your bill splits will appear here automatically. Restore any split
          with one click.
        </p>
        <div className="text-xs text-slate-400 font-mono bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          Every change auto-saves
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden animate-in fade-in duration-500 transition-colors">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-400 dark:to-white bg-clip-text text-transparent tracking-tight">
              Split History
            </h3>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
              <TrendingUp size={14} />
              {history.length} saved splits
            </p>
          </div>
          <button
            onClick={onClearAll}
            className="group flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 size={14} className="group-hover:scale-110" />
            Clear All
          </button>
        </div>

        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by person, date, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {currentIndex >= 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 mt-3">
            Current split: #{currentIndex + 1}
          </div>
        )}
      </div>

      {/* Scrollable History List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300/50 dark:scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
        {filteredHistory.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const participants = Array.from(
            new Set(Object.values(entry.assignments).flat()),
          );

          return (
            <div
              key={entry.timestamp.toString()}
              className={`group relative bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 ${
                index === currentIndex
                  ? "ring-4 ring-indigo-200/50 dark:ring-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-500 shadow-indigo-500/20"
                  : "hover:shadow-xl"
              }`}
            >
              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => onRestore?.(entry.timestamp.toString())}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center gap-1"
                  title="Restore this split"
                >
                  <ArrowLeftRight size={14} />
                  Load
                </button>
                <button
                  onClick={() => onDelete(entry.timestamp.toString())}
                  className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold text-xs"
                  title="Delete this split"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Main Content */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">
                    <Calendar size={12} />
                    <time dateTime={date.toISOString().split("T")[0]}>
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <span className="text-slate-500 font-mono text-[10px]">
                      •{" "}
                      {date.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {entry.receiptData?.currency || "$"}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {entry.receiptData?.total.toFixed(2) || "0.00"}
                    </span>
                  </div>

                  {entry.receiptData?.venue && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      <MapPin size={12} />
                      {entry.receiptData.venue}
                    </div>
                  )}

                  {index === currentIndex && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 mt-1">
                      <TrendingUp size={12} />
                      Currently Active
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {participants.length}
                    </div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      People
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors">
                  <div className="bg-emerald-500/20 p-2 rounded-xl">
                    <ShoppingBag size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {entry.receiptData?.items.length || 0}
                    </div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Items
                    </div>
                  </div>
                </div>
              </div>

              {/* Participant Tags */}
              <div className="flex flex-wrap gap-2">
                {participants.slice(0, 4).map((person, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-100/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm transition-all hover:scale-105"
                  >
                    {person}
                  </span>
                ))}
                {participants.length > 4 && (
                  <span className="px-3 py-1.5 bg-slate-200/60 text-xs font-bold text-slate-500 rounded-full border border-slate-200/50">
                    +{participants.length - 4} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySection;
