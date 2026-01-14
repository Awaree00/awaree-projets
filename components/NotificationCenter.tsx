
import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onClear: () => void;
  onRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onClear, onRead }) => {
  return (
    <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#EBF2FF]">
        <h3 className="font-bold text-[#0052FF] text-[10px] uppercase tracking-[0.2em]">Studio Alerts</h3>
        <div className="flex gap-2">
          <button onClick={onClear} className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-[#0052FF] transition-colors">Tout</button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-300 italic text-[10px] uppercase tracking-widest">Aucun message studio</div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => onRead(notif.id)}
              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/10 border-l-4 border-l-[#0052FF]' : ''}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
