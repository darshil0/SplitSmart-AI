import React from "react";
import { 
  HistoryEntry, 
  CompleteHistoryState 
} from "../types";
import { 
  Calendar, 
  Users, 
  ShoppingBag, 
  Trash2, 
  Clock, 
  ArrowLeftRight,
  TrendingUp
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
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-white/60 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white/50 mb-6 flex items-center justify-center">
          <Clock size={28} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
          No splits saved yet
        </h3>
        <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8">
          Your bill splits will appear here automatically. Restore any split with one click.
        </p>
        <div className="text-xs text-slate-400 font-mono bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-200">
          Every change auto-saves
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-indigo-50/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
              Split History
            </h3>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
              <TrendingUp size={14} />
              {history.length} saved splits
            </p>
          </div>
          <button
            onClick={onClearAll}
            className="group flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-xs px-4 py-2.5 rounded-2xl border border-rose-200 hover:border-rose-300 transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 size={14} className="group-hover:scale-110" />
            Clear All
          </button>
        </div>
        
        {currentIndex >= 0 && (
          <div className="text-xs text-slate-500 font-mono bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-200 mt-3">
            Current split: #{currentIndex + 1}
          </div>
        )}
      </div>

      {/* Scrollable History List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-transparent">
        {history.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const participants = Array.from(
            new Set(
              Object.values(entry.assignments).flat()
            )
          );
          
          return (
            <div
              key={entry.timestamp.toString()}
              className={`group relative bg-white/70 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 ${
                index === currentIndex 
                  ? "ring-4 ring-indigo-200/50 bg-indigo-50/50 border-indigo-300 shadow-indigo-500/20" 
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
                    <time dateTime={date.toISOString().split('T')[0]}>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                    <span className="text-slate-500 font-mono text-[10px]">
                      • {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-slate-900">
                      {entry.receiptData.currency}
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {entry.receiptData.total.toFixed(2)}
                    </span>
                  </div>
                  
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
                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <Users size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {participants.length}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      People
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                  <div className="bg-emerald-500/20 p-2 rounded-xl">
                    <ShoppingBag size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {entry.receiptData.items.length}
                    </div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
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
                    className="px-3 py-1.5 bg-slate-100/60 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-full border border-slate-200/50 backdrop-blur-sm transition-all hover:scale-105"
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
