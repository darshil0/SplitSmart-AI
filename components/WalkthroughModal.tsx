import React from "react";
import { X, CheckCircle2, Camera, MessageSquare, PieChart } from "lucide-react";

interface WalkthroughModalProps {
  onClose: () => void;
}

const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ onClose }) => {
  const steps = [
    {
      icon: <Camera className="text-indigo-600" />,
      title: "Upload Receipt",
      desc: "Take a photo or upload a receipt. AI parses items instantly.",
    },
    {
      icon: <MessageSquare className="text-emerald-600" />,
      title: "Chat with AI",
      desc: "Say 'I had the burger' or 'Split the wine 3 ways'.",
    },
    {
      icon: <PieChart className="text-amber-600" />,
      title: "See Totals",
      desc: "Check the summary for a perfect breakdown of who owes what.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome to SplitSmart
              </h2>
              <p className="text-slate-500 mt-1">
                Split bills in seconds with AI.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="mt-1 bg-slate-50 p-3 rounded-2xl">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <CheckCircle2 size={20} />
            Got it, let's go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughModal;
