import PDFDocument from 'pdfkit';
import type { Expense, TesRecord } from '@rotortech-tes/shared';
import { fmtDate, fmtMoney, fmtPeriod, totalOf } from '@rotortech-tes/shared';

const INK = '#1d1f20';
const MUTED = '#5d5d60';
const ACCENT = '#416180';
const RULE = '#d4d4d7';

/** Renders a one-page TES summary PDF — trip info, the expense table, and
 *  (once accounts has finalized it) the settlement block — as the document
 *  saved to the shared Rotortech Google Drive folder. Returns the PDF as a
 *  Buffer; callers upload it, they don't touch the filesystem. */
export function generateTesPdf(record: TesRecord, expenses: Expense[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor(INK).fontSize(18).text('Rotortech Energy Solutions', { continued: false });
    doc.fontSize(11).fillColor(MUTED).text('Travel Expense Settlement');
    doc.moveDown(0.6);
    doc.strokeColor(RULE).moveTo(doc.x, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown(0.8);

    doc.fillColor(ACCENT).fontSize(16).text(record.tesNo);
    doc.fillColor(INK).fontSize(11).text(record.purpose || '—');
    doc.moveDown(0.6);

    const rows: [string, string][] = [
      ['Employee', `${record.employeeName} (${record.employeeId})`],
      ['Project Code', record.projectCode || '—'],
      ['Location', record.location || '—'],
      ['Period', fmtPeriod(record.startDate || null, record.endDate || null)],
      ['Advance Paid', fmtMoney(record.advanceAmount)],
    ];
    doc.fontSize(10);
    for (const [label, value] of rows) {
      doc.fillColor(MUTED).text(label, { continued: true, width: 140 });
      doc.fillColor(INK).text('  ' + value);
    }
    doc.moveDown(0.8);

    // Expense table
    const colX = { category: 48, date: 168, desc: 240, bill: 400, amount: 460 };
    doc.fillColor(MUTED).fontSize(9);
    doc.text('CATEGORY', colX.category, doc.y, { continued: false });
    doc.text('DATE', colX.date, doc.y - 11);
    doc.text('DESCRIPTION', colX.desc, doc.y - 11);
    doc.text('BILL NO', colX.bill, doc.y - 11);
    doc.text('AMOUNT', colX.amount, doc.y - 11, { width: 87, align: 'right' });
    doc.moveDown(0.3);
    doc.strokeColor(RULE).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9.5).fillColor(INK);
    for (const ex of expenses) {
      const y = doc.y;
      doc.text(ex.category, colX.category, y, { width: 110 });
      doc.text(fmtDate(ex.date), colX.date, y, { width: 64 });
      doc.text(ex.description || '—', colX.desc, y, { width: 150 });
      doc.text(ex.billNo || '—', colX.bill, y, { width: 54 });
      doc.text(fmtMoney(ex.amount), colX.amount, y, { width: 87, align: 'right' });
      doc.moveDown(0.5);
    }
    doc.strokeColor(RULE).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10.5).font('Helvetica-Bold');
    doc.text('Total', colX.desc, doc.y);
    doc.text(fmtMoney(totalOf(expenses)), colX.amount, doc.y - 13, { width: 87, align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(1);

    if (record.accountsEntryDate) {
      doc.strokeColor(RULE).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
      doc.moveDown(0.6);
      doc.fillColor(ACCENT).fontSize(10).text('SETTLEMENT', { characterSpacing: 1 });
      doc.fillColor(INK).fontSize(10).moveDown(0.3);
      const settleRows: [string, string][] = [
        ['Advance', fmtMoney(record.advanceAmount)],
        ['Expense Approved', fmtMoney(record.expenseApproved)],
        ['Balance to Employee', fmtMoney(record.balanceEmployee)],
        ['Balance to Company', fmtMoney(record.balanceCompany)],
        ['Accounts Entry Date', fmtDate(record.accountsEntryDate)],
      ];
      for (const [label, value] of settleRows) {
        doc.fillColor(MUTED).text(label, { continued: true, width: 160 });
        doc.fillColor(INK).text('  ' + value);
      }
    }

    doc.moveDown(1.2);
    doc.fontSize(8).fillColor(MUTED).text(
      `Generated ${new Date().toISOString()} — status: ${record.stage.replace('_', ' ')}`,
    );

    doc.end();
  });
}
