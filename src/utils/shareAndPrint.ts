export interface WhatsAppSharePayload {
  text: string;
  phone?: string;
  waMeUrl: string;
  apiUrl: string;
  copied: boolean;
}

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
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

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export interface ShareModalRequest {
  text: string;
  phone?: string;
  title?: string;
  waMeUrl: string;
  apiUrl: string;
  copied: boolean;
  isWebView: boolean;
}

type ShareModalListener = (request: ShareModalRequest) => void;
const shareModalListeners = new Set<ShareModalListener>();

export function subscribeShareModal(listener: ShareModalListener): () => void {
  shareModalListeners.add(listener);
  return () => {
    shareModalListeners.delete(listener);
  };
}

function notifyShareModal(request: ShareModalRequest): boolean {
  if (shareModalListeners.size === 0) return false;
  shareModalListeners.forEach((listener) => listener(request));
  return true;
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
      win.webkit
  );
  // Android WebView standard UA contains "; wv)" or "Version/x.x Chrome/"
  const hasWebViewUa =
    /;\s*wv\)/i.test(ua) ||
    (/Android/i.test(ua) && /Version\/\d+\.\d+/i.test(ua) && /Chrome\//i.test(ua));
  return hasWebViewUa || (/Android/i.test(ua) && hasNativeBridge);
}

export function getWhatsAppLinkProps(text: string, phone?: string): {
  href: string;
  target?: '_blank';
  rel?: string;
} {
  const { apiUrl } = buildWhatsAppUrls(text, phone);
  return {
    href: apiUrl,
    target: '_blank',
    rel: 'noopener noreferrer'
  };
}

export interface ShareViaWhatsAppOptions {
  title?: string;
  url?: string;
}

/**
 * Cross-platform WhatsApp/Portal Share handler:
 * 1. Tries native Web Share API (`navigator.share`) when sharing general content
 *    so Android Chrome / TWA / iOS / supported WebViews open the native OS share sheet.
 * 2. Copies formatted text to clipboard cleanly (works in Android WebView, PWAs, desktop).
 * 3. Opens the in-app ShareFallbackModal instead of redirecting the current WebView frame
 *    to `https://api.whatsapp.com/send` (which triggers `whatsapp://` and crashes Android
 *    WebView with `net::ERR_UNKNOWN_URL_SCHEME`).
 */
export async function shareViaWhatsApp(
  text: string,
  phone?: string,
  options?: ShareViaWhatsAppOptions
): Promise<WhatsAppSharePayload> {
  const { waMeUrl, apiUrl } = buildWhatsAppUrls(text, phone);
  const webView = isAndroidWebView();
  const title = options?.title || 'Rathore Rishtey';

  // When no specific recipient phone number is targeted, prefer native OS share sheet first.
  if (!phone && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData: ShareData = { title, text };
      if (options?.url) {
        shareData.url = options.url;
      }
      await navigator.share(shareData);
      return {
        text,
        phone,
        waMeUrl,
        apiUrl,
        copied: false
      };
    } catch (err) {
      // User explicitly dismissed the native share sheet — do not show a fallback popup.
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          text,
          phone,
          waMeUrl,
          apiUrl,
          copied: false
        };
      }
      // Otherwise (e.g. NotAllowedError in preview iframe or unsupported WebView), continue to fallback modal.
    }
  }

  const copied = await copyTextToClipboard(text);

  const handledByModal = notifyShareModal({
    text,
    phone,
    title,
    waMeUrl,
    apiUrl,
    copied,
    isWebView: webView
  });

  // Fallback only if ShareFallbackModal is somehow not mounted and not in an Android WebView
  if (!handledByModal && !webView && typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = apiUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 300);
  }

  return {
    text,
    phone,
    waMeUrl,
    apiUrl,
    copied
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

/**
 * Prints structured HTML via a hidden temporary iframe (works reliably even when window.print()
 * is clipped or blocked on main shell), falling back to window.print() if needed.
 */
export function printHtmlDocument(options: PrintableDocumentOptions): boolean {
  if (typeof document === 'undefined') return false;
  const fullHtml = buildFullPrintableHtml(options);

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.print();
      return true;
    }

    frameDoc.open();
    frameDoc.write(fullHtml);
    frameDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        try {
          window.print();
        } catch {
          // ignore
        }
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 2500);
      }
    };

    // Wait briefly for iframe layout
    setTimeout(triggerPrint, 250);
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

export function downloadPrintableHtml(options: PrintableDocumentOptions): void {
  const fullHtml = buildFullPrintableHtml(options);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.filename || 'rathore-rishtey-document'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]): void {
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
