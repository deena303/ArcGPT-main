import React from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  Search,
  Database,
  Code2,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react';
import { PipelineStep } from '../types/index.js';

interface TimelineProgressProps {
  steps: PipelineStep[];
  currentStepIndex: number;
  isLoading: boolean;
  executionTimeMs?: number;
}

export const TimelineProgress: React.FC<TimelineProgressProps> = ({
  steps,
  currentStepIndex,
  isLoading,
  executionTimeMs,
}) => {
  const isBlocked = steps.some(s => s.status === 'blocked');
  const isFailed = steps.some(s => s.status === 'failed');

  const userSteps = [
    {
      name: 'Understanding',
      desc: 'Parsing natural language intent',
      isCompleted: !isLoading || currentStepIndex >= 1,
      isInProgress: isLoading && currentStepIndex === 0,
      icon: Search,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Finding Data',
      desc: 'Identifying data categories',
      isCompleted: !isLoading ? !isBlocked && !isFailed : currentStepIndex >= 2,
      isInProgress: isLoading && (currentStepIndex === 1 || currentStepIndex === 2),
      icon: Database,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      name: 'Generating SQL',
      desc: 'Formulating structured query',
      isCompleted: !isLoading ? !isBlocked && !isFailed : currentStepIndex >= 4,
      isInProgress: isLoading && currentStepIndex === 3,
      icon: Code2,
      color: 'from-violet-500 to-violet-600',
    },
    {
      name: 'Validating',
      desc: 'Security & access check',
      isCompleted: !isLoading ? !isBlocked && !isFailed : currentStepIndex >= 5,
      isInProgress: isLoading && currentStepIndex === 4,
      isBlocked: isBlocked,
      icon: ShieldCheck,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Retrieving',
      desc: 'Fetching verified records',
      isCompleted: !isLoading && !isBlocked && !isFailed,
      isInProgress: isLoading && currentStepIndex === 5,
      isFailed: isFailed,
      icon: Zap,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      name: 'Insights',
      desc: 'Synthesizing answer & charts',
      isCompleted: !isLoading && !isBlocked && !isFailed,
      isInProgress: isLoading && currentStepIndex >= 6,
      icon: BarChart3,
      color: 'from-teal-500 to-teal-600',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 glass p-5 shadow-md space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${
            isBlocked ? 'bg-gradient-to-br from-red-500 to-rose-600' :
            isFailed ? 'bg-gradient-to-br from-orange-500 to-red-500' :
            isLoading ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
            'bg-gradient-to-br from-emerald-500 to-teal-600'
          } text-white`}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBlocked ? (
              <AlertOctagon className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-800 block">
              {isLoading ? 'Processing Query...' : isBlocked ? 'Query Blocked' : 'Query Processed'}
            </span>
            <span className="text-[10px] text-slate-400">GEN-09 Translation Pipeline</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isLoading ? (
            <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 font-semibold">
              <div className="flex gap-0.5">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
              </div>
              <span>Analyzing...</span>
            </div>
          ) : isBlocked ? (
            <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 font-bold">
              <AlertOctagon className="h-3.5 w-3.5" />
              Query Restricted
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed {executionTimeMs ? `in ${executionTimeMs}ms` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {userSteps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.isInProgress;
          const isDone = step.isCompleted && !step.isBlocked;
          const isErr = (step as any).isBlocked || (step as any).isFailed;

          return (
            <div
              key={idx}
              className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                isErr
                  ? 'bg-red-50 border-red-200'
                  : isActive
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20 shadow-sm'
                  : isDone
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-xs ${
                  isErr
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : isActive
                    ? 'bg-gradient-to-br ' + step.color + ' animate-pulse-ring'
                    : isDone
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-slate-200'
                }`}>
                  {isActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : isErr ? (
                    <AlertOctagon className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3 text-slate-400" />
                  )}
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-300">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <p className={`text-[10px] font-bold leading-tight ${
                isErr ? 'text-red-800' : isActive ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-slate-500'
              }`}>
                {step.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {isLoading && (
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-indeterminate" />
        </div>
      )}
    </div>
  );
};
