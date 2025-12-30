
import React, { useState, useMemo } from 'react';
import { BankTransaction, Expense, Truck, ExpenseCategory, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';

interface SplitItem {
  id: string;
  amount: number;
  category: ExpenseCategory;
  subCategory: string;
  description: string;
  truckId: string;
  gstPaid: number;
  gstRate: number;
  isGstManual: boolean;
}

interface SplitTransactionModalProps {
  transaction: BankTransaction;
  trucks: Truck[];
  onSave: (expenses: Omit<Expense, 'id'>[]) => void;
  onCancel: () => void;
}

/**
 * Shared GST Suggestion Logic
 */
const getSuggestedGstRate = (category: string, subCategory: string): number => {
  switch (category) {
    case 'Fuel': return 18;
    case 'Maintenance': return 18;
    case 'Toll': return subCategory === 'Fastag' ? 0 : 12;
    case 'Insurance': return 18;
    case 'Driver Salary':
    case 'Taxes/GST':
    case 'Permit': return 0;
    default: return 18;
  }
};

export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({ transaction, trucks, onSave, onCancel }) => {
  const [splits, setSplits] = useState<SplitItem[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      amount: transaction.amount,
      category: 'Fuel',
      subCategory: 'Diesel',
      description: transaction.description,
      truckId: trucks[0]?.id || '',
      gstPaid: parseFloat((transaction.amount - (transaction.amount / 1.18)).toFixed(2)),
      gstRate: 18,
      isGstManual: false
    }
  ]);

  const totalSplits = splits.reduce((sum, s) => sum + s.amount, 0);
  const remaining = transaction.amount - totalSplits;

  const addSplit = () => {
    if (remaining <= 0) return;
    const defaultCategory = 'Other';
    const defaultSub = 'Misc';
    const suggestedRate = getSuggestedGstRate(defaultCategory, defaultSub);
    const suggestedGst = parseFloat((remaining - (remaining / (1 + suggestedRate / 100))).toFixed(2));

    setSplits([...splits, {
      id: Math.random().toString(36).substr(2, 9),
      amount: remaining,
      category: defaultCategory,
      subCategory: defaultSub,
      description: '',
      truckId: trucks[0]?.id || '',
      gstPaid: suggestedGst,
      gstRate: suggestedRate,
      isGstManual: false
    }]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 1) {
      setSplits(splits.filter(s => s.id !== id));
    }
  };

  const updateSplit = (id: string, updates: Partial<SplitItem>) => {
    setSplits(prevSplits => prevSplits.map(s => {
      if (s.id !== id) return s;
      
      const newSplit = { ...s, ...updates };

      // Handle GST re-calculation if amount or category changed and GST is NOT manual
      if (!newSplit.isGstManual && (updates.amount !== undefined || updates.category !== undefined || updates.subCategory !== undefined)) {
        const rate = getSuggestedGstRate(newSplit.category, newSplit.subCategory);
        const gst = parseFloat((newSplit.amount - (newSplit.amount / (1 + rate / 100))).toFixed(2));
        newSplit.gstRate = rate;
        newSplit.gstPaid = gst;
      }

      return newSplit;
    }));
  };

  const handleSave = () => {
    if (Math.abs(remaining) > 0.01) {
      alert(`The total split amount must equal the transaction amount (₹${transaction.amount}). Current difference: ₹${remaining.toFixed(2)}`);
      return;
    }

    const expenses: Omit<Expense, 'id'>[] = splits.map(s => ({
      date: transaction.date,
      amount: s.amount,
      category: s.category,
      subCategory: s.subCategory,
      truckId: s.truckId,
      description: s.description || transaction.description,
      gstPaid: s.gstPaid,
      gstRate: s.gstRate,
      isBankTransaction: true,
      linkedBankTxnIds: [transaction.id],
      paymentMethod: 'Bank Transfer',
      vendor: transaction.description,
      hasInvoiceCopy: false,
      tags: ['split-entry']
    }));

    onSave(expenses);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-5xl p-10 animate-in fade-in zoom-in duration-500 flex flex-col max-h-[92vh] border border-white/20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.5l2 2H20a2 2 0 0 1 2 2v2.5"/><path d="M12 21a1.5 1.5 0 0 0 1.5-1.5V14a1.5 1.5 0 1 0-3 0v5.5A1.5 1.5 0 0 0 12 21z"/><path d="M16 21a1.5 1.5 0 0 0 1.5-1.5V14a1.5 1.5 0 1 0-3 0v5.5A1.5 1.5 0 0 0 16 21z"/><path d="M20 21a1.5 1.5 0 0 0 1.5-1.5V14a1.5 1.5 0 1 0-3 0v5.5A1.5 1.5 0 0 0 20 21z"/></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Transaction Split Tool</h2>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
              Original: <span className="text-slate-900">₹{transaction.amount.toLocaleString('en-IN')}</span> • <span className="italic">{transaction.description}</span>
            </p>
          </div>
          
          <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center min-w-[200px] ${Math.abs(remaining) < 0.01 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 shadow-xl shadow-rose-100/50'}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Unallocated Balance</span>
            <span className={`text-2xl font-black ${remaining === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {Math.abs(remaining) < 0.01 && (
              <div className="flex items-center space-x-1 mt-1 text-[8px] font-black text-emerald-500 uppercase animate-bounce">
                <span>Perfect Match</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Splits List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4 mb-8">
          {splits.map((split, index) => (
            <div key={split.id} className="relative group animate-in slide-in-from-bottom-4 duration-300">
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-100 rounded-full group-hover:bg-indigo-600 transition-colors"></div>
              <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/40 transition-all space-y-6">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Segment</h4>
                  </div>
                  {splits.length > 1 && (
                    <button 
                      onClick={() => removeSplit(split.id)} 
                      className="p-3 bg-white text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 hover:border-rose-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Amount & GST Column */}
                  <div className="md:col-span-3 space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Allocated Amount</label>
                      <div className="relative">
                        <input 
                          type="number" step="any"
                          className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-base font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                          value={split.amount || ''}
                          onChange={e => updateSplit(split.id, { amount: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">GST ITC</label>
                        {!split.isGstManual && (
                          <span className="text-[7px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase animate-pulse">Auto {split.gstRate}%</span>
                        )}
                      </div>
                      <input 
                        type="number"
                        className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${split.isGstManual ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}
                        value={split.gstPaid || ''}
                        onChange={e => updateSplit(split.id, { gstPaid: parseFloat(e.target.value) || 0, isGstManual: true })}
                      />
                      {split.isGstManual && (
                        <button 
                          onClick={() => updateSplit(split.id, { isGstManual: false })} 
                          className="text-[8px] font-bold text-indigo-500 uppercase mt-2 hover:underline tracking-tighter"
                        >
                          Reset to Auto-Suggest
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category & Truck Column */}
                  <div className="md:col-span-4 space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Business Category</label>
                      <select 
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm cursor-pointer"
                        value={split.category}
                        onChange={e => updateSplit(split.id, { category: e.target.value as ExpenseCategory })}
                      >
                        {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Sub-Category</label>
                      <select 
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm cursor-pointer"
                        value={split.subCategory}
                        onChange={e => updateSplit(split.id, { subCategory: e.target.value })}
                      >
                        {CATEGORIES.find(c => c.name === split.category)?.subCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vehicle & Description Column */}
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Assigned Vehicle</label>
                      <select 
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm cursor-pointer"
                        value={split.truckId}
                        onChange={e => updateSplit(split.id, { truckId: e.target.value })}
                      >
                        {trucks.map(t => <option key={t.id} value={t.id}>{t.regNumber} ({t.model.split(' ').pop()})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Specific Description</label>
                      <textarea 
                        rows={1}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm resize-none"
                        placeholder="Ex: Snacks for driver, Fuel for T1..."
                        value={split.description}
                        onChange={e => updateSplit(split.id, { description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {remaining > 0 && (
            <button 
              onClick={addSplit}
              className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/20 transition-all group flex items-center justify-center space-x-3 active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <span>Add Split Line (Allocate ₹{remaining.toLocaleString()})</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 pt-4 border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="flex-1 py-5 border border-slate-200 text-slate-500 font-black rounded-3xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs active:scale-95"
          >
            Abort Recon
          </button>
          <button 
            onClick={handleSave}
            disabled={Math.abs(remaining) > 0.01}
            className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all disabled:opacity-30 disabled:shadow-none uppercase tracking-[0.2em] text-xs active:scale-95 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Confirm Multi-Record Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
