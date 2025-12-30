
import React, { useState, useMemo } from 'react';
import { BankTransaction, Truck, Expense } from '../types';
import { SplitTransactionModal } from './SplitTransactionModal';

interface BankFeedProps {
  transactions: BankTransaction[];
  trucks: Truck[];
  expenses: Expense[];
  onLink: (txns: BankTransaction | BankTransaction[]) => void;
  onSplit: (txn: BankTransaction, splits: any[]) => void;
  onExclude: (txn: BankTransaction) => void;
  onLinkToExisting: (txn: BankTransaction, expenseId: string) => void;
}

export const BankFeed: React.FC<BankFeedProps> = ({ 
  transactions, 
  trucks, 
  expenses, 
  onLink, 
  onSplit, 
  onExclude,
  onLinkToExisting 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showExcluded, setShowExcluded] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [selectedTxnIds, setSelectedTxnIds] = useState<Set<string>>(new Set());
  
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (txn.status === 'Excluded' && !showExcluded) return false;

      const txnDate = new Date(txn.date);
      const matchesStart = startDate ? txnDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? txnDate <= new Date(endDate) : true;
      const matchesMin = minAmount ? txn.amount >= parseFloat(minAmount) : true;
      const matchesMax = maxAmount ? txn.amount <= parseFloat(maxAmount) : true;
      
      return matchesStart && matchesEnd && matchesMin && matchesMax;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate, minAmount, maxAmount, showExcluded]);

  // Candidates for manual reconciliation
  const manualExpenseCandidates = useMemo(() => {
    return expenses.filter(e => !e.isBankTransaction);
  }, [expenses]);

  const totalUnlinked = transactions
    .filter(t => t.status === 'Pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedTransactions = useMemo(() => {
    return transactions.filter(t => selectedTxnIds.has(t.id));
  }, [transactions, selectedTxnIds]);

  const selectedTotal = useMemo(() => {
    return selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [selectedTransactions]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setShowExcluded(false);
  };

  const handleSplitClick = (txn: BankTransaction) => {
    setSelectedTxn(txn);
    setIsSplitModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedTxnIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTxnIds(next);
  };

  const handleBulkLink = () => {
    if (selectedTransactions.length === 0) return;
    onLink(selectedTransactions);
    setSelectedTxnIds(new Set());
  };

  const handleBulkExclude = () => {
    if (selectedTransactions.length === 0) return;
    selectedTransactions.forEach(txn => onExclude(txn));
    setSelectedTxnIds(new Set());
  };

  return (
    <div className="space-y-10 view-transition pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden relative group">
        <div className="absolute inset-0 shimmer opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Bank Recon OS</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Zero-Leakage Financial Verification</p>
        </div>
        <div className="relative z-10 flex space-x-4">
          <div className="bg-indigo-600 px-8 py-5 rounded-[2rem] text-white shadow-2xl shadow-indigo-200">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Unlinked Exposure</p>
            <p className="text-3xl font-black">₹{totalUnlinked.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-8 py-5 rounded-[2rem] flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Found</p>
            <p className="text-3xl font-black text-slate-900">{filteredTransactions.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6 h-fit sticky top-28">
          {selectedTxnIds.size > 0 && (
            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 border border-indigo-500/30 text-white space-y-4">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Selection Queue</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black">₹{selectedTotal.toLocaleString('en-IN')}</p>
                  <p className="text-sm font-bold opacity-60">{selectedTxnIds.size} Items</p>
                </div>
              </div>
              <button 
                onClick={handleBulkLink}
                className="w-full py-4 bg-indigo-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Bulk Create from Match</span>
              </button>
              <button 
                onClick={handleBulkExclude}
                className="w-full py-4 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span>Mark as Personal / Exclude</span>
              </button>
              <button 
                onClick={() => setSelectedTxnIds(new Set())}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Clear Selection
              </button>
            </div>
          )}

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 card-3d-premium">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recon Filters</h3>
                <button onClick={resetFilters} className="text-[9px] font-black text-indigo-500 uppercase hover:underline">Reset</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-1">Calendar Range</label>
                  <div className="space-y-3">
                    <input 
                      type="date" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input 
                      type="date" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 ml-1">Amount Threshold</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      placeholder="Min"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Max"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.2rem] text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-4 cursor-pointer group select-none">
                    <div className={`w-12 h-7 rounded-full transition-all relative ${showExcluded ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={showExcluded}
                        onChange={() => setShowExcluded(!showExcluded)}
                      />
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${showExcluded ? 'left-6' : 'left-1'}`}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Audit Vault</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
                Smart Matching uses AI to detect merchant similarities. Exclude personal debits to keep Audit Reports accurate.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-[3.5rem] p-24 border border-dashed border-slate-200 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </div>
              <h4 className="text-xl font-black text-slate-900">Zero Entries Found</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Adjust filters or refine date range</p>
            </div>
          ) : (
            filteredTransactions.map((txn) => {
              const hasMatch = txn.potentialMatchId;
              const isSelected = selectedTxnIds.has(txn.id);
              const isPending = txn.status === 'Pending';
              const isReconciling = reconcilingId === txn.id;

              // Find exact amount matches in manual records
              const autoMatches = manualExpenseCandidates.filter(e => Math.abs(e.amount - txn.amount) < 0.01);

              return (
                <div key={txn.id} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all group flex flex-col mb-6 ${
                  txn.status === 'Excluded' ? 'opacity-50 grayscale border-slate-100' : 
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/10' : 'border-slate-100 hover:shadow-2xl hover:shadow-indigo-50/50 card-3d-premium'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center space-x-6 flex-1">
                      {isPending && (
                        <button 
                          onClick={() => toggleSelection(txn.id)}
                          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-300'}`}
                        >
                          {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      )}
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-inner shrink-0 ${
                        txn.status === 'Linked' ? 'bg-emerald-50 text-emerald-600' : 
                        txn.status === 'Excluded' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {txn.description.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1.5">
                          <h4 className={`text-lg font-black transition-colors ${txn.status === 'Excluded' ? 'text-slate-400' : 'text-slate-900 group-hover:text-indigo-600'}`}>{txn.description}</h4>
                          {txn.status === 'Linked' && (
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow-sm">Verified Link</span>
                          )}
                          {txn.status === 'Excluded' && (
                            <span className="bg-slate-200 text-slate-500 text-[8px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest">Audit Excluded</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {txn.id}</p>
                           <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{txn.date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10">
                      <div className="text-right min-w-[120px]">
                        <p className={`text-2xl font-black ${txn.status === 'Excluded' ? 'text-slate-400' : 'text-slate-900'}`}>₹{txn.amount.toLocaleString('en-IN')}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Debit Amount</p>
                      </div>
                      
                      {txn.status === 'Pending' && (
                        <div className="flex items-center space-x-3">
                          {!isSelected && (
                            <>
                              <button 
                                onClick={() => onExclude(txn)}
                                className="w-12 h-12 flex items-center justify-center border border-slate-200 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm group/btn"
                                title="Exclude from Audit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                              <button 
                                onClick={() => setReconcilingId(isReconciling ? null : txn.id)}
                                className={`px-6 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${isReconciling ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                              >
                                Link to Manual
                              </button>
                              <button 
                                onClick={() => onLink(txn)}
                                className="px-8 py-4 bg-slate-900 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center space-x-2"
                              >
                                <span>Quick Create</span>
                                {hasMatch && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isReconciling && (
                    <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Select Existing Manual Record to Reconcile</h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {autoMatches.length > 0 ? (
                            autoMatches.map(e => (
                              <button 
                                key={e.id}
                                onClick={() => { onLinkToExisting(txn, e.id); setReconcilingId(null); }}
                                className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-left hover:bg-emerald-100 transition-all group/match relative overflow-hidden"
                              >
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase">Amount Match</div>
                                <p className="text-xs font-black text-slate-900">{e.vendor || e.description}</p>
                                <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{e.date} • {trucks.find(t=>t.id===e.truckId)?.regNumber}</p>
                              </button>
                            ))
                          ) : (
                            <div className="col-span-full py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No manual records found with exact amount ₹{txn.amount}</p>
                               <button onClick={() => setReconcilingId(null)} className="mt-2 text-[9px] font-black text-indigo-600 uppercase hover:underline">Cancel Search</button>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isSplitModalOpen && selectedTxn && (
        <SplitTransactionModal 
          transaction={selectedTxn}
          trucks={trucks}
          onSave={(splits) => {
            onSplit(selectedTxn, splits);
            setIsSplitModalOpen(false);
          }}
          onCancel={() => setIsSplitModalOpen(false)}
        />
      )}
    </div>
  );
};
