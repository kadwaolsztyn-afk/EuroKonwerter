import React from 'react';
import { RotateCw, Zap, X } from 'lucide-react';

interface AppStartupLoaderProps {
  progress: number;
  stageText: string;
  onBypassToLocal: () => void;
  onRetry: () => void;
  onResetStorage: () => void;
  elapsedSeconds: number;
  isTakingLonger?: boolean;
  isPreview?: boolean;
  onClosePreview?: () => void;
  onReplayPreview?: () => void;
  onToggleTakingLonger?: () => void;
  onSetProgressManual?: (val: number) => void;
}

export const AppStartupLoader: React.FC<AppStartupLoaderProps> = ({
  progress,
  stageText,
  onBypassToLocal,
  onRetry,
  onResetStorage,
  elapsedSeconds,
  isTakingLonger = false,
  isPreview = false,
  onClosePreview,
  onReplayPreview,
  onToggleTakingLonger,
  onSetProgressManual,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      id="app-startup-loader-screen"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 select-none transition-all duration-300"
    >
      {/* Centered animation presentation directly on the uniform navy canvas */}
      <div className="relative w-full max-w-xs p-0 space-y-4 text-center">
        
        {/* Discrete preview control bar (only in preview mode) */}
        {isPreview && (
          <div className="flex items-center justify-center gap-2 mb-2">
            {onReplayPreview && (
              <button
                type="button"
                onClick={onReplayPreview}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/30 shadow-md"
                title="Odtwórz od nowa"
              >
                <RotateCw className="w-3 h-3" />
                <span>Odtwórz</span>
              </button>
            )}
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-all cursor-pointer border border-slate-800 shadow-md flex items-center gap-1"
                title="Zamknij podgląd"
              >
                <X className="w-3 h-3" />
                <span>Zamknij</span>
              </button>
            )}
          </div>
        )}

        {/* Elegant Dual Spinning Gears (Trybiki na jednolitym granatowym tle) */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {/* Primary Main Gear (Clockwise rotation) */}
          <svg
            className="w-14 h-14 text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: 'spinGearClockwise 5s linear infinite',
              transformOrigin: '50px 50px',
            }}
          >
            {/* Gear hub filled with exact matching navy background */}
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="4" fill="#020617" />
            <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="3" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />

            {/* 12 Precise Cog Teeth */}
            {[...Array(12)].map((_, i) => {
              const angle = i * 30;
              return (
                <rect
                  key={i}
                  x="46"
                  y="12"
                  width="8"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
          </svg>

          {/* Secondary Interlocking Smaller Gear (Counter-Clockwise rotation) */}
          <svg
            className="w-9 h-9 text-slate-400 absolute -top-1 -right-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: 'spinGearCounterClockwise 3.2s linear infinite',
              transformOrigin: '40px 40px',
            }}
          >
            <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="3" fill="#020617" />
            <circle cx="40" cy="40" r="8" fill="currentColor" opacity="0.8" />
            {/* 8 Cog Teeth */}
            {[...Array(8)].map((_, i) => {
              const angle = i * 45;
              return (
                <rect
                  key={i}
                  x="37"
                  y="10"
                  width="6"
                  height="10"
                  rx="1.5"
                  fill="currentColor"
                  transform={`rotate(${angle} 40 40)`}
                />
              );
            })}
          </svg>
        </div>

        {/* Percentage Progress Display */}
        <div className="space-y-1">
          <div className="text-3xl font-mono font-bold text-white tracking-tight flex items-center justify-center gap-0.5">
            <span>{clampedProgress}</span>
            <span className="text-amber-400 text-xl font-normal">%</span>
          </div>
          
          {/* Status info: what is currently happening */}
          <p className="text-sm font-medium text-slate-200 min-h-[20px] transition-all">
            {stageText || 'Wczytywanie danych...'}
          </p>
        </div>

        {/* Delicate Slim Minimalist Progress Bar */}
        <div className="w-48 mx-auto space-y-1.5 pt-1">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Inicjalizacja</span>
            <span>{elapsedSeconds > 0 ? `${elapsedSeconds.toFixed(1)}s` : '0.0s'}</span>
          </div>
        </div>

        {/* Subtle Offline Bypass Action if loading takes longer */}
        {isTakingLonger && (
          <div className="pt-2 animate-fadeIn">
            <button
              type="button"
              onClick={onBypassToLocal}
              className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Otwórz cennik od ręki</span>
            </button>
          </div>
        )}
      </div>

      {/* Inline styles for the smooth mechanical gear rotations */}
      <style>{`
        @keyframes spinGearClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinGearCounterClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};
