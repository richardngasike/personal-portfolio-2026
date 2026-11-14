import 'server-only';

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { formatDate, formatMoney, lineTotal } from './compute';
import { KIND_LABELS, STATUS_LABELS, type BillingDocument, type Issuer } from './types';

// Builds the downloadable PDF. Invoices and quotations share the brand
// (charcoal ink, gold accent, serif titles) but have their own layouts:
// an invoice opens with an ink bar and closes on a solid "Amount due" block;
// a quotation carries a gold spine down the left edge and an outlined total.

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const RIGHT = A4.width - MARGIN;

const INK = rgb(0.063, 0.075, 0.09);
const TEXT = rgb(0.16, 0.18, 0.2);
const MUTED = rgb(0.42, 0.44, 0.47);
const RULE = rgb(0.87, 0.86, 0.83);
const GOLD = rgb(0.72, 0.54, 0.17);
const WHITE = rgb(1, 1, 1);
const SAND = rgb(0.97, 0.96, 0.93);

// The standard PDF fonts only cover Windows-1252. Anything else is replaced
// so an unusual character can never make the download fail.
function clean(value: string): string {
  return (value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\t/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of clean(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function embedLogo(pdf: PDFDocument, url: string | null): Promise<PDFImage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) return null;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    if (isPng) return await pdf.embedPng(bytes);
    if (isJpeg) return await pdf.embedJpg(bytes);
    return null; // SVG and WebP cannot be embedded; the name is printed instead.
  } catch {
    return null;
  }
}

export async function renderBillingPdf(doc: BillingDocument, issuer: Issuer): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const isInvoice = doc.kind === 'invoice';
  const label = KIND_LABELS[doc.kind];
  pdf.setTitle(`${label} ${doc.number}`);
  pdf.setAuthor(issuer.name);
  pdf.setSubject(`${label} for ${clean(doc.client_name)}`);
  pdf.setCreator(issuer.website);

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, issuer.logoUrl);

  let page!: PDFPage;
  let y = 0; // distance from the top edge

  const draw = (value: string, x: number, top: number, font: PDFFont, size: number, color = TEXT) =>
    page.drawText(clean(value), { x, y: A4.height - top - size, font, size, color });
  const drawRight = (value: string, right: number, top: number, font: PDFFont, size: number, color = TEXT) =>
    draw(value, right - font.widthOfTextAtSize(clean(value), size), top, font, size, color);
  const rule = (top: number, from = MARGIN, to = RIGHT, color = RULE, thickness = 0.75) =>
    page.drawLine({ start: { x: from, y: A4.height - top }, end: { x: to, y: A4.height - top }, thickness, color });
  const box = (x: number, top: number, width: number, height: number, color: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x, y: A4.height - top - height, width, height, color });

  const footerText = [issuer.name, issuer.email, issuer.phone, issuer.website].filter(Boolean).join('   |   ');

  function newPage() {
    page = pdf.addPage([A4.width, A4.height]);
    if (isInvoice) box(0, 0, A4.width, 10, INK);
    else box(0, 0, 10, A4.height, GOLD);
    rule(A4.height - 46);
    const size = 8;
    draw(footerText, (A4.width - sans.widthOfTextAtSize(clean(footerText), size)) / 2, A4.height - 36, sans, size, MUTED);
    y = 52;
  }

  function ensure(space: number) {
    if (y + space > A4.height - 70) {
      newPage();
      drawRight(`${label} ${doc.number} (continued)`, RIGHT, y, sans, 8, MUTED);
      y += 26;
    }
  }

  // Header -------------------------------------------------------------------
  newPage();

  const titleSize = 30;
  if (logo) {
    const scale = Math.min(170 / logo.width, 48 / logo.height);
    page.drawImage(logo, { x: MARGIN, y: A4.height - y - logo.height * scale, width: logo.width * scale, height: logo.height * scale });
  } else {
    draw(issuer.name, MARGIN, y + 6, serif, 20, INK);
  }
  drawRight(label, RIGHT, y, serif, titleSize, INK);
  drawRight(doc.number, RIGHT, y + titleSize + 8, bold, 10, isInvoice ? INK : GOLD);
  y += 64;

  draw([issuer.location, issuer.email, issuer.phone].filter(Boolean).join('   '), MARGIN, y, sans, 8.5, MUTED);
  y += 20;
  rule(y, MARGIN, RIGHT, isInvoice ? INK : GOLD, isInvoice ? 1 : 1.5);
  y += 24;

  // Parties and dates ------------------------------------------------------------
  const blockTop = y;
  draw(isInvoice ? 'Billed to' : 'Prepared for', MARGIN, y, sans, 8.5, MUTED);
  y += 15;
  draw(doc.client_name, MARGIN, y, bold, 12, INK);
  y += 17;
  const clientLines = [doc.client_company, ...doc.client_address.split('\n'), doc.client_email, doc.client_phone].filter(Boolean);
  for (const entry of clientLines) {
    for (const part of wrap(entry, sans, 9.5, 250)) {
      draw(part, MARGIN, y, sans, 9.5);
      y += 13.5;
    }
  }

  const details: Array<[string, string]> = [
    ['Date', formatDate(doc.issue_date)],
    ...(doc.due_date ? [[isInvoice ? 'Due date' : 'Valid until', formatDate(doc.due_date)] as [string, string]] : []),
    ['Status', STATUS_LABELS[doc.status]],
  ];
  let detailY = blockTop;
  for (const [name, value] of details) {
    draw(name, 360, detailY, sans, 8.5, MUTED);
    drawRight(value, RIGHT, detailY, bold, 9.5, INK);
    detailY += 18;
  }
  y = Math.max(y, detailY) + 14;

  if (doc.title) {
    for (const part of wrap(doc.title, serif, 14, RIGHT - MARGIN)) {
      draw(part, MARGIN, y, serif, 14, INK);
      y += 19;
    }
    y += 8;
  }

  // Line items -------------------------------------------------------------------
  const columns = { description: MARGIN + 10, quantity: 380, price: 470, amount: RIGHT - 10 };
  function tableHeader() {
    const height = 24;
    if (isInvoice) box(MARGIN, y, RIGHT - MARGIN, height, INK);
    else {
      box(MARGIN, y, RIGHT - MARGIN, height, SAND);
      rule(y + height, MARGIN, RIGHT, GOLD, 1.25);
    }
    const color = isInvoice ? WHITE : INK;
    draw('Description', columns.description, y + 8, bold, 8.5, color);
    drawRight('Qty', columns.quantity, y + 8, bold, 8.5, color);
    drawRight('Unit price', columns.price, y + 8, bold, 8.5, color);
    drawRight('Amount', columns.amount, y + 8, bold, 8.5, color);
    y += height + 10;
  }
  tableHeader();

  for (const item of doc.items) {
    const lines = wrap(item.description, sans, 9.5, 270);
    const height = lines.length * 13.5 + 12;
    if (y + height > A4.height - 70) {
      ensure(A4.height);
      tableHeader();
    }
    lines.forEach((part, index) => draw(part, columns.description, y + index * 13.5, sans, 9.5));
    drawRight(String(item.quantity), columns.quantity, y, sans, 9.5);
    drawRight(formatMoney(item.unit_price, '').trim(), columns.price, y, sans, 9.5);
    drawRight(formatMoney(lineTotal(item), '').trim(), columns.amount, y, sans, 9.5, INK);
    y += height;
    rule(y - 6);
  }
  y += 10;

  // Totals -----------------------------------------------------------------------
  const totalsLeft = 340;
  const rows: Array<[string, string]> = [['Subtotal', formatMoney(doc.subtotal, doc.currency)]];
  if (doc.discount > 0) rows.push(['Discount', `- ${formatMoney(doc.discount, doc.currency)}`]);
  if (doc.tax_amount > 0) rows.push([`Tax (${doc.tax_rate}%)`, formatMoney(doc.tax_amount, doc.currency)]);
  rows.push(['Total', formatMoney(doc.total, doc.currency)]);
  if (isInvoice && doc.amount_paid > 0) rows.push(['Paid', `- ${formatMoney(doc.amount_paid, doc.currency)}`]);

  ensure(rows.length * 18 + 70);
  const totalsTop = y;
  for (const [name, value] of rows) {
    const strong = name === 'Total';
    draw(name, totalsLeft, y, strong ? bold : sans, 9.5, strong ? INK : MUTED);
    drawRight(value, columns.amount, y, strong ? bold : sans, 9.5, INK);
    y += 18;
  }
  y += 4;

  const highlight = isInvoice ? formatMoney(doc.balance_due, doc.currency) : formatMoney(doc.total, doc.currency);
  const highlightLabel = isInvoice ? 'Amount due' : 'Quoted total';
  const highlightHeight = 40;
  if (isInvoice) box(totalsLeft - 12, y, RIGHT - totalsLeft + 12, highlightHeight, INK);
  else
    page.drawRectangle({
      x: totalsLeft - 12,
      y: A4.height - y - highlightHeight,
      width: RIGHT - totalsLeft + 12,
      height: highlightHeight,
      borderColor: GOLD,
      borderWidth: 1.5,
      color: WHITE,
    });
  draw(highlightLabel, totalsLeft, y + 15, sans, 9, isInvoice ? WHITE : MUTED);
  drawRight(highlight, columns.amount, y + 12.5, bold, 13, isInvoice ? WHITE : INK);
  const afterTotals = y + highlightHeight + 24;

  // Payment details and notes, beside the totals when there is room ---------------------
  y = totalsTop;
  const sections: Array<[string, string]> = [];
  if (doc.payment_details) sections.push([isInvoice ? 'Payment details' : 'Terms', doc.payment_details]);
  if (doc.notes) sections.push(['Notes', doc.notes]);
  for (const [heading, body] of sections) {
    const lines = wrap(body, sans, 9, 250);
    ensure(lines.length * 12.5 + 30);
    draw(heading, MARGIN, y, bold, 8.5, isInvoice ? INK : GOLD);
    y += 15;
    for (const part of lines) {
      ensure(14);
      draw(part, MARGIN, y, sans, 9);
      y += 12.5;
    }
    y += 12;
  }
  y = Math.max(y, afterTotals);

  if (!isInvoice) {
    ensure(40);
    draw('To accept this quotation, reply to confirm and work will be scheduled.', MARGIN, y, sans, 9, MUTED);
  }

  return pdf.save();
}
