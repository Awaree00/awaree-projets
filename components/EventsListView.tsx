
import React, { useState, useMemo } from 'react';
import { AppEvent, EventType } from '../types';

interface EventsListViewProps {
  events: AppEvent[];
  onDeleteEvent: (id: string) => void;
}

const EventsListView: React.FC<EventsListViewProps> = ({ events, onDeleteEvent }) => {
  const [tagFilter, setTagFilter] = useState<EventType[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const allTags: EventType[] = ['RDV', 'Partiel', 'Rendu', 'Cours', 'Perso', 'Admin', 'Autre'];

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by tags
    if (tagFilter.length > 0) {
      filtered = filtered.filter(e => e.types.some(t => tagFilter.includes(t)));
    }

    // Filter by period
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    if (periodFilter === 'today') {
      filtered = filtered.filter(e => e.date >= now.getTime() && e.date <= todayEnd.getTime());
    } else if (periodFilter === 'upcoming') {
      filtered = filtered.filter(e => e.date >= now.getTime());
    } else if (periodFilter === 'past') {
      filtered = filtered.filter(e => e.date < now.getTime());
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // Sort by date ascending
    return filtered.sort((a, b) => a.date - b.date);
  }, [events, tagFilter, periodFilter, searchQuery]);

  const toggleTag = (tag: EventType) => {
    setTagFilter(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Partiel': return 'bg-red-50 text-red-600 border-red-100';
      case 'RDV': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Rendu': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Cours': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Perso': return 'bg-pink-50 text-pink-600 border-pink-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 mt-12 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-5xl font-black text-[#1A1A1A] tracking-tighter">Mes dates</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Évènements & Échéances • {filteredEvents.length} items</p>
        </div>

        <div className="flex-1 max-w-md relative group">
          <input 
            type="text" 
            placeholder="Rechercher une date..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 px-12 py-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#EBF2FF] transition-all"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0052FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Filters Sidebar */}
        <div className="space-y-10">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Période</h3>
            <div className="flex flex-col gap-2">
              {(['all', 'today', 'upcoming', 'past'] as const).map(p => (
                <button 
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`text-left px-5 py-3 rounded-xl text-xs font-black uppercase transition-all ${periodFilter === p ? 'bg-[#0052FF] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-50 hover:bg-slate-50'}`}
                >
                  {p === 'all' ? 'Toutes les dates' : p === 'today' ? "Aujourd'hui" : p === 'upcoming' ? 'À venir' : 'Passées'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tags / Catégories</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${tagFilter.includes(tag) ? 'bg-[#0052FF] text-white border-[#0052FF]' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-100'}`}
                >
                  {tag}
                </button>
              ))}
              {tagFilter.length > 0 && (
                <button onClick={() => setTagFilter([])} className="text-[9px] font-black text-[#0052FF] uppercase mt-2 w-full text-center hover:underline">Effacer</button>
              )}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-3 space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div key={event.id} className="group bg-white rounded-[2rem] border border-slate-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-6">
                  <div className="bg-[#EBF2FF] p-4 rounded-2xl flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-xl font-black text-[#0052FF] leading-none">{new Date(event.date).getDate()}</span>
                    <span className="text-[9px] font-black text-[#0052FF]/60 uppercase tracking-widest mt-1">
                      {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-2">{event.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.types.map(tag => (
                        <span key={tag} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${getTagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  {event.notes && (
                    <p className="text-xs text-slate-400 font-medium italic max-w-xs truncate hidden xl:block">
                      {event.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => onDeleteEvent(event.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-100">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Aucun évènement trouvé</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default EventsListView;
