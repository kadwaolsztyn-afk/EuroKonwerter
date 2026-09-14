import React, { useState, useRef } from 'react';
import {
  Monitor,
  Check,
  Copy,
  X,
  Terminal,
  Cpu,
  HardDrive,
  ShieldCheck,
  Download,
  Upload,
  Database,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { ImportedDocument } from '../types';
import { exportFullBackupJSON, importFullBackupJSON } from '../utils/storage';

interface DesktopBuildInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: ImportedDocument | null;
  onRestoreBackup?: (doc: ImportedDocument) => void;
}

export const DesktopBuildInfoModal: React.FC<DesktopBuildInfoModalProps> = ({
  isOpen,
  onClose,
  document,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'installer' | 'memory'>('installer');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleExportBackup = () => {
    if (!document) return;
    try {
      exportFullBackupJSON(document);
      setBackupSuccessMsg('Pobrano pełną kopię zapasową bazy (.JSON) ze wszystkimi cenami, rabatami i zdjęciami!');
      setTimeout(() => setBackupSuccessMsg(null), 4000);
    } catch (err) {
      setBackupErrorMsg('Wystąpił błąd podczas eksportu kopii zapasowej.');
      setTimeout(() => setBackupErrorMsg(null), 4000);
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setBackupErrorMsg(null);
    setBackupSuccessMsg(null);

    try {
      const restoredDoc = await importFullBackupJSON(file);
      if (onRestoreBackup) {
        onRestoreBackup(restoredDoc);
      }
      setBackupSuccessMsg(`Pomyślnie wczytano ${restoredDoc.totalRows} pozycji cennika ze wszystkimi cenami i zdjęciami!`);
      setTimeout(() => setBackupSuccessMsg(null), 4000);
    } catch (err: any) {
      setBackupErrorMsg(err?.message || 'Nie udało się wczytać pliku kopii.');
      setTimeout(() => setBackupErrorMsg(null), 5000);
    } finally {
      setIsImporting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-white relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-lg shadow-amber-500/20">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Uniwersalny Instalator Windows (.EXE)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Jeden uniwersalny plik instalacyjny dla systemów <strong>Windows 64-bit (x64)</strong> oraz <strong>32-bit (x86)</strong>.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('installer')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'installer'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. Instalator EXE (x64 oraz x32)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Kopia i Pamięć Bazy Danych</span>
          </button>
        </div>

        {activeTab === 'installer' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Specs summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>Architektury CPU</span>
                </div>
                <span className="text-sm font-semibold text-white">x64 oraz 32-bit (x32)</span>
                <span className="text-[11px] text-slate-400">Instalator na każdy system Windows</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <HardDrive className="w-4 h-4" />
                  <span>Kreator Windows</span>
                </div>
                <span className="text-sm font-semibold text-white">Instalator NSIS (.EXE)</span>
                <span className="text-[11px] text-slate-400">Wybór folderu, Pulpit, Menu Start</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Działanie Offline</span>
                </div>
                <span className="text-sm font-semibold text-white">100% Niezależny Program</span>
                <span className="text-[11px] text-slate-400">Brak wymogu Internetu czy przeglądarki</span>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-4">
              {/* Method 1: Installer EXE */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Samodzielny Instalator Windows (.EXE) – krok po kroku:</span>
                  </h4>
                  <span className="text-[10px] uppercase font-bold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                    Format Office / Setup
                  </span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    W pobranym folderze programu kliknij dwukrotnie plik <strong className="text-amber-300 font-mono">buduj-exe.bat</strong> lub <strong className="text-sky-300 font-mono">buduj-instalator-x64-i-x32.bat</strong>.
                  </li>
                  <li>
                    Skrypt automatycznie skompiluje aplikację i utworzy gotowe pliki instalacyjne w katalogu <strong className="text-white font-mono">release/</strong>:
                    <div className="mt-1.5 space-y-1 text-[11px] font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                      <div className="text-emerald-300">📦 Cennik konwersji lamp i multimediów-Setup-x64.exe (Windows 64-bit)</div>
                      <div className="text-sky-300">📦 Cennik konwersji lamp i multimediów-Setup-ia32.exe (Windows 32-bit / x86)</div>
                    </div>
                  </li>
                  <li>
                    Uruchom plik setup na docelowym komputerze. Kreator poprowadzi instalację, utworzy skrót na Pulpicie i w Menu Start.
                  </li>
                </ol>
              </div>

              {/* Method 2: Fast Desktop Icon */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Alternatywa: Błyskawiczny skrót na Pulpit (bez kompilacji):
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Możesz również uruchomić plik <code className="text-amber-300 font-mono">UTWORZ-IKONE-NA-PULPICIE.bat</code>, który natychmiast utworzy ikonę uruchamiającą program w dedykowanym oknie systemowym.
                </p>
              </div>
            </div>

            {/* Manual Commands */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Polecenia w terminalu (Node.js / npm):</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-300">
                      Obie wersje (x64 + x32):
                    </span>
                    <button
                      onClick={() => copyToClipboard('npm run build:installer', 'both')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {copiedCmd === 'both' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'both' ? 'OK' : 'Kopiuj'}</span>
                    </button>
                  </div>
                  <code className="text-[11px] font-mono text-slate-300 block bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
                    npm run build:installer
                  </code>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-sky-300">
                      Wersja 64-bit (x64):
                    </span>
                    <button
                      onClick={() => copyToClipboard('npm run build:installer:x64', 'x64')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {copiedCmd === 'x64' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'x64' ? 'OK' : 'Kopiuj'}</span>
                    </button>
                  </div>
                  <code className="text-[11px] font-mono text-slate-300 block bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
                    npm run build:installer:x64
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Notification messages */}
            {backupSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{backupSuccessMsg}</span>
              </div>
            )}
            {backupErrorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{backupErrorMsg}</span>
              </div>
            )}

            {/* Explanation of memory */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Database className="w-4 h-4" />
                <span>Jak działa pamięć po instalacji na komputerze:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Po zainstalowaniu aplikacji z pliku <strong>.exe</strong>, wszystkie modyfikacje cennika (zmiany cen dla klienta i brokera, rabaty procentowe, narzuty, przypisane zdjęcia oraz nowe pozycje) są <strong>automatycznie zapisywane na dysku twardym komputera</strong> w trwałej lokalnej bazie IndexedDB.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Dane nie kasują się po restarcie komputera ani po zamknięciu programu.</li>
                <li>Aplikacja działa w 100% offline bez potrzeby połączenia z Internetem.</li>
                <li>Nawet przy aktualizacji programu baza cen pozostaje bezpieczna.</li>
              </ul>
            </div>

            {/* Backup actions */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Kopia zapasowa i przenoszenie danych z AI Studio:</span>
              </h4>
              <p className="text-xs text-slate-300">
                Możesz pobrać całą bazę (wraz ze wszystkimi zdjęciami i zmodyfikowanymi cenami) do jednego pliku <strong>.JSON</strong> i wgrać ją do zainstalowanego programu na dowolnym komputerze:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="p-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Pobierz bazę cennika (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  disabled={isImporting}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>{isImporting ? 'Wczytywanie...' : 'Wczytaj bazę z pliku (.JSON)'}</span>
                </button>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFileSelected}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end pt-5 border-t border-slate-800/80 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
