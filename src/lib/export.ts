import * as xlsx from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const safeData = data && data.length > 0 ? data : [{ 'No Records': 'No data available' }];
  const worksheet = xlsx.utils.json_to_sheet(safeData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  xlsx.writeFile(workbook, `${filename}.csv`);
}

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1'): void {
  const safeData = data && data.length > 0 ? data : [{ 'No Records': 'No data available' }];
  const worksheet = xlsx.utils.json_to_sheet(safeData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  xlsx.writeFile(workbook, `${filename}.xlsx`);
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
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}
