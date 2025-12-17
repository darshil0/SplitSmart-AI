import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AssignmentMap, ChatMessage, ReceiptData, DistributionMethod, ItemOverridesMap, ReceiptItem, HistoryEntry } from './types';
import { parseReceiptImage, processChatCommand } from './services/geminiService';
import ReceiptDisplay from './components/ReceiptDisplay';
import ChatInterface from './components/ChatInterface';
import SummaryDisplay from './components/SummaryDisplay';
import ReceiptUploader from './components/ReceiptUploader';
import WalkthroughModal from './components/WalkthroughModal';
import HistorySection from './components/HistorySection';
import { Split, User, HelpCircle, Receipt as ReceiptIcon, MessageSquare, PieChart as PieChartIcon, History as HistoryIcon, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [pastAssignments, setPastAssignments] = useState<AssignmentMap[]>([]);
  const [futureAssignments, setFutureAssignments] = useState<AssignmentMap[]>([]);
  
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('splitSmartHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCurrentSplitSaved, setIsCurrentSplitSaved] = useState(false);

  const [itemOverrides, setItemOverrides] = useState<ItemOverridesMap>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [userNameError, setUserNameError] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>('PROPORTIONAL');
  const [activeMobileTab, setActiveMobileTab] = useState<'receipt' | 'chat' | 'summary' | 'history'>('receipt');
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('splitSmartHistory', JSON.stringify(history));
  }, [history]);

  // Initial welcome message and check for walkthrough
  useEffect(() => {
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: 'Welcome to SplitSmart! Please upload a receipt to get started.',
      timestamp: Date.now()
    }]);

    const hasSeenWalkthrough = localStorage.getItem('splitSmartWalkthrough');
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
      localStorage.setItem('splitSmartWalkthrough', 'true');
    }
  }, []);

  // Compute list of all unique people mentioned so far
  const allParticipants = useMemo(() => {
    const people = new Set<string>();
    if (userName && isNameSet) people.add(userName);
    Object.values(assignments).forEach(names => {
      names.forEach(name => people.add(name));
    });
    return Array.from(people).sort();
  }, [assignments, userName, isNameSet]);

  const pushToHistory = useCallback((newMap: AssignmentMap) => {
    setPastAssignments(prev => [...prev, assignments]);
    setAssignments(newMap);
    setFutureAssignments([]);
    setIsCurrentSplitSaved(false); // Reset saved status on any change
  }, [assignments]);

  const handleUndo = useCallback(() => {
    if (pastAssignments.length === 0) return;
    const previous = pastAssignments[pastAssignments.length - 1];
    const newPast = pastAssignments.slice(0, -1);
    
    setFutureAssignments(prev => [assignments, ...prev]);
    setAssignments(previous);
    setPastAssignments(newPast);
    setIsCurrentSplitSaved(false);
  }, [assignments, pastAssignments]);

  const handleRedo = useCallback(() => {
    if (futureAssignments.length === 0) return;
    const next = futureAssignments[0];
    const newFuture = futureAssignments.slice(1);
    
    setPastAssignments(prev => [...prev, assignments]);
    setAssignments(next);
    setFutureAssignments(newFuture);
    setIsCurrentSplitSaved(false);
  }, [assignments, futureAssignments]);

  const handleSaveToHistory = (entry: HistoryEntry) => {
    setHistory(prev => [entry, ...prev]);
    setIsCurrentSplitSaved(true);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      if (!isNameSet) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Hi ${userName}! I'll assign items to you when you say "I" or "me".`,
          timestamp: Date.now()
        }]);
        setIsNameSet(true);
      }
      setUserNameError(false);
    } else {
      setUserNameError(true);
      setIsNameSet(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Analyzing your receipt... this might take a moment.',
      timestamp: Date.now()
    }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const data = await parseReceiptImage(base64String);
          setReceiptData(data);
          setAssignments({});
          setPastAssignments([]);
          setFutureAssignments([]);
          setItemOverrides({});
          setDistributionMethod('PROPORTIONAL');
          setIsCurrentSplitSaved(false);
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I found ${data.items.length} items. You can now tell me who ordered what! (e.g. "Tom had the burger")`,
            timestamp: Date.now()
          }]);
          
          setActiveMobileTab('receipt');
        } catch (error) {
          console.error(error);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I had trouble reading that receipt. Please try a clearer image.',
            timestamp: Date.now()
          }]);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      console.error("File reading error", error);
    }
  };

  const handleUpdateItem = (updatedItem: ReceiptItem) => {
    if (!receiptData) return;
    const newItems = receiptData.items.map(item => item.id === updatedItem.id ? updatedItem : item);
    const newSubtotal = newItems.reduce((acc, item) => acc + (item.price), 0);
    const newTotal = newSubtotal + receiptData.tax + receiptData.tip;
    setReceiptData({ ...receiptData, items: newItems, subtotal: newSubtotal, total: newTotal });
    setIsCurrentSplitSaved(false);
  };

  const handleUpdateAssignments = (itemId: string, names: string[]) => {
    pushToHistory({ ...assignments, [itemId]: names });
  };

  const handleSendMessage = async (text: string) => {
    if (!receiptData) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    try {
      const { assignments: newAssignments, reply } = await processChatCommand(receiptData, assignments, text, userName);
      pushToHistory(newAssignments);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm having trouble understanding that. Try being more specific!", timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-inter">
      {showWalkthrough && <WalkthroughModal onClose={() => setShowWalkthrough(false)} />}
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <Split size={20} className="sm:size-24" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">SplitSmart</h1>
          </div>

          <div className="flex flex-col relative">
            <div className={`flex items-center bg-slate-100 px-3 py-1.5 rounded-2xl border transition-all duration-300 group ${userNameError ? 'border-rose-400 bg-rose-50' : 'border-transparent focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100'}`}>
              <User size={14} className={`${userNameError ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'} mr-2`} />
              <input 
                type="text" 
                placeholder="Your Name" 
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (e.target.value.trim()) setUserNameError(false);
                }}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="bg-transparent border-none focus:outline-none text-sm text-slate-800 w-24 sm:w-32 placeholder-slate-400 font-medium"
              />
            </div>
            {userNameError && (
              <span className="absolute -bottom-4 left-1 text-[9px] font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">Enter your name</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWalkthrough(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Show Walkthrough"
          >
            <HelpCircle size={20} />
          </button>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block border-l border-slate-200 pl-4 ml-2">
            AI Engine v3
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="lg:hidden flex bg-white border-b border-slate-200 p-1">
          <button 
            onClick={() => setActiveMobileTab('receipt')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'receipt' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <ReceiptIcon size={18} /> Receipt
          </button>
          <button 
            onClick={() => setActiveMobileTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <MessageSquare size={18} /> Chat
          </button>
          <button 
            onClick={() => setActiveMobileTab('summary')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'summary' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <PieChartIcon size={18} /> Total
          </button>
          <button 
            onClick={() => setActiveMobileTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <HistoryIcon size={18} /> History
          </button>
        </div>

        <div className={`lg:hidden flex-1 overflow-hidden p-4 bg-slate-50 ${activeMobileTab === 'history' ? 'block' : 'hidden'}`}>
           <HistorySection 
             history={history} 
             onDelete={handleDeleteHistoryEntry} 
             onClearAll={handleClearHistory} 
           />
        </div>

        <div className={`flex-1 lg:w-1/2 p-4 sm:p-6 overflow-y-auto border-r border-slate-200 bg-slate-50/30 ${activeMobileTab !== 'receipt' ? 'hidden lg:block' : 'block'}`}>
           {!receiptData ? (
             <div className="h-full flex flex-col justify-center max-w-xl mx-auto w-full">
               <div className="mb-6">
                 <ReceiptUploader onUpload={handleFileUpload} isProcessing={isUploading} />
               </div>
               
               <div className="hidden lg:block mt-2">
                 <HistorySection 
                    history={history} 
                    onDelete={handleDeleteHistoryEntry} 
                    onClearAll={handleClearHistory} 
                 />
               </div>

               <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                   <div className="text-2xl mb-1">📸</div>
                   <div className="text-xs font-bold text-slate-800">Clear Photo</div>
                   <div className="text-[10px] text-slate-500">Ensure items & prices are visible</div>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                   <div className="text-2xl mb-1">🤖</div>
                   <div className="text-xs font-bold text-slate-800">AI Powered</div>
                   <div className="text-[10px] text-slate-500">Gemini 3 Pro handles the math</div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="h-full max-w-2xl mx-auto w-full flex flex-col gap-6">
                <ReceiptDisplay 
                  data={receiptData} 
                  assignments={assignments} 
                  isLoading={isUploading}
                  distributionMethod={distributionMethod}
                  onDistributionChange={setDistributionMethod}
                  itemOverrides={itemOverrides}
                  onOverrideChange={setItemOverrides}
                  onUpdateItem={handleUpdateItem}
                  onUpdateAssignments={handleUpdateAssignments}
                  allParticipants={allParticipants}
                />
                <div className="hidden lg:block mt-auto pt-6 border-t border-slate-200">
                   <button 
                     className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                   >
                     <HistoryIcon size={12} /> Recent History ({history.length})
                   </button>
                </div>
             </div>
           )}
        </div>

        <div className={`lg:w-1/2 flex flex-col bg-white overflow-hidden ${activeMobileTab === 'receipt' || activeMobileTab === 'history' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 lg:grid lg:grid-rows-2 h-full overflow-hidden">
              <div className={`lg:row-span-1 min-h-0 flex flex-col p-4 sm:p-6 ${activeMobileTab === 'summary' ? 'hidden lg:flex' : 'flex'}`}>
                 <ChatInterface 
                   messages={messages} 
                   onSendMessage={handleSendMessage}
                   isProcessing={isProcessing}
                   disabled={!receiptData || isUploading}
                   onUndo={handleUndo}
                   onRedo={handleRedo}
                   canUndo={pastAssignments.length > 0}
                   canRedo={futureAssignments.length > 0}
                 />
              </div>
              
              <div className={`lg:row-span-1 min-h-0 flex flex-col p-4 sm:p-6 ${activeMobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
                <SummaryDisplay 
                  receiptData={receiptData} 
                  assignments={assignments} 
                  distributionMethod={distributionMethod}
                  itemOverrides={itemOverrides}
                  onSaveHistory={handleSaveToHistory}
                  isSaved={isCurrentSplitSaved}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs animate-in zoom-in-95">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
             </div>
             <h3 className="text-xl font-bold text-slate-900">Scanning Receipt</h3>
             <p className="text-sm text-slate-500">Our AI is digitizing the items, tax, and tip for you...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
