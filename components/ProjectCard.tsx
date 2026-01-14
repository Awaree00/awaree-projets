
import React from 'react';
import { Project } from '../types';
import { getSubjectStyle, getStatusStyle } from '../App';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onArchive: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onArchive, onDelete }) => {
  const totalTasks = project.tasks.length;

  const daysLeft = project.deadline 
    ? Math.ceil((project.deadline - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const startDateStr = project.startDate 
    ? new Date(project.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null;

  return (
    <div className="group relative">
      <div 
        onClick={() => onClick(project)}
        className={`bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden ${project.isArchived ? 'opacity-60 grayscale' : ''} ${project.isUrgent ? 'ring-2 ring-red-100' : ''}`}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                project.type === 'Solo' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-800'
              }`}>
                {project.type === 'Solo' ? 'Solo' : 'Groupe'}
              </span>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${getSubjectStyle(project.subject)}`}>
                {project.subject}
              </span>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${getStatusStyle(project.status)}`}>
                {project.status}
              </span>
              {project.isUrgent && (
                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500 text-white border-red-600 animate-pulse">
                  URGENT
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-black text-[#1A1A1A] tracking-tighter leading-none group-hover:text-[#0052FF] transition-colors">{project.name}</h3>
          </div>
          <div className="text-right ml-4">
            <span className="text-2xl font-black text-[#0052FF] tracking-tighter leading-none">{project.progress}%</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
          <div className="bg-[#0052FF] h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,82,255,0.3)]" style={{ width: `${project.progress}%` }}></div>
        </div>

        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex gap-2">
            {startDateStr && <span className="text-[#0052FF]/60">{startDateStr}</span>}
            {startDateStr && <span>→</span>}
            <span className={daysLeft !== null && daysLeft < 0 ? 'text-red-500' : 'text-slate-600'}>
              {daysLeft !== null ? (daysLeft === 0 ? "Now" : daysLeft < 0 ? "Overdue" : `${daysLeft}d`) : 'No Due'}
            </span>
          </div>
          <div>{totalTasks} items</div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
          className="p-2 bg-white/80 backdrop-blur text-[#0052FF] rounded-xl hover:bg-[#0052FF] hover:text-white transition-all shadow-sm border border-slate-100"
          title={project.isArchived ? "Désarchiver" : "Archiver"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 bg-white/80 backdrop-blur text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100"
          title="Supprimer définitivement"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
