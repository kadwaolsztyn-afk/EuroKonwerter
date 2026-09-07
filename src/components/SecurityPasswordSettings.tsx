import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
  Building2,
  SlidersHorizontal,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  getSecurityPasswords,
  saveSecurityPasswords,
  resetSecurityPasswords,
  syncSecurityPasswordsFromServer,
  DEFAULT_ACCESS_PASSWORD,
  SecurityPasswords,
  PASSWORDS_CHANGED_EVENT,
} from '../utils/security';

interface SecurityPasswordSettingsProps {
  onSuccessNotification?: (msg: string) => void;
}

export const SecurityPasswordSettings: React.FC<SecurityPasswordSettingsProps> = ({
  onSuccessNotification,
}) => {
  const [passwords, setPasswords] = useState<SecurityPasswords>(getSecurityPasswords());
  const [settingsPassword, setSettingsPassword] = useState(passwords.settingsPassword);
  const [wholesalePassword, setWholesalePassword] = useState(passwords.wholesalePassword);

  const [showSettingsPw, setShowSettingsPw] = useState(false);
  const [showWholesalePw, setShowWholesalePw] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync with server and listen for changes
  useEffect(() => {
    let isMounted = true;
    syncSecurityPasswordsFromServer().then((pw) => {
      if (isMounted) {
        setPasswords(pw);
        setSettingsPassword(pw.settingsPassword);
        setWholesalePassword(pw.wholesalePassword);
      }
    });

    const handlePwChange = (e: Event) => {
      const customEvent = e as CustomEvent<SecurityPasswords>;
      if (customEvent.detail && isMounted) {
        setPasswords(customEvent.detail);
        setSettingsPassword(customEvent.detail.settingsPassword);
        setWholesalePassword(customEvent.detail.wholesalePassword);
      }
    };

    window.addEventListener(PASSWORDS_CHANGED_EVENT, handlePwChange);
    return () => {
      isMounted = false;
      window.removeEventListener(PASSWORDS_CHANGED_EVENT, handlePwChange);
    };
  }, []);

  const hasUnsavedChanges =
    settingsPassword !== passwords.settingsPassword ||
    wholesalePassword !== passwords.wholesalePassword;

  const isSettingsDefault = passwords.settingsPassword === DEFAULT_ACCESS_PASSWORD;
  const isWholesaleDefault = passwords.wholesalePassword === DEFAULT_ACCESS_PASSWORD;

  const handleCopySettingsToWholesale = () => {
    setWholesalePassword(settingsPassword);
    setMessage({
      type: 'success',
      text: 'Skopiowano hasło z Ustawień do Hurtu. Kliknij „Zapisz nowe hasła”, aby zastosować.',
    });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanSettings = settingsPassword.trim();
    const cleanWholesale = wholesalePassword.trim();

    if (!cleanSettings) {
      setMessage({ type: 'error', text: 'Hasło do Ustawień nie może być puste.' });
      return;
    }
    if (!cleanWholesale) {
      setMessage({ type: 'error', text: 'Hasło do Hurtu nie może być puste.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const saved = await saveSecurityPasswords({
        settingsPassword: cleanSettings,
        wholesalePassword: cleanWholesale,
      });

      setPasswords(saved);
      setSettingsPassword(saved.settingsPassword);
      setWholesalePassword(saved.wholesalePassword);

      const msg = 'Nowe hasła dostępu zostały pomyślnie zapisane!';
      setMessage({ type: 'success', text: msg });
      if (onSuccessNotification) {
        onSuccessNotification(msg);
      }
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Wystąpił błąd podczas zapisywania haseł.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setShowResetConfirm(false);
      setMessage(null);

      const reset = await resetSecurityPasswords();
      setPasswords(reset);
      setSettingsPassword(reset.settingsPassword);
      setWholesalePassword(reset.wholesalePassword);

      const msg = `Przywrócono fabryczne hasło dostępu (${DEFAULT_ACCESS_PASSWORD}) dla obu zakładek.`;
      setMessage({ type: 'success', text: msg });
      if (onSuccessNotification) {
        onSuccessNotification(msg);
      }
      setTimeout(() => setMessage(null), 4500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Nie udało się zresetować haseł.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 hover:border-amber-400/50 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-200">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Hasła Dostępu i Bezpieczeństwo
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase bg-amber-400/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Dostęp Chroniony
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dostosuj hasła autoryzacji do panelu <strong className="text-amber-300 font-semibold">Ustawień</strong> oraz do zakładki <strong className="text-amber-300 font-semibold">Hurt</strong>. Możesz nadać pracownikom dostęp wyłącznie do cennika hurtowego, zachowując wyłączny dostęp do konfiguracji technicznej i bazy.
            </p>
          </div>
        </div>

        {/* Reset Button */}
        <div className="shrink-0">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Przywróć domyślne hasło fabryczne (505690291)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Przywróć Fabryczne ({DEFAULT_ACCESS_PASSWORD})</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 p-1.5 bg-rose-950/80 border border-rose-500/50 rounded-xl animate-fadeIn">
              <span className="text-[11px] text-rose-300 font-medium pl-1">
                Przywrócić {DEFAULT_ACCESS_PASSWORD}?
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isResetting ? 'Reset...' : 'Tak, przywróć'}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Hasło do Ustawień */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4.5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Hasło do Ustawień</h4>
                  <p className="text-[11px] text-slate-400">Dostęp administracyjny</p>
                </div>
              </div>

              {isSettingsDefault ? (
                <span className="text-[10px] font-semibold bg-slate-800 text-amber-300/90 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Fabryczne ({DEFAULT_ACCESS_PASSWORD})
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Własne hasło
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chroni centrum konfiguracji, synchronizację z serwerem, eksport danych oraz zmianę haseł.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Wprowadź nowe hasło do Ustawień:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showSettingsPw ? 'text' : 'password'}
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder="Wpisz hasło..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-750 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSettingsPw(!showSettingsPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showSettingsPw ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showSettingsPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Hasło do Hurtu */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4.5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Hasło do Hurtu</h4>
                  <p className="text-[11px] text-slate-400">Dostęp do cen B2B i marż</p>
                </div>
              </div>

              {isWholesaleDefault ? (
                <span className="text-[10px] font-semibold bg-slate-800 text-amber-300/90 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Fabryczne ({DEFAULT_ACCESS_PASSWORD})
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Własne hasło
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chroni kalkulator hurtowy, marże brokera i stawki warsztatowe (np. do udostępnienia pracownikom).
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Wprowadź nowe hasło do Hurtu:
                </label>
                <button
                  type="button"
                  onClick={handleCopySettingsToWholesale}
                  className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline font-medium cursor-pointer"
                >
                  Użyj hasła z Ustawień
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showWholesalePw ? 'text' : 'password'}
                  value={wholesalePassword}
                  onChange={(e) => setWholesalePassword(e.target.value)}
                  placeholder="Wpisz hasło..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-750 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowWholesalePw(!showWholesalePw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showWholesalePw ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showWholesalePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tip & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-snug">
              Wskazówka: Hasło administratora do <strong className="text-slate-200">Ustawień</strong> automatycznie odblokowuje również zakładkę Hurt.
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Niezapisane zmiany
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                hasUnsavedChanges
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20 scale-[1.02]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Zapisywanie...' : 'Zapisz nowe hasła'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
