import React from 'react';
import {
  User,
  Building2,
  Settings,
  Unlock,
} from 'lucide-react';
import { MainTab, ViewMode, ImportedDocument, SettingsTab } from '../types';

interface HeaderProps {
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
  currentDocument: ImportedDocument | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  settingsTab?: SettingsTab;
  setSettingsTab?: (tab: SettingsTab) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportHtml: () => void;
  onPrint: () => void;
  onResetDocument?: () => void;
  onResetTo35Brands?: () => void;
  onOpenDesktopBuildInfo?: () => void;
  onSaveToServer?: () => void;
  onPushToGitHub?: () => void;
  isPushingToGitHub?: boolean;
  isSaved?: boolean;
  isUnlocked?: boolean;
  isWholesaleUnlocked?: boolean;
  isSettingsUnlocked?: boolean;
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mainTab,
  setMainTab,
  currentDocument,
  viewMode,
  setViewMode,
  settingsTab = 'basic',
  setSettingsTab,
  zoom,
  setZoom,
  onOpenUpload,
  onExportExcel,
  onExportHtml,
  onPrint,
  onResetDocument,
  onResetTo35Brands,
  onOpenDesktopBuildInfo,
  onSaveToServer,
  onPushToGitHub,
  isPushingToGitHub = false,
  isSaved = true,
  isUnlocked = false,
  isWholesaleUnlocked,
  isSettingsUnlocked,
  onLock,
}) => {
  const wholesaleUnlocked = isWholesaleUnlocked !== undefined ? isWholesaleUnlocked : isUnlocked;
  const settingsUnlocked = isSettingsUnlocked !== undefined ? isSettingsUnlocked : isUnlocked;
  const anyUnlocked = isUnlocked || wholesaleUnlocked || settingsUnlocked;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Primary Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 border-b border-slate-800/80">
        <div className="flex items-center justify-between py-2.5">
          {/* Top Left Corner: Hurt Logo Button (No text) */}
          <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[180px]">
            <button
              onClick={() => setMainTab('wholesale')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
                mainTab === 'wholesale'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 scale-105'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/80'
              }`}
              title={wholesaleUnlocked ? 'Hurt (Odblokowane)' : 'Hurt (Wymaga hasła)'}
              aria-label="Hurt"
            >
              <Building2 className="w-4 h-4" />
              {!wholesaleUnlocked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full"></span>
                </span>
              )}
            </button>
          </div>

          {/* Top Center: Klient Tab */}
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setMainTab('client')}
                className={`flex items-center gap-2 px-5 sm:px-7 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainTab === 'client'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Klient</span>
              </button>
            </div>
          </div>

          {/* Top Right Corner: Settings Gear Icon (No text label) & Doc Name */}
          <div className="flex items-center justify-end gap-2.5 min-w-[120px] sm:min-w-[180px]">
            {mainTab === 'settings' && currentDocument && (
              <span className="hidden md:inline-block bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-slate-300 font-medium text-xs truncate max-w-[180px]">
                {currentDocument.name}
              </span>
            )}

            {anyUnlocked && onLock && (
              <button
                type="button"
                onClick={onLock}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-slate-800/80 transition-all cursor-pointer"
                title="Zablokuj dostęp hasłem"
                aria-label="Zablokuj dostęp hasłem"
              >
                <Unlock className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            <button
              onClick={() => setMainTab('settings')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
                mainTab === 'settings'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-105'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/80'
              }`}
              title={settingsUnlocked ? 'Ustawienia (Odblokowane)' : 'Ustawienia (Wymagają hasła)'}
              aria-label="Ustawienia"
            >
              <Settings className="w-4 h-4" />
              {!settingsUnlocked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
