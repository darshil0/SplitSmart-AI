import React from "react";
import { X, CheckCircle2, Camera, MessageSquare, PieChart } from "lucide-react";

interface WalkthroughModalProps {
  onClose: () => void;
}

interface WalkthroughStep {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ onClose }) => {
  const steps: WalkthroughStep[] = [
    {
      icon: <Camera className="w-6 h-6 text-indigo-600" />,
      title: "Upload Receipt",
      desc: "Take a photo or upload a receipt. AI parses items instantly.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-emerald-600" />,
      title: "Chat with AI",
      desc: "Say 'I had the burger' or 'Split the wine 3 ways'.",
    },
    {
      icon: <PieChart className="w-6 h-6 text-amber-600" />,
      title: "See Totals",
      desc: "Check the summary for a perfect breakdown of who owes what.",
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] mx-4">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-slate-900">
                  Welcome to SplitSmart
                </h2>
                <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                  Split bills in seconds with AI.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full transition-all group"
                aria-label="Close walkthrough"
              >
                <X size={20} className="text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group/step">
                  <div className="flex-shrink-0 mt-1 bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-2xl shadow-sm border border-slate-200 group-hover/step:scale-105 transition-all duration-200">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-base leading-tight mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg flex items-center justify-center gap-2.5 text-sm"
              autoFocus
            >
              <CheckCircle2 size={20} />
              Got it, let's go!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WalkthroughModal;
