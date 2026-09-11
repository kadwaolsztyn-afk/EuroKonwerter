import React, { useState, useEffect, useCallback } from 'react';
import { MainTab, ViewMode, ImportedDocument, ExtractedImage, DocumentRow, SettingsTab } from './types';
import { SAMPLE_HTML_CONTENT, SAMPLE_HTML_TITLE } from './data/sampleDocument';
import { INITIAL_35_BRANDS_DOCUMENT } from './data/initialCatalog';
import { parseHtmlDocument } from './utils/htmlParser';
import { exportToExcel, exportToHtml } from './utils/exporter';
import { generateHtmlFromRows, getMimeTypeFromExt, uint8ArrayToDataUrl } from './utils/fileImporter';
import {
  saveDocumentToStorage,
  loadDocumentFromStorage,
  clearDocumentStorage,
  saveMasterCatalogToServer,
  getSynchronousInitialDocument,
} from './utils/storage';
import { mergeDocuments } from './utils/documentMerger';
import { uploadImageToProgramFolder, compressImageFile } from './utils/imageUpload';
import { pushDatabaseToGitHub, getGitHubSyncConfig, pullDatabaseFromGitHub } from './utils/githubSync';
import { checkLinkServerStatus, pullDatabaseFromLinkServer } from './utils/linkSync';
import { Header } from './components/Header';
import { SettingsView } from './components/SettingsView';
import { ClientView } from './components/ClientView';
import { WholesaleView } from './components/WholesaleView';
import { FileUploadModal } from './components/FileUploadModal';
import { PasswordLockModal } from './components/PasswordLockModal';
import { DesktopBuildInfoModal } from './components/DesktopBuildInfoModal';
import { AppStartupLoader } from './components/AppStartupLoader';
import { CheckCircle2, RotateCcw, Sparkles, X, AlertTriangle } from 'lucide-react';
import { syncSecurityPasswordsFromServer } from './utils/security';

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('client');
  const [currentDocument, setCurrentDocument] = useState<ImportedDocument>(getSynchronousInitialDocument);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('basic');
  const [zoom, setZoom] = useState<number>(1.0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDesktopInfoOpen, setIsDesktopInfoOpen] = useState(false);
  const [isSavedInMemory, setIsSavedInMemory] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Application Startup Loading State with Percentage Progress
  const [isStartupLoading, setIsStartupLoading] = useState<boolean>(false);
  const [startupProgress, setStartupProgress] = useState<number>(100);
  const [startupStage, setStartupStage] = useState<string>('Gotowe! Cennik aktywny');
  const [startupElapsed, setStartupElapsed] = useState<number>(0);
  const [isStartupTakingLonger, setIsStartupTakingLonger] = useState<boolean>(false);

  // Password Protection for 'wholesale' and 'settings' (starts locked by default)
  const [isWholesaleUnlocked, setIsWholesaleUnlocked] = useState<boolean>(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<MainTab>('settings');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleTabChange = (targetTab: MainTab) => {
    if (targetTab === 'client') {
      // Switching to Client tab always locks protected access
      setIsWholesaleUnlocked(false);
      setIsSettingsUnlocked(false);
      try {
        sessionStorage.removeItem('auth_locked_tabs_unlocked');
      } catch {
        // ignore
      }
      setMainTab('client');
      return;
    }

    if (targetTab === 'settings') {
      if (isSettingsUnlocked) {
        setMainTab('settings');
      } else {
        setPendingTab('settings');
        setIsAuthModalOpen(true);
      }
      return;
    }

    if (targetTab === 'wholesale') {
      if (isWholesaleUnlocked || isSettingsUnlocked) {
        setMainTab('wholesale');
      } else {
        setPendingTab('wholesale');
        setIsAuthModalOpen(true);
      }
      return;
    }

    setMainTab(targetTab);
  };

  const handleAuthSuccess = () => {
    if (pendingTab === 'settings') {
      setIsSettingsUnlocked(true);
      setIsWholesaleUnlocked(true);
    } else if (pendingTab === 'wholesale') {
      setIsWholesaleUnlocked(true);
    }
    try {
      sessionStorage.setItem('auth_locked_tabs_unlocked', 'true');
    } catch {
      // ignore
    }
    setMainTab(pendingTab);
    setIsAuthModalOpen(false);
    showNotification('Dostęp autoryzowany pomyślnie');
  };

  const handleAuthCancel = () => {
    setIsAuthModalOpen(false);
  };

  const handleLockSession = () => {
    setIsWholesaleUnlocked(false);
    setIsSettingsUnlocked(false);
    try {
      sessionStorage.removeItem('auth_locked_tabs_unlocked');
    } catch {
      // ignore
    }
    setMainTab('client');
    showNotification('Dostęp chroniony został zablokowany');
  };

  // 1. Initial Load and Startup Flow with Percentage Progress Tracking
  const initCatalog = useCallback(async (isDiagnostic = false) => {
    if (isDiagnostic) {
      setIsStartupLoading(true);
      setStartupElapsed(0);
      setIsStartupTakingLonger(false);
      setStartupProgress(15);
      setStartupStage('Inicjalizacja środowiska i pamięci podręcznej...');
    }

    const startTime = Date.now();

    // Live elapsed timer: updates every 100ms
    const elapsedInterval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      setStartupElapsed(elapsedSec);
      if (elapsedSec >= 2.8) {
        setIsStartupTakingLonger(true);
      }
    }, 100);

    // Smooth progress micro-ticker
    const progressInterval = setInterval(() => {
      setStartupProgress((prev) => {
        if (prev < 98) {
          return prev + 1;
        }
        return prev;
      });
    }, isDiagnostic ? 80 : 60);

    // Safety timeout: under NO circumstance can startup screen remain active longer than 2.0s
    const safetyTimeout = setTimeout(() => {
      setIsStartupLoading(false);
      clearInterval(elapsedInterval);
      clearInterval(progressInterval);
    }, 2000);

    try {
      // Step 1: Security passwords check (non-blocking)
      syncSecurityPasswordsFromServer().catch(() => {});
      if (isDiagnostic) await new Promise((r) => setTimeout(r, 180));
      setStartupProgress(40);
      setStartupStage('Weryfikacja lokalnej pamięci podręcznej i bazy...');

      // Step 2: Load document from storage (local-first, fast)
      const savedDoc = await loadDocumentFromStorage();
      if (savedDoc && savedDoc.rows && savedDoc.rows.length > 0) {
        setCurrentDocument(savedDoc);
        setIsSavedInMemory(true);
      }
      if (isDiagnostic) await new Promise((r) => setTimeout(r, 180));
      setStartupProgress(75);
      setStartupStage('Wczytywanie bazy modeli samochodów i multimediów...');

      // Step 3: Automatic GitHub / cloud sync if enabled (async)
      const ghCfg = getGitHubSyncConfig();
      if (ghCfg.enabled && ghCfg.checkOnStartup) {
        setStartupProgress(88);
        setStartupStage('Sprawdzanie aktualizacji w chmurze...');
        pullDatabaseFromGitHub(ghCfg).then((pullRes) => {
          if (pullRes.success && pullRes.document) {
            setCurrentDocument(pullRes.document);
            setIsSavedInMemory(true);
            showNotification('Baza została zaktualizowana');
          }
        }).catch((ghErr) => {
          console.warn('[App Startup] Automatic GitHub download notice:', ghErr);
        });
      }

      setStartupProgress(100);
      setStartupStage('Gotowe! Uruchamianie cennika...');

      setTimeout(() => {
        clearTimeout(safetyTimeout);
        setIsStartupLoading(false);
        clearInterval(elapsedInterval);
        clearInterval(progressInterval);
      }, isDiagnostic ? 250 : 120);

    } catch (err) {
      console.error('Error reading catalog storage during startup:', err);
      clearTimeout(safetyTimeout);
      // Safe fallback so user is never blocked
      const fallback = getSynchronousInitialDocument();
      setCurrentDocument(fallback);
      setStartupProgress(100);
      setIsStartupLoading(false);
      clearInterval(elapsedInterval);
      clearInterval(progressInterval);
    }
  }, []);

  useEffect(() => {
    initCatalog(false);

    const handleOnline = () => {
      const ghCfg = getGitHubSyncConfig();
      if (ghCfg.enabled && ghCfg.checkOnStartup) {
        pullDatabaseFromGitHub(ghCfg).then((pullRes) => {
          if (pullRes.success && pullRes.document) {
            setCurrentDocument(pullRes.document);
            setIsSavedInMemory(true);
            showNotification('Baza została zaktualizowana');
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [initCatalog]);

  const handleBypassToLocal = () => {
    setIsStartupLoading(false);
    const localDoc = getSynchronousInitialDocument();
    setCurrentDocument(localDoc);
    setIsSavedInMemory(true);
    showNotification('Otwarto cennik natychmiast z pamięci urządzenia (tryb ekspresowy)');
  };

  const handleRetryStartup = () => {
    initCatalog(false);
  };

  const handleResetStorageStartup = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  const handleTriggerStartupDiagnostic = () => {
    initCatalog(true);
  };

  // Cross-device link sync: checks lightweight /api/catalog/status on focus and periodically
  useEffect(() => {
    let isCancelled = false;

    async function checkForRemoteUpdates() {
      if (!currentDocument || isCancelled) return;
      try {
        const status = await checkLinkServerStatus();
        if (
          status.exists &&
          status.version &&
          currentDocument.version &&
          status.version !== currentDocument.version
        ) {
          console.log(
            `[LinkSync] Newer catalog detected on shared link (${status.version} vs ${currentDocument.version}). Auto-syncing...`
          );
          const res = await pullDatabaseFromLinkServer();
          if (res.success && res.document && !isCancelled) {
            setCurrentDocument(res.document);
            setIsSavedInMemory(true);
            showNotification('Aktualizacja zakończona pomyślnie');
          }
        }
      } catch (_) {}
    }

    const onFocus = () => {
      checkForRemoteUpdates();
    };

    window.addEventListener('focus', onFocus);
    const interval = setInterval(checkForRemoteUpdates, 25000);

    return () => {
      isCancelled = true;
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [currentDocument?.version]);

  // Helper to update state and save to IndexedDB and server in one step
  const updateAndPersistDocument = useCallback(async (updatedDoc: ImportedDocument) => {
    setCurrentDocument(updatedDoc);
    try {
      await saveDocumentToStorage(updatedDoc);
      saveMasterCatalogToServer(updatedDoc).catch(() => {});
      setIsSavedInMemory(true);
    } catch (err) {
      console.error('Failed to persist document:', err);
    }
  }, []);

  const handleResetTo35Brands = async () => {
    await updateAndPersistDocument(INITIAL_35_BRANDS_DOCUMENT);
    await saveMasterCatalogToServer(INITIAL_35_BRANDS_DOCUMENT);
    showNotification('Załadowano kompletną bazę 35 marek samochodowych!');
  };

  /**
   * Handles importing a document file.
   * By default ('append'), adds new positions without deleting existing rows.
   */
  const handleDocumentImported = async (newDoc: ImportedDocument, mode: 'append' | 'replace' = 'append') => {
    if (!currentDocument || mode === 'replace') {
      await updateAndPersistDocument(newDoc);
      showNotification(`Zaimportowano pomyślnie ${newDoc.rows.length} pozycji.`);
    } else {
      // Append / Merge new positions into existing document
      const result = mergeDocuments(currentDocument, newDoc, 'append');
      await updateAndPersistDocument(result.updatedDocument);
      showNotification(
        `Dodano ${result.addedCount} nowych pozycji (zaktualizowano ${result.updatedCount}). Łącznie: ${result.totalCount} pozycji.`
      );
    }
    setZoom(1.0);
  };

  /**
   * Updates an individual row's image and persists changes
   */
  const handleUpdateRowImage = async (rowId: number, imageUrl: string) => {
    if (!currentDocument) return;

    const updatedRows = currentDocument.rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, imageUrl };
      }
      return row;
    });

    // Update images list
    const updatedImages: ExtractedImage[] = [...currentDocument.images];
    const targetRow = updatedRows.find((r) => r.id === rowId);

    if (imageUrl && targetRow) {
      const existingIdx = updatedImages.findIndex((img) => img.rowIndex === rowId);
      if (existingIdx >= 0) {
        updatedImages[existingIdx].src = imageUrl;
      } else {
        updatedImages.push({
          id: `custom-img-${rowId}-${Date.now()}`,
          src: imageUrl,
          originalSrc: imageUrl,
          brand: targetRow.brand,
          model: targetRow.model,
          rowIndex: rowId,
        });
      }
    }

    // Regenerate HTML for 1:1 view
    const newHtml = generateHtmlFromRows(currentDocument.name, updatedRows);

    const newDocState: ImportedDocument = {
      ...currentDocument,
      rows: updatedRows,
      images: updatedImages,
      rawHtml: newHtml,
    };

    await updateAndPersistDocument(newDocState);
  };

  /**
   * Batch attaches image files and persists changes
   */
  const handleBatchAttachImages = async (files: File[]) => {
    if (!currentDocument || files.length === 0) return;

    const imageFiles = files.filter((f) => {
      const name = f.name.toLowerCase();
      return (
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif') ||
        name.endsWith('.svg') ||
        name.endsWith('.bmp')
      );
    });

    if (imageFiles.length === 0) return;

    // Upload all image files directly to the local program's /uploads folder
    const newExtracted: { name: string; url: string }[] = [];
    for (const f of imageFiles) {
      try {
        const url = await uploadImageToProgramFolder(f, { suggestedFilename: f.name });
        newExtracted.push({ name: f.name, url });
      } catch {
        try {
          const compressedDataUrl = await compressImageFile(f);
          newExtracted.push({ name: f.name, url: compressedDataUrl });
        } catch {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const mime = getMimeTypeFromExt(f.name);
          const dataUrl = uint8ArrayToDataUrl(bytes, mime);
          newExtracted.push({ name: f.name, url: dataUrl });
        }
      }
    }

    const updatedRows = [...currentDocument.rows];
    const updatedImages = [...currentDocument.images];
    let attachedCount = 0;

    // Match files by brand/model/row index or sequentially
    newExtracted.forEach((item, itemIdx) => {
      const lowerName = item.name.toLowerCase().replace(/\.[^/.]+$/, '');

      const numMatch = lowerName.match(/\d+/);
      const rowNum = numMatch ? parseInt(numMatch[0], 10) : -1;

      let matchedRow = updatedRows.find((r) => {
        if (r.id === rowNum || String(r.lp) === String(rowNum)) return true;
        const brandMatch = r.brand && lowerName.includes(r.brand.toLowerCase());
        const modelMatch = r.model && lowerName.includes(r.model.toLowerCase().replace(/\s+/g, ''));
        return brandMatch && modelMatch;
      });

      if (!matchedRow) {
        matchedRow = updatedRows.find((r) => !r.imageUrl);
      }

      if (!matchedRow && itemIdx < updatedRows.length) {
        matchedRow = updatedRows[itemIdx];
      }

      if (matchedRow) {
        matchedRow.imageUrl = item.url;
        attachedCount++;
        const existingImg = updatedImages.find((img) => img.src === item.url);
        if (!existingImg) {
          updatedImages.push({
            id: `batch-img-${Date.now()}-${itemIdx}`,
            src: item.url,
            originalSrc: item.name,
            brand: matchedRow.brand,
            model: matchedRow.model,
            rowIndex: matchedRow.id,
          });
        }
      }
    });

    const newHtml = generateHtmlFromRows(currentDocument.name, updatedRows);

    const newDocState: ImportedDocument = {
      ...currentDocument,
      rows: updatedRows,
      images: updatedImages,
      rawHtml: newHtml,
    };

    await updateAndPersistDocument(newDocState);
    showNotification(`Dołączono ${attachedCount} zdjęć do pozycji.`);
  };

  /**
   * Bulk updates rows (e.g. after percentage price modification) and persists changes
   */
  const handleUpdateRows = async (updatedRows: DocumentRow[]) => {
    if (!currentDocument) return;

    const newHtml = generateHtmlFromRows(currentDocument.name, updatedRows);
    const newDocState: ImportedDocument = {
      ...currentDocument,
      rows: updatedRows,
      rawHtml: newHtml,
    };

    await updateAndPersistDocument(newDocState);
    showNotification('Ceny w cenniku zostały pomyślnie zaktualizowane.');
  };

  /**
   * Resets document back to clean default initial sample (461 rows, 35 brands)
   */
  const handlePerformReset = async () => {
    try {
      await clearDocumentStorage();
      await updateAndPersistDocument(INITIAL_35_BRANDS_DOCUMENT);
      await saveMasterCatalogToServer(INITIAL_35_BRANDS_DOCUMENT);
      setIsRestoreModalOpen(false);
      showNotification('Pomyślnie przywrócono oryginalną bazę 35 marek 1:1!');
    } catch (err) {
      console.error('Błąd podczas przywracania bazy:', err);
      setCurrentDocument(INITIAL_35_BRANDS_DOCUMENT);
      setIsRestoreModalOpen(false);
      showNotification('Przywrócono oryginalną bazę 35 marek.');
    }
  };

  const handleOpenRestoreModal = () => {
    setIsRestoreModalOpen(true);
  };

  const handleExportExcel = () => {
    if (currentDocument) {
      exportToExcel(currentDocument);
    }
  };

  const handleExportHtml = () => {
    if (currentDocument) {
      exportToHtml(currentDocument);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [isPushingGH, setIsPushingGH] = useState(false);
  const [isPullingGH, setIsPullingGH] = useState(false);

  const handleSaveToServer = async () => {
    if (!currentDocument) return;
    const ok = await saveMasterCatalogToServer(currentDocument);
    if (ok) {
      showNotification(
        `Baza (${currentDocument.rows.length} pozycji) została pomyślnie zapisana na serwerze i jest aktywna dla wszystkich linków!`
      );
    } else {
      showNotification('Baza zapisana lokalnie w pamięci przeglądarki.');
    }
  };

  const handlePushToGitHub = async () => {
    if (!currentDocument) return;
    const config = getGitHubSyncConfig();
    if (!config.githubToken) {
      setMainTab('settings');
      setSettingsTab('advanced');
      setViewMode('backup');
      showNotification(
        'Wprowadź token GitHub (Personal Access Token) w sekcji Kopia i Przywracanie Bazy, aby móc automatycznie publikować na GitHub i Vercel.'
      );
      return;
    }

    try {
      setIsPushingGH(true);
      const res = await pushDatabaseToGitHub(currentDocument);
      if (res.success) {
        showNotification(
          res.message || 'Pomyślnie wysłano zaktualizowaną bazę ze zdjęciami do GitHub! Vercel już aktualizuje stronę.'
        );
      } else {
        showNotification(`Błąd wysyłania do GitHub: ${res.error}`);
      }
    } catch (err: any) {
      showNotification(`Błąd wysyłania: ${err?.message || 'Nieznany błąd'}`);
    } finally {
      setIsPushingGH(false);
    }
  };

  const handlePullFromGitHub = async () => {
    try {
      setIsPullingGH(true);
      const res = await pullDatabaseFromGitHub();
      if (res.success && res.document) {
        await updateAndPersistDocument(res.document);
        showNotification(
          res.message || `Pomyślnie pobrano najnowszą bazę z GitHub (${res.totalRows || res.document.rows?.length || 0} pozycji)!`
        );
      } else {
        showNotification(`Pobieranie z GitHub: ${res.error || 'Brak danych lub repozytorium niedostępne'}`);
      }
    } catch (err: any) {
      showNotification(`Błąd pobierania z GitHub: ${err?.message || 'Nieznany błąd'}`);
    } finally {
      setIsPullingGH(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 w-full overflow-x-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-400/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce text-xs font-medium backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header with Klient / Hurt / Ustawienia Navigation */}
      <Header
        mainTab={mainTab}
        setMainTab={handleTabChange}
        currentDocument={currentDocument}
        viewMode={viewMode}
        setViewMode={setViewMode}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        zoom={zoom}
        setZoom={setZoom}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDesktopBuildInfo={() => setIsDesktopInfoOpen(true)}
        onExportExcel={handleExportExcel}
        onExportHtml={handleExportHtml}
        onPrint={handlePrint}
        onResetDocument={handleOpenRestoreModal}
        onResetTo35Brands={handlePerformReset}
        onSaveToServer={handleSaveToServer}
        onPushToGitHub={handlePushToGitHub}
        isPushingToGitHub={isPushingGH}
        isSaved={isSavedInMemory}
        isUnlocked={isWholesaleUnlocked || isSettingsUnlocked}
        isWholesaleUnlocked={isWholesaleUnlocked}
        isSettingsUnlocked={isSettingsUnlocked}
        onLock={handleLockSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col">
        {mainTab === 'client' && (
          <ClientView
            document={currentDocument}
            onExportExcel={handleExportExcel}
          />
        )}

        {mainTab === 'wholesale' && (
          <WholesaleView
            document={currentDocument}
            onExportExcel={handleExportExcel}
          />
        )}

        {mainTab === 'settings' && (
          <SettingsView
            document={currentDocument}
            viewMode={viewMode}
            zoom={zoom}
            setZoom={setZoom}
            settingsTab={settingsTab}
            onSettingsTabChange={setSettingsTab}
            onViewModeChange={setViewMode}
            onBatchAttachImages={handleBatchAttachImages}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenDesktopBuildInfo={() => setIsDesktopInfoOpen(true)}
            onExportExcel={handleExportExcel}
            onExportHtml={handleExportHtml}
            onPrint={handlePrint}
            onResetDocument={handleOpenRestoreModal}
            onUpdateRowImage={handleUpdateRowImage}
            onUpdateRows={handleUpdateRows}
            onRestoreBackup={(restoredDoc) => {
              updateAndPersistDocument(restoredDoc);
              showNotification(`Pomyślnie przywrócono ${restoredDoc.totalRows} pozycji cennika ze wszystkimi cenami i zdjęciami!`);
            }}
            onResetTo35Brands={handlePerformReset}
            onSaveToServer={handleSaveToServer}
            onPushToGitHub={handlePushToGitHub}
            isPushingToGitHub={isPushingGH}
            onPullFromGitHub={handlePullFromGitHub}
            isPullingFromGitHub={isPullingGH}
            onNotification={showNotification}
            onTestStartupLoader={handleTriggerStartupDiagnostic}
          />
        )}
      </main>

      {/* Interactive Restore Confirmation Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white relative">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Przywracanie Bazy Danych</h3>
                <p className="text-xs text-slate-400">Kompletny katalog 35 marek samochodowych</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              Czy na pewno chcesz przywrócić oryginalną bazę <strong className="text-amber-400">35 marek (1:1 z oryginalnego szablonu)</strong>?
              Wszystkie fabryczne ceny, opisy instalacji, kody, grafiki i zdjęcia lamp zostaną natychmiast odtworzone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handlePerformReset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tak, Przywróć Pełną Bazę</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Lock Modal */}
      <PasswordLockModal
        isOpen={isAuthModalOpen}
        targetTab={pendingTab}
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
      />

      {/* Desktop Build EXE Info Modal */}
      <DesktopBuildInfoModal
        isOpen={isDesktopInfoOpen}
        onClose={() => setIsDesktopInfoOpen(false)}
        document={currentDocument}
        onRestoreBackup={(doc) => {
          updateAndPersistDocument(doc);
          showNotification('Baza została zaktualizowana');
        }}
      />

      {/* Import Modal with Append/Add by Default */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDocumentImported={handleDocumentImported}
        existingItemsCount={currentDocument.totalRows}
      />

      {/* Percentage-based Startup & Diagnostic Loading Screen */}
      {isStartupLoading && (
        <AppStartupLoader
          progress={startupProgress}
          stageText={startupStage}
          onBypassToLocal={handleBypassToLocal}
          onRetry={handleRetryStartup}
          onResetStorage={handleResetStorageStartup}
          elapsedSeconds={startupElapsed}
          isTakingLonger={isStartupTakingLonger}
        />
      )}
    </div>
  );
}
