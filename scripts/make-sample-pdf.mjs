// Generates a password-protected sample PDF used for App Store screenshots.
// Usage: node scripts/make-sample-pdf.mjs [output.pdf]
import { writeFileSync } from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';

const out = process.argv[2] ?? 'assets/screenshots/Invoice-2026.pdf';

const doc = await PDFDocument.create();
const page = doc.addPage([595, 842]); // A4
const helvetica = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

const accent = rgb(0.23, 0.42, 0.96);
page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: accent });
page.drawText('ACME Corp.', { x: 48, y: 803, size: 20, font: bold, color: rgb(1, 1, 1) });
page.drawText('Invoice #2026-0612', { x: 48, y: 730, size: 16, font: bold });
page.drawText('Billed to: Jane Appleseed', { x: 48, y: 700, size: 12, font: helvetica });
page.drawText('Date: June 12, 2026', { x: 48, y: 682, size: 12, font: helvetica });

const rows = [
  ['Design services', '12 h', '$1,440.00'],
  ['Development', '28 h', '$4,200.00'],
  ['Project management', '6 h', '$660.00'],
];
let y = 630;
for (const [item, qty, price] of rows) {
  page.drawText(item, { x: 48, y, size: 12, font: helvetica });
  page.drawText(qty, { x: 380, y, size: 12, font: helvetica });
  page.drawText(price, { x: 470, y, size: 12, font: helvetica });
  y -= 24;
}
page.drawLine({ start: { x: 48, y: y + 8 }, end: { x: 547, y: y + 8 }, color: accent });
page.drawText('Total: $6,300.00', { x: 400, y: y - 16, size: 14, font: bold });

doc.encrypt({ userPassword: 'demo1234' });
writeFileSync(out, await doc.save());
console.log(`Wrote ${out} (password: demo1234)`);
