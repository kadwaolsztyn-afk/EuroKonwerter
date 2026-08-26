import React from 'react';
import {
  FileText,
  Table,
  Image as ImageIcon,
  BarChart3,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Printer,
  Sparkles,
  User,
  Building2,
  Settings,
  RotateCcw,
  Lock,
  Unlock,
  Monitor,
  Cloud,
  CloudUpload,
  Database,
} from 'lucide-react';
import { MainTab, ViewMode, ImportedDocument } from '../types';

interface HeaderProps {
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
  currentDocument: ImportedDocument | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
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
  isSaved?: boolean;
  isUnlocked?: boolean;
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mainTab,
  setMainTab,
  currentDocument,
  viewMode,
  setViewMode,
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
  isSaved = true,
  isUnlocked = false,
  onLock,
}) => {
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
              title={isUnlocked ? 'Hurt (Odblokowane)' : 'Hurt (Wymaga hasła)'}
              aria-label="Hurt"
            >
              <Building2 className="w-4 h-4" />
              {!isUnlocked && (
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

            {isUnlocked && onLock && (
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
              title={isUnlocked ? 'Ustawienia (Odblokowane)' : 'Ustawienia (Wymagają hasła)'}
              aria-label="Ustawienia"
            >
              <Settings className="w-4 h-4" />
              {!isUnlocked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar for Settings tab (all document management features) */}
      {mainTab === 'settings' && currentDocument && (
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* File info summary */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 100% Bez Zmian
              </span>
              <span>•</span>
              <span className="font-semibold text-white">{currentDocument.rows?.length || currentDocument.totalRows} pozycji</span>
              <span>•</span>
              <span>{new Set((currentDocument.rows || []).map(r => (r.brand || '').trim()).filter(b => b && b !== '-')).size || currentDocument.brandsCount} marek</span>
            </div>

            {/* Navigation View Modes */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
              <button
                onClick={() => setViewMode('original')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'original'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Podgląd oryginalnego układu pliku HTML/Excel 1:1"
              >
                <FileText className="w-4 h-4" />
                <span>Układ Oryginalny 1:1</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Interaktywna tabela danych z wyszukiwarką i filtrami"
              >
                <Table className="w-4 h-4" />
                <span>Interaktywna Tabela</span>
              </button>

              <button
                onClick={() => setViewMode('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'gallery'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Galeria wyselekcjonowanych zdjęć lamp samochodowych"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Galeria Zdjęć ({currentDocument.images.length})</span>
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Statystyki i zestawienie marek"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Statystyki</span>
              </button>

              <button
                onClick={() => setViewMode('backup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'backup'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Zapisz lub przywróć kopię zapasową bazy z dysku"
              >
                <Database className="w-4 h-4" />
                <span>Kopia i Przywracanie Bazy</span>
              </button>
            </div>

            {/* Controls & Import Button */}
            <div className="flex items-center gap-2 justify-end">
              {/* Zoom Controls (Active in original mode) */}
              {viewMode === 'original' && (
                <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/60 text-xs">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                    title="Pomniejsz"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-slate-300 font-semibold min-w-[42px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                    title="Powiększ"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1.0)}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded text-slate-200 ml-1 font-medium cursor-pointer"
                  >
                    100%
                  </button>
                </div>
              )}

              {/* Print / Export Dropdown & Desktop EXE */}
              <div className="flex items-center gap-1">
                {onResetTo35Brands && (
                  <button
                    onClick={onResetTo35Brands}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg text-xs font-bold border border-amber-400/40 shadow-sm transition-all cursor-pointer"
                    title="Załaduj kompletną bazę 35 marek samochodowych"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Baza 35 Marek</span>
                  </button>
                )}

                {onSaveToServer && (
                  <button
                    onClick={onSaveToServer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border border-amber-300/40"
                    title="Zapisz ten arkusz jako stałą bazę dla wszystkich linków"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Zapisz na serwerze</span>
                  </button>
                )}

                {onOpenDesktopBuildInfo && (
                  <button
                    onClick={onOpenDesktopBuildInfo}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer border border-blue-400/30"
                    title="Instalator Windows (.EXE) oraz kopia zapasowa pamięci bazy"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Instalator .EXE</span>
                  </button>
                )}

                <button
                  onClick={onExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title="Eksportuj do Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Eksport Excel</span>
                </button>

                <button
                  onClick={onPrint}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                  title="Drukuj / Zapisz do PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {onResetDocument && (
                  <button
                    onClick={onResetDocument}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
                    title="Przywróć stan początkowy / Wyczyść pamięć"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Modal Trigger */}
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importuj Plik</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
