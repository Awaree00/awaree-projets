
import React, { useState } from 'react';
import { Project, AppEvent } from '../types';

interface CalendarViewProps {
  projects: Project[];
  events: AppEvent[];
  onSelectProject: (project: Project) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects, events, onSelectProject }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 });

  const getItemsForDay = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    const projectDeadlines = projects.filter(p => p.deadline && new Date(p.deadline).toDateString() === dayDate);
    const appEvents = events.filter(e => new Date(e.date).toDateString() === dayDate);
    return { projectDeadlines, appEvents };
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-6 md:mb-10">
        <h3 className="text-xl md:text-3xl font-black text-slate-800 capitalize tracking-tighter">{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 md:p-3 bg-slate-50 rounded-xl text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <button onClick={nextMonth} className="p-2 md:p-3 bg-slate-50 rounded-xl text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-4">
        <div className="min-w-[700px] md:min-w-full">
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-2">{d}</div>
            ))}
            
            {padding.map((_, i) => <div key={`pad-${i}`} className="h-20 md:h-32 bg-slate-50/30 rounded-[1.2rem] md:rounded-[1.5rem]"></div>)}
            
            {days.map(day => {
              const { projectDeadlines, appEvents } = getItemsForDay(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div key={day} className={`min-h-[100px] md:min-h-[140px] p-2 md:p-4 border border-slate-50 rounded-[1.2rem] md:rounded-[1.5rem] transition-all ${isToday ? 'bg-blue-50/30 ring-2 ring-[#0052FF]/10' : 'bg-white'}`}>
                  <span className={`text-[10px] md:text-xs font-black ${isToday ? 'text-[#0052FF]' : 'text-slate-300'}`}>{day}</span>
                  <div className="mt-2 space-y-1">
                    {appEvents.map(e => (
                      <div key={e.id} className="text-[7px] md:text-[8px] px-1.5 py-1 bg-slate-800 text-white rounded-md truncate font-black uppercase">{e.title}</div>
                    ))}
                    {projectDeadlines.map(p => (
                      <div key={p.id} onClick={() => onSelectProject(p)} className="text-[7px] md:text-[8px] bg-[#0052FF] text-white p-1.5 rounded-md cursor-pointer truncate font-black uppercase">RENDU</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="md:hidden text-center text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">← Glissez pour voir le mois →</p>
    </div>
  );
};

export default CalendarView;
