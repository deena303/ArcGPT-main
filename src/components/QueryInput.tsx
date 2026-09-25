import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  MessageSquareText,
  Mic,
  Zap,
} from "lucide-react";

interface QueryInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  activeQuery: string;
}

export const USER_SUGGESTED_QUESTIONS = [
  "How many students are there in each department?",
  "Which AIML students have attendance below 75%?",
  "What is the average CGPA by department?",
  "Which subject has the lowest average marks?",
  "Show students with attendance below 75%.",
  "Compare average marks across departments.",
];

export const QueryInput: React.FC<QueryInputProps> = ({
  onSearch,
  isLoading,
  activeQuery,
}) => {
  const [inputText, setInputText] = useState<string>(activeQuery || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeQuery) {
      setInputText(activeQuery);
    }
  }, [activeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSearch(inputText.trim());
  };

  const handleSelectSuggested = (q: string) => {
    setInputText(q);
    onSearch(q);
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 glass p-6 sm:p-8 shadow-lg space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Ask Data</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="text-[10px] text-emerald-600 font-semibold">AI Ready</span>
            </div>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What would you like to know about your data?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ask in plain English — get instant answers, charts, and insights from your organizational database.
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className={"relative flex items-center rounded-2xl border-2 p-2 transition-all duration-200 " + (isFocused ? "border-blue-500 bg-white shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/8" : "border-slate-200 bg-slate-50/60 hover:border-slate-300")}>
          <div className="pl-3 shrink-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <Search className={"h-5 w-5 transition-colors " + (isFocused ? "text-blue-600" : "text-slate-400")} />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            placeholder="Which third-year AIML students have attendance below 75%?"
            className="w-full bg-transparent px-3 py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 font-medium"
          />

          {inputText && !isLoading && (
            <button
              type="button"
              onClick={() => { setInputText(""); inputRef.current?.focus(); }}
              className="mr-2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="flex items-center justify-center gap-2 rounded-xl btn-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <div className="flex gap-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white inline-block" />
                </div>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        {isFocused && (
          <p className="text-[11px] text-slate-400 px-1 animate-fade-in">
            Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600">Enter</kbd> to submit
          </p>
        )}
      </form>

      {/* Suggestions */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700">Suggested Questions</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Click to auto-fill & execute</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {USER_SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggested(q)}
              disabled={isLoading}
              className="query-chip flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-900 transition-all shadow-xs group cursor-pointer disabled:opacity-50"
            >
              <span className="line-clamp-2 pr-2 leading-snug">"{q}"</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
