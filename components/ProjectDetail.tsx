
import React, { useState, useEffect } from 'react';
import { Project, Task, SubTask, Version, TaskStatus, ProjectNote, InspirationItem } from '../types';
import { getSubjectStyle } from '../App';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onUpdate, onClose, onArchive, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'atelier' | 'versions' | 'infos'>('atelier');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...project });
  
  const [newSubTaskInputs, setNewSubTaskInputs] = useState<{ [key: string]: string }>({});
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionFile, setNewVersionFile] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newMoodColor, setNewMoodColor] = useState('#0052FF');
  const [newMoodText, setNewMoodText] = useState('');

  const subjects = [
    "Studio Créa", "Illustration", "Branding", "WEB", "MOTION", 
    "Économie de projets", "Méthodologie de projets", "Droit du design", 
    "Typographie", "Semiologie", "Anglais"
  ];

  useEffect(() => {
    setEditData({ ...project });
  }, [project]);

  const saveEdits = () => {
    onUpdate({ ...editData, updatedAt: Date.now() });
    setIsEditing(false);
  };

  const handleExportHTML = () => {
    // On prépare la capsule de données pour le ré-import
    const projectDataJSON = JSON.stringify(project);

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport de Projet - ${project.name}</title>
    <!-- CAPSULE DE DONNÉES AWAREE - NE PAS SUPPRIMER POUR LE RÉ-IMPORT -->
    <script id="awaree-project-data" type="application/json">${projectDataJSON}</script>
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; background: #f8fafc; }
        .card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin: 0; color: #0f172a; }
        .meta { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0052ff; letter-spacing: 0.1em; margin-bottom: 10px; }
        .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #94a3b8; margin: 40px 0 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .task { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 600; font-size: 14px; }
        .task.completed { color: #94a3b8; text-decoration: line-through; }
        .note { background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #0052ff; }
        .note-meta { font-size: 10px; font-weight: 700; color: #cbd5e1; margin-top: 8px; }
        .footer { text-align: center; font-size: 10px; font-weight: 800; color: #cbd5e1; margin-top: 50px; text-transform: uppercase; letter-spacing: 0.2em; }
        .import-info { margin-top: 20px; padding: 10px; background: #EBF2FF; border-radius: 10px; font-size: 11px; font-weight: 700; color: #0052ff; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <header>
            <div class="meta">${project.subject} • ${project.type} • ${project.progress}% ACHEVÉ</div>
            <h1>${project.name}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 10px;">${project.description || 'Pas de description.'}</p>
        </header>

        <div class="import-info">✨ Ce fichier peut être ré-importé dans l'application Awaree.</div>

        <div class="section-title">Production Workflow</div>
        ${project.tasks.map(t => `
            <div class="task ${t.isCompleted ? 'completed' : ''}">
                <span style="color: ${t.isCompleted ? '#0052ff' : '#cbd5e1'}">●</span> ${t.title}
            </div>
        `).join('')}

        <div class="section-title">Journal d'Atelier</div>
        ${project.notes.map(n => `
            <div class="note">
                <div>${n.content}</div>
                <div class="note-meta">${new Date(n.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('')}

        <div class="footer">Généré par Studio Awaree • ${new Date().toLocaleDateString()}</div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `awaree_rapport_${project.name.toLowerCase().replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.isCompleted;
        return { ...t, isCompleted: nextCompleted, status: (nextCompleted ? 'terminé' : 'à faire') as TaskStatus };
      }
      return t;
    });
    const completedCount = updatedTasks.filter(t => t.isCompleted).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    onUpdate({ ...project, tasks: updatedTasks, progress, updatedAt: Date.now() });
  };

  const addSubTask = (taskId: string) => {
    const title = newSubTaskInputs[taskId];
    if (!title?.trim()) return;
    const newSub: SubTask = { id: Math.random().toString(36).substr(2, 9), title: title.trim(), isCompleted: false };
    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, subTasks: [...(t.subTasks || []), newSub] } : t);
    onUpdate({ ...project, tasks: updatedTasks, updatedAt: Date.now() });
    setNewSubTaskInputs({ ...newSubTaskInputs, [taskId]: '' });
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubs = (t.subTasks || []).map(s => s.id === subTaskId ? { ...s, isCompleted: !s.isCompleted } : s);
        return { ...t, subTasks: updatedSubs };
      }
      return t;
    });
    onUpdate({ ...project, tasks: updatedTasks, updatedAt: Date.now() });
  };

  const addNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote: ProjectNote = { id: Math.random().toString(36).substr(2, 9), content: newNoteContent, timestamp: Date.now() };
    onUpdate({ ...project, notes: [newNote, ...(project.notes || [])], updatedAt: Date.now() });
    setNewNoteContent('');
  };

  const handleNoteImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newNote: ProjectNote = { 
          id: Math.random().toString(36).substr(2, 9), 
          content: '', 
          timestamp: Date.now(), 
          attachments: [{ type: 'image', url: reader.result as string }] 
        };
        onUpdate({ ...project, notes: [newNote, ...(project.notes || [])], updatedAt: Date.now() });
      };
      reader.readAsDataURL(file);
    }
  };

  const addMoodItem = (type: 'image' | 'color' | 'text', content: string) => {
    const newItem: InspirationItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      createdAt: Date.now()
    };
    onUpdate({ ...project, inspirations: [newItem, ...(project.inspirations || [])], updatedAt: Date.now() });
  };

  const deleteMoodItem = (id: string) => {
    onUpdate({ ...project, inspirations: project.inspirations.filter(i => i.id !== id), updatedAt: Date.now() });
  };

  const handleMoodImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => addMoodItem('image', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addVersion = () => {
    if (!newVersionLabel.trim()) return;
    const newVersion: Version = { id: Math.random().toString(36).substr(2, 9), label: newVersionLabel.trim(), notes: '', imageUrl: newVersionFile || undefined, createdAt: Date.now() };
    onUpdate({ ...project, versions: [newVersion, ...project.versions], updatedAt: Date.now() });
    setNewVersionLabel(''); setNewVersionFile(null);
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const today = new Date().toDateString();
    const isToday = date.toDateString() === today;
    return `${isToday ? "Aujourd'hui" : date.toLocaleDateString()} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-slate-900/60 md:backdrop-blur-md flex flex-col md:p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white w-full h-full md:max-w-7xl md:h-[92vh] md:rounded-[3.5rem] md:mx-auto md:my-auto md:shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 md:px-12 md:py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <button onClick={onClose} className="text-[#0052FF] font-black uppercase text-[9px] flex items-center gap-2 mb-2 group">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              Studio Awaree
            </button>
            {isEditing ? (
              <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="text-xl md:text-2xl font-black tracking-tighter w-full bg-slate-50 rounded-2xl px-4 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none" />
            ) : (
              <h2 className="text-xl md:text-2xl font-black tracking-tighter truncate">{project.name}</h2>
            )}
          </div>
          <div className="flex items-center gap-4 md:gap-6 ml-4">
             <button onClick={handleExportHTML} className="hidden sm:flex p-3 bg-slate-50 text-slate-400 hover:text-[#0052FF] rounded-2xl transition-all" title="Exporter Rapport HTML">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </button>
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-2xl font-black text-[#0052FF] tracking-tighter">{project.progress}%</span>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Production</span>
             </div>
             <button onClick={() => isEditing ? saveEdits() : setIsEditing(true)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-[#0052FF] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
               {isEditing ? 'Valider' : 'Éditer'}
             </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-50 overflow-x-auto no-scrollbar shrink-0 px-8">
          {[
            { id: 'atelier', label: 'Atelier (Journal & Mood)' },
            { id: 'versions', label: 'Versions' },
            { id: 'infos', label: 'Configuration' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-5 px-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap relative transition-all ${activeTab === tab.id ? 'text-[#0052FF]' : 'text-slate-300 hover:text-slate-400'}`}>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-6 right-6 h-1 bg-[#0052FF] rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          
          {/* TAB: ATELIER (SCINDÉ) */}
          {activeTab === 'atelier' && (
            <div className="flex flex-col lg:flex-row h-full animate-in fade-in duration-300">
              
              {/* Colonne Gauche: Journal & Workflow */}
              <div className="flex-1 overflow-y-auto awaree-scrollbar p-6 md:p-12 space-y-12">
                <div className="max-w-2xl mx-auto space-y-12">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Journal de bord</h3>
                    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 focus-within:border-[#0052FF] transition-all shadow-sm">
                      <textarea 
                        value={newNoteContent} 
                        onChange={e => setNewNoteContent(e.target.value)} 
                        placeholder="Quoi de neuf sur le projet ?" 
                        rows={2} 
                        className="w-full bg-transparent border-none p-0 font-bold text-slate-700 placeholder:text-slate-200 focus:ring-0 resize-none mb-4" 
                      />
                      <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                        <label className="p-3 bg-slate-50 rounded-2xl text-slate-400 cursor-pointer hover:bg-[#EBF2FF] hover:text-[#0052FF] transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <input type="file" className="hidden" accept="image/*" onChange={handleNoteImage} />
                        </label>
                        <button onClick={addNote} className="bg-[#0052FF] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Envoyer</button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-6">
                      {project.notes.map(note => (
                        <div key={note.id} className="flex gap-4 group">
                          <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-[#0052FF] font-black text-[10px] shrink-0 uppercase tracking-tighter">A</div>
                          <div className="flex-1 space-y-1">
                            <div className="bg-slate-50 p-5 rounded-[1.5rem] rounded-tl-none border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                              {note.content && <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">{note.content}</p>}
                              {note.attachments?.map((att, i) => <img key={i} src={att.url} className="mt-3 rounded-xl max-w-full" alt="note" />)}
                            </div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">{formatTime(note.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pt-8 border-t border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Production Checklist</h3>
                    <div className="space-y-6">
                      {project.tasks.map(t => (
                        <div key={t.id} className="space-y-3">
                          <div onClick={() => toggleTask(t.id)} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${t.isCompleted ? 'bg-slate-50 opacity-50' : 'bg-white border-slate-100 shadow-sm hover:border-blue-100'}`}>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${t.isCompleted ? 'bg-[#0052FF] border-[#0052FF]' : 'border-slate-200'}`}>
                              {t.isCompleted && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-[13px] font-black tracking-tight flex-1 ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</span>
                          </div>
                          {t.subTasks?.map(sub => (
                            <div key={sub.id} onClick={() => toggleSubTask(t.id, sub.id)} className="ml-12 flex items-center gap-3 p-1.5 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${sub.isCompleted ? 'bg-blue-300 border-blue-300' : 'border-slate-200 group-hover:border-blue-200'}`}>
                                {sub.isCompleted && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className={`text-[11px] font-bold ${sub.isCompleted ? 'line-through text-slate-300' : 'text-slate-500'}`}>{sub.title}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Colonne Droite: Moodboard Sidebar */}
              <div className="w-full lg:w-[400px] border-l border-slate-50 bg-slate-50/40 overflow-y-auto awaree-scrollbar p-6 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Moodboard Express</h3>
                  <div className="flex gap-2">
                    <label className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100 cursor-pointer hover:text-[#0052FF] transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      <input type="file" className="hidden" accept="image/*" onChange={handleMoodImage} />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Ajouter Rapidement Notes/Couleurs */}
                  <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex gap-2">
                      <input type="color" value={newMoodColor} onChange={e => setNewMoodColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent" />
                      <button onClick={() => addMoodItem('color', newMoodColor)} className="flex-1 bg-slate-50 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all tracking-widest">Couleur</button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newMoodText} onChange={e => setNewMoodText(e.target.value)} placeholder="Concept..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-[11px] font-bold text-slate-600 outline-none" />
                      <button onClick={() => { if(newMoodText) { addMoodItem('text', newMoodText); setNewMoodText(''); } }} className="bg-[#0052FF] text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">Note</button>
                    </div>
                  </div>

                  {/* Liste des items Moodboard */}
                  <div className="grid grid-cols-2 gap-4">
                    {project.inspirations.map(insp => (
                      <div key={insp.id} className="group relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white aspect-square hover:shadow-lg transition-all">
                        {insp.type === 'image' && <img src={insp.content} className="w-full h-full object-cover" />}
                        {insp.type === 'color' && <div className="w-full h-full flex flex-col items-center justify-center p-2" style={{ backgroundColor: insp.content }}><span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[7px] font-black uppercase shadow-sm">{insp.content}</span></div>}
                        {insp.type === 'text' && <div className="w-full h-full bg-amber-50 p-4 flex items-center justify-center text-center"><p className="text-[10px] font-black text-amber-900 italic leading-tight">"{insp.content}"</p></div>}
                        
                        <button onClick={() => deleteMoodItem(insp.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {project.inspirations.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Aucune inspiration</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VERSIONS */}
          {activeTab === 'versions' && (
            <div className="flex-1 overflow-y-auto awaree-scrollbar p-6 md:p-12 space-y-12 animate-in fade-in duration-300">
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-8 items-end shadow-sm">
                  <div className="md:col-span-4 space-y-3">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Nom de la version</label>
                    <input type="text" value={newVersionLabel} onChange={e => setNewVersionLabel(e.target.value)} placeholder="V2 - Design Review" className="w-full bg-white border-none rounded-xl px-5 py-3.5 font-black text-xs outline-none" />
                  </div>
                  <div className="md:col-span-5 space-y-3">
                     <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Aperçu visuel</label>
                     <label className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 transition-all">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-bold text-slate-400 truncate">{newVersionFile ? "Prêt à l'envoi" : "Importer..."}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewVersionFile(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                     </label>
                  </div>
                  <div className="md:col-span-3">
                     <button onClick={addVersion} disabled={!newVersionLabel} className="w-full bg-[#0052FF] text-white py-3.5 rounded-xl font-black text-[10px] uppercase shadow-xl shadow-blue-500/10 active:scale-95 transition-all disabled:opacity-50">Archiver</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {project.versions.map(v => (
                    <div key={v.id} className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all">
                      {v.imageUrl && <img src={v.imageUrl} className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700" />}
                      <div className="p-8 flex justify-between items-center bg-white relative">
                        <div>
                          <span className="text-xs font-black uppercase text-slate-800 block tracking-tight">{v.label}</span>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(v.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONFIGURATION */}
          {activeTab === 'infos' && (
            <div className="flex-1 overflow-y-auto awaree-scrollbar p-6 md:p-12 animate-in fade-in duration-300">
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Discipline</label>
                     {isEditing ? (
                       <div className="flex flex-wrap gap-2">
                         {subjects.map(s => (
                           <button key={s} onClick={() => setEditData({...editData, subject: s})} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${editData.subject === s ? getSubjectStyle(s) : 'bg-slate-50 text-slate-400 border-transparent'}`}>{s}</button>
                         ))}
                       </div>
                     ) : (
                       <span className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase inline-block border ${getSubjectStyle(project.subject)}`}>{project.subject}</span>
                     )}
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mode</label>
                     {isEditing ? (
                       <div className="flex bg-slate-50 p-1 rounded-2xl w-full">
                         <button onClick={() => setEditData({...editData, type: 'Solo'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editData.type === 'Solo' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-300'}`}>Solo</button>
                         <button onClick={() => setEditData({...editData, type: 'Group'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${editData.type === 'Group' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-300'}`}>Groupe</button>
                       </div>
                     ) : (
                       <span className="bg-slate-50 text-slate-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase inline-block border border-slate-100">{project.type}</span>
                     )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dates</label>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl">
                         <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Début</span>
                         {isEditing ? <input type="date" value={new Date(editData.startDate || Date.now()).toISOString().split('T')[0]} onChange={e => setEditData({...editData, startDate: new Date(e.target.value).getTime()})} className="bg-transparent border-none p-0 text-xs font-black text-slate-700 outline-none" /> : <span className="text-xs font-black text-slate-700">{new Date(project.startDate || Date.now()).toLocaleDateString()}</span>}
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl">
                         <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Deadline</span>
                         {isEditing ? <input type="date" value={editData.deadline ? new Date(editData.deadline).toISOString().split('T')[0] : ''} onChange={e => setEditData({...editData, deadline: new Date(e.target.value).getTime()})} className="bg-transparent border-none p-0 text-xs font-black text-slate-700 outline-none" /> : <span className="text-xs font-black text-slate-700">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
                    <button onClick={() => isEditing && setEditData({...editData, isUrgent: !editData.isUrgent})} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${isEditing ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${(isEditing ? editData.isUrgent : project.isUrgent) ? 'bg-red-50 border-red-100 text-red-600 font-black' : 'bg-slate-50 border-transparent text-slate-400 font-bold'}`}>
                      <span className="text-[10px] uppercase tracking-widest">Priorité Haute</span>
                      {(isEditing ? editData.isUrgent : project.isUrgent) && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}
                    </button>
                    <div className="flex gap-4">
                      <button onClick={onArchive} className="flex-1 flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all group">
                        <span className="text-[10px] font-black uppercase tracking-widest">{project.isArchived ? 'Restaurer' : 'Archiver'}</span>
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </button>
                      <button onClick={onDelete} className="flex items-center justify-center p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brief / Notes</label>
                  {isEditing ? (
                    <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={5} className="w-full bg-slate-50 border-none rounded-3xl px-8 py-6 font-medium text-[13px] focus:ring-4 focus:ring-blue-50 outline-none resize-none" />
                  ) : (
                    <div className="text-[13px] font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-3xl border border-slate-50 italic">
                      {project.description || "Aucune note additionnelle."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
