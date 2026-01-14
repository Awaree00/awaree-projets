
import React, { useState, useMemo } from 'react';
import { Creation } from '../types';

interface CreationsViewProps {
  creations: Creation[];
  onUpdateCreations: React.Dispatch<React.SetStateAction<Creation[]>>;
}

const CreationsView: React.FC<CreationsViewProps> = ({ creations, onUpdateCreations }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Branding');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newImage) return;

    const creation: Creation = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      category: newCategory,
      imageUrl: newImage,
      createdAt: Date.now()
    };

    onUpdateCreations([creation, ...creations]);
    setNewTitle('');
    setNewImage(null);
    setIsAdding(false);
  };

  const filteredCreations = useMemo(() => {
    if (!searchQuery.trim()) return creations;
    const query = searchQuery.toLowerCase();
    return creations.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.category.toLowerCase().includes(query)
    );
  }, [creations, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="shrink-0">
          <h2 className="text-3xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter">Mes créations</h2>
          <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] mt-2">Portfolio personnel • {filteredCreations.length} items affichés</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 lg:max-w-2xl">
          <div className="relative w-full group">
            <input 
              type="text" 
              placeholder="Rechercher un projet, une catégorie..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-100 px-12 py-3.5 md:py-4 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0052FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto bg-[#0052FF] text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span className="text-sm">Ajouter</span>
          </button>
        </div>
      </div>

      {filteredCreations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredCreations.map(c => (
            <div key={c.id} className="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
              </div>
              <div className="p-6 md:p-8">
                <span className="text-[9px] font-black text-[#0052FF] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 mb-4 inline-block">{c.category}</span>
                <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{c.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-100 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Aucune création trouvée</p>
          <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black text-[#0052FF] uppercase tracking-widest hover:underline">Effacer la recherche</button>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsAdding(false)}>
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-y-auto awaree-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">Nouvelle création</h3>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ajout portfolio</span>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-500 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCreation} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Titre du projet</label>
                <input required type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="Ex: Logotype Awaree 2024" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Catégorie</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none cursor-pointer">
                  <option>Branding</option>
                  <option>Illustration</option>
                  <option>WEB Design</option>
                  <option>MOTION Design</option>
                  <option>Édition</option>
                  <option>Packaging</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Aperçu visuel</label>
                <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-[#0052FF] hover:bg-slate-50 overflow-hidden relative transition-all">
                  {newImage ? (
                    <img src={newImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Importer une image</span>
                    </div>
                  )}
                  <input type="file" required className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              </div>
              <button type="submit" className="w-full bg-[#0052FF] text-white py-4 md:py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">Publier le projet</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreationsView;
