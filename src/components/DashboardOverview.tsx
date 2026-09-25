import React, { useState, useEffect } from 'react';
import {
  MessageSquareText,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  Calendar,
  Lightbulb,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { User, QueryHistoryItem } from '../types/index.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardOverviewProps {
  currentUser: User;
  onNavigate: (tab: any) => void;
  onRunQuery: (query: string) => void;
}

export const USER_SUGGESTED_QUESTIONS = [
  'How many students are there in each department?',
  'Which AIML students have attendance below 75%?',
  'What is the average CGPA by department?',
  'Which subject has the lowest average marks?',
  'Show students with attendance below 75%.',
  'Compare average marks across departments.',
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentUser,
  onNavigate,
  onRunQuery,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<QueryHistoryItem[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [dashboardQuery, setDashboardQuery] = useState<string>('');

  useEffect(() => {
    // 1. Fetch real application stats
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error);

    // 2. Fetch real user query history
    fetch('/api/history?limit=6')
      .then(r => r.json())
      .then(d => setRecentQueries(d || []))
      .catch(console.error);

    // 3. Fetch real quick insights
    fetch('/api/insights')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setInsights(d);
        }
      })
      .catch(console.error);
  }, []);

  const handleDashboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardQuery.trim()) return;
    onRunQuery(dashboardQuery.trim());
  };

  // Compute live user stats from actual application data
  const totalQueriesCount = stats?.totalQueries ?? 0;
  const savedQueriesCount = stats?.savedQueries ?? 0;
  const queriesThisWeekCount = stats?.queriesThisWeek ?? (stats?.totalQueries ?? 0);
  const recentInsightsCount = stats?.recentInsights ?? insights.length;

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* ────────────────────────────────────
          HERO SECTION
          ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-8 text-white shadow-2xl shadow-blue-800/30">
        {/* Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-purple-400/15 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-blue-300/10 blur-2xl" />
          {/* Grid */}
          <div className="absolute inset-0 hero-grid opacity-20" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-200 animate-glow-pulse" />
            <span>AI-Powered Natural Data Assistant · GEN-09</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Ask your data anything.<br />
            <span className="text-blue-200 font-light">Get answers instantly.</span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed">
            Get verified, chart-ready answers from your organizational database using plain English — no SQL, no technical knowledge required.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('ask')}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 shadow-lg shadow-black/15 transition-all cursor-pointer group"
            >
              <MessageSquareText className="h-4 w-4" />
              <span>Ask Data</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('insights')}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all cursor-pointer backdrop-blur-sm"
            >
              <Lightbulb className="h-4 w-4 text-blue-200" />
              <span>Explore Insights</span>
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200/80 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Read-Only Verified
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200/80 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              RBAC Enforced
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200/80 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Auto-Visualization
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────
          STATISTICS CARDS (User-facing metrics)
          ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Queries', value: totalQueriesCount, sub: 'All-time questions', icon: MessageSquareText, css: 'stat-card-blue', iconCss: 'text-blue-600 bg-blue-100' },
          { label: 'Saved Queries', value: savedQueriesCount, sub: 'Bookmarked reports', icon: BookmarkCheck, css: 'stat-card-green', iconCss: 'text-emerald-600 bg-emerald-100' },
          { label: 'This Week', value: queriesThisWeekCount, sub: 'Active queries', icon: Calendar, css: 'stat-card-purple', iconCss: 'text-purple-600 bg-purple-100' },
          { label: 'Insights', value: recentInsightsCount, sub: 'Auto-generated', icon: Lightbulb, css: 'stat-card-amber', iconCss: 'text-amber-600 bg-amber-100' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`rounded-2xl ${card.css} p-5 shadow-xs flex flex-col justify-between space-y-3 card-hover`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.iconCss}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
                <span className="text-[11px] text-slate-500 font-medium">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ────────────────────────────────────
          ASK DATA AS MAIN FEATURE
          ──────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Ask a question about your data...
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Type any question in plain English. The assistant analyzes your database records and produces verified answers.
          </p>
        </div>

        <form onSubmit={handleDashboardSubmit} className="space-y-4">
          <div className="relative flex items-center rounded-2xl border-2 border-blue-500/40 bg-slate-50/60 p-2 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10 transition-all shadow-xs">
            <div className="pl-3 text-blue-600 shrink-0">
              <Search className="h-5 w-5" />
            </div>

            <input
              type="text"
              value={dashboardQuery}
              onChange={e => setDashboardQuery(e.target.value)}
              placeholder="Which third-year AIML students have attendance below 75%?"
              className="w-full bg-transparent px-3.5 py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />

            <button
              type="submit"
              disabled={!dashboardQuery.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 transition-all shrink-0 cursor-pointer"
            >
              <span>Ask Data</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* ────────────────────────────────────
            TRY ASKING (Suggested Questions)
            ──────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Try asking:
            </span>
            <span className="text-xs text-slate-400">Click to autofill &amp; execute</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {USER_SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onRunQuery(q)}
                className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3 text-left text-xs font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-900 transition-all shadow-2xs group cursor-pointer"
              >
                <span className="line-clamp-1 pr-2">"{q}"</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────
          QUICK INSIGHTS SECTION
          ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span>Quick Insights</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated analytical highlights synthesized directly from your organizational dataset.
            </p>
          </div>

          <button
            onClick={() => onNavigate('insights')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Insights</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {insights.length > 0 ? (
            insights.map(item => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.subtitle}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold border ${item.badgeColor || 'bg-blue-100 text-blue-800 border-blue-200'}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-slate-900">{item.statValue}</span>
                    <span className="text-[11px] text-slate-500">{item.statSubtext}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onRunQuery(item.query)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer group"
                  >
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
              No calculated insights are available yet.
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────
          RECENT QUERIES SECTION
          ──────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Clock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Queries</h2>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentQueries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No queries recorded yet. Try asking your first question above!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentQueries.map(item => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    "{item.natural_language_query}"
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="capitalize">{item.row_count ?? 0} records returned</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      item.execution_status === 'success'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : item.execution_status === 'blocked'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {item.execution_status === 'success' ? 'Completed' : item.execution_status}
                  </span>

                  <button
                    onClick={() => onRunQuery(item.natural_language_query)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
