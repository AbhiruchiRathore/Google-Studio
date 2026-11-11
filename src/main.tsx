import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AdminConfigProvider } from './context/AdminConfigContext';
import './index.css';

function syncAndroidEdgeInsets() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isWebView =
      /\bwv\b/i.test(ua) ||
      /Version\/[0-9.]+.*Chrome/i.test(ua) ||
      Boolean((window as unknown as { Android?: unknown }).Android);
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches;

    // Probe whether CSS env(safe-area-inset-top) is already populated by the OS/WebView
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top, 0px);pointer-events:none;visibility:hidden;';
    document.documentElement.appendChild(probe);
    const envTopPx = probe.getBoundingClientRect().height || 0;
    probe.remove();

    // Only apply fallback edge padding on Android WebView/standalone/full-height screens when env inset is 0
    const isFullHeightAndroid = isAndroid && window.innerHeight >= window.screen.height - 64;
    if ((isWebView || (isAndroid && isStandalone) || isFullHeightAndroid) && envTopPx < 4) {
      document.documentElement.setAttribute('data-android-edge', 'true');
    } else {
      document.documentElement.removeAttribute('data-android-edge');
    }
  } catch {
    // ignore detection errors
  }
}

syncAndroidEdgeInsets();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', syncAndroidEdgeInsets);
  window.addEventListener('orientationchange', syncAndroidEdgeInsets);
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LanguageProvider>
        <AdminConfigProvider>
          <App />
        </AdminConfigProvider>
      </LanguageProvider>
    </React.StrictMode>
  );
}
