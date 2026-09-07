import React, { useMemo } from 'react';
import { BarChart3, Car, Zap, CheckCircle2, DollarSign, Layers } from 'lucide-react';
import { ImportedDocument } from '../types';

interface AnalyticsViewProps {
  document: ImportedDocument;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ document }) => {
  const brandStats = useMemo(() => {
    const map = new Map<string, number>();
    document.rows.forEach((r) => {
      if (r.brand) {
        map.set(r.brand, (map.get(r.brand) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }, [document]);

  const signalStats = useMemo(() => {
    let dynamicCount = 0;
    let staticOnlyCount = 0;
    let bulbCount = 0;

    document.rows.forEach((r) => {
      if (r.dynamicSignal && r.dynamicSignal !== '-') {
        dynamicCount++;
      } else if (r.staticSignal && r.staticSignal.toLowerCase().includes('żarówka')) {
        bulbCount++;
      } else if (r.staticSignal && r.staticSignal !== '-') {
        staticOnlyCount++;
      }
    });

    return { dynamicCount, staticOnlyCount, bulbCount };
  }, [document]);

  const installationStats = useMemo(() => {
    let installRequired = 0;
    let codingRequired = 0;

    document.rows.forEach((r) => {
      if (r.installation.toLowerCase().includes('tak')) installRequired++;
      if (r.coding.toLowerCase().includes('tak')) codingRequired++;
    });

    return { installRequired, codingRequired };
  }, [document]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Analityka i Zestawienie Dokumentu</h2>
            <p className="text-xs text-slate-400">
              Przegląd {document.totalRows} pozycji w dokumentacji cennikowej
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1">Wszystkie Pozycje</span>
            <span className="text-2xl font-bold text-white">{document.totalRows}</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1">Liczba MarekW Pliku</span>
            <span className="text-2xl font-bold text-amber-400">{document.brandsCount}</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1">Wyposażone w Kierunkowskaz Dyn.</span>
            <span className="text-2xl font-bold text-indigo-400">{signalStats.dynamicCount}</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1">Wymagające Kodowania</span>
            <span className="text-2xl font-bold text-emerald-400">{installationStats.codingRequired}</span>
          </div>
        </div>
      </div>

      {/* Brands Breakdown Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-500" />
          Rozkład Liczby Modeli według MarekW ({brandStats.length} marek)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-2">
          {brandStats.map(({ brand, count }) => {
            const percentage = Math.round((count / document.totalRows) * 100);
            return (
              <div
                key={brand}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-400 transition-colors"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{brand}</span>
                  <span className="text-xs text-slate-500">{percentage}% całości</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-400/20 text-amber-900 font-bold text-xs rounded-lg border border-amber-400/30">
                  {count} {count === 1 ? 'model' : 'modeli'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
