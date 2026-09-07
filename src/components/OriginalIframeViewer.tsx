import React, { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, RefreshCw, ShieldCheck, ImagePlus, Sparkles, AlertCircle, Upload } from 'lucide-react';
import { ImportedDocument } from '../types';

interface OriginalIframeViewerProps {
  document: ImportedDocument;
  zoom: number;
  onBatchAttachImages?: (files: File[]) => void;
  onOpenUpload?: () => void;
}

export const OriginalIframeViewer: React.FC<OriginalIframeViewerProps> = ({
  document,
  zoom,
  onBatchAttachImages,
  onOpenUpload,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let rawHtml = document.rawHtml || '';

    // Inject meta referrer and compatibility styles & scripts
    const injectedMeta = `<meta name="referrer" content="no-referrer">\n<meta http-equiv="X-UA-Compatible" content="IE=edge;">`;
    const fontAndFallbackScript = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', -apple-system, sans-serif !important; }
        img {
          max-width: 100% !important;
          object-fit: contain !important;
          display: inline-block !important;
          border-radius: 4px;
        }
        .img-fallback-wrap {
          width: 140px;
          height: 70px;
          background: #1e293b;
          border: 1px dashed #64748b;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 10px;
          margin: 0 auto;
          gap: 2px;
          cursor: pointer;
        }
        .img-fallback-wrap:hover {
          border-color: #f59e0b;
          color: #f59e0b;
          background: #0f172a;
        }
      </style>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          var imgs = document.querySelectorAll("img");
          imgs.forEach(function(img) {
            img.setAttribute("referrerpolicy", "no-referrer");
            img.setAttribute("crossorigin", "anonymous");
            img.onerror = function() {
              if (this.dataset.triedFallback) return;
              this.dataset.triedFallback = "true";
              this.style.display = "none";
              var parent = this.parentNode;
              if (parent && !parent.querySelector(".img-fallback-wrap")) {
                var placeholder = document.createElement("div");
                placeholder.className = "img-fallback-wrap";
                placeholder.innerHTML = "<span>📷 Brak zdjęcia</span><span style='font-size:8px; opacity:0.7'>Upuść plik tutaj</span>";
                placeholder.title = "Przeciągnij zdjęcie do okna programu";
                parent.appendChild(placeholder);
              }
            };
          });
        });
      </script>
    `;

    if (rawHtml.includes('<head>')) {
      rawHtml = rawHtml.replace('<head>', `<head>\n${injectedMeta}\n${fontAndFallbackScript}`);
    } else if (rawHtml.includes('<html>')) {
      rawHtml = rawHtml.replace('<html>', `<html><head>\n${injectedMeta}\n${fontAndFallbackScript}</head>`);
    } else {
      rawHtml = `<!DOCTYPE html><html><head>${injectedMeta}${fontAndFallbackScript}</head><body>${rawHtml}</body></html>`;
    }

    const blob = new Blob([rawHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [document]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!window.document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onBatchAttachImages) {
      onBatchAttachImages(Array.from(e.dataTransfer.files));
    }
  };

  const rowsWithImages = document.rows.filter((r) => r.imageUrl).length;
  const missingImages = document.rows.length - rowsWithImages;

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[calc(100vh-140px)]'
      }`}
    >
      {/* Hidden file input for batch attaching images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.zip"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && onBatchAttachImages) {
            onBatchAttachImages(Array.from(e.target.files));
          }
        }}
      />

      {/* Sub-toolbar */}
      <div className="bg-slate-950 text-white px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800 text-xs font-medium gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Podgląd Oryginalnego Układu 1:1
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            {document.name} ({document.sizeFormatted})
          </span>
          <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono text-[11px] border border-amber-400/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {rowsWithImages} / {document.rows.length} ze zdjęciami
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick attach photos button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all cursor-pointer shadow-sm text-xs"
            title="Dodaj lub uzupełnij pliki ze zdjęciami lamp"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Dołącz Zdjęcia</span>
          </button>

          <span className="text-slate-400 ml-1">
            Powiększenie: <strong className="text-amber-300">{Math.round(zoom * 100)}%</strong>
          </span>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all cursor-pointer"
            title="Pełny Ekran"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Zamknij' : 'Pełny Ekran'}</span>
          </button>
        </div>
      </div>

      {/* Missing images helper banner if document has missing images */}
      {missingImages > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              W dokumencie wykryto <strong>{missingImages}</strong> pozycji bez przypisanego zdjęcia. Możesz przeciągnąć pliki graficzne bezpośrednio na to okno lub kliknąć przycisk obok.
            </span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-amber-300 hover:text-white underline font-semibold text-xs shrink-0 cursor-pointer ml-4"
          >
            Przeciągnij lub Wybierz Zdjęcia
          </button>
        </div>
      )}

      {/* Frame Container */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex justify-center items-start relative">
        {isDragOver && (
          <div className="absolute inset-0 z-30 bg-amber-500/20 backdrop-blur-sm border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-white p-6">
            <Upload className="w-12 h-12 text-amber-400 animate-bounce mb-2" />
            <p className="font-bold text-lg text-white">Upuść pliki graficzne lub archiwum .ZIP</p>
            <p className="text-xs text-slate-200 mt-1">
              Zdjęcia zostaną natychmiast przypisane do odpowiednich pozycji i wyświetlone w układzie 1:1!
            </p>
          </div>
        )}

        <div
          className="bg-slate-900 shadow-2xl rounded-xl border border-slate-800 overflow-hidden transition-transform duration-200 origin-top"
          style={{
            transform: `scale(${zoom})`,
            width: `${100 / Math.max(0.5, zoom)}%`,
            minHeight: '800px',
          }}
        >
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              title="1:1 Original Render"
              className="w-full h-[1200px] border-none bg-slate-900"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <p>Ładowanie oryginalnego układu pliku 1:1...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
