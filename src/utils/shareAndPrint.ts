export interface WhatsAppSharePayload {
  text: string;
  phone?: string;
  waMeUrl: string;
  apiUrl: string;
  copied: boolean;
}

export interface SharePayload {
  title: string;
  text?: string;
  url?: string;
  phone?: string;
}

export interface ResolvedSharePayload {
  title: string;
  text: string;
  url: string;
  fullText: string;
  phone?: string;
  waMeUrl: string;
  telegramUrl: string;
  twitterUrl: string;
  mailtoUrl: string;
  gmailComposeUrl: string;
  instagramUrl: string;
}

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function resolveShareUrl(url?: string): string {
  const trimmed = url?.trim();
  if (trimmed) {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      const prefix = trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?') ? '' : '/';
      return `${window.location.origin}${prefix}${trimmed}`;
    }
    return trimmed;
  }
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }
  return 'https://svayaa.com/';
}

export function buildAppShareUrl(
  tab?: string,
  params?: Record<string, string | number | undefined>
): string {
  if (typeof window === 'undefined' || !window.location) {
    return tab ? `https://svayaa.com/#${tab}` : 'https://svayaa.com/';
  }
  const { origin, pathname, href } = window.location;
  if (!tab) return href;

  const entries = params
    ? Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    : [];
  const query =
    entries.length > 0
      ? `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`
      : '';
  return `${origin}${pathname}#${tab}${query}`;
}

export function buildWhatsAppUrls(text: string, phone?: string) {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);

  const waMeUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const apiUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return { waMeUrl, apiUrl, cleanPhone };
}

export function buildGmailComposeUrl(options: {
  to?: string;
  subject?: string;
  body?: string;
}): string {
  const params: string[] = ['view=cm', 'fs=1'];
  if (options.to) params.push(`to=${encodeURIComponent(options.to)}`);
  if (options.subject) params.push(`su=${encodeURIComponent(options.subject)}`);
  if (options.body) params.push(`body=${encodeURIComponent(options.body)}`);
  return `https://mail.google.com/mail/?${params.join('&')}`;
}

export function resolveSharePayload(payload: SharePayload): ResolvedSharePayload {
  const title = payload.title?.trim() || 'Rathore Rishtey';
  const summary = payload.text?.trim() || '';
  const url = resolveShareUrl(payload.url);

  const summaryWithoutDuplicateUrl = summary;
  const parts: string[] = [];
  if (title && (!summaryWithoutDuplicateUrl || !summaryWithoutDuplicateUrl.toLowerCase().includes(title.toLowerCase()))) {
    parts.push(title);
  }
  if (summaryWithoutDuplicateUrl) {
    parts.push(summaryWithoutDuplicateUrl);
  }
  if (url && !parts.some((p) => p.includes(url))) {
    parts.push(url);
  }

  const fullText = parts.join('\n\n').trim() || `${title}\n${url}`;
  const titleAndSummary =
    summary && !summary.toLowerCase().includes(title.toLowerCase())
      ? `${title}\n\n${summary}`
      : summary || title;

  const { waMeUrl } = buildWhatsAppUrls(fullText, payload.phone);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titleAndSummary)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(titleAndSummary)}&url=${encodeURIComponent(url)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullText)}`;
  const gmailComposeUrl = buildGmailComposeUrl({ subject: title, body: fullText });

  return {
    title,
    text: summary || title,
    url,
    fullText,
    phone: payload.phone,
    waMeUrl,
    telegramUrl,
    twitterUrl,
    mailtoUrl,
    gmailComposeUrl,
    instagramUrl: 'https://www.instagram.com/'
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy textarea fallback (important for Android WebView & restricted contexts)
  }

  try {
    if (typeof document === 'undefined') return false;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.fontSize = '16px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function isAndroidWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const win = window as unknown as Record<string, unknown>;
  const hasNativeBridge = Boolean(
    win.Android ||
      win.AndroidBridge ||
      win.ReactNativeWebView ||
      win.Capacitor ||
      win.cordova ||
      win.flutter_inappwebview ||
      win.Median ||
      win.gonative
  );
  const hasWebViewUa =
    /;\s*wv\)/i.test(ua) ||
    (/Android/i.test(ua) && /Version\/\d+\.\d+/i.test(ua) && /Chrome\//i.test(ua));
  const hasAndroidReferrer =
    typeof document !== 'undefined' && /^android-app:\/\//i.test(document.referrer || '');
  return hasWebViewUa || hasAndroidReferrer || (/Android/i.test(ua) && hasNativeBridge);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function shouldUseDirectExternalNavigation(): boolean {
  return isAndroidDevice() || isAndroidWebView();
}

export function navigateExternalUrl(url: string): void {
  if (typeof window === 'undefined' || !url) return;
  window.location.href = url;
}

export function getExternalLinkProps(url: string): {
  href: string;
  target?: '_blank';
  rel?: string;
  onClick?: (e: { preventDefault: () => void }) => void;
} {
  if (shouldUseDirectExternalNavigation()) {
    return {
      href: url,
      onClick: (e) => {
        e.preventDefault();
        navigateExternalUrl(url);
      }
    };
  }
  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer'
  };
}

export function isMobileBrowserContext(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isAndroidDevice() && !isAndroidWebView()
    ? true
    : /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

type ShareModalListener = (request: ResolvedSharePayload) => void;
const shareModalListeners = new Set<ShareModalListener>();

export function subscribeShareModal(listener: ShareModalListener): () => void {
  shareModalListeners.add(listener);
  return () => {
    shareModalListeners.delete(listener);
  };
}

export function openShareModal(payload: SharePayload): ResolvedSharePayload {
  const resolved = resolveSharePayload(payload);
  shareModalListeners.forEach((listener) => listener(resolved));
  return resolved;
}

/**
 * Reusable app-wide Share function:
 * 1. Resolves item/page title, summary, and URL (defaulting to current page URL).
 * 2. Uses navigator.share on secure mobile browser contexts when no specific WhatsApp phone
 *    recipient is targeted, falling back automatically to the custom ShareModal if
 *    navigator.share is unavailable, blocked (NotAllowedError), or cancelled (AbortError).
 * 3. Opens the custom ShareModal directly on desktop browsers & Android WebViews so every
 *    Share button responds reliably without silently failing or crashing WebView schemes.
 */
export async function shareContent(payload: SharePayload): Promise<ResolvedSharePayload> {
  const resolved = resolveSharePayload(payload);

  const canUseNativeMobileShare =
    !payload.phone &&
    isMobileBrowserContext() &&
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';

  if (canUseNativeMobileShare) {
    try {
      await navigator.share({
        title: resolved.title,
        text: resolved.text,
        url: resolved.url
      });
      return resolved;
    } catch {
      // AbortError, NotAllowedError, or unsupported field -> open custom ShareModal fallback
    }
  }

  openShareModal(payload);
  return resolved;
}

export function getWhatsAppLinkProps(text: string, phone?: string): {
  href: string;
  target?: '_blank';
  rel?: string;
  onClick?: (e: { preventDefault: () => void }) => void;
} {
  const { waMeUrl } = buildWhatsAppUrls(text, phone);
  return getExternalLinkProps(waMeUrl);
}

/**
 * Unified helper preserved for existing callers; delegates to shareContent so
 * WhatsApp, Instagram, Telegram, X, Email, and Copy Link all work consistently.
 */
export async function shareViaWhatsApp(
  text: string,
  phone?: string,
  options?: { title?: string; url?: string }
): Promise<WhatsAppSharePayload> {
  const resolved = await shareContent({
    title: options?.title || 'Rathore Rishtey',
    text,
    url: options?.url,
    phone
  });
  const { apiUrl } = buildWhatsAppUrls(resolved.fullText, phone);

  return {
    text: resolved.fullText,
    phone,
    waMeUrl: resolved.waMeUrl,
    apiUrl,
    copied: false
  };
}

export interface PrintableDocumentOptions {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  filename?: string;
}

export function buildFullPrintableHtml({ title, subtitle, bodyHtml }: PrintableDocumentOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", Arial, sans-serif;
      color: #1c1917;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      line-height: 1.45;
    }
    .doc-header {
      border-bottom: 2px solid #6e1628;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #851834;
      margin-bottom: 4px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      color: #380812;
    }
    .subtitle {
      margin: 4px 0 0;
      font-size: 12px;
      color: #57534e;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .meta-box {
      border: 1px solid #e7e5e4;
      background: #fafaf9;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #78716c;
      font-weight: 700;
      display: block;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 700;
      color: #1c1917;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #d6d3d1;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #380812;
      color: #fef3c7;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    tr:nth-child(even) td {
      background: #faf8f5;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #d6d3d1;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e7e5e4;
      font-size: 11px;
      color: #78716c;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 10px; }
      @page { margin: 12mm; size: auto; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand">Rathore Rishtey • Shubh Vivah</div>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    <div style="font-size: 11px; color: #57534e; text-align: right;">
      Printed on ${new Date().toLocaleDateString()}
    </div>
  </div>
  ${bodyHtml}
  <div class="footer">
    <span>Rathore Rishtey Portal</span>
    <span>https://svayaa.com/</span>
  </div>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function saveOrShareBlobFile(
  blob: Blob,
  filename: string,
  mimeType: string,
  shareTitle?: string
): Promise<'downloaded' | 'shared' | 'cancelled'> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'downloaded';
  }

  // Inside Android WebView, blob: URLs often fail in DownloadManager; try Web Share File API first
  if (isAndroidWebView() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle || filename
        });
        return 'shared';
      }
    } catch (err) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to data-URI / blob download fallback
    }
  }

  // On Android WebView without file share support, data: URIs are handled better than blob: URIs by WebView DownloadListeners
  if (isAndroidWebView()) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return 'downloaded';
      }
    } catch {
      // Fall through to standard blob URL download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'downloaded';
}

/**
 * Prints structured HTML via an off-screen A4-sized iframe (avoiding visibility:hidden or 0x0
 * which cause blank print previews, and running synchronously to preserve mobile user-gesture).
 * Returns false inside Android WebView when system print is unavailable so the UI can guide
 * the user to Download PDF / Download Sheet.
 */
export function printHtmlDocument(options: PrintableDocumentOptions): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;

  // Standard Android WebView ignores window.print() silently unless a native bridge handles it
  if (isAndroidWebView()) {
    const win = window as unknown as Record<string, { print?: () => void } | undefined>;
    if (typeof win.Android?.print === 'function') {
      try {
        win.Android.print();
        return true;
      } catch {
        return false;
      }
    }
    if (typeof win.AndroidBridge?.print === 'function') {
      try {
        win.AndroidBridge.print();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  const fullHtml = buildFullPrintableHtml(options);

  try {
    const existing = document.getElementById('app-print-iframe');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'app-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameWin = iframe.contentWindow;
    const frameDoc = iframe.contentDocument || frameWin?.document;
    if (!frameDoc || !frameWin) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      window.print();
      return true;
    }

    frameDoc.open();
    frameDoc.write(fullHtml);
    frameDoc.close();

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    try {
      frameWin.addEventListener('afterprint', cleanup, { once: true });
    } catch {
      // ignore if cross-browser listener fails
    }
    // Generous safety timeout so slow print dialogs are never torn down mid-preview
    window.setTimeout(cleanup, 120000);

    frameWin.focus();
    frameWin.print();
    return true;
  } catch {
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

export async function downloadPrintableHtml(
  options: PrintableDocumentOptions
): Promise<'downloaded' | 'shared' | 'cancelled'> {
  const fullHtml = buildFullPrintableHtml(options);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const safeBase = (options.filename || 'rathore-rishtey-document').replace(/[\\/:*?"<>|]+/g, '-');
  return saveOrShareBlobFile(blob, `${safeBase}.html`, 'text/html', options.title);
}

export async function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<'downloaded' | 'shared' | 'cancelled'> {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  // Include UTF-8 BOM so Hindi text renders cleanly in Excel
  const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8' });
  const safeBase = filename.replace(/[\\/:*?"<>|]+/g, '-') || 'export';
  return saveOrShareBlobFile(blob, `${safeBase}.csv`, 'text/csv', safeBase);
}
