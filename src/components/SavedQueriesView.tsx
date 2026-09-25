import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Play,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Code,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SavedQuery, User } from '../types/index.js';

interface SavedQueriesViewProps {
  currentUser?: User;
  onRunQuery: (query: string) => void;
}

export const SavedQueriesView: React.FC<SavedQueriesViewProps> = ({ currentUser, onRunQuery }) => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<SavedQuery | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editQuery, setEditQuery] = useState<string>('');

  const fetchSaved = () => {
    setLoading(true);
    fetch('/api/saved-queries', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setSavedQueries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load saved queries:', err);
        setSavedQueries([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSaved();
  }, [currentUser]);

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    try {
      await fetch(`/api/saved-queries/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle.trim(),
          query: editQuery.trim() || editingItem.natural_language_query,
        }),
      });
      setSavedQueries(prev =>
        prev.map(q =>
          q.id === editingItem.id
            ? { ...q, title: editTitle.trim(), natural_language_query: editQuery.trim() || q.natural_language_query }
            : q
        )
      );
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update query:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved-queries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSavedQueries(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Failed to delete query:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-blue-600" />
            <span>Saved Queries</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Store and organize frequently asked queries for instant one-click re-runs and reporting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-xs text-slate-500">
            Loading saved queries...
          </div>
        ) : savedQueries.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            No saved queries yet. Execute a query and click "Save Query" to keep it here.
          </div>
        ) : (
          savedQueries.map(item => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                {/* Title & Edit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <BookmarkCheck className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditTitle(item.title);
                        setEditQuery(item.natural_language_query);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Edit Saved Query"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Natural Question */}
                <p className="text-xs font-semibold text-slate-700 leading-snug">
                  "{item.natural_language_query}"
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {new Date(item.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>

                <button
                  onClick={() => onRunQuery(item.natural_language_query)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Run Again</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Saved Query Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Saved Query</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Query Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Natural-Language Question
                </label>
                <textarea
                  value={editQuery}
                  onChange={e => setEditQuery(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
