/**
 * Security & Access Control Module
 * Manages passwords for 'wholesale' and 'settings' modules.
 * Supports localStorage persistence, server synchronization, and defaults.
 */

export interface SecurityPasswords {
  settingsPassword: string;
  wholesalePassword: string;
  updatedAt?: string;
}

export const DEFAULT_ACCESS_PASSWORD = '505690291';
const SECURITY_STORAGE_KEY = 'carlamps_security_passwords';
export const PASSWORDS_CHANGED_EVENT = 'carlamps_passwords_changed';

/**
 * Retrieves the currently configured access passwords.
 * Falls back to DEFAULT_ACCESS_PASSWORD ('505690291').
 */
export function getSecurityPasswords(): SecurityPasswords {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        settingsPassword: parsed.settingsPassword && typeof parsed.settingsPassword === 'string'
          ? parsed.settingsPassword
          : DEFAULT_ACCESS_PASSWORD,
        wholesalePassword: parsed.wholesalePassword && typeof parsed.wholesalePassword === 'string'
          ? parsed.wholesalePassword
          : DEFAULT_ACCESS_PASSWORD,
        updatedAt: parsed.updatedAt || undefined,
      };
    }
  } catch (err) {
    console.warn('[Security] Failed to read passwords from storage:', err);
  }

  return {
    settingsPassword: DEFAULT_ACCESS_PASSWORD,
    wholesalePassword: DEFAULT_ACCESS_PASSWORD,
  };
}

/**
 * Saves new access passwords to localStorage and attempts to sync with the backend server.
 */
export async function saveSecurityPasswords(
  updates: Partial<SecurityPasswords>
): Promise<SecurityPasswords> {
  const current = getSecurityPasswords();
  const next: SecurityPasswords = {
    settingsPassword: (updates.settingsPassword !== undefined ? updates.settingsPassword : current.settingsPassword).trim() || DEFAULT_ACCESS_PASSWORD,
    wholesalePassword: (updates.wholesalePassword !== undefined ? updates.wholesalePassword : current.wholesalePassword).trim() || DEFAULT_ACCESS_PASSWORD,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PASSWORDS_CHANGED_EVENT, { detail: next }));
    }
  } catch (err) {
    console.warn('[Security] Failed to save passwords to localStorage:', err);
  }

  // Attempt backend persistence
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch('/api/security/passwords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    // Non-blocking fallback for offline or static hosting
  }

  return next;
}

/**
 * Resets passwords to the default factory password ('505690291').
 */
export async function resetSecurityPasswords(): Promise<SecurityPasswords> {
  return saveSecurityPasswords({
    settingsPassword: DEFAULT_ACCESS_PASSWORD,
    wholesalePassword: DEFAULT_ACCESS_PASSWORD,
  });
}

/**
 * Synchronizes passwords from the server if available.
 */
export async function syncSecurityPasswordsFromServer(): Promise<SecurityPasswords> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('/api/security/passwords', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.passwords) {
        const current = getSecurityPasswords();
        // If server has updated passwords, apply them
        if (data.passwords.settingsPassword || data.passwords.wholesalePassword) {
          const merged: SecurityPasswords = {
            settingsPassword: data.passwords.settingsPassword || current.settingsPassword,
            wholesalePassword: data.passwords.wholesalePassword || current.wholesalePassword,
            updatedAt: data.passwords.updatedAt || new Date().toISOString(),
          };
          try {
            localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(merged));
          } catch (_) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(PASSWORDS_CHANGED_EVENT, { detail: merged }));
          }
          return merged;
        }
      }
    }
  } catch {
    // Silent ignore if offline or running in standalone mode
  }

  return getSecurityPasswords();
}

/**
 * Verifies if the entered password matches the required authorization.
 * For 'settings': requires settingsPassword.
 * For 'wholesale': accepts wholesalePassword OR settingsPassword (master).
 */
export function verifyAccessPassword(entered: string, targetTab: 'wholesale' | 'settings'): boolean {
  const cleanInput = (entered || '').trim();
  if (!cleanInput) return false;

  const passwords = getSecurityPasswords();

  if (targetTab === 'settings') {
    return cleanInput === passwords.settingsPassword;
  }

  if (targetTab === 'wholesale') {
    return cleanInput === passwords.wholesalePassword || cleanInput === passwords.settingsPassword;
  }

  return false;
}
