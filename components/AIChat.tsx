
import React, { useState, useRef, useEffect } from 'react';
import { askGemini } from '../geminiService';
import { Expense, Truck } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
}

interface AIChatProps {
  expenses: Expense[];
  trucks: Truck[];
  language?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ expenses, trucks, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Agent SFC Analytics ready. I have audited your current records. Any specific segment you want me to deep-dive into?',
      actions: ['Analyze Fuel Trends', 'Identify Cost Leaks', 'GST ITC Advice']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input;
    if (!userMsg.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const response = await askGemini(userMsg, { expenses, trucks, language });
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Activation Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-slate-900 text-white rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 hover:-rotate-3 transition-all z-40 group"
      >
        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity"></div>
        <div className="relative z-10 flex flex-col items-center">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Analyst</span>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></div>
      </button>

      {isOpen && (
        <div className="fixed bottom-12 right-12 w-[480px] h-[75vh] max-h-[850px] bg-white rounded-[4rem] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.2)] z-50 flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
          {/* AI Header */}
          <div className="bg-slate-900 px-8 py-10 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <div className="shimmer absolute inset-0 opacity-40"></div>
                <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 2v20M5 12h14"/></svg>
              </div>
              <div>
                <h4 className="font-black text-white text-xl tracking-tight leading-none mb-1.5">Agent SFC-01</h4>
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Neural Fleet Intelligence Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-[1.2rem] bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Chat Canvas - Added scroll-smooth */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/20 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-4`}>
                <div className={`max-w-[85%] px-8 py-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none font-bold' 
                    : 'bg-white text-slate-800 border border-slate-200/50 rounded-tl-none font-semibold'
                }`}>
                  {msg.content}
                </div>
                {msg.actions && msg.role === 'assistant' && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-500 delay-300">
                    {msg.actions.map(action => (
                      <button 
                        key={action}
                        onClick={() => handleSend(action)}
                        className="px-4 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-8 py-6 rounded-[2.5rem] shadow-sm border border-slate-200/50 rounded-tl-none flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Analyzing Data</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bay */}
          <div className="p-10 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-4">
              <input 
                type="text"
                placeholder="Ex: 'Which truck is costing me the most?'"
                className="flex-1 px-8 py-5 bg-slate-100 rounded-3xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all border-none"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] hover:bg-indigo-600 disabled:opacity-30 transition-all flex items-center justify-center shadow-2xl active:scale-95 group"
              >
                <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-center mt-4 uppercase tracking-[0.2em]">Contextually aware of all fleet expenses & bank records</p>
          </div>
        </div>
      )}
    </>
  );
};
