
import React, { useMemo, useState } from 'react';
import { Expense, GSTSummary, Revenue } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { COLORS } from '../constants';

interface GSTCenterProps {
  expenses: Expense[];
  revenues: Revenue[];
}

export const GSTCenter: React.FC<GSTCenterProps> = ({ expenses, revenues }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'analytics' | 'audit-vault'>('analytics');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredRevenues = useMemo(() => {
    return revenues.filter(r => r.date.startsWith(selectedMonth));
  }, [revenues, selectedMonth]);

  const gstSummary = useMemo((): GSTSummary => {
    const summary: GSTSummary = {
      period: selectedMonth,
      totalITC: 0,
      totalCollected: 0,
      taxableAmount: 0,
      gstPaidByRate: { 5: 0, 12: 0, 18: 0, 28: 0 },
      gstCollectedByRate: { 5: 0, 12: 0, 18: 0, 28: 0 },
      count: 0
    };

    filteredExpenses.forEach(e => {
      if (e.gstPaid > 0) {
        summary.totalITC += e.gstPaid;
        summary.count += 1;
        summary.taxableAmount += (e.amount - e.gstPaid);
        const rate = e.gstRate || 18;
        summary.gstPaidByRate[rate] = (summary.gstPaidByRate[rate] || 0) + e.gstPaid;
      }
    });

    filteredRevenues.forEach(r => {
      if (r.gstCollected > 0) {
        summary.totalCollected += r.gstCollected;
        const rate = r.gstRate || 5;
        summary.gstCollectedByRate[rate] = (summary.gstCollectedByRate[rate] || 0) + r.gstCollected;
      }
    });

    return summary;
  }, [filteredExpenses, filteredRevenues, selectedMonth]);

  const netLiability = gstSummary.totalCollected - gstSummary.totalITC;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tax & Compliance Hub</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Audit-ready ledgers for your CA</p>
          </div>
          <div className="flex items-center space-x-3">
            <input 
              type="month" 
              className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100">
              Export GSTR Package
            </button>
          </div>
        </div>
        
        <div className="flex mt-8 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Analytics & Liability
          </button>
          <button 
            onClick={() => setActiveTab('audit-vault')}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit-vault' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Audit Vault (Bills)
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Net Liability</p>
                <h3 className="text-4xl font-black">₹{netLiability.toLocaleString()}</h3>
                <p className="text-[10px] font-bold mt-4 opacity-80 uppercase">Total Collected: ₹{gstSummary.totalCollected.toLocaleString()}</p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total ITC (Inward)</p>
                  <h3 className="text-3xl font-black text-emerald-600">₹{gstSummary.totalITC.toLocaleString()}</h3>
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-emerald-500" style={{ width: `${(gstSummary.totalITC / (gstSummary.totalCollected || 1)) * 100}%` }}></div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tax Efficiency</p>
                <div className="flex items-center space-x-4">
                   <div className="w-16 h-16 rounded-full border-4 border-indigo-50 flex items-center justify-center font-black text-indigo-600">
                     {gstSummary.count}
                   </div>
                   <p className="text-[11px] font-bold text-slate-500 leading-tight uppercase">GST Invoices detected for this period</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate-Wise Consolidation</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-10 py-5">Rate Slab</th>
                  <th className="px-10 py-5">Input Credit (Paid)</th>
                  <th className="px-10 py-5">Collected (Sales)</th>
                  <th className="px-10 py-5 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[5, 12, 18, 28].map(rate => (
                  <tr key={rate} className="hover:bg-indigo-50/30 transition-all">
                    <td className="px-10 py-6 text-sm font-black text-slate-700">{rate}% GST</td>
                    <td className="px-10 py-6 text-sm font-bold text-emerald-600">₹{(gstSummary.gstPaidByRate[rate] || 0).toLocaleString()}</td>
                    <td className="px-10 py-6 text-sm font-bold text-indigo-600">₹{(gstSummary.gstCollectedByRate[rate] || 0).toLocaleString()}</td>
                    <td className="px-10 py-6 text-sm font-black text-right">₹{((gstSummary.gstCollectedByRate[rate] || 0) - (gstSummary.gstPaidByRate[rate] || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-500 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col max-h-[700px]">
           <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="text-2xl font-black text-slate-900">Audit Documentation</h3>
              <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 <span>Download All as ZIP</span>
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
              {filteredExpenses.filter(e => e.gstPaid > 0).map(e => (
                <div key={e.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-300 transition-all group h-fit">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">📄</div>
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase">{e.gstRate}% GST</span>
                   </div>
                   <h4 className="text-sm font-black text-slate-800 mb-1 truncate">{e.vendor}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{e.date}</p>
                   <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">ITC Claim</p>
                        <p className="text-sm font-black text-emerald-600">₹{e.gstPaid.toLocaleString()}</p>
                      </div>
                      <button className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">VIEW BILL →</button>
                   </div>
                </div>
              ))}
              {filteredExpenses.filter(e => e.gstPaid > 0).length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No digitized bills for this period</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
