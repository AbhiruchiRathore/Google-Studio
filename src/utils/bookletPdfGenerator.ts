import { jsPDF } from 'jspdf';
import { BusinessAd, GuestItem, MatrimonyProfile } from '../types';
import { KundaliMilanReport } from './kundaliMilan';
import { saveOrShareBlobFile } from './shareAndPrint';

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

async function triggerPdfSave(
  blob: Blob,
  filename: string,
  shareTitle: string
): Promise<'downloaded' | 'shared' | 'cancelled'> {
  return saveOrShareBlobFile(blob, filename, 'application/pdf', shareTitle);
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
    await triggerPdfSave(
      fallbackBlob,
      'Rathore-Samaj-Patrika-2026.pdf',
      'Rathore Samaj Patrika 2026'
    );
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
  await triggerPdfSave(
    pdfBlob,
    'Rathore-Samaj-Patrika-2026.pdf',
    'Rathore Samaj Patrika 2026'
  );
  onProgress?.(100);
  return pdfBlob;
}

export async function generateAndDownloadKundaliPdf(
  report: KundaliMilanReport,
  lang: 'en' | 'hi',
  filenameBase?: string
): Promise<'downloaded' | 'shared' | 'cancelled'> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');

  const safeBase =
    (filenameBase || `kundali-milan-${report.boyName}-${report.girlName}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kundali-milan-certificate';
  const filename = `${safeBase}.pdf`;

  if (!ctx) {
    doc.setFontSize(18);
    doc.text(`${report.boyName} & ${report.girlName} - Kundali Milan`, 40, 50);
    doc.setFontSize(12);
    doc.text(`Score: ${report.totalGunas} / 36 Gunas (${report.percentage}%)`, 40, 80);
    doc.text(`Verdict: ${report.verdict.grade} - ${report.verdict.title}`, 40, 102);
    const blob = doc.output('blob');
    return triggerPdfSave(blob, filename, `${report.boyName} & ${report.girlName} Kundali Milan`);
  }

  initPageCanvas(ctx, lang === 'hi' ? 'कुंडली मिलान प्रमाणपत्र' : 'Vedic Kundali Milan', 1);

  // Header Banner
  drawRoundedRect(ctx, MARGIN_X, 144, CONTENT_W, 180, 18);
  ctx.fillStyle = '#4C0D1B';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FCD34D';
  ctx.font = '600 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    lang === 'hi' ? 'शुभ विवाह • वैदिक अष्टकूट 36-गुण मिलान रिपोर्ट' : 'Shubh Vivah • Vedic Ashtakoot 36-Guna Certificate',
    MARGIN_X + 28,
    188
  );

  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 36px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${report.boyName}  &  ${report.girlName}`, MARGIN_X + 28, 236);

  ctx.fillStyle = '#FDE68A';
  ctx.font = '500 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  const boyRashiLabel = lang === 'hi' ? report.boyRashi.hindiName : report.boyRashi.name;
  const girlRashiLabel = lang === 'hi' ? report.girlRashi.hindiName : report.girlRashi.name;
  ctx.fillText(
    `${lang === 'hi' ? 'वर राशि' : 'Groom Rashi'}: ${boyRashiLabel}   |   ${lang === 'hi' ? 'वधू राशि' : 'Bride Rashi'}: ${girlRashiLabel}`,
    MARGIN_X + 28,
    276
  );

  // Score Box + Verdict
  let y = 352;
  drawRoundedRect(ctx, MARGIN_X, y, 250, 132, 16);
  ctx.fillStyle = '#FFFBEB';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#6E1628';
  ctx.font = 'bold 54px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${report.totalGunas}/36`, MARGIN_X + 125, y + 68);
  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 20px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${report.percentage}% ${lang === 'hi' ? 'मिलान' : 'Match'}`, MARGIN_X + 125, y + 104);
  ctx.textAlign = 'left';

  drawRoundedRect(ctx, MARGIN_X + 272, y, CONTENT_W - 272, 132, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 22px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `${report.verdict.grade}: ${lang === 'hi' ? report.verdict.hindiTitle : report.verdict.title}`,
    MARGIN_X + 294,
    y + 40
  );
  ctx.fillStyle = '#44403C';
  ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  const recLines = wrapCanvasText(
    ctx,
    lang === 'hi' ? report.verdict.hindiRecommendation : report.verdict.recommendation,
    CONTENT_W - 316
  );
  let ry = y + 72;
  for (const line of recLines.slice(0, 2)) {
    ctx.fillText(line, MARGIN_X + 294, ry);
    ry += 25;
  }

  y += 162;

  // 8 Kootas Table Header
  ctx.fillStyle = '#380812';
  ctx.fillRect(MARGIN_X, y, CONTENT_W, 44);
  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(lang === 'hi' ? 'अष्टकूट' : 'Ashtakoot', MARGIN_X + 16, y + 28);
  ctx.fillText(lang === 'hi' ? 'अंक' : 'Score', MARGIN_X + 340, y + 28);
  ctx.fillText(lang === 'hi' ? 'विश्लेषण' : 'Analysis', MARGIN_X + 460, y + 28);
  y += 44;

  const kootasList = Object.values(report.kootas);
  for (let i = 0; i < kootasList.length; i++) {
    const k = kootasList[i];
    ctx.font = '500 17px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    const descLines = wrapCanvasText(
      ctx,
      lang === 'hi' ? k.hindiDescription : k.description,
      CONTENT_W - 478
    );
    const rowH = Math.max(58, 22 + descLines.length * 22);

    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
    ctx.fillRect(MARGIN_X, y, CONTENT_W, rowH);
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN_X, y, CONTENT_W, rowH);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    const kNameLines = wrapCanvasText(ctx, lang === 'hi' ? k.hindiName : k.name, 310);
    ctx.fillText(kNameLines[0] || k.name, MARGIN_X + 16, y + 30);

    ctx.fillStyle = k.obtainedPoints === k.maxPoints ? '#065F46' : k.obtainedPoints === 0 ? '#BE123C' : '#92400E';
    ctx.font = 'bold 19px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${k.obtainedPoints} / ${k.maxPoints}`, MARGIN_X + 340, y + 30);

    ctx.fillStyle = '#44403C';
    ctx.font = '500 17px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    let dy = y + 26;
    for (const dl of descLines) {
      ctx.fillText(dl, MARGIN_X + 460, dy);
      dy += 22;
    }

    y += rowH;
  }

  // Dosha Summary Card
  y += 22;
  if (y + 185 < BODY_MAX_Y) {
    drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, 175, 14);
    ctx.fillStyle = '#FAF8F5';
    ctx.fill();
    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#6E1628';
    ctx.font = 'bold 21px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(lang === 'hi' ? 'दोष परीक्षण एवं ज्योतिषीय सारांश' : 'Dosha Summary & Safeguards', MARGIN_X + 20, y + 34);

    ctx.fillStyle = '#292524';
    ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    const nadiLine = report.doshaSummary.nadiDosha
      ? (lang === 'hi' ? '• नाड़ी दोष उपस्थित' : '• Nadi Dosha Present')
      : (lang === 'hi' ? '• नाड़ी अनुकूल (कोई दोष नहीं)' : '• Nadi Compatible (No Dosha)');
    const bhakootLine = report.doshaSummary.bhakootDosha
      ? (lang === 'hi' ? '• भकूट दोष उपस्थित' : '• Bhakoot Dosha Present')
      : (lang === 'hi' ? '• भकूट शुभ (कोई दोष नहीं)' : '• Bhakoot Auspicious (No Dosha)');
    const manglikLine = `• ${lang === 'hi' ? report.doshaSummary.manglikCheck.hindiStatus : report.doshaSummary.manglikCheck.status}`;

    ctx.fillText(nadiLine, MARGIN_X + 20, y + 72);
    ctx.fillText(bhakootLine, MARGIN_X + 20, y + 104);
    const mLines = wrapCanvasText(ctx, manglikLine, CONTENT_W - 40);
    let my = y + 136;
    for (const ml of mLines.slice(0, 2)) {
      ctx.fillText(ml, MARGIN_X + 20, my);
      my += 24;
    }
  }

  flushCanvasToPdf(doc, canvas, true);
  const blob = doc.output('blob');
  return triggerPdfSave(blob, filename, `${report.boyName} & ${report.girlName} Kundali Milan`);
}

export async function generateAndDownloadGuestListPdf(options: {
  title: string;
  date?: string;
  venue?: string;
  guests: GuestItem[];
  lang: 'en' | 'hi';
  filenameBase?: string;
}): Promise<'downloaded' | 'shared' | 'cancelled'> {
  const { title, date, venue, guests, lang, filenameBase } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');

  const safeSlug =
    (filenameBase || title)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'guest-list';
  const filename = safeSlug.startsWith('guest-list') ? `${safeSlug}.pdf` : `guest-list-${safeSlug}.pdf`;

  if (!ctx) {
    doc.setFontSize(18);
    doc.text(title, 40, 50);
    doc.setFontSize(11);
    let py = 80;
    guests.forEach((g, idx) => {
      if (py > 780) {
        doc.addPage();
        py = 50;
      }
      doc.text(`${idx + 1}. ${g.name} | ${g.phone} | ${g.address} | Pax: ${g.membersCount} | ${g.status}`, 40, py);
      py += 18;
    });
    const blob = doc.output('blob');
    return triggerPdfSave(blob, filename, title);
  }

  let pageNumber = 1;
  let isFirstPage = true;
  initPageCanvas(ctx, lang === 'hi' ? 'अतिथि सूची' : 'Guest Directory', pageNumber);

  // Occasion Banner
  drawRoundedRect(ctx, MARGIN_X, 140, CONTENT_W, 118, 16);
  ctx.fillStyle = '#4C0D1B';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 30px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  const titleLines = wrapCanvasText(ctx, title, CONTENT_W - 48);
  ctx.fillText(titleLines[0] || title, MARGIN_X + 24, 184);

  const metaLine = [
    date ? `${lang === 'hi' ? 'दिनांक' : 'Date'}: ${date}` : '',
    venue ? `${lang === 'hi' ? 'स्थान' : 'Venue'}: ${venue}` : ''
  ]
    .filter(Boolean)
    .join('   •   ');
  ctx.fillStyle = '#FDE68A';
  ctx.font = '500 18px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    metaLine || `${guests.length} ${lang === 'hi' ? 'परिवार' : 'Families'}`,
    MARGIN_X + 24,
    224
  );

  // Summary Pills
  const totalPax = guests.reduce((sum, g) => sum + (Number(g.membersCount) || 1), 0);
  const confirmedCount = guests.filter((g) => g.status === 'Confirmed').length;
  const statW = (CONTENT_W - 28) / 3;
  const stats = [
    { label: lang === 'hi' ? 'अतिथि परिवार' : 'Guest Entries', val: String(guests.length) },
    { label: lang === 'hi' ? 'कुल सदस्य' : 'Total Attendees', val: String(totalPax) },
    { label: lang === 'hi' ? 'पुष्ट उपस्थिति' : 'Confirmed RSVP', val: String(confirmedCount) }
  ];

  stats.forEach((st, idx) => {
    const sx = MARGIN_X + idx * (statW + 14);
    drawRoundedRect(ctx, sx, 276, statW, 74, 12);
    ctx.fillStyle = '#FFFBEB';
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#78716C';
    ctx.font = 'bold 15px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(st.label, sx + 16, 302);
    ctx.fillStyle = '#380812';
    ctx.font = 'bold 26px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(st.val, sx + 16, 336);
  });

  const drawTableHeader = (topY: number) => {
    ctx.fillStyle = '#380812';
    ctx.fillRect(MARGIN_X, topY, CONTENT_W, 42);
    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'bold 16px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText('#', MARGIN_X + 12, topY + 26);
    ctx.fillText(lang === 'hi' ? 'नाम व संबंध' : 'Guest & Relation', MARGIN_X + 54, topY + 26);
    ctx.fillText(lang === 'hi' ? 'मोबाइल' : 'Phone', MARGIN_X + 350, topY + 26);
    ctx.fillText(lang === 'hi' ? 'पता व शहर' : 'Address & City', MARGIN_X + 520, topY + 26);
    ctx.fillText(lang === 'hi' ? 'सदस्य' : 'Pax', MARGIN_X + 870, topY + 26);
    ctx.fillText(lang === 'hi' ? 'स्थिति' : 'Status', MARGIN_X + 945, topY + 26);
    return topY + 42;
  };

  let cursorY = drawTableHeader(372);

  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    const addrText = `${g.address || ''}${g.city ? `, ${g.city}` : ''}`.trim() || '-';
    ctx.font = '500 16px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    const nameLines = wrapCanvasText(ctx, g.name, 280);
    const addrLines = wrapCanvasText(ctx, addrText, 330);
    const rowLines = Math.max(nameLines.length + (g.category ? 1 : 0), addrLines.length, 1);
    const rowH = Math.max(52, 22 + rowLines * 21);

    if (cursorY + rowH > BODY_MAX_Y) {
      flushCanvasToPdf(doc, canvas, isFirstPage);
      isFirstPage = false;
      pageNumber += 1;
      initPageCanvas(ctx, lang === 'hi' ? 'अतिथि सूची' : 'Guest Directory', pageNumber);
      cursorY = drawTableHeader(140);
    }

    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
    ctx.fillRect(MARGIN_X, cursorY, CONTENT_W, rowH);
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN_X, cursorY, CONTENT_W, rowH);

    ctx.fillStyle = '#57534E';
    ctx.font = 'bold 16px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(i + 1), MARGIN_X + 12, cursorY + 28);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 17px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    let ny = cursorY + 26;
    for (const nl of nameLines) {
      ctx.fillText(nl, MARGIN_X + 54, ny);
      ny += 21;
    }
    if (g.category) {
      ctx.fillStyle = '#78716C';
      ctx.font = '500 14px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
      ctx.fillText(g.category, MARGIN_X + 54, ny);
    }

    ctx.fillStyle = '#292524';
    ctx.font = '500 16px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(g.phone || '-', MARGIN_X + 350, cursorY + 28);

    let ay = cursorY + 26;
    for (const al of addrLines) {
      ctx.fillText(al, MARGIN_X + 520, ay);
      ay += 21;
    }

    ctx.fillStyle = '#380812';
    ctx.font = 'bold 17px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(g.membersCount || 1), MARGIN_X + 882, cursorY + 28);

    ctx.fillStyle = g.status === 'Confirmed' ? '#065F46' : g.status === 'Card Sent' ? '#1D4ED8' : '#92400E';
    ctx.font = 'bold 15px "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif';
    ctx.fillText(g.status, MARGIN_X + 945, cursorY + 28);

    cursorY += rowH;
  }

  flushCanvasToPdf(doc, canvas, isFirstPage);
  const blob = doc.output('blob');
  return triggerPdfSave(blob, filename, title);
}
