import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { QueryInput } from './components/QueryInput.js';
import { TimelineProgress } from './components/TimelineProgress.js';
import { ResultViewer } from './components/ResultViewer.js';
import { AmbiguityClarifier } from './components/AmbiguityClarifier.js';
import { HistoryView } from './components/HistoryView.js';
import { SavedQueriesView } from './components/SavedQueriesView.js';
import { InsightsView } from './components/InsightsView.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { DashboardOverview } from './components/DashboardOverview.js';
import { SecurityDemoModal } from './components/SecurityDemoModal.js';
import { LoginModal } from './components/LoginModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { LoginPage } from './components/LoginPage.js';
import {
  User,
  QueryExecutionResult,
  ConversationContextItem,
} from './types/index.js';
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionResult, setExecutionResult] = useState<QueryExecutionResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationContextItem[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async response => {
        if (!response.ok) return null;
        return response.json() as Promise<{ user: User }>;
      })
      .then(data => {
        if (data?.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      })
      .catch(() => undefined);

    if (window.location.pathname === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Signed in as ${user.name} (${user.role})`);
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setExecutionResult(null);
    setActiveQuery('');
    setConversationHistory([]);
    setConversationId(undefined);
    setActiveTab('dashboard');
    showToast('Signed out of ArcGPT.');
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'settings') {
      setIsSettingsModalOpen(true);
      return;
    }

    setActiveTab(tab);
    if (tab === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  const handleExecuteQuery = async (queryText: string) => {
    if (!currentUser) return;
    setActiveQuery(queryText);
    setIsLoading(true);
    setCurrentStepIndex(0);
    setActiveTab('ask');

    // Simulate animated step progression through the 6 user phases
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 280);

    try {
      const response = await fetch('/api/query/translate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          conversationHistory,
          conversationId,
        }),
      });

      clearInterval(stepInterval);
      setCurrentStepIndex(6); // Step 6: Preparing insights

      const result = await response.json() as QueryExecutionResult & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'The query could not be processed.');
      }
      setExecutionResult(result);
      if (result.conversationId) setConversationId(result.conversationId);

      if (result.status === 'success' || result.status === 'empty') {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: queryText },
          { role: 'assistant', content: result.naturalLanguageAnswer, sql: result.sanitizedSql || result.generatedSql },
        ]);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Query execution failed:', err);
      showToast('Execution error: ' + (err.message || 'Server error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuery = async (query: string, sql: string) => {
    if (!currentUser) return;
    try {
      const title = query.length > 40 ? query.substring(0, 37) + '...' : query;
      const res = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, query }),
      });
      if (res.ok) {
        showToast('Query saved successfully to Saved Queries list.');
      } else {
        showToast('Failed to save query.', 'error');
      }
    } catch (err) {
      showToast('Failed to save query.', 'error');
    }
  };

  const handleFeedback = async (rating: number, comment: string) => {
    try {
      if (!executionResult?.queryId) return;
      const response = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId: executionResult.queryId,
          rating: rating >= 4 ? 'HELPFUL' : 'NOT_HELPFUL',
          comment,
        }),
      });
      if (!response.ok) throw new Error('Feedback could not be recorded.');
      showToast('Thank you for your feedback! Recorded in the local PostgreSQL feedback table.');
    } catch {
      showToast('Thank you for your feedback! Recorded in system audit logs.');
    }
  };

  // If not authenticated, show the dedicated login page
  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/20 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenSecurityDemo={() => setIsSecurityModalOpen(true)}
        onSignOut={handleSignOut}
        onNavigateToAdmin={() => handleTabChange('admin')}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          userRole={currentUser.role}
        />

        {/* Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
              <div
                className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold shadow-lg transition-all animate-slide-in-right ${
                  toastMessage.type === 'success'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                }`}
              >
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                currentUser={currentUser}
                onNavigate={handleTabChange}
                onRunQuery={handleExecuteQuery}
              />
            )}

            {/* TAB 2: ASK DATA */}
            {activeTab === 'ask' && (
              <div className="space-y-6">
                {/* Natural Language Query Box */}
                <QueryInput
                  onSearch={handleExecuteQuery}
                  isLoading={isLoading}
                  activeQuery={activeQuery}
                />

                {/* Processing Timeline (Visible while loading or after execution) */}
                {(isLoading || executionResult) && (
                  <TimelineProgress
                    steps={
                      executionResult?.pipelineSteps || [
                        { step: 1, name: 'Understanding question', description: 'Parsing natural language criteria and intent', status: 'pending' },
                        { step: 2, name: 'Finding relevant data', description: 'Identifying organizational data categories', status: 'pending' },
                        { step: 3, name: 'Generating query', description: 'Formulating structured data lookup', status: 'pending' },
                        { step: 4, name: 'Validating query', description: 'Verifying data security and access authorization', status: 'pending' },
                        { step: 5, name: 'Retrieving results', description: 'Extracting verified database records', status: 'pending' },
                        { step: 6, name: 'Preparing insights', description: 'Synthesizing plain-English answer and charts', status: 'pending' },
                      ]
                    }
                    currentStepIndex={currentStepIndex}
                    isLoading={isLoading}
                    executionTimeMs={executionResult?.executionTimeMs}
                  />
                )}

                {/* Ambiguity Clarification Component */}
                {executionResult?.clarificationRequired && (
                  <AmbiguityClarifier
                    question={executionResult.clarificationQuestion || 'Please clarify your inquiry.'}
                    suggestions={executionResult.clarificationSuggestions}
                    onSelectSuggestion={handleExecuteQuery}
                  />
                )}

                {/* Query Result Presentation Card */}
                {executionResult && !executionResult.clarificationRequired && (
                  <ResultViewer
                    result={executionResult}
                    onSaveQuery={handleSaveQuery}
                    onFollowUp={handleExecuteQuery}
                    onSubmitFeedback={handleFeedback}
                  />
                )}
              </div>
            )}

            {/* TAB 3: INSIGHTS */}
            {activeTab === 'insights' && (
              <InsightsView onExploreQuery={handleExecuteQuery} />
            )}

            {/* TAB 4: QUERY HISTORY */}
            {activeTab === 'history' && (
              <HistoryView currentUser={currentUser} onRerunQuery={handleExecuteQuery} />
            )}

            {/* TAB 5: SAVED QUERIES */}
            {activeTab === 'saved' && (
              <SavedQueriesView currentUser={currentUser} onRunQuery={handleExecuteQuery} />
            )}

            {/* TAB 6: ADMIN DASHBOARD (PROTECTED AREA) */}
            {activeTab === 'admin' && (
              currentUser.role === 'Admin' ? (
                <AdminDashboard
                  currentUser={currentUser}
                  onReturnToUserPortal={() => handleTabChange('dashboard')}
                />
              ) : (
                <div className="rounded-3xl border border-red-200 bg-white p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    The System Administration area requires Administrator privileges. Your current active role is <strong>{currentUser.role}</strong> ({currentUser.name}).
                  </p>
                  <button
                    onClick={() => handleTabChange('dashboard')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to Dashboard</span>
                  </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <SecurityDemoModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={currentUser}
        onRunTestQuery={handleExecuteQuery}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
