import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { THESIS_SVGS } from './thesisDiagrams.js';

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

function cleanMarkdown(mdContent, isBangla = false) {
  // Strip any remaining presenter notes / speaking scripts
  if (isBangla) {
    return mdContent.replace(/### প্রেজেন্টারের স্ক্রিপ্ট \(মুখে যা বলবেন\)[\s\S]*?(?=\n---|\n## স্লাইড|$)/gu, '');
  } else {
    return mdContent.replace(/### Presenter Notes \(What to Say\)[\s\S]*?(?=\n---|\n## Slide|$)/g, '');
  }
}

function buildSlideHtml(markdown, isBangla = false) {
  const cleanedMd = cleanMarkdown(markdown, isBangla);
  const processedMd = convertMarkdownImagesToBase64(cleanedMd);

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
      <title>${isBangla ? 'ফ্লোপে প্রেজেন্টেশন (A4)' : 'FlowPay Presentation (A4)'}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 297mm;
          height: auto;
          font-family: ${fontStack};
          background-color: #0f172a;
          color: #1e293b;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .slide {
          width: 297mm;
          height: 210mm;
          padding: 10mm 15mm;
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
          padding-bottom: 2mm;
          border-bottom: 2px solid #e2e8f0;
          height: 12mm;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-box {
          background: #4f46e5;
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .brand-text {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .slide-badge {
          background: #eef2ff;
          color: #4338ca;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 16px;
          border: 1px solid #c7d2fe;
          text-transform: uppercase;
        }
        .slide-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-top: 3mm;
          overflow: hidden;
        }
        .slide-body h1, .slide-body h2 {
          font-size: 21px;
          font-weight: 800;
          color: #1e1b4b;
          margin-top: 0;
          margin-bottom: 3mm;
          border-left: 5px solid #4f46e5;
          padding-left: 10px;
          line-height: 1.25;
        }
        .slide-body h3 {
          font-size: 15px;
          font-weight: 700;
          color: #334155;
          margin-top: 2.5mm;
          margin-bottom: 1.5mm;
        }
        .slide-body p, .slide-body li {
          font-size: 13.5px;
          line-height: 1.45;
          color: #1e293b;
        }
        .slide-body ul {
          margin: 1.5mm 0;
          padding-left: 20px;
        }
        .slide-body li {
          margin-bottom: 2mm;
        }
        .slide-body strong {
          color: #0f172a;
        }
        /* LARGE PROMINENT SCREENSHOTS */
        .slide-body img {
          max-width: 95%;
          max-height: 125mm;
          object-fit: contain;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08);
          margin: 3mm auto;
          display: block;
        }
        .slide-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 2.5mm 0;
          font-size: 13px;
        }
        .slide-body th, .slide-body td {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          text-align: left;
        }
        .slide-body th {
          background: #f1f5f9;
          font-weight: 700;
          color: #0f172a;
        }
        .slide-body pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          overflow-x: auto;
          margin: 2.5mm 0;
        }
        .slide-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2mm;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          height: 8mm;
        }
      </style>
    </head>
    <body>
      ${slides.join('\n')}
    </body>
    </html>
  `;
}

function formatMathBlocks(mdContent) {
  let out = mdContent.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const clean = tex
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1) / ($2)')
      .replace(/\\lfloor\s*/g, 'floor(')
      .replace(/\s*\\rfloor/g, ')')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\sum\s*/g, 'Σ ')
      .replace(/\\max/g, 'max')
      .replace(/\\cdot/g, '×')
      .replace(/\\times/g, '×')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\qquad/g, '   |   ')
      .replace(/\\,/g, ' ')
      .replace(/\\%/g, '%')
      .replace(/\s+/g, ' ')
      .trim();
    return `\n<div class="math-block"><code>${clean}</code></div>\n`;
  });
  out = out.replace(/\$([A-Za-z0-9_\\{}]+)\$/g, (_, inner) => {
    return `<code>${inner.replace(/\\ge/g, '≥').replace(/\\le/g, '≤')}</code>`;
  });
  return out;
}

function replaceThesisMermaidWithSvgs(mdContent) {
  let idx = 0;
  return mdContent.replace(/```mermaid[\s\S]*?```/g, (block) => {
    if (idx < THESIS_SVGS.length) {
      const svg = THESIS_SVGS[idx];
      idx += 1;
      return `\n${svg}\n`;
    }
    return block;
  });
}

function buildDocumentHtml(markdown, title, isThesis = false) {
  let processedMd = convertMarkdownImagesToBase64(markdown);
  if (isThesis) {
    processedMd = replaceThesisMermaidWithSvgs(processedMd);
  }
  processedMd = formatMathBlocks(processedMd);
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
          margin: 20mm 16mm 22mm 16mm;
        }
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #1e293b;
          line-height: 1.55;
          font-size: 12.5px;
          margin: 0;
          padding: 0;
        }
        .page-break {
          page-break-after: always;
          break-after: page;
        }
        .title-page {
          text-align: center;
          padding-top: 12mm;
        }
        .title-page table {
          text-align: left;
          margin-top: 18px;
        }
        .diagram-box {
          margin: 12px auto;
          padding: 8px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          text-align: center;
          page-break-inside: avoid;
        }
        .math-block {
          background: #f8fafc;
          border-left: 3px solid #4f46e5;
          padding: 7px 12px;
          margin: 6px 0;
          font-size: 11.5px;
          page-break-inside: avoid;
        }
        .math-block code {
          background: transparent;
          color: #1e1b4b;
          font-weight: 600;
          font-size: 11.5px;
        }
        h1 {
          font-size: 22px;
          color: #1e1b4b;
          border-bottom: 2.5px solid #4f46e5;
          padding-bottom: 6px;
          margin-top: 0;
        }
        h2 {
          font-size: 17px;
          color: #312e81;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-top: 20px;
          page-break-after: avoid;
        }
        h3 {
          font-size: 14px;
          color: #4338ca;
          margin-top: 14px;
          page-break-after: avoid;
        }
        p, li {
          color: #334155;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 11px;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 5px 8px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
        }
        code {
          background: #f1f5f9;
          color: #4338ca;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: Consolas, monospace;
          font-size: 11px;
        }
        pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          overflow-x: auto;
          page-break-inside: avoid;
        }
        img {
          max-width: 90%;
          height: auto;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          margin: 8px auto;
          display: block;
          page-break-inside: avoid;
        }
        hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
}

async function renderPdf(html, outputPath, isPresentation = true, isThesis = false) {
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
      format: 'A4',
      landscape: true,
      preferCSSPageSize: true
    });
  } else {
    await page.pdf({
      path: outputPath,
      printBackground: true,
      format: 'A4',
      margin: { top: '20mm', bottom: '22mm', left: '16mm', right: '16mm' },
      displayHeaderFooter: isThesis,
      headerTemplate: isThesis
        ? '<div style="font-size:8px;color:#64748b;width:100%;text-align:right;padding:0 16mm;">FlowPay Enterprise — Final Year Project Thesis Report</div>'
        : '<span></span>',
      footerTemplate: isThesis
        ? '<div style="font-size:8.5px;color:#64748b;width:100%;display:flex;justify-content:space-between;padding:0 16mm;"><span>Department of Computer Science &amp; Engineering</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
        : '<span></span>'
    });
  }

  await browser.close();
  console.log(`Successfully created: ${outputPath}`);
}

async function main() {
  // 1. English Presentation (A4 Landscape, Large Image, Large Text, No Speaking Script)
  if (fs.existsSync('PRESENTATION_EN.md')) {
    const enMd = formatMathBlocks(fs.readFileSync('PRESENTATION_EN.md', 'utf8'));
    const enHtml = buildSlideHtml(enMd, false);
    fs.writeFileSync('PRESENTATION_EN.html', enHtml);
    await renderPdf(enHtml, 'FlowPay_Presentation_English.pdf', true);
  }

  // 2. Bangla Presentation (A4 Landscape, Large Image, Large Text, No Speaking Script)
  if (fs.existsSync('PRESENTATION_BN.md')) {
    const bnMd = formatMathBlocks(fs.readFileSync('PRESENTATION_BN.md', 'utf8'));
    const bnHtml = buildSlideHtml(bnMd, true);
    fs.writeFileSync('PRESENTATION_BN.html', bnHtml);
    await renderPdf(bnHtml, 'FlowPay_Presentation_Bangla.pdf', true);
    if (fs.existsSync('public')) {
      fs.copyFileSync('FlowPay_Presentation_Bangla.pdf', 'public/FlowPay_Presentation_Bangla.pdf');
    }
  }

  // 3. User Guide (A4 Portrait)
  if (fs.existsSync('USER_GUIDE.md')) {
    const userGuideMd = fs.readFileSync('USER_GUIDE.md', 'utf8');
    const userGuideHtml = buildDocumentHtml(userGuideMd, 'FlowPay User Guide', false);
    fs.writeFileSync('USER_GUIDE.html', userGuideHtml);
    await renderPdf(userGuideHtml, 'FlowPay_User_Guide.pdf', false, false);
  }

  // 4. System Documentation (A4 Portrait)
  if (fs.existsSync('DOCUMENTATION.md')) {
    const docMd = fs.readFileSync('DOCUMENTATION.md', 'utf8');
    const docHtml = buildDocumentHtml(docMd, 'FlowPay System Architecture & Documentation', false);
    fs.writeFileSync('DOCUMENTATION.html', docHtml);
    await renderPdf(docHtml, 'FlowPay_System_Documentation.pdf', false, false);
  }

  // 5. Final Year Project Thesis Report (A4 Portrait + Embedded Vector Diagrams)
  if (fs.existsSync('FINAL_YEAR_PROJECT_REPORT.md')) {
    const thesisMd = fs.readFileSync('FINAL_YEAR_PROJECT_REPORT.md', 'utf8');
    const thesisHtml = buildDocumentHtml(
      thesisMd,
      'FlowPay Enterprise — Final Year Project Thesis Report',
      true
    );
    fs.writeFileSync('FINAL_YEAR_PROJECT_REPORT.html', thesisHtml);
    await renderPdf(thesisHtml, 'FlowPay_FYP_Thesis_Report.pdf', false, true);
  }

  console.log('All 5 PDFs regenerated successfully in A4 size!');
}

main().catch(err => {
  console.error('Fatal error generating PDFs:', err);
  process.exit(1);
});
