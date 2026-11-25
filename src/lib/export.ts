import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const safeData = data && data.length > 0 ? data : [{ 'No Records': 'No data available' }];
  const headers = Array.from(
    safeData.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...safeData.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ];

  // Include UTF-8 BOM so currency symbols (e.g., ৳) render properly in Excel
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, `${filename}.csv`);
}

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const safeData = data && data.length > 0 ? data : [{ 'No Records': 'No data available' }];
  const headers = Array.from(
    safeData.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const workbook = new ExcelJS.Workbook();
  const safeSheetName = sheetName.slice(0, 31).replace(/[*?:\\/[\]]/g, '_') || 'Sheet1';
  const worksheet = workbook.addWorksheet(safeSheetName);

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 4, 16),
  }));

  safeData.forEach((row) => {
    const normalizedRow: Record<string, unknown> = {};
    headers.forEach((header) => {
      const val = row[header];
      normalizedRow[header] =
        val !== null && typeof val === 'object' ? JSON.stringify(val) : (val ?? '');
    });
    worksheet.addRow(normalizedRow);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `${filename}.xlsx`);
}

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0.5) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const cleanFilename = filename.toLowerCase().endsWith('.pdf')
    ? filename
    : `${filename}.pdf`;
  pdf.save(cleanFilename);
}
