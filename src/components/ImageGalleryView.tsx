import React, { useState, useMemo, useRef } from 'react';
import { Search, Image as ImageIcon, ExternalLink, X, Car, Filter, Upload, ImagePlus, Sparkles, Trash2, Lightbulb, Tv, Info } from 'lucide-react';
import { ImportedDocument, DocumentRow, ExtractedImage } from '../types';

interface ImageGalleryViewProps {
  document: ImportedDocument;
  onUpdateRowImage?: (rowId: number, imageUrl: string) => void;
  onBatchAttachImages?: (files: File[]) => void;
}

export const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({
  document,
  onUpdateRowImage,
  onBatchAttachImages,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRow, setSelectedRow] = useState<DocumentRow | null>(null);
  const [galleryModalTab, setGalleryModalTab] = useState<'lighting' | 'multimedia'>('lighting');
  const [editingRowForUpload, setEditingRowForUpload] = useState<DocumentRow | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Filter rows with images
  const rowsWithImages = useMemo(() => {
    return document.rows.filter((r) => r.imageUrl);
  }, [document]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    document.rows.forEach((r) => {
      if (r.brand) set.add(r.brand);
    });
    return Array.from(set).sort();
  }, [document]);

  const filtered = useMemo(() => {
    return document.rows.filter((r) => {
      if (selectedBrand !== 'all' && r.brand !== selectedBrand) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        r.brand.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.factoryCode.toLowerCase().includes(q) ||
        r.years.toLowerCase().includes(q)
      );
    });
  }, [document, selectedBrand, search]);

  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  const handleSingleImageUpload = (file: File) => {
    if (!editingRowForUpload || !onUpdateRowImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onUpdateRowImage(editingRowForUpload.id, dataUrl);
      if (selectedRow && selectedRow.id === editingRowForUpload.id) {
        setSelectedRow({ ...selectedRow, imageUrl: dataUrl });
      }
      setEditingRowForUpload(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGalleryUrl = (row: DocumentRow) => {
    if (!galleryUrlInput.trim() || !onUpdateRowImage) return;
    const trimmed = galleryUrlInput.trim();
    onUpdateRowImage(row.id, trimmed);
    setSelectedRow({ ...row, imageUrl: trimmed });
    setGalleryUrlInput('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSingleImageUpload(e.target.files[0]);
          }
        }}
      />

      <input
        ref={batchInputRef}
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

      {/* Header controls */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            Galeria Lamp Samochodowych
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Przeglądaj zdjęcia przypisane do modeli ({rowsWithImages.length} z {document.rows.length} modeli posiada zdjęcie).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtruj markę lub model..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">Wszystkie Marki ({allBrands.length})</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <button
            onClick={() => batchInputRef.current?.click()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Dołącz Zdjęcia</span>
          </button>
        </div>
      </div>

      {/* Grid of Image Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((row) => (
            <div
              key={row.id}
              onClick={() => setSelectedRow(row)}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    {row.brand}
                  </span>
                  <h3 className="font-bold text-sm text-white truncate max-w-[170px]">
                    {row.model}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {row.years}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 flex items-center justify-center min-h-[140px] group-hover:bg-slate-800/40 transition-colors relative">
                {row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt={`${row.brand} ${row.model}`}
                    className="max-h-[110px] max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-1.5 p-4 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-700" />
                    <span className="text-[11px]">Brak zdjęcia</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRowForUpload(row);
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-2.5 py-1 bg-slate-800 hover:bg-amber-400/20 text-amber-300 rounded-lg text-[10px] border border-slate-700 font-semibold"
                    >
                      + Dodaj zdjęcie
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Cena: <strong className="text-sky-400 font-mono">{row.priceClientStatic || row.priceClientDynamic || '-'}</strong>
                </span>
                <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  Szczegóły <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-12 text-center text-slate-500 border border-slate-800">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-base text-slate-300">Brak pozycji do wyświetlenia.</p>
          <p className="text-xs text-slate-500 mt-1">
            Nie znaleziono pozycji odpowiadających wybranym filtrom.
          </p>
        </div>
      )}

      {/* Row Detail Lightbox */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {selectedRow.brand}
                </span>
                <h3 className="font-bold text-lg text-white">
                  {selectedRow.brand} {selectedRow.model}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 pt-2.5 gap-2">
              <button
                type="button"
                onClick={() => setGalleryModalTab('lighting')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  galleryModalTab === 'lighting'
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Oświetlenie</span>
              </button>
              <button
                type="button"
                onClick={() => setGalleryModalTab('multimedia')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  galleryModalTab === 'multimedia'
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Multimedia</span>
              </button>
            </div>

            {galleryModalTab === 'lighting' ? (
              <>
                <div className="p-6 bg-slate-950 flex justify-center items-center min-h-[220px]">
                  {selectedRow.imageUrl ? (
                    <img
                      src={selectedRow.imageUrl}
                      alt={selectedRow.brand}
                      className="max-h-[240px] max-w-full object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-500 text-center flex flex-col items-center gap-2">
                      <ImageIcon className="w-12 h-12 text-slate-700" />
                      <p className="text-xs">Brak zdjęcia dla tego modelu</p>
                    </div>
                  )}
                </div>

                <div className="p-5 bg-slate-900 space-y-3 text-xs border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kod Fabryczny:</span>
                      <strong className="text-white font-mono">{selectedRow.factoryCode || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Lata Produkcji:</span>
                      <strong className="text-white">{selectedRow.years || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Cena Klient (Stat/Dyn):</span>
                      <strong className="text-sky-400 font-mono">
                        {selectedRow.priceClientStatic || '-'} / {selectedRow.priceClientDynamic || '-'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Ilość Lamp:</span>
                      <strong className="text-white">{selectedRow.lampCount || '-'}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setEditingRowForUpload(selectedRow);
                          fileInputRef.current?.click();
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{selectedRow.imageUrl ? 'Zmień zdjęcie z dysku' : 'Wgraj zdjęcie z dysku'}</span>
                      </button>

                      {selectedRow.imageUrl && onUpdateRowImage && (
                        <button
                          onClick={() => {
                            onUpdateRowImage(selectedRow.id, '');
                            setSelectedRow({ ...selectedRow, imageUrl: '' });
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Usuń zdjęcie</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      <input
                        type="text"
                        value={galleryUrlInput}
                        onChange={(e) => setGalleryUrlInput(e.target.value)}
                        placeholder="Lub wklej bezpośredni link URL do zdjęcia..."
                        className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveGalleryUrl(selectedRow)}
                        disabled={!galleryUrlInput.trim()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer shrink-0"
                      >
                        Zapisz URL
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-slate-950">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center mb-3">
                  <Tv className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1.5">
                  Brak informacji
                </h4>
                <p className="text-slate-400 text-xs max-w-sm mb-4">
                  Dla wybranego modelu <strong className="text-white">{selectedRow.brand} {selectedRow.model}</strong> brak danych w zakładce Multimedia.
                </p>
                <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kategoria Multimedia</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
