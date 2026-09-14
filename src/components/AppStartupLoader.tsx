import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface AppStartupLoaderProps {
  progress: number;
  stageText: string;
  onBypassToLocal: () => void;
  onRetry: () => void;
  onResetStorage: () => void;
  elapsedSeconds: number;
  isTakingLonger?: boolean;
}

export const AppStartupLoader: React.FC<AppStartupLoaderProps> = ({
  progress,
  stageText,
  onBypassToLocal,
  onRetry,
  onResetStorage,
  elapsedSeconds,
  isTakingLonger = false,
}) => {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((c) => (c + 1) % 1000);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      id="app-startup-loader-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-4 select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* App Logo & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shadow-lg shadow-amber-400/10 relative">
              <Zap className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
              </span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cennik konwersji lamp i multimediów
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Ładowanie bazy danych pojazdów i modułów</span>
              </p>
            </div>
          </div>

          {/* Active heartbeat indicator */}
          <div className="px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                pulseCount % 2 === 0 ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : 'bg-emerald-600'
              }`}
            />
            <span>{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Big Percentage Progress Card */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 shadow-inner space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span>Postęp inicjalizacji</span>
              </span>
              <p className="text-sm font-medium text-slate-200 truncate max-w-[280px] sm:max-w-xs">
                {stageText || 'Przetwarzanie danych...'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight font-mono">
                {clampedProgress}%
              </span>
            </div>
          </div>

          {/* Progress Bar with Glow */}
          <div className="w-full bg-slate-800/90 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 ease-out shadow-lg shadow-amber-400/30 relative"
              style={{ width: `${clampedProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] rounded-full" />
            </div>
          </div>

          {/* Process Checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  clampedProgress >= 25 ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <span className={clampedProgress >= 25 ? 'text-slate-200' : 'text-slate-500'}>
                Pamięć podręczna
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  clampedProgress >= 50 ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <span className={clampedProgress >= 50 ? 'text-slate-200' : 'text-slate-500'}>
                Baza 266 modeli
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  clampedProgress >= 75 ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <span className={clampedProgress >= 75 ? 'text-slate-200' : 'text-slate-500'}>
                Serwer w chmurze
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  clampedProgress >= 95 ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <span className={clampedProgress >= 95 ? 'text-slate-200' : 'text-slate-500'}>
                Cenniki i marże
              </span>
            </div>
          </div>
        </div>

        {/* Reassurance Banner: App is Active and Not Frozen */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <p className="leading-snug">
            <strong className="text-emerald-200 font-semibold">Aplikacja działa i odpowiada.</strong>{' '}
            Proces nie jest zawieszony, trwa przygotowanie danych.
          </p>
        </div>

        {/* Longer Startup Notice / Safe Fallback Actions (Shown after ~3s or if server is cold-starting) */}
        {isTakingLonger && (
          <div className="space-y-3 pt-2 border-t border-slate-800 animate-fadeIn">
            <div className="flex items-start gap-2.5 text-xs text-amber-300/90 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Rozruch trwa dłużej z powodu wybudzania kontenera serwera lub wolniejszego łącza.
                Możesz od razu wejść do cennika z pamięci urządzenia:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                id="btn-bypass-to-local"
                onClick={onBypassToLocal}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-95"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Otwórz natychmiast z pamięci lokalnej</span>
              </button>

              <button
                type="button"
                id="btn-retry-startup"
                onClick={onRetry}
                className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Ponów próbę odpytania serwera"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Ponów</span>
              </button>

              <button
                type="button"
                id="btn-reset-cache-startup"
                onClick={onResetStorage}
                className="px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Wyczyść pamięć podręczną i zresetuj"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
