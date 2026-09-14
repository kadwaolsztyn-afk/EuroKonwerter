import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    if (typeof (window as any).__onReactMounted === 'function') {
      (window as any).__onReactMounted();
    }
  } catch (err: any) {
    console.error('Fatal initialization error in main.tsx:', err);
    container.innerHTML = `
      <div style="min-height: 100vh; background-color: #020617; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; text-align: center;">
        <div style="max-width: 400px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 20px;">
          <h2 style="color: #f87171; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Błąd inicjalizacji aplikacji</h2>
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 16px 0;">${err?.message || 'Nieznany błąd startowy'}</p>
          <button onclick="try{localStorage.clear();sessionStorage.clear();}catch(e){}window.location.reload();" style="padding: 10px 18px; background: #f59e0b; color: #020617; font-weight: bold; border-radius: 10px; border: none; cursor: pointer; font-size: 12px;">
            Wyczyść pamięć i odśwież
          </button>
        </div>
      </div>
    `;
  }
}
