
import React, { useState, useRef } from 'react';
import { scanReceipt } from '../geminiService';
import { Expense } from '../types';

interface ReceiptScannerProps {
  onScanComplete: (data: Partial<Expense>) => void;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const data = await scanReceipt(base64);
      onScanComplete(data);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            {isScanning ? (
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{isScanning ? 'AI Extracting Data...' : 'Smart Receipt Scanner'}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Instant Expense Log via AI-OCR</p>
          
          {!isScanning && (
            <div className="space-y-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.8rem] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-[0.2em] text-xs"
              >
                Upload Bill Image
              </button>
              <button 
                onClick={onClose}
                className="w-full py-5 border border-slate-200 text-slate-500 font-black rounded-[1.8rem] hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-xs"
              >
                Cancel
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange} 
          />
        </div>
      </div>
    </div>
  );
};
