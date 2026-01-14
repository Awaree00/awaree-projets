
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectFormData, AppNotification, TaskStatus, AppEvent, EventType, Creation } from './types';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import CalendarView from './components/CalendarView';
import CreationsView from './components/CreationsView';
import EventsListView from './components/EventsListView';
import { suggestTasksForProject } from './services/gemini';

// Thèmes de couleurs pastel réutilisables
export const colorThemes: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  pink: "bg-pink-50 text-pink-600 border-pink-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  red: "bg-red-50 text-red-600 border-red-100",
  slate: "bg-slate-50 text-slate-400 border-slate-100"
};

// Récupération des couleurs depuis le localStorage ou valeurs par défaut
const getStoredTagColors = () => {
  const saved = localStorage.getItem('awaree_tag_colors');
  if (saved) return JSON.parse(saved);
  return {
    'à faire': 'orange',
    'en cours': 'pink',
    'à livrer': 'purple',
    'terminé': 'blue',
    'urgent': 'red'
  };
};

export const getStatusStyle = (status: string) => {
  const colors = getStoredTagColors();
  const colorKey = colors[status] || 'slate';
  return colorThemes[colorKey];
};

export const getSubjectStyle = (subject: string) => {
  const s = subject.toLowerCase();
  if (["économie de projets", "méthodologie de projets", "droit du design"].includes(s)) return colorThemes.orange;
  if (["typographie", "semiologie", "anglais", "branding"].includes(s)) return colorThemes.pink;
  if (["web", "motion", "web design", "motion design"].includes(s)) return colorThemes.purple;
  return colorThemes.blue;
};

type SortOption = 'recent' | 'deadline' | 'progress' | 'name';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('awaree_user_email'));
  const [loginInput, setLoginInput] = useState('');

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'creations' | 'dates'>('home');
  const [tagColors, setTagColors] = useState<Record<string, string>>(getStoredTagColors);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('awaree_projects');
    if (!saved) return [];
    try {
      return JSON.parse(saved).map((p: any) => ({ ...p, notes: p.notes || [], inspirations: p.inspirations || [] }));
    } catch { return []; }
  });

  const [events, setEvents] = useState<AppEvent[]>(() => {
    const saved = localStorage.getItem('awaree_events');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [creations, setCreations] = useState<Creation[]>(() => {
    const saved = localStorage.getItem('awaree_creations');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('awaree_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('awaree_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('awaree_creations', JSON.stringify(creations)); }, [creations]);
  useEffect(() => { localStorage.setItem('awaree_tag_colors', JSON.stringify(tagColors)); }, [tagColors]);

  useEffect(() => {
    document.body.style.overflow = (isModalOpen || selectedProject) ? 'hidden' : 'auto';
  }, [isModalOpen, selectedProject]);

  // --- SORTING LOGIC ---
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(p => p.isArchived === showArchived);
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
        case 'progress':
          return b.progress - a.progress;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [projects, showArchived, sortBy]);

  const activeProjects = useMemo(() => projects.filter(p => !p.isArchived), [projects]);

  const stats = useMemo(() => {
    const totalTasks = activeProjects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completedTasks = activeProjects.reduce((acc, p) => acc + p.tasks.filter(t => t.isCompleted).length, 0);
    const urgentCount = activeProjects.filter(p => p.isUrgent).length;
    
    const subjectCounts = activeProjects.reduce((acc, p) => {
      acc[p.subject] = (acc[p.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSubjects = Object.entries(subjectCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      activeCount: activeProjects.length,
      totalCount: projects.length,
      taskRatio: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      urgentCount,
      topSubjects,
      soloCount: activeProjects.filter(p => p.type === 'Solo').length,
      groupCount: activeProjects.filter(p => p.type === 'Group').length
    };
  }, [activeProjects, projects]);

  const subjects = [
    "Studio Créa", "Illustration", "Branding", "WEB", "MOTION", 
    "Économie de projets", "Méthodologie de projets", "Droit du design", 
    "Typographie", "Semiologie", "Anglais"
  ];

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '', subject: 'Studio Créa', description: '', type: 'Solo', status: 'à faire', isUrgent: false,
    startDate: new Date().toISOString().split('T')[0], deadline: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.includes('@')) {
      setUserEmail(loginInput);
      localStorage.setItem('awaree_user_email', loginInput);
    }
  };

  const handleLogout = () => {
    if (confirm("Se déconnecter ?")) {
      setUserEmail(null);
      localStorage.removeItem('awaree_user_email');
      setCurrentView('home');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsGeneratingTasks(true);
    const suggestedTasks = await suggestTasksForProject(formData.name, formData.subject);
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name, 
      subject: formData.subject, 
      description: formData.description,
      type: formData.type, 
      status: formData.status, 
      isUrgent: formData.isUrgent, 
      progress: 0,
      startDate: formData.startDate ? new Date(formData.startDate).getTime() : Date.now(),
      deadline: formData.deadline ? new Date(formData.deadline).getTime() : undefined,
      tasks: suggestedTasks.map(t => ({ id: Math.random().toString(36).substr(2, 9), title: t, isCompleted: false, status: 'à faire' })),
      versions: [], 
      notes: formData.description ? [{ id: 'init', content: formData.description, timestamp: Date.now() }] : [], 
      inspirations: [], 
      createdAt: Date.now(), 
      updatedAt: Date.now(), 
      isArchived: false
    };
    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setIsGeneratingTasks(false);
    setFormData({ name: '', subject: 'Studio Créa', description: '', type: 'Solo', status: 'à faire', isUrgent: false, startDate: new Date().toISOString().split('T')[0], deadline: '' });
  };

  const handleExportGlobal = () => {
    const data = {
      projects,
      events,
      creations,
      tagColors,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `awaree_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      try {
        if (file.name.endsWith('.html')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          const dataScript = doc.getElementById('awaree-project-data');
          
          if (!dataScript) {
            alert("Ce fichier HTML n'est pas un rapport Awaree valide ou ne contient pas de données de projet.");
            return;
          }

          const importedProject: Project = JSON.parse(dataScript.textContent || '');
          setProjects(prev => {
            const exists = prev.find(p => p.id === importedProject.id);
            if (exists) {
              if (confirm("Ce projet existe déjà dans votre studio. Souhaitez-vous le mettre à jour ?")) {
                return prev.map(p => p.id === importedProject.id ? importedProject : p);
              }
              return prev;
            }
            return [importedProject, ...prev];
          });
          alert(`Projet "${importedProject.name}" restauré avec succès !`);
        } else {
          const data = JSON.parse(content);
          if (data.projects) setProjects(data.projects);
          if (data.events) setEvents(data.events);
          if (data.creations) setCreations(data.creations);
          if (data.tagColors) setTagColors(data.tagColors);
          alert("Studio Awaree restauré avec succès !");
        }
      } catch (err) {
        alert("Erreur lors de l'import : fichier corrompu ou format inconnu.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce projet ? Cette action est irréversible.")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    }
  };

  const updateTagColor = (tagName: string, color: string) => {
    setTagColors(prev => ({ ...prev, [tagName]: color }));
  };

  const ColorPicker = ({ tagName }: { tagName: string }) => (
    <div className="flex gap-1.5 mt-2">
      {Object.keys(colorThemes).map(color => (
        <button
          key={color}
          type="button"
          onClick={() => updateTagColor(tagName, color)}
          className={`w-4 h-4 rounded-full border-2 transition-all ${tagColors[tagName] === color ? 'border-slate-800 scale-125' : 'border-transparent'}`}
          style={{ backgroundColor: color === 'blue' ? '#EBF2FF' : color === 'orange' ? '#FFF7ED' : color === 'pink' ? '#FDF2F8' : color === 'purple' ? '#FAF5FF' : color === 'red' ? '#FEF2F2' : '#F8FAFC' }}
        />
      ))}
    </div>
  );

  // --- RENDERING LOGIN ---
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="logo-awaree text-6xl md:text-9xl text-[#1A1A1A] mb-12">AWAREE</h1>
        <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-md">
           <h2 className="text-xl font-black mb-2">Bienvenue au Studio</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Accès session créative</p>
           <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email professionnel</label>
                <input 
                  required 
                  type="email" 
                  value={loginInput} 
                  onChange={(e) => setLoginInput(e.target.value)} 
                  placeholder="nom@studio.com" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                />
              </div>
              <button type="submit" className="w-full bg-[#0052FF] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                Entrer
              </button>
           </form>
           <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Design Workflow Suite v1.0</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-20 selection:bg-[#0052FF] selection:text-white">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 md:px-12 py-4 md:py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="cursor-pointer group" onClick={() => setCurrentView('home')}>
              <h1 className="logo-awaree text-xl md:text-3xl text-[#1A1A1A] group-hover:text-[#0052FF] transition-colors">AWAREE</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 ml-4">
              <button onClick={() => setCurrentView('dashboard')} className={`text-[10px] font-black uppercase tracking-widest ${currentView === 'dashboard' ? 'text-[#0052FF]' : 'text-slate-400 hover:text-slate-600'}`}>Studio</button>
              <button onClick={() => setCurrentView('dates')} className={`text-[10px] font-black uppercase tracking-widest ${currentView === 'dates' ? 'text-[#0052FF]' : 'text-slate-400 hover:text-slate-600'}`}>Planning</button>
              <button onClick={() => setCurrentView('creations')} className={`text-[10px] font-black uppercase tracking-widest ${currentView === 'creations' ? 'text-[#0052FF]' : 'text-slate-400 hover:text-slate-600'}`}>Portfolio</button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end mr-4">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{userEmail}</span>
               <button onClick={handleLogout} className="text-[8px] font-black text-[#0052FF] uppercase hover:underline">Déconnexion</button>
             </div>
             <button onClick={handleExportGlobal} className="hidden md:flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-[#0052FF] px-3 py-2 transition-colors" title="Sauvegarder tout le studio">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
             </button>
             <button onClick={() => setIsModalOpen(true)} className="bg-[#0052FF] text-white px-5 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">Nouveau</button>
          </div>
        </div>
      </header>
      
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[80vh]">
          <h1 className="logo-awaree text-6xl md:text-9xl text-[#1A1A1A] mb-12">AWAREE</h1>
          <div className="flex flex-col gap-4 w-full max-w-sm px-4">
            <button onClick={() => setCurrentView('dashboard')} className="bg-[#0052FF] text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-xl active:scale-95 transition-all">Studio</button>
            <button onClick={() => setCurrentView('creations')} className="bg-white text-slate-800 border border-slate-100 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg active:scale-95 transition-all">Portfolio</button>
          </div>
        </div>
      )}

      {currentView === 'creations' && <CreationsView creations={creations} onUpdateCreations={setCreations} />}
      {currentView === 'dates' && <EventsListView events={events} onDeleteEvent={(id) => setEvents(events.filter(e => e.id !== id))} />}
      
      {currentView === 'dashboard' && (
        <main className="max-w-7xl mx-auto px-4 md:px-12 mt-8 md:mt-12">
          <section className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Studio Analytics Suite</h2>
              <div className="flex items-center gap-4">
                 <input type="file" ref={importInputRef} onChange={handleImportFile} className="hidden" accept=".json,.html" />
                 <button onClick={() => importInputRef.current?.click()} className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-[#0052FF] transition-colors flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Restaurer Projet
                 </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div><span className="text-[9px] font-black text-[#0052FF] uppercase tracking-widest block mb-4">Progression Globale</span>
                <div className="text-4xl font-black text-slate-800 tracking-tighter">{stats.taskRatio}%</div></div>
                <div className="w-full bg-slate-50 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-[#0052FF] h-full transition-all duration-1000" style={{ width: `${stats.taskRatio}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Activité Studio</span>
                <div className="flex items-center gap-6">
                  <div className="flex-1"><div className="text-4xl font-black text-slate-800 tracking-tighter">{stats.activeCount}</div><span className="text-[8px] font-black text-slate-300 uppercase">Actifs</span></div>
                  <div className="w-px h-10 bg-slate-100"></div>
                  <div className="flex-1 text-right"><div className="text-4xl font-black text-slate-300 tracking-tighter">{stats.totalCount}</div><span className="text-[8px] font-black text-slate-300 uppercase">Total</span></div>
                </div>
              </div>
              <div className="bg-[#EBF2FF] p-8 rounded-[2.5rem] border border-[#D9E6FF] shadow-sm">
                <span className="text-[9px] font-black text-[#0052FF] uppercase tracking-widest block mb-4">Disciplines Actives</span>
                <div className="space-y-3">
                  {stats.topSubjects.map(([sub, count]) => (
                    <div key={sub} className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-600 truncate mr-2">{sub}</span>
                      <span className="text-[9px] font-black text-[#0052FF]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-8 rounded-[2.5rem] border transition-all shadow-sm flex flex-col justify-between ${stats.urgentCount > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-900 border-slate-800'}`}>
                <div><span className={`text-[9px] font-black uppercase tracking-widest block mb-4 ${stats.urgentCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>Priorités</span>
                <div className="text-4xl font-black tracking-tighter text-white">{stats.urgentCount}</div></div>
                <div className="text-[8px] font-black uppercase text-white/40 pt-4">Solo: {stats.soloCount} • Group: {stats.groupCount}</div>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8">
            <div className="flex items-center gap-8">
              <button onClick={() => setShowArchived(false)} className={`text-xl md:text-2xl font-black transition-colors ${!showArchived ? 'text-slate-800' : 'text-slate-300'}`}>Studio</button>
              <button onClick={() => setShowArchived(true)} className={`text-xl md:text-2xl font-black transition-colors ${showArchived ? 'text-slate-800' : 'text-slate-300'}`}>Archives</button>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 mr-1">Trier par:</span>
                {(['recent', 'deadline', 'progress', 'name'] as SortOption[]).map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => setSortBy(opt)} 
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${sortBy === opt ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {opt === 'recent' ? 'Récent' : opt === 'deadline' ? 'Échéance' : opt === 'progress' ? 'Progression' : 'Nom'}
                  </button>
                ))}
              </div>
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Liste</button>
                <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Planning</button>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sortedProjects.map(p => (
                <ProjectCard 
                  key={p.id} 
                  project={p} 
                  onClick={setSelectedProject} 
                  onArchive={() => setProjects(projects.map(pj => pj.id === p.id ? { ...pj, isArchived: !pj.isArchived } : pj))} 
                  onDelete={() => handleDeleteProject(p.id)}
                />
              ))}
              <button onClick={() => setIsModalOpen(true)} className="group border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[220px] hover:border-[#0052FF] hover:bg-[#EBF2FF]/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-[#0052FF] group-hover:text-white transition-all mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#0052FF]">Nouveau Projet</span>
              </button>
            </div>
          ) : (
            <CalendarView projects={sortedProjects} events={events} onSelectProject={setSelectedProject} />
          )}
        </main>
      )}

      {selectedProject && (
        <ProjectDetail 
          project={selectedProject} 
          onUpdate={(u) => { setProjects(projects.map(p => p.id === u.id ? u : p)); setSelectedProject(u); }} 
          onClose={() => setSelectedProject(null)} 
          onArchive={() => { setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, isArchived: !p.isArchived } : p)); setSelectedProject(null); }} 
          onDelete={() => handleDeleteProject(selectedProject.id)}
        />
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-[3.5rem] p-8 md:p-12 overflow-y-auto awaree-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">Nouveau Projet</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Lancement de workflow Awaree</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titre du projet</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Identité Visuelle - Awaree Studio..." className="w-full text-2xl md:text-3xl font-black border-none focus:ring-0 p-0 text-slate-500 placeholder:text-slate-300 outline-none" />
                <div className="h-[2px] bg-slate-50 w-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matière</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-xs">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tag Projet</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl">
                    <button type="button" onClick={() => setFormData({...formData, type: 'Solo'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === 'Solo' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-300'}`}>Solo</button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'Group'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.type === 'Group' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-300'}`}>Groupe</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Initial</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-xs">
                    <option value="à faire">À faire</option>
                    <option value="en cours">En cours</option>
                    <option value="à livrer">À livrer</option>
                    <option value="terminé">Terminé</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Personnalisation des Couleurs de Tags</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {['à faire', 'en cours', 'à livrer', 'terminé', 'urgent'].map(tag => (
                    <div key={tag} className="space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border block w-fit ${tag === 'urgent' ? colorThemes[tagColors['urgent']] : colorThemes[tagColors[tag]]}`}>{tag}</span>
                      <ColorPicker tagName={tag} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dates</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-xs" />
                    <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-xs" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Urgences</label>
                  <label className="flex items-center gap-4 cursor-pointer h-[52px]">
                    <input type="checkbox" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} className="hidden" />
                    <div className={`w-14 h-7 rounded-full transition-all relative ${formData.isUrgent ? 'bg-red-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${formData.isUrgent ? 'translate-x-7' : ''}`}></div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.isUrgent ? 'text-red-500' : 'text-slate-400'}`}>Urgent</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isGeneratingTasks} className="w-full sm:w-auto bg-[#0052FF] text-white px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all">
                  {isGeneratingTasks ? 'Analyse Gemini...' : 'Lancer le Projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
