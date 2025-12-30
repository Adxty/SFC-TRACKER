
import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Truck, ExpenseCategory, PaymentMethod, BankTransaction } from '../types';
import { CATEGORIES, PAYMENT_METHODS } from '../constants';

interface ExpenseFormProps {
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
  trucks: Truck[];
  initialData?: Expense;
  bankTransactions?: BankTransaction[];
  expenses?: Expense[];
}

const getSuggestedGstRate = (category: string, subCategory: string): number => {
  switch (category) {
    case 'Fuel':
      if (subCategory === 'AdBlue') return 18;
      return 0;
    case 'Maintenance':
      switch (subCategory) {
        case 'Tire Replacement': return 28;
        case 'Engine Repair': return 18;
        case 'Oil Change': return 18;
        case 'Brake Service': return 18;
        default: return 18;
      }
    case 'Toll':
      if (subCategory === 'Parking') return 18;
      if (subCategory === 'Fastag') return 0;
      return 12;
    case 'Insurance': return 18;
    case 'Driver Salary': return 0;
    case 'Taxes/GST': return 18;
    case 'Permit': return 0;
    default: return 18;
  }
};

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onSave, 
  onCancel, 
  trucks, 
  initialData, 
  bankTransactions = [], 
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || 0,
    category: (initialData?.category || 'Fuel') as ExpenseCategory,
    subCategory: initialData?.subCategory || '',
    truckId: initialData?.truckId || trucks[0]?.id || '',
    description: initialData?.description || '',
    gstPaid: initialData?.gstPaid || 0,
    gstRate: initialData?.gstRate || 0,
    isBankTransaction: initialData?.isBankTransaction || false,
    linkedBankTxnIds: initialData?.linkedBankTxnIds || [] as string[],
    paymentMethod: (initialData?.paymentMethod || 'Bank Transfer') as PaymentMethod,
    vendor: initialData?.vendor || '',
    tags: initialData?.tags || [] as string[],
    hasInvoiceCopy: initialData?.hasInvoiceCopy || false,
  });

  const [showGstHelper, setShowGstHelper] = useState(false);
  const [calcInputAmount, setCalcInputAmount] = useState<number>(initialData?.amount || 0);
  const [calcGstRate, setCalcGstRate] = useState<number>(initialData?.gstRate || 18);
  const [manualGstInput, setManualGstInput] = useState<string>('');
  const [calcMode, setCalcMode] = useState<'fromNet' | 'fromGross'>('fromGross');
  const [isGstManuallyEdited, setIsGstManuallyEdited] = useState(!!initialData);

  const selectedCategoryDef = CATEGORIES.find(c => c.name === formData.category);

  // Find matching bank transactions for smart linking
  const bankMatches = useMemo(() => {
    if (formData.amount <= 0 || formData.isBankTransaction) return [];
    return bankTransactions.filter(bt => 
      bt.status === 'Pending' && 
      Math.abs(bt.amount - formData.amount) < 0.01
    );
  }, [formData.amount, formData.isBankTransaction, bankTransactions]);

  const GST_RATES = [0, 5, 12, 18, 28];

  const applyGstRate = (rate: number, isManual: boolean = true) => {
    const gross = formData.amount;
    const gst = gross - (gross / (1 + rate / 100));
    setFormData(prev => ({
      ...prev,
      gstPaid: parseFloat(gst.toFixed(2)),
      gstRate: rate
    }));
    if (isManual) setIsGstManuallyEdited(true);
  };

  useEffect(() => {
    if (!initialData && !isGstManuallyEdited) {
      const suggestion = getSuggestedGstRate(formData.category, formData.subCategory);
      applyGstRate(suggestion, false);
    }
  }, [formData.category, formData.subCategory, initialData, isGstManuallyEdited]);

  useEffect(() => {
    if (selectedCategoryDef && !selectedCategoryDef.subCategories.includes(formData.subCategory)) {
      setFormData(prev => ({ ...prev, subCategory: selectedCategoryDef.subCategories[0] || 'Other' }));
    }
  }, [formData.category, selectedCategoryDef]);

  const gstBreakdown = useMemo(() => {
    let net = 0, gst = 0, gross = 0;
    if (calcMode === 'fromNet') {
      net = calcInputAmount || 0;
      gst = (net * calcGstRate) / 100;
      gross = net + gst;
    } else {
      gross = calcInputAmount || 0;
      if (manualGstInput !== '') {
        gst = parseFloat(manualGstInput) || 0;
        net = gross - gst;
      } else {
        net = gross / (1 + calcGstRate / 100);
        gst = gross - net;
      }
    }
    return {
      net: parseFloat(net.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      gross: parseFloat(gross.toFixed(2))
    };
  }, [calcInputAmount, calcGstRate, calcMode, manualGstInput]);

  const handleApplyGstHelper = () => {
    setFormData(prev => ({
      ...prev,
      amount: gstBreakdown.gross,
      gstPaid: gstBreakdown.gst,
      gstRate: manualGstInput !== '' ? 0 : calcGstRate
    }));
    setIsGstManuallyEdited(true);
    setShowGstHelper(false);
  };

  const handleLinkBankTxn = (txn: BankTransaction) => {
    setFormData(prev => ({
      ...prev,
      isBankTransaction: true,
      linkedBankTxnIds: [txn.id],
      vendor: prev.vendor || txn.description,
      description: prev.description || `Linked to Bank: ${txn.description}`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const calculatedNet = Math.max(0, formData.amount - formData.gstPaid);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[95vh] custom-scrollbar">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{initialData && initialData.id ? 'Update Record' : 'Log New Expense'}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ref ID: {initialData?.id || 'New Entry'}</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowGstHelper(!showGstHelper)}
            className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest border ${showGstHelper ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m5 9 7-7 7 7"/><path d="m19 15-7 7-7-7"/></svg>
            <span>Tax Calc</span>
          </button>
        </div>

        {showGstHelper && (
          <div className="mb-6 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-top-4 duration-300 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Auto-Tax Calculator</h4>
              <div className="flex bg-white/60 border border-indigo-100 p-1 rounded-xl shadow-inner">
                <button type="button" onClick={() => setCalcMode('fromNet')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${calcMode === 'fromNet' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-white/40'}`}>From Net</button>
                <button type="button" onClick={() => setCalcMode('fromGross')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${calcMode === 'fromGross' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-white/40'}`}>From Gross</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-5 mb-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{calcMode === 'fromNet' ? 'Net Price (₹)' : 'Gross Total (₹)'}</label>
                <input type="number" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-2xl text-base font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm" value={calcInputAmount || ''} onChange={e => setCalcInputAmount(parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">GST Slab (%)</label>
                <div className="grid grid-cols-5 gap-2">
                  {GST_RATES.map(rate => (
                    <button key={rate} type="button" onClick={() => setCalcGstRate(rate)} className={`py-3 rounded-xl text-[11px] font-black transition-all border ${calcGstRate === rate ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>{rate}%</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/50 rounded-[1.5rem] p-5 mb-6 space-y-3 border border-indigo-100/50">
               <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                 <span>NET VALUE</span>
                 <span>₹{gstBreakdown.net.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-black text-indigo-600">
                 <span>GST PORTION</span>
                 <span>₹{gstBreakdown.gst.toLocaleString()}</span>
               </div>
               <div className="pt-3 border-t border-indigo-100 flex justify-between items-center font-black">
                 <span className="text-[11px]">GROSS TOTAL</span>
                 <span className="text-lg">₹{gstBreakdown.gross.toLocaleString()}</span>
               </div>
            </div>
            <button type="button" onClick={handleApplyGstHelper} disabled={!calcInputAmount} className="w-full py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.2rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50">Apply to Entry</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Billing Date</label>
              <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gross Amount (₹)</label>
              <input 
                type="number" required step="any"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900 text-lg"
                value={formData.amount}
                onChange={e => {
                   const amt = parseFloat(e.target.value) || 0;
                   const rate = formData.gstRate;
                   const gst = amt - (amt / (1 + rate / 100));
                   setFormData({ ...formData, amount: amt, gstPaid: parseFloat(gst.toFixed(2)) });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sub-Category</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                value={formData.subCategory}
                onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
              >
                {selectedCategoryDef?.subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vehicle</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm" value={formData.truckId} onChange={e => setFormData({ ...formData, truckId: e.target.value })}>
                {trucks.map(truck => <option key={truck.id} value={truck.id}>{truck.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}>
                {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vendor Name</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm" placeholder="Ex: Shell Station" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
          </div>

          <div className="flex items-center space-x-3 px-1">
            <input 
              type="checkbox" 
              id="hasInvoiceCopy"
              className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/10"
              checked={formData.hasInvoiceCopy}
              onChange={e => setFormData({ ...formData, hasInvoiceCopy: e.target.checked })}
            />
            <label htmlFor="hasInvoiceCopy" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
              I have a copy of the invoice
            </label>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                <span>GST Tax Value</span>
                {!isGstManuallyEdited && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[7px] animate-pulse">Suggested {formData.gstRate}%</span>
                )}
                {isGstManuallyEdited && (
                  <button type="button" onClick={() => setIsGstManuallyEdited(false)} className="ml-2 px-2 py-0.5 border border-slate-300 text-slate-400 rounded-md text-[7px] hover:text-indigo-600 hover:border-indigo-200">Reset to Suggestion</button>
                )}
              </label>
              <div className="flex space-x-1">
                {GST_RATES.map(rate => (
                  <button
                    key={rate} type="button" onClick={() => applyGstRate(rate)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${formData.gstRate === rate ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input 
                type="number" step="any"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-indigo-600 text-xl shadow-sm"
                value={formData.gstPaid || ''}
                onChange={e => {
                  setFormData({ ...formData, gstPaid: parseFloat(e.target.value) || 0, gstRate: 0 });
                  setIsGstManuallyEdited(true);
                }}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">INR Tax</div>
            </div>
          </div>

          {/* Smart Bank Linkage matches UI */}
          {!initialData && bankMatches.length > 0 && (
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xs">🔗</div>
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">Smart Bank Match</h4>
                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Detected matching unlinked transactions</p>
                  </div>
               </div>
               <div className="space-y-2">
                  {bankMatches.map(bt => (
                    <div key={bt.id} className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-2xl group transition-all">
                       <div className="flex-1 min-w-0 pr-4">
                          <p className="text-xs font-black text-slate-800 truncate">{bt.description}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{bt.date}</p>
                       </div>
                       <button 
                         type="button"
                         onClick={() => handleLinkBankTxn(bt)}
                         className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            formData.linkedBankTxnIds.includes(bt.id)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                         }`}
                       >
                         {formData.linkedBankTxnIds.includes(bt.id) ? 'Linked' : 'Link'}
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">Save Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
};
