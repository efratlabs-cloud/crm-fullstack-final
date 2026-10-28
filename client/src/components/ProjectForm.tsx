'use client';

import { useState, useEffect } from 'react';

interface Lead {
  _id: string;
  name: string;
}

interface Project {
  _id?: string;
  name: string;
  description: string;
  status: string;
  deadline: string;
  budget?: number;
  lead?: string | Lead;
}

interface ProjectFormProps {
  initialData?: Project | null;
  onProjectSaved: (savedProject: Project) => void;
  onCancel: () => void;
}

export default function ProjectForm({ initialData, onProjectSaved, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'בביצוע');
  const [deadline, setDeadline] = useState(
    initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : ''
  );
  const [budget, setBudget] = useState(initialData?.budget?.toString() || '');
  const [lead, setLead] = useState(
    typeof initialData?.lead === 'object' && initialData?.lead !== null 
      ? initialData.lead._id 
      : (initialData?.lead || '')
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/leads', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setLeads(data);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };
    fetchLeads();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) {
      alert('חובה לבחור ליד משויך לפרויקט');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = initialData?._id 
        ? `http://localhost:5000/api/projects/${initialData._id}`
        : 'http://localhost:5000/api/projects';
      
      const method = initialData?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          description, 
          status,
          deadline, 
          budget: budget ? Number(budget) : 0,
          lead 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'שגיאה בשמירת הפרויקט');

      onProjectSaved(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשמירת הפרויקט';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        {initialData?._id ? 'עריכת פרויקט' : 'הוספת פרויקט חדש'}
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">שם הפרויקט *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">שייך לליד *</label>
        <select
          required
          value={lead}
          onChange={(e) => setLead(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
        >
          <option value="">בחר ליד מהרשימה...</option>
          {leads.map((l) => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">סטטוס</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="בביצוע">בביצוע</option>
            <option value="בדיקות">בדיקות</option>
            <option value="הסתיים">הסתיים</option>
            <option value="הושהה">הושהה</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">תקציב (₪)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">תאריך יעד (Deadline)</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'שומר...' : 'שמור שינויים'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}