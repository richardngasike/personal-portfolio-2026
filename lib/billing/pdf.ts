import 'server-only';

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { formatDate, formatMoney, lineTotal } from './compute';
import { amountInWords } from './words';
import { KIND_LABELS, STATUS_LABELS, type BillingDocument, type Issuer } from './types';

// The downloadable PDF, matching the on-screen document and Richard's formal
// template: red accents, grey panels, a numbered deliverables table, amount
// in words, banking details and a signature page.

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 44;
const RIGHT = A4.width - MARGIN;
const WIDTH = RIGHT - MARGIN;

const INK = rgb(0.1, 0.1, 0.1);
const BODY = rgb(0.2, 0.2, 0.2);
const SOFT = rgb(0.42, 0.42, 0.42);
const RED = rgb(0.753, 0.224, 0.169);
const WHITE = rgb(1, 1, 1);
const PANEL = rgb(0.957, 0.957, 0.957);
const PANEL_LINE = rgb(0.886, 0.886, 0.886);
const LINE = rgb(0.85, 0.85, 0.85);
const TOTAL_BG = rgb(0.925, 0.925, 0.925);

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
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await pdf.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await pdf.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

export async function renderBillingPdf(doc: BillingDocument, issuer: Issuer, shareUrl: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const isInvoice = doc.kind === 'invoice';
  const label = KIND_LABELS[doc.kind];
  pdf.setTitle(`${label} ${doc.number}`);
  pdf.setAuthor(issuer.name);
  pdf.setSubject(`${label} for ${clean(doc.client_name)}`);

  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, issuer.logoUrl);

  let page!: PDFPage;
  let y = 0;

  const text = (value: string, x: number, size: number, font: PDFFont, color = BODY) =>
    page.drawText(clean(value), { x, y: A4.height - y - size, font, size, color });
  const textAt = (value: string, x: number, top: number, size: number, font: PDFFont, color = BODY) =>
    page.drawText(clean(value), { x, y: A4.height - top - size, font, size, color });
  const right = (value: string, r: number, size: number, font: PDFFont, color = BODY) =>
    text(value, r - font.widthOfTextAtSize(clean(value), size), size, font, color);
  const rightAt = (value: string, r: number, top: number, size: number, font: PDFFont, color = BODY) =>
    textAt(value, r - font.widthOfTextAtSize(clean(value), size), top, size, font, color);
  const fillRect = (x: number, top: number, w: number, h: number, color: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x, y: A4.height - top - h, width: w, height: h, color });
  const strokeRect = (x: number, top: number, w: number, h: number, color = LINE, thickness = 0.75) =>
    page.drawRectangle({ x, y: A4.height - top - h, width: w, height: h, borderColor: color, borderWidth: thickness });
  const hline = (top: number, from = MARGIN, to = RIGHT, color = LINE, thickness = 0.75) =>
    page.drawLine({ start: { x: from, y: A4.height - top }, end: { x: to, y: A4.height - top }, thickness, color });

  function heading(value: string) {
    y += 8;
    text(value.toUpperCase(), MARGIN, 9, bold, RED);
    y += 18;
  }

  function startPage() {
    page = pdf.addPage([A4.width, A4.height]);
    y = MARGIN;
    fillRect(MARGIN, y, WIDTH, 2, RED);
    y += 16;
  }

  function ensure(space: number) {
    if (y + space > A4.height - MARGIN) {
      startPage();
    }
  }

  // ---- Page 1 --------------------------------------------------------------
  startPage();

  text(label.toUpperCase(), MARGIN, 30, bold, INK);
  y += 34;
  if (doc.title) {
    for (const line of wrap(doc.title, sans, 12, WIDTH)) {
      text(line, MARGIN, 12, sans, SOFT);
      y += 16;
    }
  }
  y += 10;

  // Two grey panels
  const panelTop = y;
  const panelW = WIDTH / 2;
  const leftLines: Array<[string, PDFFont]> = [[issuer.name, bold]];
  for (const line of issuer.address.split('\n').filter(Boolean)) leftLines.push([line, sans]);
  if (issuer.phone) leftLines.push([`Phone: ${issuer.phone}`, sans]);
  if (issuer.email) leftLines.push([`E-Mail: ${issuer.email}`, sans]);

  const rightRows: Array<[string, string]> = [
    [`${label} No.:`, doc.number],
    [`${label} date:`, formatDate(doc.issue_date)],
  ];
  if (doc.due_date) rightRows.push([isInvoice ? 'Due date:' : 'Valid until:', formatDate(doc.due_date)]);
  rightRows.push(['Currency:', doc.currency], ['Status:', STATUS_LABELS[doc.status]]);

  const panelH = Math.max(leftLines.length, rightRows.length + 1) * 14 + 24;
  fillRect(MARGIN, panelTop, WIDTH, panelH, PANEL);
  strokeRect(MARGIN, panelTop, WIDTH, panelH, PANEL_LINE);
  page.drawLine({ start: { x: MARGIN + panelW, y: A4.height - panelTop - 8 }, end: { x: MARGIN + panelW, y: A4.height - panelTop - panelH + 8 }, thickness: 0.75, color: PANEL_LINE });

  let ly = panelTop + 14;
  for (const [line, font] of leftLines) {
    textAt(line, MARGIN + 14, ly, 9.5, font, font === bold ? INK : BODY);
    ly += 14;
  }
  textAt(`${label} details`, MARGIN + panelW + 14, panelTop + 14, 9.5, bold, RED);
  let ry = panelTop + 32;
  for (const [k, v] of rightRows) {
    textAt(k, MARGIN + panelW + 14, ry, 9, bold, INK);
    textAt(v, MARGIN + panelW + 14 + 86, ry, 9, sans, BODY);
    ry += 14;
  }
  y = panelTop + panelH + 10;

  // Bill to
  heading(isInvoice ? 'Bill to' : 'Prepared for');
  const billLines = [doc.client_name, doc.client_company, ...doc.client_address.split('\n'), doc.client_email, doc.client_phone].filter(Boolean);
  const billH = billLines.length * 13 + 16;
  fillRect(MARGIN, y, WIDTH, billH, PANEL);
  strokeRect(MARGIN, y, WIDTH, billH, PANEL_LINE);
  let by = y + 12;
  billLines.forEach((line, i) => {
    textAt(line, MARGIN + 14, by, 9.5, i === 0 ? bold : sans, i === 0 ? INK : BODY);
    by += 13;
  });
  y += billH + 4;

  // Deliverables table
  heading(isInvoice ? 'Deliverables' : 'Items');
  const cols = { no: MARGIN, desc: MARGIN + 32, qty: RIGHT - 200, price: RIGHT - 110, amount: RIGHT };
  const colLines = [MARGIN + 32, RIGHT - 210, RIGHT - 120];

  function tableHeader() {
    const h = 20;
    fillRect(MARGIN, y, WIDTH, h, RED);
    textAt('No.', MARGIN + 8, y + 6, 8.5, bold, WHITE);
    textAt('Description', cols.desc + 6, y + 6, 8.5, bold, WHITE);
    rightAt(`Qty`, cols.qty + 40, y + 6, 8.5, bold, WHITE);
    rightAt(`Unit price`, cols.price + 30, y + 6, 8.5, bold, WHITE);
    rightAt(`Total`, cols.amount - 6, y + 6, 8.5, bold, WHITE);
    y += h;
  }
  tableHeader();

  doc.items.forEach((item, index) => {
    const lines = wrap(item.description, sans, 9, RIGHT - 210 - cols.desc - 12);
    const h = Math.max(lines.length * 12 + 8, 20);
    ensure(h + 30);
    if (y === MARGIN + 16) tableHeader();
    strokeRect(MARGIN, y, WIDTH, h, LINE);
    for (const line of colLines) page.drawLine({ start: { x: line, y: A4.height - y }, end: { x: line, y: A4.height - y - h }, thickness: 0.75, color: LINE });
    textAt(String(index + 1), MARGIN + 12, y + 5, 9, sans, BODY);
    lines.forEach((line, i) => textAt(line, cols.desc + 6, y + 5 + i * 12, 9, sans, BODY));
    rightAt(String(item.quantity), cols.qty + 40, y + 5, 9, sans, BODY);
    rightAt(formatMoney(item.unit_price, '').trim(), cols.price + 30, y + 5, 9, sans, BODY);
    rightAt(formatMoney(lineTotal(item), '').trim(), cols.amount - 6, y + 5, 9, sans, INK);
    y += h;
  });

  // TOTAL row
  const totalH = 22;
  fillRect(MARGIN, y, WIDTH, totalH, TOTAL_BG);
  strokeRect(MARGIN, y, WIDTH, totalH, LINE);
  rightAt('TOTAL', cols.qty + 40, y + 7, 9.5, bold, INK);
  rightAt(`${doc.currency} ${formatMoney(doc.total, '').trim()}`, cols.amount - 6, y + 7, 9.5, bold, RED);
  y += totalH + 6;

  // Adjustments
  const adjust: Array<[string, string, boolean]> = [];
  if (doc.discount > 0 || doc.tax_amount > 0 || (isInvoice && doc.amount_paid > 0)) {
    adjust.push(['Subtotal', formatMoney(doc.subtotal, doc.currency), false]);
    if (doc.discount > 0) adjust.push(['Discount', `- ${formatMoney(doc.discount, doc.currency)}`, false]);
    if (doc.tax_amount > 0) adjust.push([`Tax (${doc.tax_rate}%)`, formatMoney(doc.tax_amount, doc.currency), false]);
    if (isInvoice && doc.amount_paid > 0) {
      adjust.push(['Paid', `- ${formatMoney(doc.amount_paid, doc.currency)}`, false]);
      adjust.push(['Amount due', formatMoney(doc.balance_due, doc.currency), true]);
    }
  }
  for (const [k, v, strong] of adjust) {
    ensure(20);
    textAt(k, RIGHT - 210, y, 9, strong ? bold : sans, strong ? INK : SOFT);
    rightAt(v, RIGHT, y, 9, strong ? bold : sans, strong ? RED : INK);
    y += 15;
  }
  y += 6;

  // Amount in words
  ensure(50);
  heading('Amount in words');
  const words = amountInWords(isInvoice ? doc.balance_due : doc.total, doc.currency);
  const wordLines = wrap(words, sans, 9.5, WIDTH - 24);
  const wordsH = wordLines.length * 13 + 14;
  fillRect(MARGIN, y, WIDTH, wordsH, PANEL);
  strokeRect(MARGIN, y, WIDTH, wordsH, PANEL_LINE);
  let wy = y + 11;
  for (const line of wordLines) {
    textAt(line, MARGIN + 12, wy, 9.5, sans, INK);
    wy += 13;
  }
  y += wordsH + 4;

  // Banking details (invoice only)
  const bank: Array<[string, string]> = [
    ['Account holder name', issuer.banking.accountName],
    ['Account number', issuer.banking.accountNumber],
    ['Bank name', issuer.banking.bankName],
    ['Branch', issuer.banking.branch],
    ['Bank address', issuer.banking.bankAddress],
    ['IBAN number', issuer.banking.iban],
    ['SWIFT code', issuer.banking.swift],
    ['M-Pesa', issuer.banking.mpesa],
  ].filter(([, v]) => v) as Array<[string, string]>;

  if (isInvoice && bank.length > 0) {
    ensure(40 + bank.length * 20);
    heading('Banking details');
    const labelW = WIDTH * 0.38;
    for (const [k, v] of bank) {
      const rowH = 20;
      strokeRect(MARGIN, y, labelW, rowH, LINE);
      strokeRect(MARGIN + labelW, y, WIDTH - labelW, rowH, LINE);
      fillRect(MARGIN + 0.75, y + 0.75, labelW - 1.5, rowH - 1.5, PANEL);
      textAt(k, MARGIN + 10, y + 6, 9, bold, INK);
      textAt(v, MARGIN + labelW + 10, y + 6, 9, sans, BODY);
      y += rowH;
    }
    y += 4;
  }

  if (isInvoice && doc.payment_details) {
    ensure(40);
    for (const line of wrap(doc.payment_details, sans, 9, WIDTH)) {
      textAt(line, MARGIN, y, 9, sans, BODY);
      y += 13;
    }
    y += 6;
  }

  if (!isInvoice && doc.payment_details) {
    ensure(40);
    heading('Terms');
    for (const line of wrap(doc.payment_details, sans, 9, WIDTH)) {
      textAt(line, MARGIN, y, 9, sans, BODY);
      y += 13;
    }
    y += 6;
  }

  if (doc.notes) {
    ensure(40);
    heading('Notes');
    for (const line of wrap(doc.notes, sans, 9, WIDTH)) {
      textAt(line, MARGIN, y, 9, sans, SOFT);
      y += 13;
    }
  }

  // Footline (flows after the content)
  y += 12;
  ensure(30);
  hline(y);
  y += 10;
  const footline = `${label} - ${issuer.name}${doc.client_company || doc.client_name ? ` | ${doc.client_company || doc.client_name}` : ''} | ${doc.issue_date.slice(0, 4)}`;
  textAt(footline, (A4.width - sans.widthOfTextAtSize(clean(footline), 8)) / 2, y, 8, sans, SOFT);
  y += 24;

  // Signature block. It flows after the content and only moves to a new page
  // if it does not fit; the footer is kept with it so they never split.
  const logoH = logo ? Math.min(44, (logo.height * 150) / logo.width) : 0;
  const signBlockH = 16 + 30 + (logo ? logoH + 6 : 0) + 2 * 18 + 60;
  ensure(signBlockH);
  y += 16;
  const colW = (WIDTH - 40) / 2;
  const signCols: Array<{ x: number; name: string; role: string; lines: string[]; mark: boolean }> = [
    { x: MARGIN, name: issuer.name, role: isInvoice ? 'Service provider' : 'Prepared by', lines: ['Signature: ____________________________', `Date: ${formatDate(doc.issue_date)}`], mark: Boolean(logo) },
    { x: MARGIN + colW + 40, name: `For ${doc.client_company || doc.client_name}`, role: isInvoice ? 'Received / Approved' : 'Accepted', lines: ['Name: ____________________________', 'Signature / Date: ____________________'], mark: false },
  ];
  const signTop = y;
  let signBottom = y;
  for (const col of signCols) {
    let sy = signTop;
    textAt(col.name, col.x, sy, 10.5, bold, INK);
    sy += 16;
    textAt(col.role, col.x, sy, 9.5, sans, SOFT);
    sy += 30;
    if (col.mark && logo) {
      const scale = Math.min(150 / logo.width, 44 / logo.height);
      page.drawImage(logo, { x: col.x, y: A4.height - sy - logo.height * scale, width: logo.width * scale, height: logo.height * scale });
      sy += logo.height * scale + 6;
    }
    for (const line of col.lines) {
      textAt(line, col.x, sy, 9.5, sans, BODY);
      sy += 18;
    }
    signBottom = Math.max(signBottom, sy);
  }
  y = signBottom + 20;

  // Footer: website and the shareable link, at the end of the document.
  hline(y);
  y += 10;
  textAt(issuer.website, (A4.width - bold.widthOfTextAtSize(clean(issuer.website), 9.5)) / 2, y, 9.5, bold, INK);
  y += 13;
  textAt(shareUrl, (A4.width - sans.widthOfTextAtSize(clean(shareUrl), 8)) / 2, y, 8, sans, RED);

  return pdf.save();
}
