import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { MainTab } from '../types';

interface PasswordLockModalProps {
  isOpen: boolean;
  targetTab: MainTab;
  onSuccess: () => void;
  onCancel: () => void;
}

const REQUIRED_PASSWORD = '505690291';

export const PasswordLockModal: React.FC<PasswordLockModalProps> = ({
  isOpen,
  targetTab,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabName = targetTab === 'wholesale' ? 'Hurt' : 'Ustawienia';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === REQUIRED_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
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

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Strefa chroniona hasłem
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Dostęp do zakładki <strong className="text-amber-300 font-semibold">{tabName}</strong> wymaga autoryzacji kodem dostępu.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  if (error) setError(false);
                }}
                placeholder="Wpisz hasło..."
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
                <span>Nieprawidłowe hasło dostępu. Spróbuj ponownie.</span>
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
        </form>
      </div>
    </div>
  );
};
