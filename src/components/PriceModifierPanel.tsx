import React, { useState, useMemo, useEffect } from 'react';
import {
  Percent,
  RotateCcw,
  Check,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  BadgePercent,
  UserCheck,
  Building2,
  TrendingDown
} from 'lucide-react';
import { DocumentRow } from '../types';

export interface PriceModifierPanelProps {
  rows: DocumentRow[];
  onApplyPrices: (updatedRows: DocumentRow[]) => void;
}

export type TargetClientColumnOption = 'both' | 'static' | 'dynamic';
export type TargetBrokerColumnOption = 'both' | 'static' | 'dynamic';
export type BaseSourceOption = 'client_initial' | 'broker_base';
export type RoundingOption = 'smart_adaptive' | '50' | '100' | 'none';
export type RoundingDirection = 'nearest' | 'ceil' | 'floor';

export function parseNumericPrice(priceStr: string | undefined): number | null {
  if (!priceStr || priceStr === '-' || priceStr.trim() === '') return null;
  const clean = priceStr
    .replace(/[\s\u00A0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  if (!clean) return null;
  const num = parseFloat(clean);
  return isNaN(num) || num <= 0 ? null : num;
}

export function formatCalculatedPrice(oldStr: string, newNumber: number): string {
  const hasZl = /zł|pln/i.test(oldStr);
  const rounded = Math.round(newNumber);
  const formatted = rounded.toLocaleString('pl-PL').replace(/\u00A0/g, ' ');
  return hasZl ? `${formatted} zł` : `${formatted}`;
}

export function applyRounding(
  val: number,
  rounding: RoundingOption = '50',
  direction: RoundingDirection = 'ceil'
): number {
  if (rounding === 'none') {
    return Math.round(val);
  }

  // Pre-normalize to 2 decimal places to prevent floating-point inaccuracy issues (e.g. 1050.000000000002)
  const normalized = Math.round(val * 100) / 100;
  if (normalized <= 0) return 0;

  // Exact rule for rounding up to 50 zł / 100 zł (1-49 zł -> 50 zł, 51-99 zł -> 100 zł):
  if ((rounding === '50' || rounding === 'smart_adaptive') && direction === 'ceil') {
    const intVal = Math.ceil(normalized);
    const rem = intVal % 100;
    if (rem === 0) return intVal;
    if (rem > 0 && rem <= 50) return intVal - rem + 50;
    return intVal - rem + 100;
  }

  let step = 50;
  if (rounding === 'smart_adaptive') {
    step = 50;
  } else if (rounding === '100') {
    step = 100;
  } else {
    step = 50;
  }

  if (direction === 'ceil') {
    const intVal = Math.ceil(normalized);
    const rem = intVal % step;
    if (rem === 0) return intVal;
    return intVal - rem + step;
  }
  if (direction === 'floor') {
    const intVal = Math.floor(normalized);
    const rem = intVal % step;
    return intVal - rem;
  }
  return Math.round(normalized / step) * step;
}

export const PriceModifierPanel: React.FC<PriceModifierPanelProps> = ({
  rows,
  onApplyPrices,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'broker'>('client');

  // ==========================================
  // 🟡 1. STAN MODYFIKATORA CEN KLIENTA (DETAL)
  // ==========================================
  const [clientTargetColumn, setClientTargetColumn] = useState<TargetClientColumnOption>('both');
  const [clientBaseSource, setClientBaseSource] = useState<BaseSourceOption>('client_initial');
  const [clientMode, setClientMode] = useState<'ranges' | 'global'>('ranges');
  const [clientGlobalPercent, setClientGlobalPercent] = useState<number>(0);
  const [clientRange1Percent, setClientRange1Percent] = useState<number>(0);
  const [clientRange2Percent, setClientRange2Percent] = useState<number>(0);
  const [clientRange3Percent, setClientRange3Percent] = useState<number>(0);
  const [clientThreshold1, setClientThreshold1] = useState<number>(1000);
  const [clientThreshold2, setClientThreshold2] = useState<number>(2000);
  const [clientRounding, setClientRounding] = useState<RoundingOption>('50');
  const [clientRoundingDirection, setClientRoundingDirection] = useState<RoundingDirection>('ceil');
  const [clientRoundExisting, setClientRoundExisting] = useState<boolean>(false);
  const [clientTestPrice, setClientTestPrice] = useState<string>('930');

  // ==========================================
  // 🔵 2. STAN MODYFIKATORA CEN BROKERA / POŚREDNIKA (RABAT UJEMNY)
  // ==========================================
  const [brokerTargetColumn, setBrokerTargetColumn] = useState<TargetBrokerColumnOption>('both');
  const [brokerMode, setBrokerMode] = useState<'ranges' | 'global'>('global');
  const [brokerGlobalDiscount, setBrokerGlobalDiscount] = useState<number>(-10);
  const [brokerRange1Discount, setBrokerRange1Discount] = useState<number>(-10);
  const [brokerRange2Discount, setBrokerRange2Discount] = useState<number>(-15);
  const [brokerRange3Discount, setBrokerRange3Discount] = useState<number>(-20);
  const [brokerThreshold1, setBrokerThreshold1] = useState<number>(1000);
  const [brokerThreshold2, setBrokerThreshold2] = useState<number>(2000);
  const [brokerRounding, setBrokerRounding] = useState<RoundingOption>('none');
  const [brokerRoundingDirection, setBrokerRoundingDirection] = useState<RoundingDirection>('ceil');
  const [brokerRoundExisting, setBrokerRoundExisting] = useState<boolean>(false);
  const [brokerTestPrice, setBrokerTestPrice] = useState<string>('2490');

  // Historia i powiadomienia
  const [previousRowsHistory, setPreviousRowsHistory] = useState<DocumentRow[] | null>(null);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  // Sync settings with localStorage so backup exports everything accurately
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carlamps_price_modifier_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clientGlobalPercent !== undefined) setClientGlobalPercent(parsed.clientGlobalPercent);
        if (parsed.clientRange1Percent !== undefined) setClientRange1Percent(parsed.clientRange1Percent);
        if (parsed.clientRange2Percent !== undefined) setClientRange2Percent(parsed.clientRange2Percent);
        if (parsed.clientRange3Percent !== undefined) setClientRange3Percent(parsed.clientRange3Percent);
        if (parsed.clientThreshold1 !== undefined) setClientThreshold1(parsed.clientThreshold1);
        if (parsed.clientThreshold2 !== undefined) setClientThreshold2(parsed.clientThreshold2);
        if (parsed.clientRounding !== undefined) setClientRounding(parsed.clientRounding);
        if (parsed.clientRoundingDirection !== undefined) setClientRoundingDirection(parsed.clientRoundingDirection);
        if (parsed.clientMode !== undefined) setClientMode(parsed.clientMode);
        if (parsed.clientBaseSource !== undefined) setClientBaseSource(parsed.clientBaseSource);

        if (parsed.brokerGlobalDiscount !== undefined) setBrokerGlobalDiscount(parsed.brokerGlobalDiscount);
        if (parsed.brokerRange1Discount !== undefined) setBrokerRange1Discount(parsed.brokerRange1Discount);
        if (parsed.brokerRange2Discount !== undefined) setBrokerRange2Discount(parsed.brokerRange2Discount);
        if (parsed.brokerRange3Discount !== undefined) setBrokerRange3Discount(parsed.brokerRange3Discount);
        if (parsed.brokerThreshold1 !== undefined) setBrokerThreshold1(parsed.brokerThreshold1);
        if (parsed.brokerThreshold2 !== undefined) setBrokerThreshold2(parsed.brokerThreshold2);
        if (parsed.brokerRounding !== undefined) setBrokerRounding(parsed.brokerRounding);
        if (parsed.brokerRoundingDirection !== undefined) setBrokerRoundingDirection(parsed.brokerRoundingDirection);
        if (parsed.brokerMode !== undefined) setBrokerMode(parsed.brokerMode);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const settingsPayload = {
        clientGlobalPercent,
        clientRange1Percent,
        clientRange2Percent,
        clientRange3Percent,
        clientThreshold1,
        clientThreshold2,
        clientRounding,
        clientRoundingDirection,
        clientMode,
        clientBaseSource,
        clientTargetColumn,
        brokerGlobalDiscount,
        brokerRange1Discount,
        brokerRange2Discount,
        brokerRange3Discount,
        brokerThreshold1,
        brokerThreshold2,
        brokerRounding,
        brokerRoundingDirection,
        brokerMode,
        brokerTargetColumn,
      };
      localStorage.setItem('carlamps_price_modifier_settings', JSON.stringify(settingsPayload));
    } catch (_) {}
  }, [
    clientGlobalPercent,
    clientRange1Percent,
    clientRange2Percent,
    clientRange3Percent,
    clientThreshold1,
    clientThreshold2,
    clientRounding,
    clientRoundingDirection,
    clientMode,
    clientBaseSource,
    clientTargetColumn,
    brokerGlobalDiscount,
    brokerRange1Discount,
    brokerRange2Discount,
    brokerRange3Discount,
    brokerThreshold1,
    brokerThreshold2,
    brokerRounding,
    brokerRoundingDirection,
    brokerMode,
    brokerTargetColumn,
  ]);

  // ------------------------------------------
  // POMOCNICZE POBIERANIE BAZY
  // ------------------------------------------
  const getClientRowBasePrice = (r: DocumentRow, type: 'static' | 'dynamic'): string => {
    if (clientBaseSource === 'broker_base') {
      return type === 'static'
        ? (r.basePriceBrokerStatic || r.priceBrokerStatic)
        : (r.basePriceBrokerDynamic || r.priceBrokerDynamic);
    }
    return type === 'static'
      ? (r.basePriceClientStatic || r.priceClientStatic)
      : (r.basePriceClientDynamic || r.priceClientDynamic);
  };

  const getBrokerRowBasePrice = (r: DocumentRow, type: 'static' | 'dynamic'): string => {
    return type === 'static'
      ? (r.basePriceBrokerStatic || r.priceBrokerStatic)
      : (r.basePriceBrokerDynamic || r.priceBrokerDynamic);
  };

  // ------------------------------------------
  // KALKULACJA CENY KLIENTA
  // ------------------------------------------
  const calculateNewClientPrice = (
    basePriceStr: string | undefined,
    currentPriceStr: string
  ) => {
    const effectiveBaseStr = (basePriceStr && basePriceStr.trim() !== '' && basePriceStr !== '-')
      ? basePriceStr
      : currentPriceStr;

    const baseNum = parseNumericPrice(effectiveBaseStr);
    const currentNum = parseNumericPrice(currentPriceStr) || 0;

    if (baseNum === null) {
      return {
        newPriceStr: currentPriceStr,
        baseNum: 0,
        currentNum,
        newNum: currentNum,
        diffFromBase: 0,
        diffFromCurrent: 0,
        changed: false,
        appliedPercent: 0,
      };
    }

    let percent = 0;
    if (clientMode === 'global') {
      percent = clientGlobalPercent;
    } else {
      if (baseNum <= clientThreshold1) percent = clientRange1Percent;
      else if (baseNum <= clientThreshold2) percent = clientRange2Percent;
      else percent = clientRange3Percent;
    }

    let targetCalculated = baseNum;
    if (percent !== 0) {
      targetCalculated = baseNum * (1 + percent / 100);
    } else if (!clientRoundExisting && clientRounding === 'none' && clientBaseSource === 'client_initial') {
      const formattedBase = formatCalculatedPrice(effectiveBaseStr, baseNum);
      return {
        newPriceStr: formattedBase,
        baseNum,
        currentNum,
        newNum: baseNum,
        diffFromBase: 0,
        diffFromCurrent: baseNum - currentNum,
        changed: formattedBase !== currentPriceStr,
        appliedPercent: 0,
      };
    }

    const rounded = applyRounding(targetCalculated, clientRounding, clientRoundingDirection);
    const newPriceStr = formatCalculatedPrice(effectiveBaseStr, rounded);
    return {
      newPriceStr,
      baseNum,
      currentNum,
      newNum: rounded,
      diffFromBase: rounded - baseNum,
      diffFromCurrent: rounded - currentNum,
      changed: newPriceStr !== currentPriceStr,
      appliedPercent: percent,
    };
  };

  // ------------------------------------------
  // KALKULACJA CENY BROKERA (RABAT UJEMNY)
  // ------------------------------------------
  const calculateNewBrokerPrice = (
    basePriceStr: string | undefined,
    currentPriceStr: string
  ) => {
    const effectiveBaseStr = (basePriceStr && basePriceStr.trim() !== '' && basePriceStr !== '-')
      ? basePriceStr
      : currentPriceStr;

    const baseNum = parseNumericPrice(effectiveBaseStr);
    const currentNum = parseNumericPrice(currentPriceStr) || 0;

    if (baseNum === null) {
      return {
        newPriceStr: currentPriceStr,
        baseNum: 0,
        currentNum,
        newNum: currentNum,
        diffFromBase: 0,
        diffFromCurrent: 0,
        changed: false,
        appliedDiscount: 0,
      };
    }

    let discountPercent = 0;
    if (brokerMode === 'global') {
      discountPercent = brokerGlobalDiscount;
    } else {
      if (baseNum <= brokerThreshold1) discountPercent = brokerRange1Discount;
      else if (baseNum <= brokerThreshold2) discountPercent = brokerRange2Discount;
      else discountPercent = brokerRange3Discount;
    }

    let targetCalculated = baseNum;
    if (discountPercent !== 0) {
      // Np. 2490 zł z rabatem -10% => 2490 * (1 - 0.10)
      targetCalculated = baseNum * (1 + discountPercent / 100);
    } else if (!brokerRoundExisting && brokerRounding === 'none') {
      const formattedBase = formatCalculatedPrice(effectiveBaseStr, baseNum);
      return {
        newPriceStr: formattedBase,
        baseNum,
        currentNum,
        newNum: baseNum,
        diffFromBase: 0,
        diffFromCurrent: baseNum - currentNum,
        changed: formattedBase !== currentPriceStr,
        appliedDiscount: 0,
      };
    }

    const rounded = applyRounding(targetCalculated, brokerRounding, brokerRoundingDirection);
    const newPriceStr = formatCalculatedPrice(effectiveBaseStr, rounded);
    return {
      newPriceStr,
      baseNum,
      currentNum,
      newNum: rounded,
      diffFromBase: rounded - baseNum,
      diffFromCurrent: rounded - currentNum,
      changed: newPriceStr !== currentPriceStr,
      appliedDiscount: discountPercent,
    };
  };

  // ------------------------------------------
  // PODGLĄD ZMIAN DLA CEN KLIENTA
  // ------------------------------------------
  const { clientPreviewRows, clientChangesCount } = useMemo(() => {
    let count = 0;
    const modified = rows.map((r) => {
      const baseStatic = getClientRowBasePrice(r, 'static');
      const baseDynamic = getClientRowBasePrice(r, 'dynamic');

      let newPriceStatic = r.priceClientStatic;
      let newPriceDynamic = r.priceClientDynamic;
      let hasChange = false;

      if (clientTargetColumn === 'both' || clientTargetColumn === 'static') {
        const res = calculateNewClientPrice(baseStatic, r.priceClientStatic);
        if (res.changed) {
          newPriceStatic = res.newPriceStr;
          hasChange = true;
        }
      }

      if (clientTargetColumn === 'both' || clientTargetColumn === 'dynamic') {
        const res = calculateNewClientPrice(baseDynamic, r.priceClientDynamic);
        if (res.changed) {
          newPriceDynamic = res.newPriceStr;
          hasChange = true;
        }
      }

      if (hasChange) count++;

      return {
        ...r,
        basePriceClientStatic: r.basePriceClientStatic || r.priceClientStatic,
        basePriceClientDynamic: r.basePriceClientDynamic || r.priceClientDynamic,
        basePriceBrokerStatic: r.basePriceBrokerStatic || r.priceBrokerStatic,
        basePriceBrokerDynamic: r.basePriceBrokerDynamic || r.priceBrokerDynamic,
        priceClientStatic: newPriceStatic,
        priceClientDynamic: newPriceDynamic,
      };
    });
    return { clientPreviewRows: modified, clientChangesCount: count };
  }, [
    rows,
    clientTargetColumn,
    clientBaseSource,
    clientMode,
    clientGlobalPercent,
    clientRange1Percent,
    clientRange2Percent,
    clientRange3Percent,
    clientThreshold1,
    clientThreshold2,
    clientRounding,
    clientRoundingDirection,
    clientRoundExisting,
  ]);

  // ------------------------------------------
  // PODGLĄD ZMIAN DLA CEN BROKERA
  // ------------------------------------------
  const { brokerPreviewRows, brokerChangesCount } = useMemo(() => {
    let count = 0;
    const modified = rows.map((r) => {
      const baseStatic = getBrokerRowBasePrice(r, 'static');
      const baseDynamic = getBrokerRowBasePrice(r, 'dynamic');

      let newPriceStatic = r.priceBrokerStatic;
      let newPriceDynamic = r.priceBrokerDynamic;
      let hasChange = false;

      if (brokerTargetColumn === 'both' || brokerTargetColumn === 'static') {
        const res = calculateNewBrokerPrice(baseStatic, r.priceBrokerStatic);
        if (res.changed) {
          newPriceStatic = res.newPriceStr;
          hasChange = true;
        }
      }

      if (brokerTargetColumn === 'both' || brokerTargetColumn === 'dynamic') {
        const res = calculateNewBrokerPrice(baseDynamic, r.priceBrokerDynamic);
        if (res.changed) {
          newPriceDynamic = res.newPriceStr;
          hasChange = true;
        }
      }

      if (hasChange) count++;

      return {
        ...r,
        basePriceClientStatic: r.basePriceClientStatic || r.priceClientStatic,
        basePriceClientDynamic: r.basePriceClientDynamic || r.priceClientDynamic,
        basePriceBrokerStatic: r.basePriceBrokerStatic || r.priceBrokerStatic,
        basePriceBrokerDynamic: r.basePriceBrokerDynamic || r.priceBrokerDynamic,
        priceBrokerStatic: newPriceStatic,
        priceBrokerDynamic: newPriceDynamic,
      };
    });
    return { brokerPreviewRows: modified, brokerChangesCount: count };
  }, [
    rows,
    brokerTargetColumn,
    brokerMode,
    brokerGlobalDiscount,
    brokerRange1Discount,
    brokerRange2Discount,
    brokerRange3Discount,
    brokerThreshold1,
    brokerThreshold2,
    brokerRounding,
    brokerRoundingDirection,
    brokerRoundExisting,
  ]);

  // ------------------------------------------
  // STATYSTYKI ZAKRESÓW
  // ------------------------------------------
  const clientRangeStats = useMemo(() => {
    let c1 = 0, c2 = 0, c3 = 0;
    rows.forEach((r) => {
      const pStat = parseNumericPrice(getClientRowBasePrice(r, 'static'));
      const pDyn = parseNumericPrice(getClientRowBasePrice(r, 'dynamic'));
      const check = (p: number | null) => {
        if (p === null) return;
        if (p <= clientThreshold1) c1++;
        else if (p <= clientThreshold2) c2++;
        else c3++;
      };
      if (clientTargetColumn === 'both') {
        check(pStat); check(pDyn);
      } else if (clientTargetColumn === 'static') {
        check(pStat);
      } else {
        check(pDyn);
      }
    });
    return { c1, c2, c3 };
  }, [rows, clientTargetColumn, clientBaseSource, clientThreshold1, clientThreshold2]);

  const brokerRangeStats = useMemo(() => {
    let c1 = 0, c2 = 0, c3 = 0;
    rows.forEach((r) => {
      const pStat = parseNumericPrice(getBrokerRowBasePrice(r, 'static'));
      const pDyn = parseNumericPrice(getBrokerRowBasePrice(r, 'dynamic'));
      const check = (p: number | null) => {
        if (p === null) return;
        if (p <= brokerThreshold1) c1++;
        else if (p <= brokerThreshold2) c2++;
        else c3++;
      };
      if (brokerTargetColumn === 'both') {
        check(pStat); check(pDyn);
      } else if (brokerTargetColumn === 'static') {
        check(pStat);
      } else {
        check(pDyn);
      }
    });
    return { c1, c2, c3 };
  }, [rows, brokerTargetColumn, brokerThreshold1, brokerThreshold2]);

  // ------------------------------------------
  // SYMULATORY TESTOWE
  // ------------------------------------------
  const clientTestCalc = useMemo(() => {
    const num = parseNumericPrice(clientTestPrice);
    if (num === null) return null;
    let percent = 0;
    if (clientMode === 'global') percent = clientGlobalPercent;
    else {
      if (num <= clientThreshold1) percent = clientRange1Percent;
      else if (num <= clientThreshold2) percent = clientRange2Percent;
      else percent = clientRange3Percent;
    }
    const raw = num * (1 + percent / 100);
    const rounded = applyRounding(raw, clientRounding, clientRoundingDirection);
    const step = clientRounding === '100' ? 100 : clientRounding === 'none' ? 1 : 50;
    return { num, percent, raw, rounded, step, diff: rounded - num };
  }, [clientTestPrice, clientMode, clientGlobalPercent, clientRange1Percent, clientRange2Percent, clientRange3Percent, clientThreshold1, clientThreshold2, clientRounding, clientRoundingDirection]);

  const brokerTestCalc = useMemo(() => {
    const num = parseNumericPrice(brokerTestPrice);
    if (num === null) return null;
    let discount = 0;
    if (brokerMode === 'global') discount = brokerGlobalDiscount;
    else {
      if (num <= brokerThreshold1) discount = brokerRange1Discount;
      else if (num <= brokerThreshold2) discount = brokerRange2Discount;
      else discount = brokerRange3Discount;
    }
    const raw = num * (1 + discount / 100);
    const rounded = applyRounding(raw, brokerRounding, brokerRoundingDirection);
    const step = brokerRounding === '100' ? 100 : brokerRounding === 'none' ? 1 : 50;
    return { num, discount, raw, rounded, step, diff: rounded - num };
  }, [brokerTestPrice, brokerMode, brokerGlobalDiscount, brokerRange1Discount, brokerRange2Discount, brokerRange3Discount, brokerThreshold1, brokerThreshold2, brokerRounding, brokerRoundingDirection]);

  // ------------------------------------------
  // AKCJE ZAPISU / PRZYWRACANIA
  // ------------------------------------------
  const handleApplyClientPrices = () => {
    if (clientChangesCount === 0) {
      setAppliedSuccessMessage('Brak zmian w Cenach Klienta do zastosowania.');
      setTimeout(() => setAppliedSuccessMessage(null), 3000);
      return;
    }
    setPreviousRowsHistory(rows);
    onApplyPrices(clientPreviewRows);
    setAppliedSuccessMessage(`Zastosowano zmiany dla ${clientChangesCount} pozycji w Cenach Klienta!`);
    setTimeout(() => setAppliedSuccessMessage(null), 4000);
  };

  const handleApplyBrokerPrices = () => {
    if (brokerChangesCount === 0) {
      setAppliedSuccessMessage('Brak zmian w Cenach Pośrednika/Brokera do zastosowania.');
      setTimeout(() => setAppliedSuccessMessage(null), 3000);
      return;
    }
    setPreviousRowsHistory(rows);
    onApplyPrices(brokerPreviewRows);
    setAppliedSuccessMessage(`Zastosowano rabat dla ${brokerChangesCount} pozycji w Cenach Brokera!`);
    setTimeout(() => setAppliedSuccessMessage(null), 4000);
  };

  const handleUndo = () => {
    if (!previousRowsHistory) return;
    onApplyPrices(previousRowsHistory);
    setPreviousRowsHistory(null);
  };

  const handleRestoreBaseClientPrices = () => {
    const restored = rows.map((r) => ({
      ...r,
      priceClientStatic: r.basePriceClientStatic || r.priceClientStatic,
      priceClientDynamic: r.basePriceClientDynamic || r.priceClientDynamic,
    }));
    setPreviousRowsHistory(rows);
    onApplyPrices(restored);
    setClientGlobalPercent(0);
    setClientRange1Percent(0);
    setClientRange2Percent(0);
    setClientRange3Percent(0);
    setAppliedSuccessMessage('Przywrócono oryginalne Ceny Klienta z importu.');
    setTimeout(() => setAppliedSuccessMessage(null), 4000);
  };

  const handleRestoreBaseBrokerPrices = () => {
    const restored = rows.map((r) => ({
      ...r,
      priceBrokerStatic: r.basePriceBrokerStatic || r.priceBrokerStatic,
      priceBrokerDynamic: r.basePriceBrokerDynamic || r.priceBrokerDynamic,
    }));
    setPreviousRowsHistory(rows);
    onApplyPrices(restored);
    setBrokerGlobalDiscount(0);
    setBrokerRange1Discount(0);
    setBrokerRange2Discount(0);
    setBrokerRange3Discount(0);
    setAppliedSuccessMessage('Przywrócono oryginalne Ceny Brokera/Pośrednika z importu.');
    setTimeout(() => setAppliedSuccessMessage(null), 4000);
  };

  const clientQuickPercentages = [-15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 50, 100];
  const brokerQuickDiscounts = [0, -5, -10, -15, -20, -25, -30, -35, -40, -50];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-4 transition-all">
      {/* Header bar / Toggle */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none border-b border-slate-800/80 bg-slate-900/90">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 cursor-pointer group flex-1"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Centrum Modyfikacji Cen i Rabatów
              </h3>
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                Klient + Broker
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Niezależne przeliczanie cen detalicznych (Klient) oraz rabatów ujemnych hurtowych (Broker/Pośrednik).
            </p>
          </div>
        </div>

        {/* Tab Switcher & Toggle Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('client');
                setIsOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'client'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ceny Klienta</span>
              {clientChangesCount > 0 && (
                <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {clientChangesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('broker');
                setIsOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'broker'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ceny Brokera (Rabat ujemny)</span>
              {brokerChangesCount > 0 && (
                <span className="bg-blue-700 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {brokerChangesCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Panel Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 bg-slate-950/70 space-y-6 animate-in fade-in duration-200">
          {/* ========================================================================= */}
          {/* 🟡 WIDOK 1: MODYFIKATOR CEN KLIENTA (DETAL) */}
          {/* ========================================================================= */}
          {activeTab === 'client' && (
            <div className="space-y-6">
              {/* Informative Business Rules Callout */}
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">
                    Zasada modyfikacji Cen Klienta:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[11px]">
                    <li>
                      <span className="font-semibold text-white">Naliczanie od ceny bazowej:</span> Procenty są zawsze liczone od pierwotnej wartości z importu (brak kumulacji procentów).
                    </li>
                    <li>
                      <span className="font-semibold text-white">Zasada zaokrąglania w górę (do 50 zł):</span> Końcówka 1–49 zł ➔ <span className="font-bold text-amber-300">50 zł</span> (np. kwota 930 zł ➔ <span className="font-bold text-emerald-400">950 zł</span>, 3 130 zł ➔ <span className="font-bold text-emerald-400">3 150 zł</span>).
                    </li>
                    <li>
                      <span className="font-semibold text-white">Dopełnienie do 100 zł:</span> Końcówka 51–99 zł ➔ pełna kolejna setka <span className="font-bold text-amber-300">100 zł</span> (np. 1 070 zł ➔ <span className="font-bold text-emerald-400">1 100 zł</span>, 3 170 zł ➔ <span className="font-bold text-emerald-400">3 200 zł</span>).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Configuration Controls: Base Source & Target Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Źródło Ceny Bazowej */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Baza wyliczeń (punkt odniesienia):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientBaseSource('client_initial')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer flex flex-col gap-0.5 ${
                        clientBaseSource === 'client_initial'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Cena Klient z importu</span>
                      <span className={`text-[10px] font-normal ${clientBaseSource === 'client_initial' ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                        Korekta cen detalicznych (np. 5 950 zł, 7 500 zł)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientBaseSource('broker_base')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer flex flex-col gap-0.5 ${
                        clientBaseSource === 'broker_base'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Cena Pośrednik (Hurt/Koszt)</span>
                      <span className={`text-[10px] font-normal ${clientBaseSource === 'broker_base' ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                        Narzut od ceny bazowej (np. 2 490 zł, 3 090 zł)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Wybór docelowych kolumn */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Kolumny docelowe (Cena Klient):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setClientTargetColumn('both')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                        clientTargetColumn === 'both'
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Obie: Statyczna + Dynamiczna
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientTargetColumn('static')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                        clientTargetColumn === 'static'
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Tylko Statyczna
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientTargetColumn('dynamic')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                        clientTargetColumn === 'dynamic'
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Tylko Dynamiczna
                    </button>
                  </div>
                </div>
              </div>

              {/* Rounding Strategy and Direction Configuration for Client */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Rounding Strategy */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">Krok zaokrąglania (Reguła kwot):</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                      {clientRounding === '50' ? '1–49zł ➔ 50zł | 51–99zł ➔ 100zł' : clientRounding === '100' ? 'Do pełnych 100 zł' : clientRounding === 'smart_adaptive' ? 'Adaptacyjnie (50/100 zł)' : 'Dokładna kwota'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setClientRounding('50')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRounding === '50'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do 50 zł</span>
                      <span className={`text-[9px] font-normal ${clientRounding === '50' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        1-49 ➔ 50, 51-99 ➔ 100
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientRounding('smart_adaptive')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRounding === 'smart_adaptive'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Adaptacyjne</span>
                      <span className={`text-[9px] font-normal ${clientRounding === 'smart_adaptive' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        ≤1tys: 50zł, &gt;1tys: 100zł
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientRounding('100')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRounding === '100'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do 100 zł</span>
                      <span className={`text-[9px] font-normal ${clientRounding === '100' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        Pełne setki
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientRounding('none')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRounding === 'none'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Bez zaokr.</span>
                      <span className={`text-[9px] font-normal ${clientRounding === 'none' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        Dokładny wynik
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rounding Direction */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">Kierunek zaokrąglania:</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                      {clientRoundingDirection === 'ceil' ? 'W górę (Zawsze w górę)' : clientRoundingDirection === 'floor' ? 'W dół (Obniżanie)' : 'Do najbliższej'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientRoundingDirection('ceil')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRoundingDirection === 'ceil'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>W górę (sufit)</span>
                      <span className={`text-[9px] font-normal ${clientRoundingDirection === 'ceil' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        1-49 ➔ 50, 51-99 ➔ 100
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientRoundingDirection('nearest')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRoundingDirection === 'nearest'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do najbliższej</span>
                      <span className={`text-[9px] font-normal ${clientRoundingDirection === 'nearest' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        Matematyczne
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientRoundingDirection('floor')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        clientRoundingDirection === 'floor'
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>W dół (podłoga)</span>
                      <span className={`text-[9px] font-normal ${clientRoundingDirection === 'floor' ? 'text-slate-850 font-bold' : 'text-slate-400'}`}>
                        Obcinanie w dół
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode Switch: Ranges vs Global % */}
              <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Sposób definiowania procentów:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClientMode('ranges')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      clientMode === 'ranges'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    3 Zakresy Progowe
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode('global')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      clientMode === 'global'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Jednolity Procent Globalny
                  </button>
                </div>
              </div>

              {/* Global Mode */}
              {clientMode === 'global' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">Jednolita zmiana dla wszystkich pozycji</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Wszystkie ceny bazowe zostaną powiększone/pomniejszone o ten sam procent.
                      </p>
                    </div>
                    <span className={`text-lg font-mono font-extrabold ${clientGlobalPercent > 0 ? 'text-emerald-400' : clientGlobalPercent < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {clientGlobalPercent > 0 ? `+${clientGlobalPercent}%` : `${clientGlobalPercent}%`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-48">
                      <input
                        type="number"
                        value={clientGlobalPercent === 0 ? '' : clientGlobalPercent}
                        onChange={(e) => setClientGlobalPercent(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="1"
                        className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                        %
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {clientQuickPercentages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setClientGlobalPercent(p)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            clientGlobalPercent === p
                              ? 'bg-amber-400 text-slate-950 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {p > 0 ? `+${p}%` : `${p}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Ranges Mode */}
              {clientMode === 'ranges' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400">
                    <span className="font-semibold text-slate-300">Granice progów kwotowych:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span>Próg 1:</span>
                        <input
                          type="number"
                          value={clientThreshold1}
                          onChange={(e) => setClientThreshold1(Math.max(100, parseFloat(e.target.value) || 1000))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                        />
                        <span>zł</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Próg 2:</span>
                        <input
                          type="number"
                          value={clientThreshold2}
                          onChange={(e) => setClientThreshold2(Math.max(clientThreshold1 + 100, parseFloat(e.target.value) || 2000))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                        />
                        <span>zł</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Zakres 1 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                            Zakres 1
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            0 – {clientThreshold1.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-amber-300/80">Zaokrąglanie do 50 zł</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {clientRangeStats.c1} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={clientRange1Percent === 0 ? '' : clientRange1Percent}
                            onChange={(e) => setClientRange1Percent(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {clientQuickPercentages.slice(0, 8).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setClientRange1Percent(p)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                clientRange1Percent === p ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {p > 0 ? `+${p}%` : `${p}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Zakres 2 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                            Zakres 2
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            {clientThreshold1.toLocaleString('pl-PL')} – {clientThreshold2.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-amber-300/80">Zaokrąglanie do 50 zł (1-49 ➔ 50, 51-99 ➔ 100)</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {clientRangeStats.c2} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={clientRange2Percent === 0 ? '' : clientRange2Percent}
                            onChange={(e) => setClientRange2Percent(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {clientQuickPercentages.slice(0, 8).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setClientRange2Percent(p)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                clientRange2Percent === p ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {p > 0 ? `+${p}%` : `${p}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Zakres 3 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                            Zakres 3
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            Powyżej {clientThreshold2.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-amber-300/80">Zaokrąglanie do 50 zł (1-49 ➔ 50, 51-99 ➔ 100)</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {clientRangeStats.c3} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={clientRange3Percent === 0 ? '' : clientRange3Percent}
                            onChange={(e) => setClientRange3Percent(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {clientQuickPercentages.slice(0, 8).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setClientRange3Percent(p)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                clientRange3Percent === p ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {p > 0 ? `+${p}%` : `${p}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Tester Box for Client */}
              <div className="bg-slate-900/90 border border-amber-400/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Symulator przeliczenia dla Cen Klienta:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Podgląd krok po kroku</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Wpisz kwotę:</span>
                    <input
                      type="text"
                      value={clientTestPrice}
                      onChange={(e) => setClientTestPrice(e.target.value)}
                      placeholder="930"
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white w-32 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                    <div className="flex gap-1">
                      {['930', '1070', '2490', '5950'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setClientTestPrice(val)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                  {clientTestCalc && (
                    <div className="flex-1 w-full flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                      <span className="text-slate-400">Baza: <strong className="text-white">{clientTestCalc.num} zł</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-slate-400">Naliczono: <strong className="text-amber-400">{clientTestCalc.percent >= 0 ? `+${clientTestCalc.percent}%` : `${clientTestCalc.percent}%`}</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-slate-400">Krok: <strong className="text-amber-300">{clientTestCalc.step} zł</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-emerald-400 font-extrabold text-sm whitespace-nowrap">
                        Wynik: {clientTestCalc.rounded.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Table for Client */}
              {clientChangesCount > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Podgląd na żywo Cen Klienta (Pozycji do zmiany: {clientChangesCount})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Wyliczenia względem bazy z importu</span>
                  </div>

                  <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Marka / Model</th>
                          <th className="py-2 px-3">Rocznik</th>
                          {(clientTargetColumn === 'both' || clientTargetColumn === 'static') && (
                            <th className="py-2 px-3">Cena Statyczna: Bazowa ➔ Nowa</th>
                          )}
                          {(clientTargetColumn === 'both' || clientTargetColumn === 'dynamic') && (
                            <th className="py-2 px-3">Cena Dynamiczna: Bazowa ➔ Nowa</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {rows
                          .filter((r) => {
                            const bS = getClientRowBasePrice(r, 'static');
                            const bD = getClientRowBasePrice(r, 'dynamic');
                            const s = calculateNewClientPrice(bS, r.priceClientStatic);
                            const d = calculateNewClientPrice(bD, r.priceClientDynamic);
                            return s.changed || d.changed;
                          })
                          .slice(0, 10)
                          .map((r) => {
                            const bS = getClientRowBasePrice(r, 'static');
                            const bD = getClientRowBasePrice(r, 'dynamic');
                            const s = calculateNewClientPrice(bS, r.priceClientStatic);
                            const d = calculateNewClientPrice(bD, r.priceClientDynamic);
                            return (
                              <tr key={r.id} className="hover:bg-slate-800/40">
                                <td className="py-2 px-3 font-semibold text-white">{r.brand} {r.model}</td>
                                <td className="py-2 px-3 text-slate-400">{r.years}</td>
                                {(clientTargetColumn === 'both' || clientTargetColumn === 'static') && (
                                  <td className="py-2 px-3 font-mono">
                                    <span className="text-slate-400 line-through text-[11px] mr-1.5">{bS || '-'}</span>
                                    <span className="text-slate-500 mr-1.5">➔</span>
                                    <span className="text-amber-300 font-bold text-xs">{s.newPriceStr}</span>
                                    <span className={`text-[10px] ml-1.5 font-bold ${s.diffFromBase > 0 ? 'text-emerald-400' : s.diffFromBase < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                      ({s.diffFromBase > 0 ? `+${s.diffFromBase}` : s.diffFromBase} zł)
                                    </span>
                                  </td>
                                )}
                                {(clientTargetColumn === 'both' || clientTargetColumn === 'dynamic') && (
                                  <td className="py-2 px-3 font-mono">
                                    <span className="text-slate-400 line-through text-[11px] mr-1.5">{bD || '-'}</span>
                                    <span className="text-slate-500 mr-1.5">➔</span>
                                    <span className="text-amber-300 font-bold text-xs">{d.newPriceStr}</span>
                                    <span className={`text-[10px] ml-1.5 font-bold ${d.diffFromBase > 0 ? 'text-emerald-400' : d.diffFromBase < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                      ({d.diffFromBase > 0 ? `+${d.diffFromBase}` : d.diffFromBase} zł)
                                    </span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons for Client */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreBaseClientPrices}
                    className="text-slate-300 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer transition-colors px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Przywróć bazowe Ceny Klienta</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyClientPrices}
                    disabled={clientChangesCount === 0}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Zastosuj Ceny Klienta ({clientChangesCount} pozycji)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🔵 WIDOK 2: MODYFIKATOR CEN BROKERA (RABAT UJEMNY) */}
          {/* ========================================================================= */}
          {activeTab === 'broker' && (
            <div className="space-y-6">
              {/* Informative Callout for Broker */}
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-200">
                <BadgePercent className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <span>Modyfikator Cen Brokera / Pośrednika (Dokładne wyliczenia bez zaokrągleń):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-200/90 text-[11px]">
                    <li>
                      <span className="font-semibold text-white">Naliczanie od ceny bazowej brokera:</span> Zmiana jest liczona od pierwotnych cen brokera z importu (np. 2 490 zł, 3 090 zł).
                    </li>
                    <li>
                      <span className="font-semibold text-white">Konkretna, dokładna cena:</span> Domyślnie system nie zaokrągla kwot (np. -10% z 2 490 zł = <span className="font-bold text-emerald-400">2 241 zł</span>, nie 2 250 zł).
                    </li>
                    <li>
                      <span className="font-semibold text-white">Rabat ujemny:</span> Wprowadzenie wartości ujemnej (np. <span className="font-bold text-blue-300">-10%, -15%, -20%</span>) precyzyjnie obniża cenę hurtową o wskazany upust.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Target Broker Columns Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Kolumny docelowe (Cena Pośrednik/Broker):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBrokerTargetColumn('both')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      brokerTargetColumn === 'both'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Obie: Pośrednik Stat + Dyn
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrokerTargetColumn('static')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      brokerTargetColumn === 'static'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Tylko Pośrednik Statyczna
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrokerTargetColumn('dynamic')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      brokerTargetColumn === 'dynamic'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Tylko Pośrednik Dynamiczna
                  </button>
                </div>
              </div>

              {/* Rounding Strategy and Direction Configuration for Broker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Rounding Strategy */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">Krok zaokrąglania po rabacie:</span>
                    </div>
                    <span className="text-[10px] text-blue-300 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
                      {brokerRounding === '50' ? '1–49zł ➔ 50zł | 51–99zł ➔ 100zł' : brokerRounding === '100' ? 'Do pełnych 100 zł' : brokerRounding === 'smart_adaptive' ? 'Adaptacyjnie (50/100 zł)' : 'Dokładna kwota'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBrokerRounding('50')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRounding === '50'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do 50 zł</span>
                      <span className={`text-[9px] font-normal ${brokerRounding === '50' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        1-49 ➔ 50, 51-99 ➔ 100
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBrokerRounding('smart_adaptive')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRounding === 'smart_adaptive'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Adaptacyjne</span>
                      <span className={`text-[9px] font-normal ${brokerRounding === 'smart_adaptive' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        ≤1tys: 50zł, &gt;1tys: 100zł
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBrokerRounding('100')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRounding === '100'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do 100 zł</span>
                      <span className={`text-[9px] font-normal ${brokerRounding === '100' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        Pełne setki
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBrokerRounding('none')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRounding === 'none'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Bez zaokr.</span>
                      <span className={`text-[9px] font-normal ${brokerRounding === 'none' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        Dokładny wynik
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rounding Direction */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">Kierunek zaokrąglania:</span>
                    </div>
                    <span className="text-[10px] text-blue-300 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
                      {brokerRoundingDirection === 'ceil' ? 'W górę (Zawsze w górę)' : brokerRoundingDirection === 'floor' ? 'W dół (Obniżanie)' : 'Do najbliższej'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBrokerRoundingDirection('ceil')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRoundingDirection === 'ceil'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>W górę (sufit)</span>
                      <span className={`text-[9px] font-normal ${brokerRoundingDirection === 'ceil' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        1-49 ➔ 50, 51-99 ➔ 100
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBrokerRoundingDirection('nearest')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRoundingDirection === 'nearest'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>Do najbliższej</span>
                      <span className={`text-[9px] font-normal ${brokerRoundingDirection === 'nearest' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        Matematyczne
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBrokerRoundingDirection('floor')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        brokerRoundingDirection === 'floor'
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <span>W dół (podłoga)</span>
                      <span className={`text-[9px] font-normal ${brokerRoundingDirection === 'floor' ? 'text-blue-100 font-bold' : 'text-slate-400'}`}>
                        Obcinanie w dół
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode Switch: Ranges vs Global % */}
              <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Sposób definiowania rabatu:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBrokerMode('global')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      brokerMode === 'global'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Jednolity Rabat Globalny
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrokerMode('ranges')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      brokerMode === 'ranges'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    3 Zakresy Progowe
                  </button>
                </div>
              </div>

              {/* Broker Global Discount Mode */}
              {brokerMode === 'global' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-blue-400" />
                        <span>Jednolity rabat ujemny dla wszystkich cen brokera</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Wszystkie bazowe ceny pośrednika zostaną pomniejszone o wybrany upust procentowy.
                      </p>
                    </div>
                    <span className={`text-xl font-mono font-extrabold ${brokerGlobalDiscount < 0 ? 'text-blue-400' : brokerGlobalDiscount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {brokerGlobalDiscount > 0 ? `+${brokerGlobalDiscount}%` : `${brokerGlobalDiscount}%`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-48">
                      <input
                        type="number"
                        value={brokerGlobalDiscount === 0 ? '' : brokerGlobalDiscount}
                        onChange={(e) => setBrokerGlobalDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="1"
                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                        %
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {brokerQuickDiscounts.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setBrokerGlobalDiscount(d)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            brokerGlobalDiscount === d
                              ? 'bg-blue-500 text-white shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {d === 0 ? '0%' : `${d}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Broker 3 Ranges Mode */}
              {brokerMode === 'ranges' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400">
                    <span className="font-semibold text-slate-300">Granice progów kwotowych dla cen brokera:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span>Próg 1:</span>
                        <input
                          type="number"
                          value={brokerThreshold1}
                          onChange={(e) => setBrokerThreshold1(Math.max(100, parseFloat(e.target.value) || 1000))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                        />
                        <span>zł</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Próg 2:</span>
                        <input
                          type="number"
                          value={brokerThreshold2}
                          onChange={(e) => setBrokerThreshold2(Math.max(brokerThreshold1 + 100, parseFloat(e.target.value) || 2000))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-right"
                        />
                        <span>zł</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Zakres 1 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                            Zakres 1
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            0 – {brokerThreshold1.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-blue-300/80">Zaokrąglanie do 50 zł</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {brokerRangeStats.c1} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={brokerRange1Discount === 0 ? '' : brokerRange1Discount}
                            onChange={(e) => setBrokerRange1Discount(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {brokerQuickDiscounts.slice(0, 6).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setBrokerRange1Discount(d)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                brokerRange1Discount === d ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {d === 0 ? '0%' : `${d}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Zakres 2 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                            Zakres 2
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            {brokerThreshold1.toLocaleString('pl-PL')} – {brokerThreshold2.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-blue-300/80">Zaokrąglanie do 50 zł (1-49 ➔ 50, 51-99 ➔ 100)</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {brokerRangeStats.c2} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={brokerRange2Discount === 0 ? '' : brokerRange2Discount}
                            onChange={(e) => setBrokerRange2Discount(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {brokerQuickDiscounts.slice(0, 6).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setBrokerRange2Discount(d)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                brokerRange2Discount === d ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {d === 0 ? '0%' : `${d}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Zakres 3 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                            Zakres 3
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">
                            Powyżej {brokerThreshold2.toLocaleString('pl-PL')} zł
                          </h4>
                          <p className="text-[11px] text-blue-300/80">Zaokrąglanie do 50 zł (1-49 ➔ 50, 51-99 ➔ 100)</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {brokerRangeStats.c3} cen
                        </span>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            value={brokerRange3Discount === 0 ? '' : brokerRange3Discount}
                            onChange={(e) => setBrokerRange3Discount(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {brokerQuickDiscounts.slice(0, 6).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setBrokerRange3Discount(d)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                brokerRange3Discount === d ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {d === 0 ? '0%' : `${d}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Tester Box for Broker */}
              <div className="bg-slate-900/90 border border-blue-400/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Symulator rabatu ujemnego dla Ceny Brokera:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Podgląd rabatu hurtowego</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Wpisz kwotę brokera:</span>
                    <input
                      type="text"
                      value={brokerTestPrice}
                      onChange={(e) => setBrokerTestPrice(e.target.value)}
                      placeholder="2490"
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                    <div className="flex gap-1">
                      {['1500', '2490', '3090', '4500'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBrokerTestPrice(val)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                  {brokerTestCalc && (
                    <div className="flex-1 w-full flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                      <span className="text-slate-400">Baza brokera: <strong className="text-white">{brokerTestCalc.num} zł</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-slate-400">Rabat: <strong className="text-blue-400">{brokerTestCalc.discount >= 0 ? `+${brokerTestCalc.discount}%` : `${brokerTestCalc.discount}%`}</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-slate-400">Krok: <strong className="text-blue-300">{brokerTestCalc.step} zł</strong></span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-blue-400 font-extrabold text-sm whitespace-nowrap">
                        Cena po rabacie: {brokerTestCalc.rounded.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Table for Broker */}
              {brokerChangesCount > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>Podgląd na żywo Cen Brokera po rabacie (Pozycji do zmiany: {brokerChangesCount})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Wyliczenia względem bazowych cen brokera</span>
                  </div>

                  <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Marka / Model</th>
                          <th className="py-2 px-3">Rocznik</th>
                          {(brokerTargetColumn === 'both' || brokerTargetColumn === 'static') && (
                            <th className="py-2 px-3">Pośrednik Statyczna: Bazowa ➔ Po rabacie</th>
                          )}
                          {(brokerTargetColumn === 'both' || brokerTargetColumn === 'dynamic') && (
                            <th className="py-2 px-3">Pośrednik Dynamiczna: Bazowa ➔ Po rabacie</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {rows
                          .filter((r) => {
                            const bS = getBrokerRowBasePrice(r, 'static');
                            const bD = getBrokerRowBasePrice(r, 'dynamic');
                            const s = calculateNewBrokerPrice(bS, r.priceBrokerStatic);
                            const d = calculateNewBrokerPrice(bD, r.priceBrokerDynamic);
                            return s.changed || d.changed;
                          })
                          .slice(0, 10)
                          .map((r) => {
                            const bS = getBrokerRowBasePrice(r, 'static');
                            const bD = getBrokerRowBasePrice(r, 'dynamic');
                            const s = calculateNewBrokerPrice(bS, r.priceBrokerStatic);
                            const d = calculateNewBrokerPrice(bD, r.priceBrokerDynamic);
                            return (
                              <tr key={r.id} className="hover:bg-slate-800/40">
                                <td className="py-2 px-3 font-semibold text-white">{r.brand} {r.model}</td>
                                <td className="py-2 px-3 text-slate-400">{r.years}</td>
                                {(brokerTargetColumn === 'both' || brokerTargetColumn === 'static') && (
                                  <td className="py-2 px-3 font-mono">
                                    <span className="text-slate-400 line-through text-[11px] mr-1.5">{bS || '-'}</span>
                                    <span className="text-slate-500 mr-1.5">➔</span>
                                    <span className="text-blue-300 font-bold text-xs">{s.newPriceStr}</span>
                                    <span className={`text-[10px] ml-1.5 font-bold ${s.diffFromBase < 0 ? 'text-blue-400' : s.diffFromBase > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                      ({s.diffFromBase > 0 ? `+${s.diffFromBase}` : s.diffFromBase} zł)
                                    </span>
                                  </td>
                                )}
                                {(brokerTargetColumn === 'both' || brokerTargetColumn === 'dynamic') && (
                                  <td className="py-2 px-3 font-mono">
                                    <span className="text-slate-400 line-through text-[11px] mr-1.5">{bD || '-'}</span>
                                    <span className="text-slate-500 mr-1.5">➔</span>
                                    <span className="text-blue-300 font-bold text-xs">{d.newPriceStr}</span>
                                    <span className={`text-[10px] ml-1.5 font-bold ${d.diffFromBase < 0 ? 'text-blue-400' : d.diffFromBase > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                      ({d.diffFromBase > 0 ? `+${d.diffFromBase}` : d.diffFromBase} zł)
                                    </span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons for Broker */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreBaseBrokerPrices}
                    className="text-slate-300 hover:text-blue-400 flex items-center gap-1.5 cursor-pointer transition-colors px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Przywróć bazowe Ceny Brokera</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyBrokerPrices}
                    disabled={brokerChangesCount === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Zastosuj Ceny Brokera ({brokerChangesCount} pozycji)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {appliedSuccessMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{appliedSuccessMessage}</span>
            </div>
          )}

          {/* Undo Global Button */}
          {previousRowsHistory && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUndo}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cofnij ostatnią operację na cenach</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
