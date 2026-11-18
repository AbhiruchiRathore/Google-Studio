import { jsPDF } from 'jspdf';
import { BusinessAd, MatrimonyProfile } from '../types';

export interface BookletPageEntry {
  page: number;
  title: string;
  subtitle: string;
  content: string[];
  note?: string;
}

const PAGE_W = 1240; // A4 @ 150 DPI
const PAGE_H = 1754;
const MARGIN_X = 72;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_Y = PAGE_H - 54;
const BODY_MAX_Y = PAGE_H - 96;

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const safe = String(text || '').replace(/\s+/g, ' ').trim();
  if (!safe) return [];

  const words = safe.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        current = '';
      }
      // Handle overly long unbroken tokens
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function initPageCanvas(
  ctx: CanvasRenderingContext2D,
  sectionTitle: string,
  pageNumber: number
) {
  // Warm paper background
  ctx.fillStyle = '#FDFBF7';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // Outer ceremonial border
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, PAGE_W - 56, PAGE_H - 56);

  // Top header bar
  ctx.fillStyle = '#380812';
  ctx.fillRect(28, 28, PAGE_W - 56, 86);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 28px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText('RATHORE RISHTEY • E-PATRIKA 2026', MARGIN_X, 74);

  ctx.fillStyle = '#FDE68A';
  ctx.font = '600 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(sectionTitle, PAGE_W - MARGIN_X, 74);
  ctx.textAlign = 'left';

  // Footer
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, PAGE_H - 82);
  ctx.lineTo(PAGE_W - MARGIN_X, PAGE_H - 82);
  ctx.stroke();

  ctx.fillStyle = '#78716C';
  ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText('Rathore Samaj Matrimonial & Business Directory • https://svayaa.com/', MARGIN_X, FOOTER_Y);

  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageNumber}`, PAGE_W - MARGIN_X, FOOTER_Y);
  ctx.textAlign = 'left';
}

function flushCanvasToPdf(doc: jsPDF, canvas: HTMLCanvasElement, isFirstPage: boolean) {
  const imgData = canvas.toDataURL('image/jpeg', 0.84);
  if (!isFirstPage) {
    doc.addPage('a4', 'portrait');
  }
  doc.addImage(imgData, 'JPEG', 0, 0, 595.28, 841.89, undefined, 'FAST');
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export async function generateAndDownloadBookletPdf(options: {
  bookletPages: BookletPageEntry[];
  profiles: MatrimonyProfile[];
  ads: BusinessAd[];
  onProgress?: (percent: number) => void;
}): Promise<Blob> {
  const { bookletPages, profiles, ads, onProgress } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Pure vector fallback if Canvas 2D context is unavailable
    doc.setFontSize(18);
    doc.text('Rathore Samaj Patrika 2026', 40, 50);
    doc.setFontSize(11);
    let y = 80;
    profiles.forEach((p, idx) => {
      if (y > 780) {
        doc.addPage();
        y = 50;
      }
      doc.text(`${idx + 1}. ${p.name} (${p.age} Yrs, ${p.gender}) | ${p.gotra} | ${p.city} | ${p.contact}`, 40, y);
      y += 18;
    });
    const fallbackBlob = doc.output('blob');
    triggerBlobDownload(fallbackBlob, 'Rathore-Samaj-Patrika-2026.pdf');
    return fallbackBlob;
  }

  let pageNumber = 0;
  let isFirstPage = true;
  let cursorY = 148;

  const brides = profiles.filter((p) => p.gender === 'Female');
  const grooms = profiles.filter((p) => p.gender === 'Male');

  const startNewPage = (sectionTitle: string) => {
    if (!isFirstPage || pageNumber > 0) {
      flushCanvasToPdf(doc, canvas, isFirstPage);
      isFirstPage = false;
    }
    pageNumber += 1;
    initPageCanvas(ctx, sectionTitle, pageNumber);
    cursorY = 152;
  };

  // --- PAGE 1: COVER & BOOKLET OVERVIEW ---
  pageNumber = 1;
  initPageCanvas(ctx, 'Cover & Overview', pageNumber);

  // Cover Hero Box
  drawRoundedRect(ctx, MARGIN_X, 144, CONTENT_W, 250, 20);
  ctx.fillStyle = '#4C0D1B';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 42px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText('Rathore Samaj Patrika 2026', MARGIN_X + 36, 212);

  ctx.fillStyle = '#FEF3C7';
  ctx.font = '600 24px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText('वार्षिक राठौड़ समाज वधु-वर परिचय एवं व्यापार निर्देशिका', MARGIN_X + 36, 254);

  ctx.fillStyle = '#F5F5F4';
  ctx.font = '500 21px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `Total Profiles: ${profiles.length}  (${brides.length} Brides • ${grooms.length} Grooms)   |   Business Ads: ${ads.length}`,
    MARGIN_X + 36,
    312
  );

  ctx.fillStyle = '#FCD34D';
  ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `Generated on ${new Date().toLocaleDateString()} • Digital Archive & Printable Directory`,
    MARGIN_X + 36,
    354
  );

  cursorY = 432;

  // Render Booklet Editorial Pages
  for (const entry of bookletPages) {
    ctx.font = '500 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    const wrappedBlocks = entry.content.map((line) => wrapCanvasText(ctx, line, CONTENT_W - 44));
    const totalContentLines = wrappedBlocks.reduce((sum, arr) => sum + arr.length, 0);
    const boxHeight = 96 + totalContentLines * 28 + (entry.note ? 40 : 12);

    if (cursorY + boxHeight > BODY_MAX_Y) {
      startNewPage('Editorial & Index');
    }

    drawRoundedRect(ctx, MARGIN_X, cursorY, CONTENT_W, boxHeight, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#6E1628';
    ctx.font = 'bold 24px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${entry.page}. ${entry.title}`, MARGIN_X + 22, cursorY + 38);

    ctx.fillStyle = '#B45309';
    ctx.font = '600 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(entry.subtitle, MARGIN_X + 22, cursorY + 68);

    let lineY = cursorY + 102;
    ctx.fillStyle = '#292524';
    ctx.font = '500 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    for (const lines of wrappedBlocks) {
      for (const l of lines) {
        ctx.fillText(l, MARGIN_X + 22, lineY);
        lineY += 28;
      }
    }

    if (entry.note) {
      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 17px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      ctx.fillText(`Note: ${entry.note}`, MARGIN_X + 22, lineY + 6);
    }

    cursorY += boxHeight + 22;
  }

  onProgress?.(20);

  // --- MATRIMONIAL PROFILES HELPER ---
  const renderProfileSection = async (
    list: MatrimonyProfile[],
    sectionHeader: string,
    baseProgress: number,
    progressSpan: number
  ) => {
    startNewPage(sectionHeader);

    // Section Banner
    drawRoundedRect(ctx, MARGIN_X, cursorY, CONTENT_W, 56, 12);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4C0D1B';
    ctx.font = 'bold 26px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${sectionHeader} (${list.length} Profiles)`, MARGIN_X + 22, cursorY + 37);
    cursorY += 76;

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const detailsLine1 = `${p.age} Yrs${p.height ? ` · ${p.height}` : ''}  |  Gotra: ${p.gotra || 'N/A'}  |  City: ${p.city}${p.state ? `, ${p.state}` : ''}`;
      const detailsLine2 = `Edu: ${p.education || 'N/A'}${p.profession ? `  |  Work: ${p.profession}` : ''}${p.income ? ` (${p.income})` : ''}`;
      const detailsLine3 = `Family: ${p.familyDetails || 'Reputed Rathore Family'}${p.dob ? `  |  DOB: ${p.dob}` : ''}`;
      const detailsLine4 = `Contact: ${p.contact || p.phone || 'Verified Portal Contact'}`;

      ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      const l1 = wrapCanvasText(ctx, detailsLine1, CONTENT_W - 36);
      const l2 = wrapCanvasText(ctx, detailsLine2, CONTENT_W - 36);
      const l3 = wrapCanvasText(ctx, detailsLine3, CONTENT_W - 36);
      const l4 = wrapCanvasText(ctx, detailsLine4, CONTENT_W - 36);

      const lineCount = l1.length + l2.length + l3.length + l4.length;
      const cardHeight = 48 + lineCount * 24 + 14;

      if (cursorY + cardHeight > BODY_MAX_Y) {
        startNewPage(sectionHeader);
      }

      drawRoundedRect(ctx, MARGIN_X, cursorY, CONTENT_W, cardHeight, 12);
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FAF7F2';
      ctx.fill();
      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Name header
      ctx.fillStyle = '#6E1628';
      ctx.font = 'bold 22px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${i + 1}. ${p.name}`, MARGIN_X + 18, cursorY + 32);

      let ty = cursorY + 60;
      ctx.fillStyle = '#292524';
      ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      for (const l of [...l1, ...l2, ...l3]) {
        ctx.fillText(l, MARGIN_X + 18, ty);
        ty += 24;
      }

      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      for (const l of l4) {
        ctx.fillText(l, MARGIN_X + 18, ty);
        ty += 24;
      }

      cursorY += cardHeight + 12;

      if (i % 18 === 0) {
        onProgress?.(Math.round(baseProgress + (i / Math.max(1, list.length)) * progressSpan));
        await new Promise((r) => window.setTimeout(r, 0));
      }
    }
  };

  if (brides.length > 0) {
    await renderProfileSection(brides, 'Brides Directory (वधु सूची)', 20, 25);
  }
  if (grooms.length > 0) {
    await renderProfileSection(grooms, 'Grooms Directory (वर सूची)', 45, 35);
  }

  // --- BUSINESS DIRECTORY ---
  if (ads.length > 0) {
    startNewPage('Business Directory (व्यापार निर्देशिका)');
    drawRoundedRect(ctx, MARGIN_X, cursorY, CONTENT_W, 56, 12);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4C0D1B';
    ctx.font = 'bold 26px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Business & Shop Directory (${ads.length} Businesses)`, MARGIN_X + 22, cursorY + 37);
    cursorY += 76;

    for (let i = 0; i < ads.length; i++) {
      const ad = ads[i];
      const contactsList =
        Array.isArray(ad.contacts) && ad.contacts.length > 0
          ? ad.contacts.filter((c) => c.phone?.trim()).map((c) => `${c.name}: ${c.phone}`).join('  |  ')
          : ad.phone || '';

      const line1 = `Category: ${ad.category}  |  Owner: ${ad.owner}${ad.city ? `  |  City: ${ad.city}` : ''}`;
      const line2 = ad.address ? `Address: ${ad.address}` : '';
      const line3 = ad.tagline || ad.offer || '';
      const line4 = contactsList ? `Contact: ${contactsList}` : '';

      ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      const w1 = wrapCanvasText(ctx, line1, CONTENT_W - 36);
      const w2 = line2 ? wrapCanvasText(ctx, line2, CONTENT_W - 36) : [];
      const w3 = line3 ? wrapCanvasText(ctx, line3, CONTENT_W - 36) : [];
      const w4 = line4 ? wrapCanvasText(ctx, line4, CONTENT_W - 36) : [];

      const lineCount = w1.length + w2.length + w3.length + w4.length;
      const cardHeight = 48 + lineCount * 24 + 14;

      if (cursorY + cardHeight > BODY_MAX_Y) {
        startNewPage('Business Directory (व्यापार निर्देशिका)');
      }

      drawRoundedRect(ctx, MARGIN_X, cursorY, CONTENT_W, cardHeight, 12);
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FAF7F2';
      ctx.fill();
      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#6E1628';
      ctx.font = 'bold 22px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${i + 1}. ${ad.title}`, MARGIN_X + 18, cursorY + 32);

      let ty = cursorY + 60;
      ctx.fillStyle = '#292524';
      ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      for (const l of [...w1, ...w2, ...w3]) {
        ctx.fillText(l, MARGIN_X + 18, ty);
        ty += 24;
      }

      if (w4.length > 0) {
        ctx.fillStyle = '#065F46';
        ctx.font = 'bold 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
        for (const l of w4) {
          ctx.fillText(l, MARGIN_X + 18, ty);
          ty += 24;
        }
      }

      cursorY += cardHeight + 12;

      if (i % 15 === 0) {
        onProgress?.(Math.round(80 + (i / Math.max(1, ads.length)) * 15));
        await new Promise((r) => window.setTimeout(r, 0));
      }
    }
  }

  // Flush final page
  flushCanvasToPdf(doc, canvas, isFirstPage);
  onProgress?.(98);

  const pdfBlob = doc.output('blob');
  triggerBlobDownload(pdfBlob, 'Rathore-Samaj-Patrika-2026.pdf');
  onProgress?.(100);
  return pdfBlob;
}
