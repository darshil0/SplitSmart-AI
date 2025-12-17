import React, { useState } from 'react';
import { TestResult, TestStatus } from '../types';
import { Play, RotateCcw, CheckCircle2, XCircle, Beaker, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { runTestSuite } from '../tests/suite';

const TestDashboard: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const startTests = async () => {
    setIsTesting(true);
    const report = await runTestSuite((update) => {
      setResults(prev => {
        const index = prev.findIndex(r => r.id === update.id);
        if (index > -1) {
          const next = [...prev];
          next[index] = update;
          return next;
        }
        return [...prev, update];
      });
    });
    setIsTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Beaker size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Automated Test Lab</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Version 1.0.4 • 100% Coverage Target</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={clearResults}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={startTests}
            disabled={isTesting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {isTesting ? <Activity size={18} className="animate-spin" /> : <Play size={18} />}
            Run All Suites
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {results.length > 0 && (
        <div className="flex p-1 bg-slate-950/50 gap-1 border-b border-slate-800">
          <div className="flex-1 bg-slate-800/30 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
            <span className="text-lg font-black">{stats.total}</span>
          </div>
          <div className="flex-1 bg-emerald-500/10 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Passed</span>
            <span className="text-lg font-black text-emerald-400">{stats.passed}</span>
          </div>
          <div className="flex-1 bg-rose-500/10 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-bold text-rose-500 uppercase">Failed</span>
            <span className="text-lg font-black text-rose-400">{stats.failed}</span>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
            <Terminal size={48} />
            <div className="text-center">
              <p className="font-bold">No test runs detected</p>
              <p className="text-xs">Click "Run All Suites" to begin automation</p>
            </div>
          </div>
        ) : (
          results.map((test) => (
            <div 
              key={test.id} 
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                test.status === 'passed' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                test.status === 'failed' ? 'bg-rose-500/5 border-rose-500/20' : 
                'bg-slate-800 border-slate-700 animate-pulse'
              }`}
            >
              <div className="shrink-0">
                {test.status === 'passed' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {test.status === 'failed' && <XCircle size={18} className="text-rose-500" />}
                {test.status === 'running' && <Activity size={18} className="text-indigo-400 animate-spin" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                    test.category === 'BVT' ? 'text-indigo-400 border-indigo-400/30' :
                    test.category === 'Edge Case' ? 'text-amber-400 border-amber-400/30' :
                    'text-slate-400 border-slate-400/30'
                  }`}>
                    {test.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-200 truncate">{test.name}</h4>
                </div>
                {test.error && (
                  <p className="text-[10px] text-rose-400 mt-1 font-mono bg-rose-500/10 p-1.5 rounded border border-rose-500/20 italic">
                    {test.error}
                  </p>
                )}
              </div>

              {test.duration !== undefined && (
                <div className="text-[10px] font-mono text-slate-500">
                  {test.duration}ms
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <ShieldCheck size={12} className="text-emerald-500" />
          Test execution environment: Browser/Sandbox
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;