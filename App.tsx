import React, { useState, useEffect } from 'react';
import { AssignmentMap, ChatMessage, ReceiptData } from './types';
import { parseReceiptImage, processChatCommand } from './services/geminiService';
import ReceiptDisplay from './components/ReceiptDisplay';
import ChatInterface from './components/ChatInterface';
import SummaryDisplay from './components/SummaryDisplay';
import ReceiptUploader from './components/ReceiptUploader';
import { Split, Github, User } from 'lucide-react';

const App: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: 'Welcome to SplitSmart! Please upload a receipt to get started.',
      timestamp: Date.now()
    }]);
  }, []);

  const handleNameSubmit = () => {
    if (userName.trim() && !isNameSet) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hi ${userName}! I'll assign items to you when you say "I" or "me".`,
        timestamp: Date.now()
      }]);
      setIsNameSet(true);
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
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I found ${data.items.length} items. You can now tell me who ordered what! (e.g. "Tom had the burger")`,
            timestamp: Date.now()
          }]);
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

  const handleSendMessage = async (text: string) => {
    if (!receiptData) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const { assignments: newAssignments, reply } = await processChatCommand(
        receiptData,
        assignments,
        text,
        userName // Pass current user name context
      );

      setAssignments(newAssignments);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble understanding that command. Could you rephrase?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Split size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">SplitSmart AI</h1>
          </div>

          {/* User Name Input */}
          <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <User size={14} className="text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Your Name" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="bg-transparent border-none focus:outline-none text-sm text-gray-800 w-28 placeholder-gray-400 font-medium"
            />
          </div>
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          Powered by Gemini 3 Pro
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane - Receipt & Upload */}
        <div className="w-1/2 p-6 flex flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
           {!receiptData ? (
             <div className="flex-1 flex flex-col justify-center">
               <ReceiptUploader onUpload={handleFileUpload} isProcessing={isUploading} />
             </div>
           ) : (
             <div className="h-full">
                <ReceiptDisplay 
                  data={receiptData} 
                  assignments={assignments} 
                  isLoading={isUploading}
                />
             </div>
           )}
        </div>

        {/* Right Pane - Chat & Summary */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full grid grid-rows-2 gap-6">
              {/* Chat Section */}
              <div className="row-span-1 min-h-0">
                 <ChatInterface 
                   messages={messages} 
                   onSendMessage={handleSendMessage}
                   isProcessing={isProcessing}
                   disabled={!receiptData || isUploading}
                 />
              </div>
              
              {/* Summary Section */}
              <div className="row-span-1 min-h-0">
                <SummaryDisplay 
                  receiptData={receiptData} 
                  assignments={assignments} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
