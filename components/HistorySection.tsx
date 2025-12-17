import React from "react";
import { HistoryEntry } from "../types";
import { Calendar, Users, ShoppingBag, Trash2, Clock } from "lucide-react";

interface HistorySectionProps {
  history: HistoryEntry[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onDelete,
  onClearAll,
}) => {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Clock size={32} className="text-slate-300" />
        </div>
        <h3 className="text-slate-900 font-bold">No history yet</h3>
        <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
          Your saved splits will appear here for future reference.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Past Splits</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {history.length} Saved Entries
          </p>
        </div>
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 hover:bg-rose-50 rounded-lg transition-all uppercase tracking-widest"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="group relative bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all animate-in slide-in-from-bottom-2"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Calendar size={10} />
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xl font-black text-slate-900">
                  {entry.currency}
                  {entry.total.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                  <Users size={12} />
                </div>
                <div className="text-[11px] font-bold text-slate-600">
                  {entry.participants.length} People
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                  <ShoppingBag size={12} />
                </div>
                <div className="text-[11px] font-bold text-slate-600">
                  {entry.itemCount} Items
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {entry.participants.slice(0, 3).map((p, idx) => (
                <span
                  key={idx}
                  className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium"
                >
                  {p}
                </span>
              ))}
              {entry.participants.length > 3 && (
                <span className="text-[9px] text-slate-400 font-medium px-1">
                  +{entry.participants.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;
