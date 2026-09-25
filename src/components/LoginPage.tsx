import React, { useEffect, useState } from 'react';
import {
  Database,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  BarChart3,
  Terminal,
  Zap,
  Globe,
  Brain,
  Mail,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, UserRole } from '../types/index.js';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const roleOptions: Array<{ role: UserRole; email: string; title: string; desc: string; scope: string[]; sampleQuery: string; gradient: string }> = [
  { role: 'Admin', email: '', title: 'Administrator', desc: 'Institutional oversight and local system governance.', scope: ['All approved institution tables', 'Audit and security monitoring', 'Local user management'], sampleQuery: 'What is the average CGPA of each department?', gradient: 'from-purple-600 to-indigo-600' },
  { role: 'HOD', email: '', title: 'Department Head', desc: 'Department-scoped academic access.', scope: ['Department student records', 'Attendance and academic performance', 'Department course offerings'], sampleQuery: 'Which AIML students have attendance below 75%?', gradient: 'from-blue-600 to-cyan-600' },
  { role: 'Faculty', email: '', title: 'Faculty', desc: 'Authorized academic and classroom access.', scope: ['Academic records', 'Attendance and assessment data', 'Course performance'], sampleQuery: 'Which students in my department have low attendance?', gradient: 'from-emerald-600 to-teal-600' },
];

const roleMeta: Record<UserRole, { title: string; desc: string; scope: string[]; sampleQuery: string; gradient: string }> = {
  Admin: roleOptions[0],
  SUPER_ADMIN: { ...roleOptions[0], title: 'Super Administrator' },
  Principal: { ...roleOptions[0], title: 'Principal' },
  HOD: roleOptions[1],
  Faculty: roleOptions[2],
  Student: { ...roleOptions[2], title: 'Student', desc: 'Personal academic record access.' },
  Accounts: { ...roleOptions[0], title: 'Accounts' },
  'Placement Officer': { ...roleOptions[0], title: 'Placement Officer' },
  Librarian: { ...roleOptions[0], title: 'Librarian' },
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Faculty');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<{ ollama: string; postgresql: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then((data: { ollama?: string; postgresql?: string }) => setHealth({ ollama: data.ollama || 'offline', postgresql: data.postgresql || 'offline' }))
      .catch(() => setHealth({ ollama: 'offline', postgresql: 'offline' }));
  }, []);

  const selected = roleOptions.find(option => option.role === selectedRole) || roleOptions[2];
  const meta = roleMeta[selectedRole];

  const handleSignIn = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setErrorMessage(null);
    if (!emailInput.trim() || !passwordInput) {
      setErrorMessage('Enter the email and password for a local ArcGPT account.');
      return;
    }
    setIsSigningIn(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), password: passwordInput }),
      });
      const data = await response.json() as { user?: User; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error || 'Authentication failed.');
      setPasswordInput('');
      onLogin(data.user);
    } catch (error) {
      setPasswordInput('');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const pipelineSteps = [
    { label: 'Natural Language Input', icon: Brain, color: 'text-blue-600 bg-blue-50' },
    { label: 'Intent & Schema Retrieval', icon: Zap, color: 'text-purple-600 bg-purple-50' },
    { label: 'SQL Generation & Validation', icon: Terminal, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Permission & RBAC Guard', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Safe Database Execution', icon: Database, color: 'text-blue-600 bg-blue-50' },
    { label: 'Result Formatting', icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col font-sans">
      <div className="fixed inset-0 hero-grid pointer-events-none" />
      <header className="relative z-10 w-full border-b border-slate-200/60 glass px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white shadow-lg">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-lg">ArcGPT</span>
              <span className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">GEN-09</span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Natural-Language Data Query Translation System</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="hidden sm:flex items-center gap-1.5 text-slate-500 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-full">
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            Local PostgreSQL: {health?.postgresql || 'checking'}
          </span>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ollama: {health?.ollama || 'checking'}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
          <div className="lg:col-span-6 space-y-7 animate-fade-in-up">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Local PostgreSQL + Ollama
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">Ask your data.<br /><span className="gradient-text-brand">Get answers instantly.</span></h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">ArcGPT securely interprets plain-English questions, retrieves relevant local schema, validates read-only SQL, and returns verified PostgreSQL results.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Local account sign-in</span>
                <Lock className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="px-6 pt-4 pb-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {roleOptions.map(option => (
                    <button key={option.role} type="button" onClick={() => setSelectedRole(option.role)} className={`rounded-lg py-2.5 px-2 text-xs font-bold transition-all ${selectedRole === option.role ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:bg-white/60'}`}>
                      {option.role}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={handleSignIn} className="p-6 space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white font-bold text-sm shadow-md`}>{selected.title.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{meta.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{meta.desc}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input type="email" value={emailInput} onChange={event => setEmailInput(event.target.value)} required className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="user@arcai.edu" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={event => setPasswordInput(event.target.value)}
                        required
                        className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Your local account password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">Authorized scope</p>
                  <div className="grid gap-1.5 mt-2">
                    {meta.scope.map(scope => <div key={scope} className="flex items-center gap-2 text-xs text-slate-700"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />{scope}</div>)}
                  </div>
                </div>
                {errorMessage && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700"><AlertCircle className="h-4 w-4 text-red-600" />{errorMessage}</div>}
                {health?.ollama === 'offline' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Local AI engine is unavailable. Please start Ollama.</div>}
                <button type="submit" disabled={isSigningIn} className="w-full flex items-center justify-center gap-2.5 rounded-xl btn-brand px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70 cursor-pointer shadow-lg">
                  {isSigningIn ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Signing in locally...</span></> : <><span>Sign in to ArcGPT</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5 animate-fade-in-up">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white"><Terminal className="h-4 w-4" /></div><div><span className="text-xs font-bold text-slate-800 block">ArcGPT Local Pipeline</span><span className="text-[10px] text-slate-400">Natural Language → Schema → Validation → Safe SQL</span></div></div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Read-Only</span>
              </div>
              <div className="space-y-2.5">
                {pipelineSteps.map((step, index) => { const Icon = step.icon; return <div key={index} className="flex items-center gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${step.color}`}><Icon className="h-4 w-4" /></div><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-indeterminate" style={{ animationDelay: `${index * 0.15}s` }} /></div><span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap hidden sm:block w-48 text-right">{step.label}</span></div>; })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: ShieldCheck, title: 'Query Guard', desc: 'Blocks mutation and injection attempts.' }, { icon: Sparkles, title: 'Local AI', desc: 'Uses the configured Ollama model.' }, { icon: BarChart3, title: 'Real Results', desc: 'Renders rows from local PostgreSQL.' }].map(item => { const Icon = item.icon; return <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-4 w-4" /></div><h4 className="text-xs font-bold text-slate-900">{item.title}</h4><p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p></div>; })}
            </div>
          </div>
        </div>
      </main>
      <footer className="relative z-10 w-full border-t border-slate-200/60 glass py-4 px-6 text-center text-xs text-slate-400"><p><strong className="text-slate-600">ArcGPT</strong> — local natural-language PostgreSQL query translation.</p></footer>
    </div>
  );
};
