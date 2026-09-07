import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { MainTab } from '../types';
import { verifyAccessPassword, saveSecurityPasswords, getSecurityPasswords } from '../utils/security';

interface PasswordLockModalProps {
  isOpen: boolean;
  targetTab: MainTab;
  onSuccess: () => void;
  onCancel: () => void;
  initialMode?: 'unlock' | 'change';
}

export const PasswordLockModal: React.FC<PasswordLockModalProps> = ({
  isOpen,
  targetTab,
  onSuccess,
  onCancel,
  initialMode = 'unlock',
}) => {
  const [modalMode, setModalMode] = useState<'unlock' | 'change'>(initialMode);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [applyToBoth, setApplyToBoth] = useState(true);
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [changeSuccessMessage, setChangeSuccessMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const currentPwInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setModalMode(initialMode);
      setPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(false);
      setErrorMessage('');
      setIsShaking(false);
      setChangeSuccessMessage('');
      setTimeout(() => {
        if (initialMode === 'change') {
          currentPwInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const tabName = targetTab === 'wholesale' ? 'Hurt' : 'Ustawienia';

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAccessPassword(password, targetTab === 'wholesale' ? 'wholesale' : 'settings')) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Nieprawidłowe hasło dostępu. Spróbuj ponownie.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setErrorMessage('');

    // 1. Verify current password
    if (!verifyAccessPassword(currentPassword, targetTab === 'wholesale' ? 'wholesale' : 'settings')) {
      setError(true);
      setErrorMessage('Obecne hasło jest nieprawidłowe. (Domyślne hasło to: koral)');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 2. Validate new password
    const trimmedNew = newPassword.trim();
    if (!trimmedNew) {
      setError(true);
      setErrorMessage('Nowe hasło nie może być puste.');
      return;
    }

    if (trimmedNew !== confirmPassword.trim()) {
      setError(true);
      setErrorMessage('Wpisane nowe hasła nie są identyczne.');
      return;
    }

    try {
      setIsSavingPw(true);
      const currentConfig = getSecurityPasswords();
      const targetZone = targetTab === 'wholesale' ? 'wholesale' : 'settings';

      let newSettingsPw = currentConfig.settingsPassword;
      let newWholesalePw = currentConfig.wholesalePassword;

      if (applyToBoth) {
        newSettingsPw = trimmedNew;
        newWholesalePw = trimmedNew;
      } else if (targetZone === 'settings') {
        newSettingsPw = trimmedNew;
      } else {
        newWholesalePw = trimmedNew;
      }

      await saveSecurityPasswords({
        settingsPassword: newSettingsPw,
        wholesalePassword: newWholesalePw,
      });

      setChangeSuccessMessage('Hasło zostało pomyślnie zmienione! Odblokowywanie...');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setError(true);
      setErrorMessage(err?.message || 'Błąd podczas zapisywania hasła.');
    } finally {
      setIsSavingPw(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white relative transition-transform ${
          isShaking ? 'animate-shake ring-2 ring-rose-500' : ''
        }`}
      >
        {/* Close / Cancel Button */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Anuluj"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-center mb-5">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setModalMode('unlock');
                setError(false);
                setErrorMessage('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalMode === 'unlock'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Odblokuj dostęp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMode('change');
                setError(false);
                setErrorMessage('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modalMode === 'change'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Zmień hasło</span>
            </button>
          </div>
        </div>

        {modalMode === 'unlock' ? (
          <>
            {/* Header Icon & Title */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-13 h-13 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mb-2.5 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Strefa chroniona hasłem
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Dostęp do zakładki <strong className="text-amber-300 font-semibold">{tabName}</strong> wymaga podania hasła.
              </p>
            </div>

            {/* Unlock Form */}
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Wprowadź hasło dostępu:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) {
                        setError(false);
                        setErrorMessage('');
                      }
                    }}
                    placeholder="Wpisz hasło (domyślnie: koral)..."
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      error
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-950/20'
                        : 'border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage || 'Nieprawidłowe hasło dostępu. Spróbuj ponownie.'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Odblokuj</span>
                </button>
              </div>

              {/* Direct Link to Change Password */}
              <div className="pt-2 text-center border-t border-slate-800/80 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('change');
                    setError(false);
                    setErrorMessage('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Chcesz zmienić hasło? Kliknij tutaj</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Header Icon & Title for Change Password */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-13 h-13 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mb-2.5 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Zmień Hasło Dostępu
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Wprowadź aktualne hasło, a następnie zdefiniuj nowe hasło dla strefy <strong className="text-amber-300">{tabName}</strong>.
              </p>
            </div>

            {changeSuccessMessage && (
              <div className="p-3 mb-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{changeSuccessMessage}</span>
              </div>
            )}

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              {/* Current Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">
                    Aktualne hasło:
                  </label>
                  <span className="text-[10px] text-slate-500">Domyślne: koral</span>
                </div>
                <div className="relative">
                  <input
                    ref={currentPwInputRef}
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (error) {
                        setError(false);
                        setErrorMessage('');
                      }
                    }}
                    placeholder="Wpisz aktualne hasło..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Nowe hasło:
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) {
                        setError(false);
                        setErrorMessage('');
                      }
                    }}
                    placeholder="Wpisz nowe bezpieczne hasło..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Powtórz nowe hasło:
                </label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) {
                      setError(false);
                      setErrorMessage('');
                    }
                  }}
                  placeholder="Powtórz nowe hasło..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Checkbox: apply to both Hurt and Ustawienia */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={applyToBoth}
                  onChange={(e) => setApplyToBoth(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 bg-slate-950 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Ustaw jedno wspólne hasło dla <strong>Ustawień</strong> i <strong>Hurtu</strong></span>
              </label>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('unlock');
                    setError(false);
                    setErrorMessage('');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  Wróć do logowania
                </button>
                <button
                  type="submit"
                  disabled={isSavingPw}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSavingPw ? 'Zapisywanie...' : 'Zapisz i Odblokuj'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
