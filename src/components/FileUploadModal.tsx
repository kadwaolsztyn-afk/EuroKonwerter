import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  FileCode,
  Archive,
  Image as ImageIcon,
  FolderArchive,
  Sparkles,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { importDocumentFromFile } from '../utils/fileImporter';
import { ImportedDocument } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentImported: (doc: ImportedDocument, mode: 'append' | 'replace') => void;
  existingItemsCount?: number;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentImported,
  existingItemsCount = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesProcess = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Find primary document file (.xlsx, .html, .htm, .zip, .xls, .csv)
      const primaryDoc =
        files.find((f) => {
          const name = f.name.toLowerCase();
          return (
            name.endsWith('.xlsx') ||
            name.endsWith('.html') ||
            name.endsWith('.htm') ||
            name.endsWith('.zip') ||
            name.endsWith('.xls') ||
            name.endsWith('.csv')
          );
        }) || files[0];

      const additionalFiles = files.filter((f) => f !== primaryDoc);

      const doc = await importDocumentFromFile(primaryDoc, additionalFiles);
      if (doc.rows.length === 0 && !doc.rawHtml) {
        throw new Error('Nie udało się wyodrębnić tabeli ani treści z wybranego pliku.');
      }
      onDocumentImported(doc, importMode);
      onClose();
    } catch (err: any) {
      console.error('File import error:', err);
      setErrorMessage(
        `Błąd podczas przetwarzania pliku: ${err.message || 'Niepoprawny format pliku'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcess(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Import i Aktualizacja Katalogu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Import Mode Selection */}
          {existingItemsCount > 0 && (
            <div className="mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">
                Sposób załadowania danych do bazy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    importMode === 'append'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      importMode === 'append' ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Dodaj nowe pozycje
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Dołącza nowe wiersze do obecnych ({existingItemsCount} pozycji)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    importMode === 'replace'
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <RefreshCw
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      importMode === 'replace' ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Zastąp całą bazę
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Wgrywa nowy plik jako zupełnie nowy cennik
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.htm,.xlsx,.xls,.csv,.zip,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesProcess(e.target.files);
              }
            }}
          />

          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesProcess(e.target.files);
              }
            }}
          />

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-amber-400 bg-amber-400/10 scale-[0.99]'
                : 'border-slate-700 bg-slate-950/60 hover:border-amber-400/60 hover:bg-slate-800/60'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="font-bold text-sm text-white">
                Przeciągnij plik tutaj lub{' '}
                <span className="text-amber-400 underline">Wybierz z dysku</span>
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Wybierz plik <strong>.xlsx</strong> (z osadzonymi zdjęciami),{' '}
                <strong>.html</strong>, <strong>.zip</strong> lub zaznacz stronę HTML
                razem z folderem zdjęć.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold border border-slate-700 hover:border-amber-400/40 transition-all flex items-center gap-1.5"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Wybierz cały folder (HTML + Zdjęcia)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 pt-3 border-t border-slate-800 w-full justify-center">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
                (.xlsx, .xls)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-amber-400" /> HTML / HTM 1:1
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Archive className="w-3.5 h-3.5 text-indigo-400" /> Archiwum .ZIP
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> Zdjęcia
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 p-3 bg-amber-400/20 border border-amber-400/40 rounded-xl text-amber-200 text-xs text-center font-medium animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>Trwa bezstratny import 1:1, ekstrakcja arkusza i osadzanie zdjęć...</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Obsługuje zdjęcia z arkuszy OpenXML i Google Sheets</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
};
