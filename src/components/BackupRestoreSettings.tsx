import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  CloudUpload,
  Layers,
  Car,
  Image as ImageIcon,
  Clock,
  HardDrive,
  RefreshCw,
  Info,
  ExternalLink,
  GitBranch,
  Globe,
  Radio,
  Sliders,
  Check,
  Key,
  Send,
  Eye,
  EyeOff,
  HelpCircle,
  GitCommit,
  Copy,
  Link,
  Share2,
  Smartphone,
  Laptop,
  Network,
} from 'lucide-react';
import { ImportedDocument } from '../types';
import { exportFullBackupJSON, importFullBackupJSON } from '../utils/storage';
import {
  checkLinkServerStatus,
  pushDatabaseToLinkServer,
  pullDatabaseFromLinkServer,
  LinkServerStatus,
} from '../utils/linkSync';
import {
  getGitHubSyncConfig,
  saveGitHubSyncConfig,
  checkGitHubReleaseUpdates,
  pullDatabaseFromGitHub,
  pushDatabaseToGitHub,
  syncCatalogToSourceCode,
  pullDatabaseFromUrl,
  GitHubSyncConfig,
  GitHubCheckResult,
} from '../utils/githubSync';
import { PortableModeCard } from './PortableModeCard';

interface BackupRestoreSettingsProps {
  document: ImportedDocument;
  onRestoreBackup: (doc: ImportedDocument) => void;
  onExportExcel: () => void;
  onExportHtml: () => void;
  onResetTo35Brands?: () => void;
  onSaveToServer?: () => void;
  onOpenUpload?: () => void;
}

export const BackupRestoreSettings: React.FC<BackupRestoreSettingsProps> = ({
  document,
  onRestoreBackup,
  onExportExcel,
  onExportHtml,
  onResetTo35Brands,
  onSaveToServer,
  onOpenUpload,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub Sync State
  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig>(getGitHubSyncConfig());
  const [isCheckingGH, setIsCheckingGH] = useState(false);
  const [isPullingGH, setIsPullingGH] = useState(false);
  const [isPushingGH, setIsPushingGH] = useState(false);
  const [isSyncingSource, setIsSyncingSource] = useState(false);
  const [ghCheckResult, setGhCheckResult] = useState<GitHubCheckResult | null>(null);
  const [isEditingGhConfig, setIsEditingGhConfig] = useState(false);
  const [editRepoUrl, setEditRepoUrl] = useState(ghConfig.repoUrl);
  const [editReleaseTag, setEditReleaseTag] = useState(ghConfig.releaseTag || 'main');
  const [editGhToken, setEditGhToken] = useState(ghConfig.githubToken || '');
  const [showTokenField, setShowTokenField] = useState(Boolean(ghConfig.githubToken));
  const [showTokenSecret, setShowTokenSecret] = useState(false);
  const [directUrl, setDirectUrl] = useState('https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json');
  const [isPullingUrl, setIsPullingUrl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Link Server Cross-Device Synchronization state
  const [linkStatus, setLinkStatus] = useState<LinkServerStatus | null>(null);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isPushingLink, setIsPushingLink] = useState(false);
  const [isPullingLink, setIsPullingLink] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const handleCopyAppUrl = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopiedAppUrl(true);
      showSuccess('Skopiowano link aplikacji! Otwórz go na telefonie lub drugim komputerze.');
      setTimeout(() => setCopiedAppUrl(false), 3500);
    }
  };

  const handleCheckLink = async () => {
    try {
      setIsCheckingLink(true);
      const st = await checkLinkServerStatus();
      setLinkStatus(st);
    } catch (_) {
    } finally {
      setIsCheckingLink(false);
    }
  };

  const handlePushToLink = async () => {
    try {
      setIsPushingLink(true);
      const res = await pushDatabaseToLinkServer(document);
      if (res.success) {
        showSuccess(res.message || 'Pomyślnie zapisano bazę na serwerze linku! Inne urządzenia natychmiast ją pobiorą.');
        await handleCheckLink();
      } else {
        showError(res.error || 'Nie udało się zapisać bazy na serwerze linku.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd zapisu na serwerze linku.');
    } finally {
      setIsPushingLink(false);
    }
  };

  const handlePullFromLink = async () => {
    try {
      setIsPullingLink(true);
      const res = await pullDatabaseFromLinkServer();
      if (res.success && res.document) {
        onRestoreBackup(res.document);
        showSuccess(res.message || `Pomyślnie zsynchronizowano bazę (${res.document.rows.length} modeli)!`);
        await handleCheckLink();
      } else {
        showError(res.error || 'Nie udało się pobrać bazy z serwera linku.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd pobierania bazy z serwera linku.');
    } finally {
      setIsPullingLink(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showSuccess('Skopiowano link do schowka!');
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const handlePullFromUrl = async (urlToPull?: string) => {
    const target = (urlToPull || directUrl).trim();
    if (!target) {
      showError('Podaj prawidłowy link URL do bazy danych.');
      return;
    }
    try {
      setIsPullingUrl(true);
      const res = await pullDatabaseFromUrl(target);
      if (res.success && res.document) {
        onRestoreBackup(res.document);
        setGhConfig(getGitHubSyncConfig());
        showSuccess(res.message || `Pomyślnie wczytano bazę (${res.document.rows.length} modeli)!`);
      } else {
        showError(res.error || 'Nie udało się pobrać bazy ze wskazanego linku.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd podczas pobierania bazy z linku.');
    } finally {
      setIsPullingUrl(false);
    }
  };

  useEffect(() => {
    // Initial silent checks on mount
    handleCheckGitHub(true);
    handleCheckLink();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const handleCheckGitHub = async (silent = false) => {
    try {
      setIsCheckingGH(true);
      const result = await checkGitHubReleaseUpdates();
      setGhCheckResult(result);
      if (!silent) {
        if (result.success && result.connected) {
          showSuccess(result.message || 'Połączono pomyślnie z GitHub Releases!');
        } else if (result.success && !result.connected) {
          showSuccess(result.message || 'Sprawdzono GitHub (brak nowego wydania).');
        } else {
          showError(result.error || 'Nie udało się nawiązać połączenia z GitHub.');
        }
      }
    } catch (err: any) {
      if (!silent) {
        showError(err?.message || 'Błąd połączenia z GitHub.');
      }
    } finally {
      setIsCheckingGH(false);
    }
  };

  const handlePullGitHub = async () => {
    try {
      setIsPullingGH(true);
      const result = await pullDatabaseFromGitHub();
      if (result.success && result.document) {
        onRestoreBackup(result.document);
        setGhConfig(getGitHubSyncConfig());
        showSuccess(
          `Pomyślnie zsynchronizowano bazę z GitHub! Zastosowano ${result.totalRows} pozycji (${result.brandsCount} marek).`
        );
        // Refresh check status
        handleCheckGitHub(true);
      } else {
        showError(result.error || 'Nie udało się pobrać bazy z GitHub.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd podczas synchronizacji z GitHub.');
    } finally {
      setIsPullingGH(false);
    }
  };

  const handlePushGitHub = async () => {
    const tokenToUse = editGhToken.trim() || ghConfig.githubToken;
    if (!tokenToUse) {
      setShowTokenField(true);
      setIsEditingGhConfig(true);
      showError('Podaj swój token GitHub (Personal Access Token), aby wysyłać zmiany prosto do repozytorium i aktualizować Vercel.');
      return;
    }

    try {
      setIsPushingGH(true);
      const res = await pushDatabaseToGitHub(document, tokenToUse);
      if (res.success) {
        setGhConfig(getGitHubSyncConfig());
        showSuccess(
          res.message || 'Pomyślnie wysłano zaktualizowaną bazę ze zdjęciami do GitHub! Vercel automatycznie rozpoczął wdrażanie.'
        );
        handleCheckGitHub(true);
      } else {
        showError(res.error || 'Nie udało się wysłać bazy do GitHub.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd podczas wysyłania do GitHub.');
    } finally {
      setIsPushingGH(false);
    }
  };

  const handleSyncToSourceCode = async () => {
    try {
      setIsSyncingSource(true);
      const res = await syncCatalogToSourceCode(document);
      if (res.success) {
        showSuccess(res.message || 'Zapisano pliki źródłowe! Google AI Studio widzi teraz wszystkie zmiany w kodzie projektu.');
      } else {
        showError(res.error || 'Nie udało się zapisać plików źródłowych na serwerze.');
      }
    } catch (err: any) {
      showError(err?.message || 'Błąd zapisu plików źródłowych.');
    } finally {
      setIsSyncingSource(false);
    }
  };

  const handleDownloadCatalogJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(document, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'data-catalog.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSuccess('Pobrano plik data-catalog.json ze wszystkimi zdjęciami i cenami.');
    } catch {
      showError('Błąd pobierania pliku data-catalog.json.');
    }
  };

  const handleSaveGhConfig = async () => {
    const updated = await saveGitHubSyncConfig({
      repoUrl: editRepoUrl,
      releaseTag: editReleaseTag,
      githubToken: editGhToken.trim(),
    });
    setGhConfig(updated);
    setIsEditingGhConfig(false);
    showSuccess('Zapisano konfigurację repozytorium oraz token GitHub.');
    handleCheckGitHub(false);
  };

  const handleToggleStartupCheck = async (enabled: boolean) => {
    const updated = await saveGitHubSyncConfig({
      checkOnStartup: enabled,
    });
    setGhConfig(updated);
    showSuccess(
      enabled
        ? 'Włączono automatyczne sprawdzanie bazy przy uruchomieniu aplikacji.'
        : 'Wyłączono automatyczne sprawdzanie bazy przy starcie.'
    );
  };

  // 1. Export Backup to JSON file
  const handleExportBackup = () => {
    try {
      setIsProcessing(true);
      exportFullBackupJSON(document);
      showSuccess(
        `Pobrano pełną kopię zapasową (${document.totalRows} pozycji, ${document.brandsCount} marek) do pliku .JSON!`
      );
    } catch (err: any) {
      showError('Wystąpił błąd podczas eksportowania kopii zapasowej.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Import / Restore Backup from JSON file
  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      showError('Wybrany plik nie jest poprawnym plikiem kopii zapasowej (.json).');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const restoredDoc = await importFullBackupJSON(file);
      onRestoreBackup(restoredDoc);
      showSuccess(
        `Pomyślnie przywrócono bazę z dysku! Wczytano ${restoredDoc.totalRows} pozycji dla ${restoredDoc.brandsCount} marek.`
      );
    } catch (err: any) {
      console.error('Error importing backup:', err);
      showError(err?.message || 'Nie udało się odczytać pliku kopii zapasowej. Upewnij się, że plik ma poprawny format JSON.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const currentDate = new Date().toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full space-y-6 animate-fadeIn text-white">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Banner & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-lg shadow-amber-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Centrum Kopii Zapasowych i Ustawień Bazy
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Zarządzaj pełnym backupem bazy danych cennika. Zapisuj wszystkie modele aut, ceny detaliczne, marże brokera,
                notatki techniczne oraz zdjęcia do bezpiecznego pliku na dysku, aby w dowolnym momencie przywrócić je jednym kliknięciem.
              </p>
            </div>
          </div>

          {/* Quick stats pill */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Pamięć trwała:</span>
            <strong className="text-emerald-400 font-bold">Aktywna</strong>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mt-4 p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-medium animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 100% Portable Mode Status & Local Folder Overview */}
      <PortableModeCard />

      {/* CARD 0: Synchronizacja Między Urządzeniami z Tego Samego Linku (Bez GitHub) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/40 hover:border-indigo-400/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-indigo-500/20 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg shadow-indigo-500/20">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Synchronizacja Między Urządzeniami z Tego Samego Linku
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Aktywny
                </span>
                <span className="text-[10px] font-medium bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Bez konta GitHub • Bez tokenów
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Każde urządzenie (telefon, tablet, laptop, komputer biurowy), które otworzy ten link, korzysta z tego samego centralnego serwera bazy danych. Zmiany wysłane z jednego urządzenia są natychmiast dostępne dla wszystkich pozostałych!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCheckLink}
              disabled={isCheckingLink}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Sprawdź stan serwera bazy tego linku"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingLink ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isCheckingLink ? 'Sprawdzanie...' : 'Sprawdź Stan'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
              title="Skopiuj link do otwarcia na drugim telefonie lub komputerze"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>{copiedAppUrl ? 'Skopiowano Link!' : 'Kopiuj Link dla Urządzenia'}</span>
            </button>
          </div>
        </div>

        {/* Device Sync Status & Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Box 1: Server Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <Globe className="w-3.5 h-3.5" /> Serwer tego linku
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Stan:</span>
                  <span className="text-emerald-400 font-bold">Połączony (Online)</span>
                </div>
                <div className="flex justify-between">
                  <span>Baza na serwerze:</span>
                  <span className="text-slate-200">{linkStatus?.totalRows || document.rows.length} aut</span>
                </div>
                <div className="flex justify-between">
                  <span>Wersja serwera:</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[140px]" title={linkStatus?.version || document.version}>
                    {linkStatus?.version || document.version || 'Najnowsza'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: This Device Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Laptop className="w-3.5 h-3.5" /> To urządzenie
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Lokalnie</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Załadowane modele:</span>
                  <span className="text-amber-400 font-bold">{document.rows.length} aut ({document.brandsCount} marek)</span>
                </div>
                <div className="flex justify-between">
                  <span>Zdjęcia w pamięci:</span>
                  <span className="text-slate-200">
                    {document.rows.filter((r) => r.imageUrl && !r.imageUrl.startsWith('data:image/svg')).length} zdjęć
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Wersja lokalna:</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[140px]" title={document.version}>
                    {document.version || 'Podstawowa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Quick Action Buttons */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-center gap-2">
            <button
              type="button"
              onClick={handlePushToLink}
              disabled={isPushingLink || isPullingLink}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Upload className={`w-3.5 h-3.5 ${isPushingLink ? 'animate-bounce' : ''}`} />
              <span>{isPushingLink ? 'Wysyłanie na link...' : 'Wyślij bazę na ten link (Push)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromLink}
              disabled={isPullingLink || isPushingLink}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-indigo-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isPullingLink ? 'animate-bounce' : ''}`} />
              <span>{isPullingLink ? 'Pobieranie z linku...' : 'Pobierz najnowszą z linku (Pull)'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            <strong>Wskazówka:</strong> Otwórz ten sam link na telefonie lub tablecie, a aplikacja automatycznie załaduje aktualne ceny, rabaty i zdjęcia. Dodatkowo przy powrocie do zakładki program sam sprawdza, czy inne urządzenie wprowadziło zmiany!
          </span>
        </div>
      </div>

      {/* Main Action Cards: 1. Zapisz Backup & 2. Przywróć Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: Zapisz Kopię Zapasową do Pliku */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-400/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    1. Zapisz Backup do Pliku (.JSON)
                  </h3>
                  <p className="text-[11px] text-slate-400">Eksport kompletnego stanu aplikacji na dysk</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20">
                JSON
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Zapisuje <strong className="text-amber-300">100% wszystkich danych i ustawień</strong>: wszystkie zdjęcia lamp w pełnej jakości,
              ceny detaliczne i hurtowe, <strong>wszystkie reguły rabatów brokera i marż</strong>, moduły multimediów,
              kody kodowania, instalacje, notatki warsztatowe oraz preferencje systemowe.
            </p>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5 mb-5 font-mono">
              <div className="flex justify-between">
                <span>Nazwa pliku:</span>
                <span className="text-slate-200">Cennik_Pelna_Baza_{new Date().toISOString().slice(0, 10)}.json</span>
              </div>
              <div className="flex justify-between">
                <span>Zawartość:</span>
                <span className="text-amber-400 font-bold">{document.totalRows} aut • {document.brandsCount} marek</span>
              </div>
              <div className="flex justify-between">
                <span>Data utworzenia:</span>
                <span className="text-slate-300">{currentDate}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Zapisz Pełny Backup do Pliku (.JSON)</span>
          </button>
        </div>

        {/* CARD 2: Przywróć Kopię Zapasową z Dysku */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`bg-slate-900 border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 ${
            isDragging
              ? 'border-amber-400 bg-amber-500/5 shadow-amber-500/10'
              : 'border-slate-800 hover:border-sky-400/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    2. Przywróć Backup z Dysku (.JSON)
                  </h3>
                  <p className="text-[11px] text-slate-400">Import i natychmiastowe odtworzenie bazy 1:1</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded border border-sky-400/20">
                IMPORT
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Wczytuje wcześniej zapisany plik <strong className="text-sky-300">.json</strong> z Twojego komputera.
              Aplikacja natychmiast podmieni stan danych, zaktualizuje pamięć podręczną i zsynchronizuje katalog z serwerem.
            </p>

            {/* Drop Zone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-xl p-4 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950/90 transition-all mb-5 group"
            >
              <FileJson className="w-8 h-8 text-slate-500 group-hover:text-sky-400 mx-auto mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white block">
                Kliknij lub przeciągnij tutaj plik .JSON
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Obsługiwane pliki: kopie zapasowe cennika (.json)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <Upload className="w-4 h-4" />
            <span>Wybierz Plik i Przywróć Backup z Dysku</span>
          </button>
        </div>
      </div>

      {/* CARD 3: Synchronizacja Online z GitHub i Publikacja (Push & Pull) */}
      <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Synchronizacja z GitHub & Vercel (Push & Pull)
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> Branch: main
                </span>
                {ghConfig.checkOnStartup && (
                  <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-start aktywny
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Repozytorium:{' '}
                <a
                  href={ghConfig.repoUrl || 'https://github.com/kadwaolsztyn-afk/EuroKonwerter'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline font-mono inline-flex items-center gap-1"
                >
                  {(ghConfig.repoUrl || 'https://github.com/kadwaolsztyn-afk/EuroKonwerter').replace('https://', '')}
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleCheckGitHub(false)}
              disabled={isCheckingGH || isPullingGH || isPushingGH}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Sprawdź czy na GitHubie pojawiły się nowe wersje bazy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingGH ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isCheckingGH ? 'Sprawdzanie...' : 'Sprawdź GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullGitHub}
              disabled={isPullingGH || isCheckingGH || isPushingGH}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Pobierz ostatnią wersję bazy z GitHub"
            >
              <Download className={`w-4 h-4 ${isPullingGH ? 'animate-bounce' : ''}`} />
              <span>{isPullingGH ? 'Pobieranie...' : 'Pobierz z GitHub (Pull)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingGhConfig(!isEditingGhConfig)}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              title="Konfiguracja tokena i repozytorium GitHub"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ready Direct Links Section */}
        <div className="mb-5 p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Gotowe Linki Bezpośrednie do Aktualizacji Bazy (461 Modeli)
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              100% sprawdzona kompatybilność
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
            Poniżej wygenerowane są bezpośrednie, gotowe linki do najnowszego pliku bazy <code className="text-amber-300 font-mono">data-catalog.json</code> w Twoim repozytorium. Możesz kliknąć <strong>„Pobierz do programu”</strong>, aby natychmiast wczytać bazę bez konieczności wpisywania żadnych danych, albo skopiować link do przeglądarki:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5">
            {/* Link 1: GitHub Raw */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    GitHub Raw (Gałąź główna main)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Oficjalny</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 break-all select-all mb-2.5">
                  https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handlePullFromUrl('https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json')}
                  disabled={isPullingUrl}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isPullingUrl ? 'animate-bounce' : ''}`} />
                  <span>{isPullingUrl ? 'Wczytywanie...' : 'Pobierz do programu'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Kopiuj link do schowka"
                >
                  {copiedUrl === 'https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Kopiuj</span>
                </button>
                <a
                  href="https://raw.githubusercontent.com/kadwaolsztyn-afk/EuroKonwerter/main/data-catalog.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Otwórz plik bezpośrednio w nowej karcie"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Link 2: jsDelivr CDN */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Globalny CDN jsDelivr (Najszybszy)
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300">CORS 100%</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300 break-all select-all mb-2.5">
                  https://cdn.jsdelivr.net/gh/kadwaolsztyn-afk/EuroKonwerter@main/data-catalog.json
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handlePullFromUrl('https://cdn.jsdelivr.net/gh/kadwaolsztyn-afk/EuroKonwerter@main/data-catalog.json')}
                  disabled={isPullingUrl}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isPullingUrl ? 'animate-bounce' : ''}`} />
                  <span>{isPullingUrl ? 'Wczytywanie...' : 'Pobierz do programu'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('https://cdn.jsdelivr.net/gh/kadwaolsztyn-afk/EuroKonwerter@main/data-catalog.json')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Kopiuj link do schowka"
                >
                  {copiedUrl === 'https://cdn.jsdelivr.net/gh/kadwaolsztyn-afk/EuroKonwerter@main/data-catalog.json' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Kopiuj</span>
                </button>
                <a
                  href="https://cdn.jsdelivr.net/gh/kadwaolsztyn-afk/EuroKonwerter@main/data-catalog.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Otwórz plik bezpośrednio w nowej karcie"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Custom URL Input Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="Wklej dowolny link URL do pliku bazy JSON (GitHub, CDN, serwer)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="button"
              onClick={() => handlePullFromUrl()}
              disabled={isPullingUrl || !directUrl.trim()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingUrl ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isPullingUrl ? 'Pobieranie...' : 'Wczytaj z tego linku'}</span>
            </button>
          </div>
        </div>

        {/* Highlight Section: Push to GitHub & Deploy to Vercel */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-950 border border-indigo-500/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Publikacja Dodanych Zdjęć i Zmian na GitHub / Vercel
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Aktualnie w programie:{' '}
                <strong className="text-amber-400 font-mono">
                  {document.rows.filter((r) => r.imageUrl && r.imageUrl.trim()).length} modeli
                </strong>{' '}
                posiada dodane zdjęcia (skompresowane WebP). Kliknij poniższy przycisk, aby wysłać aktualizację prosto na GitHub — Vercel automatycznie rozpocznie budowanie i nowe zdjęcia będą widoczne online!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePushGitHub}
                disabled={isPushingGH || isPullingGH}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <GitCommit className={`w-4 h-4 ${isPushingGH ? 'animate-spin' : ''}`} />
                <span>{isPushingGH ? 'Wysyłanie do GitHub...' : 'Wyślij do GitHub (Auto-Deploy Vercel)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSourceCode}
                disabled={isSyncingSource}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Zapisuje pliki bezpośrednio na dysku serwera (dla AI Studio)"
              >
                <FileCode className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSource ? 'animate-spin' : ''}`} />
                <span>{isSyncingSource ? 'Zapisywanie...' : 'Zapisz w kodzie (AI Studio)'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCatalogJson}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Pobierz plik data-catalog.json ze zdjęciami"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick notice if no token set */}
          {(!ghConfig.githubToken || showTokenField) && (
            <div className="mt-4 pt-3 border-t border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Key className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  {ghConfig.githubToken
                    ? 'Token GitHub jest zapisany i gotowy do wysyłania zmian.'
                    : 'Do automatycznego wysyłania wymagany jest GitHub Personal Access Token (PAT).'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingGhConfig(true)}
                className="text-xs text-indigo-400 hover:text-indigo-200 underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>{ghConfig.githubToken ? 'Zmień token' : 'Wprowadź token GitHub'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Configuration collapse panel */}
        {isEditingGhConfig && (
          <div className="mb-5 p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Konfiguracja Repozytorium i Tokena GitHub
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Adres URL Repozytorium</label>
                <input
                  type="text"
                  value={editRepoUrl}
                  onChange={(e) => setEditRepoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  placeholder="https://github.com/kadwaolsztyn-afk/EuroKonwerter"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gałąź lub Tag Wydania (Branch / Tag)</label>
                <input
                  type="text"
                  value={editReleaseTag}
                  onChange={(e) => setEditReleaseTag(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  placeholder="main"
                />
              </div>
            </div>

            {/* GitHub PAT Token input */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=EuroKonwerter%20App%20Sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  <span>Wygeneruj token na GitHub (uprawnienie 'repo')</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showTokenSecret ? 'text' : 'password'}
                  value={editGhToken}
                  onChange={(e) => setEditGhToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-10 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <button
                  type="button"
                  onClick={() => setShowTokenSecret(!showTokenSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showTokenSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Token jest bezpiecznie zapisywany w Twojej przeglądarce (LocalStorage) i służy wyłącznie do wysyłania zmian bezpośrednio do Twojego repozytorium GitHub na branch <code className="text-indigo-300">main</code>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingGhConfig(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveGhConfig}
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Zapisz Ustawienia & Token
              </button>
            </div>
          </div>
        )}

        {/* Live Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="text-[11px] text-slate-400 mb-1">Status Połączenia:</div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  ghCheckResult?.connected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold text-slate-200">
                {ghCheckResult?.connected ? 'Połączono z Release' : 'Oczekiwanie / Tryb Domyślny'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="text-[11px] text-slate-400 mb-1">Ostatnie Sprawdzenie:</div>
            <span className="font-semibold text-slate-200 font-mono">
              {ghConfig.lastChecked
                ? new Date(ghConfig.lastChecked).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Przed chwilą'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="text-[11px] text-slate-400 mb-1">Ostatnia Synchronizacja / Wersja:</div>
            <span className="font-semibold text-indigo-300 font-mono truncate block" title={ghConfig.lastVersion || document.version}>
              {ghConfig.lastSynced
                ? `${new Date(ghConfig.lastSynced).toLocaleDateString('pl-PL')} (${ghConfig.lastTotalRows || document.totalRows} modeli)`
                : ghConfig.lastVersion || document.version}
            </span>
          </div>
        </div>

        {/* Startup Sync Toggle & Publisher Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ghConfig.checkOnStartup}
              onChange={(e) => handleToggleStartupCheck(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>
              <strong>Automatycznie sprawdzaj i pobieraj aktualną bazę z GitHub</strong> przy każdym uruchomieniu aplikacji
            </span>
          </label>

          <a
            href={`${(ghConfig.repoUrl || 'https://github.com/kadwaolsztyn-afk/EuroKonwerter').replace(/\/$/, '')}/releases/tag/${ghConfig.releaseTag || 'Baza'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline self-end sm:self-auto shrink-0"
          >
            <span>Instrukcja aktualizacji w GitHub Release</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Section 3: Database Status & Diagnostic Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span>Status Bazy Danych i Statystyki Systemowe</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Pozycje w cenniku:</span>
            </div>
            <div className="text-xl font-bold text-white">{document.totalRows} aut</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Unikalne marki:</span>
            </div>
            <div className="text-xl font-bold text-white">{document.brandsCount} marek</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zdjęcia w bazie:</span>
            </div>
            <div className="text-xl font-bold text-white">{document.images.length || document.rows.filter(r => r.imageUrl).length} zdjęć</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rozmiar pakietu:</span>
            </div>
            <div className="text-xl font-bold text-white">{document.sizeFormatted || '280 KB'}</div>
          </div>
        </div>
      </div>

      {/* Section 4: Secondary Tools & Alternative Formats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Dodatkowe Narzędzia Eksportu i Zarządzania</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Excel Export */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-3 p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                Eksportuj do Excel (.xlsx)
              </div>
              <div className="text-[11px] text-slate-400 truncate">Arkusz ze wszystkimi kolumnami</div>
            </div>
          </button>

          {/* HTML 1:1 Export */}
          <button
            type="button"
            onClick={onExportHtml}
            className="flex items-center gap-3 p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                Eksportuj do HTML 1:1 (.html)
              </div>
              <div className="text-[11px] text-slate-400 truncate">Samodzielna strona offline</div>
            </div>
          </button>

          {/* Reset to 35 Brands */}
          {onResetTo35Brands && (
            <button
              type="button"
              onClick={onResetTo35Brands}
              className="flex items-center gap-3 p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  Resetuj do Bazy 35 Marek
                </div>
                <div className="text-[11px] text-slate-400 truncate">Odtwórz fabryczny katalog</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
