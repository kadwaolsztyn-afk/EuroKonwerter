import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  HardDrive,
  FolderSync,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Download,
  Info,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  fetchPortableStatus,
  migrateCatalogImagesToUploadsFolder,
  PortableStatus,
} from '../utils/imageUpload';

export const PortableModeCard: React.FC = () => {
  const [status, setStatus] = useState<PortableStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPortableStatus();
      if (data) setStatus(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationMessage(null);
    try {
      const result = await migrateCatalogImagesToUploadsFolder();
      if (result.success) {
        setMigrationMessage(
          result.migratedCount > 0
            ? `Pomyślnie przeniesiono ${result.migratedCount} zdjęć do folderu /uploads!`
            : 'Wszystkie zdjęcia znajdują się już w fizycznym folderze /uploads.'
        );
        loadStatus();
      } else {
        setMigrationMessage(`Błąd migracji: ${result.error || 'Nieznany błąd'}`);
      }
    } catch (e: any) {
      setMigrationMessage(`Błąd: ${e.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDownloadLauncher = () => {
    const launcherContent = `@echo off
chcp 65001 > nul
title Cennik Konwersji Lamp i Multimediow (Wersja Przenosna)
color 0b

echo ===============================================================================
echo     CENNIK KONWERSJI LAMP I MULTIMEDIOW - WERSJA W 100%% PRZENOSNA (PORTABLE)
echo     Wszystkie pliki bazy (data-catalog.json) oraz zdjecia (/uploads)
echo     znajduja sie w tym folderze. Brak wpisow do rejestru i AppData.
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Sprawdzanie srodowiska Node.js w systemie...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [UWAGA] Nie wykryto polecenia 'node' w sciezce systemowej PATH.
    echo Aby uruchomic program na nowym komputerze, zainstaluj Node.js LTS (https://nodejs.org).
    echo.
    pause
    exit /b 1
)

echo [2/3] Uruchamianie lokalnego silnika cennika...
if exist "dist\\server.cjs" (
    start /min "Cennik Serwer" node dist/server.cjs
) else (
    start /min "Cennik Serwer" npx tsx server.ts
)

echo [3/3] Otwieram przegladarke...
timeout /t 2 /nobreak > nul
start http://localhost:3000
pause
`;
    const blob = new Blob([launcherContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Uruchom_Cennik.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background subtle glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Wersja Przenośna (100% Portable / USB)</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Aktywna
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Wszystkie pliki programu, baza danych oraz dodane zdjęcia znajdują się wyłącznie w jednym folderze.
            </p>
          </div>
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Odśwież status
        </button>
      </div>

      {/* Grid of portable facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        {/* Card 1: Images in uploads */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Zdjęcia w folderze /uploads</span>
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {status ? status.uploadsCount : '—'} <span className="text-sm font-normal text-slate-400">plików</span>
          </div>
          <div className="text-xs text-emerald-400/90 mt-1 font-mono">
            {status ? status.uploadsSizeFormatted : '0.00 MB'} w folderze programu
          </div>
        </div>

        {/* Card 2: Database in folder */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Lokalna baza danych</span>
            <FileCode className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white truncate font-mono">
            data-catalog.json
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Zapisywana bezpośrednio w folderze aplikacji
          </div>
        </div>

        {/* Card 3: Windows Isolation */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Izolacja od Windowsa</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" /> 0 wpisów w rejestrze
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Brak plików w AppData, pełna mobilność USB
          </div>
        </div>
      </div>

      {/* Action banner & tools */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-emerald-400" />
            Optymalizacja zdjęć do folderu /uploads
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Przenosi ewentualne stare zdjęcia z bazy danych bezpośrednio do fizycznych plików w folderze <code>uploads/</code>, odchudzając bazę danych i przyspieszając start.
          </p>
          {migrationMessage && (
            <p className="text-xs font-medium text-emerald-300 mt-1">{migrationMessage}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Przenoszenie...' : 'Przenieś zdjęcia do /uploads'}
          </button>

          <button
            onClick={handleDownloadLauncher}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            title="Pobierz plik uruchomieniowy Uruchom_Cennik.bat"
          >
            <Download className="w-3.5 h-3.5" />
            Uruchom_Cennik.bat
          </button>
        </div>
      </div>
    </div>
  );
};
