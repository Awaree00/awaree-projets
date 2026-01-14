
export type ProjectType = 'Solo' | 'Group';
export type TaskStatus = 'à faire' | 'en cours' | 'à livrer' | 'terminé';
export type EventType = 'RDV' | 'Partiel' | 'Rendu' | 'Cours' | 'Perso' | 'Admin' | 'Autre';

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  attachments?: {
    type: 'image' | 'gif';
    url: string;
  }[];
}

export interface InspirationItem {
  id: string;
  type: 'image' | 'color' | 'text';
  content: string; 
  label?: string;
  createdAt: number;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  status?: TaskStatus;
  dueDate?: number; 
  subTasks?: SubTask[];
}

export interface Version {
  id: string;
  label: string;
  notes: string;
  imageUrl?: string;
  fileName?: string;
  createdAt: number;
}

export interface Creation {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'deadline';
  timestamp: number;
  isRead: boolean;
}

export interface AppEvent {
  id: string;
  title: string;
  date: number; 
  types: EventType[];
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  subject: string;
  description: string; 
  progress: number;
  type: ProjectType;
  status: TaskStatus;
  isUrgent: boolean;
  tasks: Task[];
  versions: Version[];
  notes: ProjectNote[]; 
  inspirations: InspirationItem[]; 
  startDate?: number; 
  deadline?: number; 
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
}

export interface ProjectFormData {
  name: string;
  subject: string;
  description: string;
  type: ProjectType;
  status: TaskStatus;
  isUrgent: boolean;
  startDate?: string;
  deadline?: string;
}
