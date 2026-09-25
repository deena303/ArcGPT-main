import React from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  Lightbulb,
  History,
  BookmarkCheck,
  Settings,
  ShieldAlert,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { UserRole } from "../types/index.js";

export type NavTab =
  | "dashboard"
  | "ask"
  | "insights"
  | "history"
  | "saved"
  | "settings"
  | "admin";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
}) => {
  const mainNavItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "ask" as NavTab, label: "Ask Data", icon: MessageSquareText, badge: "AI" },
    { id: "insights" as NavTab, label: "Insights", icon: Lightbulb, badge: null },
    { id: "history" as NavTab, label: "Query History", icon: History, badge: null },
    { id: "saved" as NavTab, label: "Saved Queries", icon: BookmarkCheck, badge: null },
    { id: "settings" as NavTab, label: "Settings", icon: Settings, badge: null },
  ];

  const isAdmin = userRole === "Admin";

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/70 bg-white/80 glass flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
            Navigation
          </p>
          <nav className="space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all " + (isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={"h-4 w-4 " + (isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={"text-[9px] font-extrabold px-1.5 py-0.5 rounded-md " + (isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700")}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold tracking-widest text-purple-600 uppercase mb-2.5 flex items-center justify-between">
              <span>Administration</span>
              <span className="admin-badge">Pro</span>
            </p>
            <button
              onClick={() => onSelectTab("admin")}
              className={"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all " + (activeTab === "admin" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20" : "text-purple-900 bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/50")}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className={"h-4 w-4 " + (activeTab === "admin" ? "text-white" : "text-purple-600")} />
                <span>Admin Console</span>
              </div>
              <ArrowUpRight className={"h-3.5 w-3.5 " + (activeTab === "admin" ? "text-white" : "text-purple-400")} />
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 p-3.5 border border-blue-100/80 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
              <Database className="h-3.5 w-3.5" />
            </div>
            <p className="font-bold text-xs text-slate-800">QueryMind AI</p>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Ask questions in plain English to explore your organizational data securely.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="text-[10px] font-semibold text-emerald-700">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
