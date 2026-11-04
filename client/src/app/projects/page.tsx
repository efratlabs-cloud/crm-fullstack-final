'use client';

import { useState, useEffect } from 'react';
import ProjectForm from '@/components/ProjectForm';

interface Project {
  _id?: string;
  name: string;
  description: string;
  status: string;
  deadline: string;
  budget?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // הגדרת הפונקציה והקריאה אליה מתוך ה-useEffect עצמו למניעת שגיאות סדר
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'שגיאה בטעינת הפרויקטים');

        setProjects(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectSaved = (savedProject: Project) => {
    if (editingProject) {
      setProjects(projects.map((p) => (p._id === savedProject._id ? savedProject : p)));
    } else {
      setProjects([...projects, savedProject]);
    }
    closeForm();
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק פרויקט זה?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('שגיאה במחיקת הפרויקט');

      setProjects(projects.filter((p) => p._id !== id));
    } catch (err) {
      alert('שגיאה במחיקת הפרויקט');
    }
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  if (loading) return <div className="p-8 text-center text-slate-600">טוען פרויקטים...</div>;

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">ניהול פרויקטים</h1>
          <p className="mt-2 text-sm text-gray-600">מעקב אחר פרויקטים פעילים, דד-ליינים וסטטוס ביצוע.</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showForm ? 'ביטול' : '+ פרויקט חדש'}
        </button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {showForm && (
        <ProjectForm 
          initialData={editingProject}
          onProjectSaved={handleProjectSaved} 
          onCancel={closeForm} 
        />
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          אין פרויקטים פעילים כרגע. צור פרויקט חדש כדי להתחיל!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(project)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => project._id && handleDeleteProject(project._id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description || 'אין תיאור זמין'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                  {project.status || 'בביצוע'}
                </span>
                {project.deadline && <span>יעד: {new Date(project.deadline).toLocaleDateString('he-IL')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}