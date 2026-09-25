import React from 'react';
import { Database, ShieldCheck, X, LogOut } from 'lucide-react';
import { User, UserRole } from '../types/index.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser?: (user: User) => void;
  onSignOut?: () => void;
}

const roleDescriptions: Record<UserRole, string> = {
  Admin: 'Institutional administration and audit access.',
  SUPER_ADMIN: 'System administration access.',
  Principal: 'Institution-wide academic oversight.',
  HOD: 'Department-scoped academic access.',
  Faculty: 'Authorized academic and classroom access.',
  Student: 'Personal academic record access.',
  Accounts: 'Authorized financial record access.',
  'Placement Officer': 'Authorized placement record access.',
  Librarian: 'Authorized library record access.',
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, currentUser, onSignOut }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Local account</h3>
              <p className="text-xs text-slate-500">Secure HTTP-only session</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">Authenticated locally</span>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{currentUser.name}</p>
          <p className="text-xs text-slate-600">{currentUser.email}</p>
          <p className="mt-2 text-xs text-slate-600">{roleDescriptions[currentUser.role]}</p>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-3">
          <button
            onClick={() => {
              onClose();
              onSignOut?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
