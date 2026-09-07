import React, { useState, useEffect } from 'react';
import { ImportedDocument, ViewMode, DocumentRow } from '../types';
import { OriginalIframeViewer } from './OriginalIframeViewer';
import { InteractiveDataGrid } from './InteractiveDataGrid';
import { ImageGalleryView } from './ImageGalleryView';
import { AnalyticsView } from './AnalyticsView';
import { BackupRestoreSettings } from './BackupRestoreSettings';
import { SecurityPasswordSettings } from './SecurityPasswordSettings';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { getGitHubSyncConfig, saveGitHubSyncConfig, GitHubSyncConfig } from '../utils/githubSync';

interface SettingsViewProps {
  document: ImportedDocument;
  viewMode: ViewMode;
  zoom: number;
  onBatchAttachImages: (files: File[]) => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportHtml?: () => void;
  onUpdateRowImage: (rowId: number, imageUrl: string) => void;
  onUpdateRows?: (updatedRows: DocumentRow[]) => void;
  onRestoreBackup?: (doc: ImportedDocument) => void;
  onResetTo35Brands?: () => void;
  onSaveToServer?: () => void;
  onNotification?: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  document,
  viewMode,
  zoom,
  onBatchAttachImages,
  onOpenUpload,
  onExportExcel,
  onExportHtml = () => {},
  onUpdateRowImage,
  onUpdateRows,
  onRestoreBackup = () => {},
  onResetTo35Brands,
  onSaveToServer,
  onNotification,
}) => {
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

  return (
    <div className="w-full">
      {viewMode === 'security' && (
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

          {/* Full Password Security Management Component */}
          <SecurityPasswordSettings
            onSuccessNotification={(msg) => onNotification && onNotification(msg)}
          />
        </div>
      )}

      {viewMode === 'backup' && (
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

      {viewMode === 'original' && (
        <OriginalIframeViewer
          document={document}
          zoom={zoom}
          onBatchAttachImages={onBatchAttachImages}
          onOpenUpload={onOpenUpload}
        />
      )}

      {viewMode === 'grid' && (
        <InteractiveDataGrid
          document={document}
          onExportExcel={onExportExcel}
          onUpdateRowImage={onUpdateRowImage}
          onBatchAttachImages={onBatchAttachImages}
          onUpdateRows={onUpdateRows}
        />
      )}

      {viewMode === 'gallery' && (
        <ImageGalleryView
          document={document}
          onUpdateRowImage={onUpdateRowImage}
          onBatchAttachImages={onBatchAttachImages}
        />
      )}

      {viewMode === 'analytics' && (
        <AnalyticsView document={document} />
      )}
    </div>
  );
};
