
import React, { useState } from 'react';
import { MaintenanceRecord, Truck, MaintenanceStatus } from '../types';

interface MaintenanceTrackerProps {
  records: MaintenanceRecord[];
  trucks: Truck[];
  onAdd: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdate: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
}

export const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({ records, trucks, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<MaintenanceRecord, 'id'>>({
    truckId: trucks[0]?.id || '',
    scheduledDate: new Date().toISOString().split('T')[0],
    type: 'Oil Change',
    cost: 0,
    status: 'Scheduled',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId });
      setEditingId(null);
    } else {
      onAdd(formData);
    }
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      truckId: trucks[0]?.id || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      type: 'Oil Change',
      cost: 0,
      status: 'Scheduled',
      description: '',
    });
  };

  const startEdit = (record: MaintenanceRecord) => {
    setFormData(record);
    setEditingId(record.id);
    setIsAdding(true);
  };

  const getTruckReg = (id: string) => trucks.find(t => t.id === id)?.regNumber || 'Unknown';

  const statusColors = {
    'Scheduled': 'bg-indigo-100 text-indigo-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Maintenance Schedule</h2>
          <p className="text-sm text-slate-500">Track and manage vehicle health</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>Schedule Maintenance</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{editingId ? 'Edit Maintenance' : 'Schedule New Service'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Truck</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.truckId}
                onChange={e => setFormData({ ...formData, truckId: e.target.value })}
              >
                {trucks.map(t => <option key={t.id} value={t.id}>{t.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <input 
                type="text"
                placeholder="e.g. Engine Overhaul"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.scheduledDate}
                onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estimated Cost (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
              <textarea 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
              >
                {editingId ? 'Update Record' : 'Schedule Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Truck</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{record.scheduledDate}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{getTruckReg(record.truckId)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{record.type}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{record.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{record.cost.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[record.status]}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(record)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button onClick={() => onDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
