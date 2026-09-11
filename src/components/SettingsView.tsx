import React, { useState, useEffect } from 'react';
import { ImportedDocument, ViewMode, DocumentRow, SettingsTab } from '../types';
import { OriginalIframeViewer } from './OriginalIframeViewer';
import { InteractiveDataGrid } from './InteractiveDataGrid';
import { ImageGalleryView } from './ImageGalleryView';
import { AnalyticsView } from './AnalyticsView';
import { BackupRestoreSettings } from './BackupRestoreSettings';
import { SecurityPasswordSettings } from './SecurityPasswordSettings';
import {
  RefreshCw,
  ShieldCheck,
  Gauge,
  Zap,
  Sliders,
  Cog,
  Database,
  KeyRound,
  Table,
  Image as ImageIcon,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Printer,
  RotateCcw,
  Monitor,
  CloudUpload,
  GitCommit,
  DownloadCloud,
  Rocket,
  Code2,
  X,
  ExternalLink,
  Lock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  getGitHubSyncConfig,
  saveGitHubSyncConfig,
  pullDatabaseFromGitHub,
  pushFullCodeToGitHub,
  GitHubSyncConfig,
} from '../utils/githubSync';

interface SettingsViewProps {
  document: ImportedDocument;
  viewMode: ViewMode;
  zoom: number;
  setZoom?: React.Dispatch<React.SetStateAction<number>>;
  settingsTab?: SettingsTab;
  onSettingsTabChange?: (tab: SettingsTab) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onBatchAttachImages: (files: File[]) => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportHtml?: () => void;
  onPrint?: () => void;
  onResetDocument?: () => void;
  onResetTo35Brands?: () => void;
  onSaveToServer?: () => void;
  onPushToGitHub?: () => void;
  isPushingToGitHub?: boolean;
  onPullFromGitHub?: () => void;
  isPullingFromGitHub?: boolean;
  onOpenDesktopBuildInfo?: () => void;
  onUpdateRowImage: (rowId: number, imageUrl: string) => void;
  onUpdateRows?: (updatedRows: DocumentRow[]) => void;
  onRestoreBackup?: (doc: ImportedDocument) => void;
  onNotification?: (msg: string) => void;
  onTestStartupLoader?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  document,
  viewMode,
  zoom,
  setZoom,
  settingsTab = 'basic',
  onSettingsTabChange,
  onViewModeChange,
  onBatchAttachImages,
  onOpenUpload,
  onExportExcel,
  onExportHtml = () => {},
  onPrint,
  onResetDocument,
  onResetTo35Brands,
  onSaveToServer,
  onPushToGitHub,
  isPushingToGitHub = false,
  onPullFromGitHub,
  isPullingFromGitHub = false,
  onOpenDesktopBuildInfo,
  onUpdateRowImage,
  onUpdateRows,
  onRestoreBackup = () => {},
  onNotification,
  onTestStartupLoader,
}) => {
  const [internalTab, setInternalTab] = useState<SettingsTab>(settingsTab);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(viewMode);
  const [basicSubTab, setBasicSubTab] = useState<'grid' | 'password'>('grid');
  const [internalPulling, setInternalPulling] = useState(false);

  const activeTab = settingsTab ?? internalTab;
  const activeViewMode = viewMode ?? internalViewMode;

  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig>(() => {
    const cfg = getGitHubSyncConfig();
    return { ...cfg, checkOnStartup: cfg.checkOnStartup ?? true };
  });
  const [isUpdatingSync, setIsUpdatingSync] = useState(false);

  useEffect(() => {
    fetch('/api/sync/github/config')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && data.config) {
          setGhConfig((prev) => ({
            ...prev,
            ...data.config,
            checkOnStartup: data.config.checkOnStartup ?? true,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setInternalTab(tab);
    if (onSettingsTabChange) {
      onSettingsTabChange(tab);
    }
  };

  const handleModeChange = (mode: ViewMode) => {
    setInternalViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const isPulling = isPullingFromGitHub || internalPulling;

  const handlePullAction = async () => {
    if (onPullFromGitHub) {
      onPullFromGitHub();
      return;
    }
    try {
      setInternalPulling(true);
      const res = await pullDatabaseFromGitHub();
      if (res.success && res.document) {
        onRestoreBackup(res.document);
        if (onNotification) {
          onNotification(res.message || 'Pomyślnie pobrano najnowszą bazę cennika z GitHub!');
        }
      } else {
        if (onNotification) {
          onNotification(`Pobieranie z GitHub: ${res.error || 'Błąd połączenia'}`);
        }
      }
    } catch (err: any) {
      if (onNotification) {
        onNotification(`Błąd pobierania: ${err?.message || 'Nieznany błąd'}`);
      }
    } finally {
      setInternalPulling(false);
    }
  };

  const handleToggleAutoUpdate = async (checked: boolean) => {
    try {
      setIsUpdatingSync(true);
      const updated = await saveGitHubSyncConfig({ checkOnStartup: checked });
      setGhConfig(updated);
      if (onNotification) {
        onNotification(
          checked
            ? 'Włączono automatyczną aktualizację bazy z chmury przy uruchomieniu aplikacji.'
            : 'Wyłączono automatyczną aktualizację bazy.'
        );
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingSync(false);
    }
  };

  // State for Full Code Push to GitHub
  const [isPushingFullCode, setIsPushingFullCode] = useState(false);
  const [showFullCodeModal, setShowFullCodeModal] = useState(false);
  const [patTokenInput, setPatTokenInput] = useState('');
  const [pushResultMessage, setPushResultMessage] = useState<string | null>(null);
  const [pushResultError, setPushResultError] = useState<string | null>(null);
  const [pushCommitSha, setPushCommitSha] = useState<string | null>(null);

  const handleOpenPushFullCode = () => {
    setPushResultMessage(null);
    setPushResultError(null);
    setPushCommitSha(null);
    setPatTokenInput(ghConfig.githubToken || '');
    setShowFullCodeModal(true);
  };

  const handleExecutePushFullCode = async () => {
    const tokenToUse = patTokenInput.trim() || ghConfig.githubToken?.trim();
    if (!tokenToUse) {
      setPushResultError('Wprowadź token GitHub (Personal Access Token), aby móc wysłać cały program.');
      return;
    }

    try {
      setIsPushingFullCode(true);
      setPushResultError(null);
      setPushResultMessage('Przygotowywanie plików programu, tworzenie commita i wysyłanie do kadwaolsztyn-afk/EuroKonwerter...');

      const res = await pushFullCodeToGitHub(document, tokenToUse);
      if (res.success) {
        setPushResultMessage(
          res.message || 'Pomyślnie wysłano cały kod programu do GitHub! Vercel natychmiast rozpoczął budowanie nowej wersji.'
        );
        if (res.commitSha) {
          setPushCommitSha(res.commitSha);
        }
        setGhConfig((prev) => ({ ...prev, githubToken: tokenToUse }));
        if (onNotification) {
          onNotification('Pomyślnie wysłano CAŁY KOD PROGRAMU do GitHub! Vercel automatycznie publikuje aktualizację.');
        }
      } else {
        setPushResultError(res.error || 'Wystąpił błąd podczas wysyłania programu do GitHub.');
      }
    } catch (err: any) {
      setPushResultError(err?.message || 'Nieznany błąd podczas wysyłania kodu programu.');
    } finally {
      setIsPushingFullCode(false);
    }
  };

  const brandsCount =
    new Set((document.rows || []).map((r) => (r.brand || '').trim()).filter((b) => b && b !== '-')).size ||
    document.brandsCount;

  return (
    <div className="w-full">
      {/* Główny przełącznik: Ustawienia podstawowe vs Ustawienia zaawansowane */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap border-b border-slate-800 pb-4">
        <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            type="button"
            id="tab-btn-basic-settings"
            onClick={() => handleTabChange('basic')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ustawienia podstawowe</span>
          </button>

          <button
            type="button"
            id="tab-btn-advanced-settings"
            onClick={() => handleTabChange('advanced')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Cog className="w-4 h-4" />
            <span>Ustawienia zaawansowane</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
          {activeTab === 'basic' ? (
            <span className="bg-amber-400/10 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-400/20 font-medium">
              Zakładka: Ustawienia podstawowe
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-medium">
              Zakładka: Ustawienia zaawansowane
            </span>
          )}
        </div>
      </div>

      {/* 1. ZAKŁADKA: USTAWIENIA PODSTAWOWE */}
      {activeTab === 'basic' && (
        <div className="space-y-6 animate-fadeIn text-white">
          {/* Belka główna Ustawień Podstawowych z przyciskami GitHub (Push & Pull) oraz przełącznikiem podzakładek */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Lewa strona: Przełącznik podzakładek w Ustawieniach Podstawowych */}
              <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  id="btn-basic-subtab-grid"
                  onClick={() => setBasicSubTab('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    basicSubTab === 'grid'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Interaktywna Tabela</span>
                </button>

                <button
                  type="button"
                  id="btn-basic-subtab-password"
                  onClick={() => setBasicSubTab('password')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    basicSubTab === 'password'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Zmiana Hasła (Pełna funkcja)</span>
                </button>
              </div>

              {/* Prawa strona: Przyciski z pełnym funkcjonowaniem (Wyślij do GitHub auto-deploy vercel) oraz (Pobierz z GitHub pull) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Nowy przycisk: Wypchnij CAŁY kod programu do GitHub (Kod + Baza) */}
                <button
                  type="button"
                  id="btn-basic-push-full-code"
                  onClick={handleOpenPushFullCode}
                  disabled={isPushingFullCode}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 transition-all cursor-pointer border border-purple-400/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  title="Wypchnij CAŁY zaktualizowany kod programu (wszystkie pliki React, komponenty, serwer, style i bazę) bezpośrednio do repozytorium GitHub kadwaolsztyn-afk/EuroKonwerter i uruchom pełny auto-deploy na Vercel"
                >
                  <Rocket className={`w-4 h-4 text-amber-300 ${isPushingFullCode ? 'animate-bounce' : ''}`} />
                  <span>
                    {isPushingFullCode
                      ? 'Wysyłanie całego kodu...'
                      : 'Wypchnij CAŁY kod programu (Auto-deploy Vercel)'}
                  </span>
                </button>

                {/* Przycisk: Pobierz kod programu (.ZIP na GitHub) */}
                <a
                  href="/api/export/project-zip"
                  download="EuroKonwerter-program-update.zip"
                  id="btn-basic-download-zip"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer border border-amber-400/30"
                  title="Pobierz całe zaktualizowane źródło programu w pliku ZIP (wszystkie pliki React, komponenty i bazę) gotowe do wrzucenia na GitHub"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Pobierz kod (.ZIP)</span>
                </a>

                {/* Przycisk: Wyślij do GitHub (Auto-deploy Vercel) */}
                <button
                  type="button"
                  id="btn-basic-push-github"
                  onClick={onPushToGitHub}
                  disabled={isPushingToGitHub}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer border border-indigo-400/50 disabled:opacity-50"
                  title="Wyślij zaktualizowaną bazę ze zdjęciami bezpośrednio do repozytorium GitHub i uruchom auto-deploy na Vercel"
                >
                  <GitCommit className={`w-4 h-4 ${isPushingToGitHub ? 'animate-spin' : ''}`} />
                  <span>
                    {isPushingToGitHub
                      ? 'Wysyłanie do GitHub...'
                      : 'Wyślij bazę do GitHub'}
                  </span>
                </button>

                {/* Przycisk: Pobierz z GitHub (Pull) */}
                <button
                  type="button"
                  id="btn-basic-pull-github"
                  onClick={handlePullAction}
                  disabled={isPulling}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer border border-emerald-400/50 disabled:opacity-50"
                  title="Pobierz najnowszą zaktualizowaną bazę ze zdjęciami z repozytorium GitHub (Pull)"
                >
                  <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>
                    {isPulling
                      ? 'Pobieranie z GitHub...'
                      : 'Pobierz z GitHub (Pull)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Pasek statusu bazy i synchronizacji */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Aktywna Baza
                </span>
                <span>•</span>
                <span className="font-semibold text-white">
                  {document.rows?.length || document.totalRows} pozycji
                </span>
                <span>•</span>
                <span>{brandsCount} marek</span>
                <span>•</span>
                <span>{document.images?.length || 0} zdjęć lamp</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Auto-deploy:</span>
                <span className="text-indigo-400 font-medium">Vercel & GitHub</span>
              </div>
            </div>
          </div>

          {/* Podzakładka 1: INTERAKTYWNA TABELA (Pełne funkcjonowanie: edycja cen, wyszukiwarka, filtry, zdjęcia, eksport) */}
          {basicSubTab === 'grid' && (
            <div className="space-y-4 animate-fadeIn">
              <InteractiveDataGrid
                document={document}
                onExportExcel={onExportExcel}
                onUpdateRowImage={onUpdateRowImage}
                onBatchAttachImages={onBatchAttachImages}
                onUpdateRows={onUpdateRows}
              />
            </div>
          )}

          {/* Podzakładka 2: ZMIANA HASŁA (Pełne funkcjonowanie: hasło Hurt, hasło Ustawień, weryfikacja, reset) */}
          {basicSubTab === 'password' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shrink-0 shadow-lg shadow-amber-400/10">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      Zmiana Hasła Dostępu
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Zarządzaj hasłem dostępu do zakładki Ustawień oraz cen hurtowych (Hurt). Hasła są bezpiecznie zapisywane w systemie.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pełny komponent zarządzania hasłami */}
              <SecurityPasswordSettings
                onSuccessNotification={(msg) => onNotification && onNotification(msg)}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. ZAKŁADKA: USTAWIENIA ZAAWANSOWANE (Pełna środkowa belka z bazą, zapisem na serwerze i wszystkimi widokami) */}
      {activeTab === 'advanced' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Środkowa belka z ustawieniami, bazą, zapisem na serwerze i narzędziami */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
            {/* Wiersz 1: Podsumowanie bazy i przełączniki widoków */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-3 border-b border-slate-800/80">
              {/* Podsumowanie bazy */}
              <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                <span className="bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 100% Bez Zmian
                </span>
                <span>•</span>
                <span className="font-semibold text-white">
                  {document.rows?.length || document.totalRows} pozycji
                </span>
                <span>•</span>
                <span>{brandsCount} marek</span>
              </div>

              {/* Przyciski trybów widoków zaawansowanych */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
                <button
                  type="button"
                  onClick={() => handleModeChange('original')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'original'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Podgląd oryginalnego układu pliku HTML/Excel 1:1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Układ Oryginalny 1:1</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'grid'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Interaktywna tabela danych z wyszukiwarką i filtrami"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Interaktywna Tabela</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('gallery')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'gallery'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Galeria wyselekcjonowanych zdjęć lamp samochodowych"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Galeria Zdjęć ({document.images.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('analytics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'analytics'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Statystyki i zestawienie marek"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Statystyki</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('backup')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'backup'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Zapisz lub przywróć kopię zapasową bazy z dysku"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Kopia i Przywracanie Bazy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('security')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeViewMode === 'security'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Zmień hasło dostępu lub konfigurację zabezpieczeń"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Zmiana Hasła</span>
                </button>
              </div>
            </div>

            {/* Wiersz 2: Narzędzia Zoom, Baza 35 Marek, Zapisz na serwerze, GitHub Push & Pull, Instalator EXE, Eksport, Import */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Lewa strona: Zoom kontrolka dla układu 1:1 */}
              <div>
                {activeViewMode === 'original' && setZoom && (
                  <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                      title="Pomniejsz"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono text-slate-300 font-semibold min-w-[42px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                      title="Powiększ"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1.0)}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 rounded text-slate-200 ml-1 font-medium cursor-pointer"
                    >
                      100%
                    </button>
                  </div>
                )}
              </div>

              {/* Prawa strona: Akcje bazy danych, serwera i eksportu */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto">
                {onResetTo35Brands && (
                  <button
                    type="button"
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
                    type="button"
                    onClick={onSaveToServer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border border-amber-300/40"
                    title="Zapisz ten arkusz jako stałą bazę dla wszystkich linków"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Zapisz na serwerze</span>
                  </button>
                )}

                {onPushToGitHub && (
                  <button
                    type="button"
                    onClick={onPushToGitHub}
                    disabled={isPushingToGitHub}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer border border-indigo-400/40 disabled:opacity-50"
                    title="Wyślij zaktualizowaną bazę ze zdjęciami bezpośrednio do repozytorium GitHub i uruchom auto-deploy na Vercel"
                  >
                    <GitCommit className={`w-3.5 h-3.5 ${isPushingToGitHub ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isPushingToGitHub ? 'Wysyłanie...' : 'Wyślij do GitHub / Vercel'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePullAction}
                  disabled={isPulling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-400/40 disabled:opacity-50"
                  title="Pobierz najnowszą bazę z repozytorium GitHub (Pull)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isPulling ? 'Pobieranie...' : 'Pobierz z GitHub (Pull)'}</span>
                </button>

                {onOpenDesktopBuildInfo && (
                  <button
                    type="button"
                    onClick={onOpenDesktopBuildInfo}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer border border-blue-400/30"
                    title="Instalator Windows (.EXE) oraz kopia zapasowa pamięci bazy"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Instalator .EXE</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  title="Eksportuj do Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Eksport Excel</span>
                </button>

                {onPrint && (
                  <button
                    type="button"
                    onClick={onPrint}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                    title="Drukuj / Zapisz do PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                )}

                {onResetDocument && (
                  <button
                    type="button"
                    onClick={onResetDocument}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
                    title="Przywróć stan początkowy / Wyczyść pamięć"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importuj Plik</span>
                </button>
              </div>
            </div>
          </div>

          {/* View: Układ Oryginalny 1:1 */}
          {activeViewMode === 'original' && (
            <OriginalIframeViewer
              document={document}
              zoom={zoom}
              onBatchAttachImages={onBatchAttachImages}
              onOpenUpload={onOpenUpload}
            />
          )}

          {/* View: Interaktywna Tabela */}
          {activeViewMode === 'grid' && (
            <InteractiveDataGrid
              document={document}
              onExportExcel={onExportExcel}
              onUpdateRowImage={onUpdateRowImage}
              onBatchAttachImages={onBatchAttachImages}
              onUpdateRows={onUpdateRows}
            />
          )}

          {/* View: Galeria Zdjęć */}
          {activeViewMode === 'gallery' && (
            <ImageGalleryView
              document={document}
              onUpdateRowImage={onUpdateRowImage}
              onBatchAttachImages={onBatchAttachImages}
            />
          )}

          {/* View: Statystyki */}
          {activeViewMode === 'analytics' && (
            <AnalyticsView document={document} />
          )}

          {/* View: Kopia i Przywracanie Bazy */}
          {activeViewMode === 'backup' && (
            <BackupRestoreSettings
              document={document}
              onRestoreBackup={onRestoreBackup}
              onExportExcel={onExportExcel}
              onExportHtml={onExportHtml}
              onResetTo35Brands={onResetTo35Brands}
              onSaveToServer={onSaveToServer}
              onOpenUpload={onOpenUpload}
            />
          )}

          {/* View: Zmiana Hasła & Bezpieczeństwo */}
          {activeViewMode === 'security' && (
            <div className="space-y-6 animate-fadeIn text-white">
              {/* Top Banner for Security and Auto Update */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shrink-0 shadow-lg shadow-amber-400/10">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        Ustawienia Bezpieczeństwa i Auto-Aktualizacji
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Zmień hasła dostępu do strefy Ustawień oraz cen hurtowych (Hurt) lub włącz/wyłącz automatyczne pobieranie najnowszej bazy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Auto-Update Card with Auto-Checked Checkbox */}
              <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/25">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                      <RefreshCw className={`w-5 h-5 ${isUpdatingSync ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          Automatyczna Aktualizacja Bazy z Chmury
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {ghConfig.checkOnStartup ? 'Aktywna (Zaznaczona z automatu)' : 'Wyłączona'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                        Automatycznie pobiera najnowszy cennik i zdjęcia przy każdym wejściu do aplikacji.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/90 border-2 border-amber-400/60 hover:border-amber-400 transition-all cursor-pointer select-none shrink-0 shadow-xl">
                    <input
                      type="checkbox"
                      checked={ghConfig.checkOnStartup ?? true}
                      onChange={(e) => handleToggleAutoUpdate(e.target.checked)}
                      disabled={isUpdatingSync}
                      className="w-5 h-5 rounded text-amber-400 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">
                        Auto-aktualizacja aktywna
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        ✓ Kwadracik zaznaczony z automatu
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Startup Health & Percentage Loader Diagnostic Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          Kontrola Rozruchu i Wskaźnik Postępu Procentowego
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Funkcja aktywna (0-100%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                        Gdy serwer w chmurze lub łącze wymaga dłuższego czasu na rozruch, aplikacja wyświetla aktywny licznik procentowy z komunikatami etapów i czasem pracy, dając pewność, że proces nie jest zawieszony.
                      </p>
                    </div>
                  </div>

                  {onTestStartupLoader && (
                    <button
                      type="button"
                      id="btn-test-startup-loader"
                      onClick={onTestStartupLoader}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700 hover:border-amber-400/50 shadow-md shrink-0"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Przetestuj ekran rozruchu z postępem</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pełny komponent zarządzania hasłami */}
              <SecurityPasswordSettings
                onSuccessNotification={(msg) => onNotification && onNotification(msg)}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal: Wypchnij CAŁY kod programu do GitHub */}
      {showFullCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-left my-8">
            {/* Nagłówek okna */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                  <Rocket className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Wypchnij CAŁY kod programu do GitHub</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Full Code
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Repozytorium: <span className="text-amber-400 font-mono">kadwaolsztyn-afk/EuroKonwerter</span> (gałąź main)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullCodeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Treść */}
            <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>Co zostanie wysłane do GitHub?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                  <li><strong className="text-slate-200">Wszystkie pliki źródłowe:</strong> interfejs React, komponenty, style Tailwind, ikony</li>
                  <li><strong className="text-slate-200">Serwer i konfiguracja:</strong> server.ts, package.json, vite.config.ts, vercel.json</li>
                  <li><strong className="text-slate-200">Baza danych:</strong> aktualne cenniki i zdjęcia lamp</li>
                  <li><strong className="text-emerald-400">Automatyczny skutek:</strong> Vercel natychmiast wykryje commit i opublikuje nową wersję programu online!</li>
                </ul>
              </div>

              {/* Pole wprowadzania Tokena GitHub */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Token GitHub (Personal Access Token)
                  </span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=EuroKonwerter-AutoDeploy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>Wygeneruj token na GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={patTokenInput}
                  onChange={(e) => setPatTokenInput(e.target.value)}
                  placeholder="Wklej swój token (np. ghp_... lub github_pat_...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-xs placeholder:text-slate-600 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Token wymaga zaznaczonego uprawnienia <strong className="text-slate-400">repo</strong>. Po wysłaniu token zostanie zapamiętany w Twojej przeglądarce.
                </p>
              </div>

              {/* Komunikaty stanu */}
              {pushResultMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Sukces!</div>
                    <div>{pushResultMessage}</div>
                    {pushCommitSha && (
                      <div className="font-mono text-[10px] text-emerald-400/80 mt-1">
                        Commit SHA: {pushCommitSha.slice(0, 10)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pushResultError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Błąd wysyłania:</div>
                    <div>{pushResultError}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Przyciski akcji */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFullCodeModal(false)}
                disabled={isPushingFullCode}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Zamknij
              </button>

              <button
                type="button"
                onClick={handleExecutePushFullCode}
                disabled={isPushingFullCode}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 border border-purple-400/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <Rocket className={`w-4 h-4 text-amber-300 ${isPushingFullCode ? 'animate-bounce' : ''}`} />
                <span>
                  {isPushingFullCode
                    ? 'Wysyłanie całego kodu programu...'
                    : 'Wypchnij CAŁY kod programu teraz'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
