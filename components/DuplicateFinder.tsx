
import React, { useMemo, useState } from 'react';
import { Expense, Truck } from '../types';

interface DuplicateFinderProps {
  expenses: Expense[];
  trucks: Truck[];
  onMerge: (masterId: string, duplicateId: string) => void;
  onDelete: (id: string) => void;
  onIgnore: (id: string) => void;
}

export const DuplicateFinder: React.FC<DuplicateFinderProps> = ({ expenses, trucks, onMerge, onDelete, onIgnore }) => {
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    
    expenses.forEach(e => {
      const vendorSig = (e.vendor || e.description || '').toLowerCase().trim();
      const key = `${e.date}-${e.amount}-${vendorSig}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    return Object.values(groups).filter(group => group.length > 1);
  }, [expenses]);

  const getTruckReg = (id: string) => trucks.find(t => t.id === id)?.regNumber || 'Unknown';

  if (duplicateGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border border-slate-100 shadow-sm animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ledger Integrity: Verified</h3>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Zero Suspicious redundancies found in current journal</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-amber-50 border border-amber-100 p-10 rounded-[3rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden card-3d-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-amber-900 tracking-tighter">Audit Shield: Flagged Entries</h2>
          <p className="text-amber-700 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            Intelligence system detected {duplicateGroups.length} suspected duplicate sets
          </p>
        </div>
        <div className="relative z-10 px-8 py-4 bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-widest shadow-sm">
          Signature: Date + Value + Merchant
        </div>
      </div>

      <div className="space-y-12 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
        {duplicateGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white border border-slate-100 rounded-[3.5rem] shadow-xl overflow-hidden card-3d-premium transition-all duration-500">
            <div className="bg-slate-50/50 px-12 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center space-x-3">
                  <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">Audit Conflict #{groupIdx + 1}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.length} Confirmed Matches</span>
               </div>
               <span className="text-xl font-black text-slate-900 tracking-tighter">Value Dispute: ₹{group[0].amount.toLocaleString()}</span>
            </div>
            
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {group.map((expense, idx) => (
                <div key={expense.id} className="relative p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-300 hover:shadow-2xl interactive-scale transition-all duration-300 group/item">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl font-black">
                        {idx === 0 ? 'A' : 'B'}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Record ID</p>
                        <p className="text-sm font-black text-slate-900">{expense.id}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm ${expense.isBankTransaction ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {expense.isBankTransaction ? 'Bank Recon' : 'Manual Entry'}
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 bg-white/40 p-6 rounded-3xl border border-slate-50">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-black uppercase">Partner</span>
                      <span className="text-slate-900 font-black truncate max-w-[150px]">{expense.vendor || expense.description}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-black uppercase">Asset</span>
                      <span className="text-indigo-600 font-black">{getTruckReg(expense.truckId)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-black uppercase">Segment</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-black">{expense.category}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => onMerge(expense.id, group.find(e => e.id !== expense.id)!.id)}
                      className="flex-1 py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m19 15-7 7-7-7"/></svg>
                      <span>Keep Primary</span>
                    </button>
                    <button 
                      onClick={() => onDelete(expense.id)}
                      className="px-6 py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95 group/del"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/del:rotate-12"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all active:scale-95">Mark as Distinct Audit Records</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
