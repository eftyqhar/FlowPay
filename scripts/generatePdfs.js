import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function imageToBase64(relPath) {
  try {
    const fullPath = path.resolve(relPath);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).toLowerCase().replace('.', '');
      const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/svg+xml';
      const data = fs.readFileSync(fullPath).toString('base64');
      return `data:${mime};base64,${data}`;
    }
  } catch (err) {
    console.error('Error reading image:', relPath, err);
  }
  return relPath;
}

function convertMarkdownImagesToBase64(mdContent) {
  return mdContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    const cleanSrc = src.trim();
    const base64 = imageToBase64(cleanSrc);
    return `![${alt}](${base64})`;
  });
}

function buildSlideHtml(markdown, isBangla = false) {
  const processedMd = convertMarkdownImagesToBase64(markdown);

  // Match English digits or Bengali digits (০-৯)
  const slideRegex = isBangla ? /(?=## স্লাইড [0-9০-৯]+:)/u : /(?=## Slide \d+:)/g;
  const rawSlides = processedMd.split(slideRegex);

  const slides = rawSlides.map((slideText, idx) => {
    const trimmed = slideText.trim();
    if (!trimmed) return '';
    const htmlContent = marked.parse(trimmed);
    const slideNumber = idx === 0 ? (isBangla ? 'ওভারভিউ' : 'Overview') : (isBangla ? 'স্লাইড ' + idx : 'SLIDE ' + idx);
    const footerLabel = idx === 0 ? '' : (isBangla ? 'স্লাইড ' + idx + ' / ১৮' : 'Slide ' + idx + ' of 18');
    
    return `
      <div class="slide">
        <div class="slide-header">
          <div class="brand">
            <span class="logo-box">FP</span>
            <span class="brand-text">FlowPay Enterprise</span>
          </div>
          <div class="slide-badge">${slideNumber}</div>
        </div>
        <div class="slide-body">
          ${htmlContent}
        </div>
        <div class="slide-footer">
          <span>FlowPay Workforce & Payroll Management System</span>
          <span>${footerLabel}</span>
        </div>
      </div>
    `;
  }).filter(Boolean);

  const fontStack = isBangla 
    ? "'Nirmala UI', 'Kalpurush', 'Hind Siliguri', 'Segoe UI', system-ui, sans-serif"
    : "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";

  return `
    <!DOCTYPE html>
    <html lang="${isBangla ? 'bn' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isBangla ? 'ফ্লোপে প্রেজেন্টেশন' : 'FlowPay Enterprise Presentation'}</title>
      <style>
        @page {
          size: 16in 9in;
          margin: 0;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: ${fontStack};
          background-color: #0f172a;
          color: #1e293b;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .slide {
          width: 16in;
          height: 9in;
          padding: 0.5in 0.8in;
          background: #ffffff;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .slide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.2in;
          border-bottom: 2px solid #e2e8f0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          background: #4f46e5;
          color: #ffffff;
          font-weight: 800;
          font-size: 16px;
          padding: 6px 10px;
          border-radius: 8px;
          letter-spacing: 1px;
        }
        .brand-text {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .slide-badge {
          background: #eef2ff;
          color: #4338ca;
          font-weight: 700;
          font-size: 14px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #c7d2fe;
          text-transform: uppercase;
        }
        .slide-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-top: 0.2in;
          overflow: hidden;
        }
        .slide-body h1, .slide-body h2 {
          font-size: 26px;
          font-weight: 800;
          color: #1e1b4b;
          margin-top: 0;
          margin-bottom: 12px;
          border-left: 6px solid #4f46e5;
          padding-left: 14px;
        }
        .slide-body h3 {
          font-size: 18px;
          font-weight: 700;
          color: #334155;
          margin-top: 8px;
          margin-bottom: 6px;
        }
        .slide-body p, .slide-body li {
          font-size: 15px;
          line-height: 1.5;
          color: #334155;
        }
        .slide-body ul {
          margin: 6px 0;
          padding-left: 24px;
        }
        .slide-body li {
          margin-bottom: 4px;
        }
        .slide-body img {
          max-width: 90%;
          max-height: 3.5in;
          object-fit: contain;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          margin: 8px 0;
        }
        .slide-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 14px;
        }
        .slide-body th, .slide-body td {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          text-align: left;
        }
        .slide-body th {
          background: #f8fafc;
          font-weight: 700;
          color: #0f172a;
        }
        .slide-body blockquote {
          background: #fffbeb;
          border-left: 5px solid #f59e0b;
          padding: 10px 16px;
          margin: 8px 0 0 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #78350f;
          font-size: 14px;
          line-height: 1.5;
        }
        .slide-body blockquote strong {
          color: #92400e;
        }
        .slide-body pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          overflow-x: auto;
          margin: 6px 0;
        }
        .slide-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.15in;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      ${slides.join('\n')}
    </body>
    </html>
  `;
}

function buildDocumentHtml(markdown, title) {
  const processedMd = convertMarkdownImagesToBase64(markdown);
  const htmlContent = marked.parse(processedMd);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 18mm 22mm 18mm;
          @bottom-right {
            content: counter(page);
          }
        }
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #1e293b;
          line-height: 1.6;
          font-size: 13px;
          margin: 0;
          padding: 0;
        }
        h1 {
          font-size: 24px;
          color: #1e1b4b;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 8px;
          margin-top: 0;
        }
        h2 {
          font-size: 18px;
          color: #312e81;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-top: 24px;
          page-break-after: avoid;
        }
        h3 {
          font-size: 15px;
          color: #4338ca;
          margin-top: 16px;
          page-break-after: avoid;
        }
        p, li {
          color: #334155;
          font-size: 12.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 11.5px;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
        }
        code {
          background: #f1f5f9;
          color: #4338ca;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: Consolas, monospace;
          font-size: 11px;
        }
        pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 11.5px;
          overflow-x: auto;
          page-break-inside: avoid;
        }
        pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }
        blockquote {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          margin: 12px 0;
          padding: 8px 14px;
          color: #1e40af;
          font-size: 12px;
        }
        img {
          max-width: 95%;
          height: auto;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          margin: 10px 0;
          page-break-inside: avoid;
        }
        hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
}

async function renderPdf(html, outputPath, isPresentation = true) {
  console.log(`Generating PDF -> ${outputPath}...`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  if (isPresentation) {
    await page.pdf({
      path: outputPath,
      printBackground: true,
      width: '16in',
      height: '9in',
      preferCSSPageSize: true
    });
  } else {
    await page.pdf({
      path: outputPath,
      printBackground: true,
      format: 'A4',
      margin: { top: '20mm', bottom: '22mm', left: '18mm', right: '18mm' }
    });
  }

  await browser.close();
  console.log(`Successfully created: ${outputPath}`);
}

async function main() {
  // 1. English Presentation (16:9 Landscape Presentation Slides)
  if (fs.existsSync('PRESENTATION_EN.md')) {
    const enMd = fs.readFileSync('PRESENTATION_EN.md', 'utf8');
    const enHtml = buildSlideHtml(enMd, false);
    fs.writeFileSync('PRESENTATION_EN.html', enHtml);
    await renderPdf(enHtml, 'FlowPay_Presentation_English.pdf', true);
  }

  // 2. Bangla Presentation (16:9 Landscape Presentation Slides)
  if (fs.existsSync('PRESENTATION_BN.md')) {
    const bnMd = fs.readFileSync('PRESENTATION_BN.md', 'utf8');
    const bnHtml = buildSlideHtml(bnMd, true);
    fs.writeFileSync('PRESENTATION_BN.html', bnHtml);
    await renderPdf(bnHtml, 'FlowPay_Presentation_Bangla.pdf', true);
  }

  // 3. User Guide (A4 Printable Document)
  if (fs.existsSync('USER_GUIDE.md')) {
    const userGuideMd = fs.readFileSync('USER_GUIDE.md', 'utf8');
    const userGuideHtml = buildDocumentHtml(userGuideMd, 'FlowPay User Guide');
    fs.writeFileSync('USER_GUIDE.html', userGuideHtml);
    await renderPdf(userGuideHtml, 'FlowPay_User_Guide.pdf', false);
  }

  // 4. System Documentation (A4 Printable Technical Manual)
  if (fs.existsSync('DOCUMENTATION.md')) {
    const docMd = fs.readFileSync('DOCUMENTATION.md', 'utf8');
    const docHtml = buildDocumentHtml(docMd, 'FlowPay System Architecture & Documentation');
    fs.writeFileSync('DOCUMENTATION.html', docHtml);
    await renderPdf(docHtml, 'FlowPay_System_Documentation.pdf', false);
  }

  console.log('All 4 PDFs generated successfully!');
}

main().catch(err => {
  console.error('Fatal error generating PDFs:', err);
  process.exit(1);
});
