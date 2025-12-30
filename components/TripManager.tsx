
import React, { useState } from 'react';
import { Trip, Truck, Driver } from '../types';

interface TripManagerProps {
  trips: Trip[];
  trucks: Truck[];
  drivers: Driver[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (trip: Trip) => void;
}

export const TripManager: React.FC<TripManagerProps> = ({ trips, trucks, drivers, onAddTrip, onUpdateTrip }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<Trip, 'id'>>({
    truckId: trucks[0]?.id || '',
    driverId: drivers[0]?.id || '',
    origin: '',
    destination: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Loading',
    revenue: 0,
    estimatedFuelCost: 0,
    distanceKm: 0
  });

  const getTruckReg = (id: string) => trucks.find(t => t.id === id)?.regNumber || 'Unknown';
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || 'Unknown';

  const statusColors = {
    'Loading': 'bg-slate-100 text-slate-600',
    'On Road': 'bg-indigo-100 text-indigo-600',
    'Delivered': 'bg-emerald-100 text-emerald-600',
    'Cancelled': 'bg-rose-100 text-rose-600'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trip Logistics OS</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Managed dispatch and journey monitoring</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
        >
          Create Trip Manifest
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-indigo-100 animate-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-8">New Trip Manifest</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Truck</label>
              <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.truckId} onChange={e => setFormData({...formData, truckId: e.target.value})}>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Driver</label>
              <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Start Date</label>
              <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Origin</label>
              <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Source City" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Destination</label>
              <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Destination City" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Contract Value (₹)</label>
              <input type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.revenue} onChange={e => setFormData({...formData, revenue: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-10 pt-10 border-t border-slate-50">
            <button onClick={() => setIsAdding(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Cancel</button>
            <button 
              onClick={() => { onAddTrip(formData); setIsAdding(false); }}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
            >
              Post Manifest
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all group flex flex-wrap lg:flex-nowrap items-center gap-12">
             <div className="flex items-center space-x-8">
                <div className="w-20 h-20 bg-slate-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  🛣️
                </div>
                <div>
                   <h4 className="text-xl font-black text-slate-900 tracking-tight">{trip.origin} → {trip.destination}</h4>
                   <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Trip ID: {trip.id}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] font-black text-indigo-500 uppercase">{getTruckReg(trip.truckId)}</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[trip.status]}`}>{trip.status}</span>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contract Revenue</p>
                   <p className="text-lg font-black text-slate-900">₹{trip.revenue.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Est. Fuel Burn</p>
                   <p className="text-lg font-black text-rose-500">₹{trip.estimatedFuelCost.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Distance</p>
                   <p className="text-lg font-black text-slate-900">{trip.distanceKm} KM</p>
                </div>
             </div>

             <div className="flex space-x-2">
                <button className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all">⚙️</button>
                <button className="px-8 h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Audit Details</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
