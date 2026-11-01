import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_FILE = path.resolve('FlowPay_Presentation_Bangla.pdf');
const PUBLIC_OUTPUT_FILE = path.resolve('public/FlowPay_Presentation_Bangla.pdf');

// HTML & CSS for the 16:9 Widescreen Professional Presentation
const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>FlowPay Enterprise - Architecture & Engineering Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 297mm 167.06mm; /* Standard 16:9 Widescreen Presentation Ratio */
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Nirmala UI', 'Segoe UI', sans-serif;
      background-color: #0b0f19;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }

    /* Base Slide Layout */
    .slide {
      width: 297mm;
      height: 167.06mm;
      padding: 12mm 16mm 10mm 16mm;
      page-break-after: always;
      position: relative;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Top Accent Line */
    .slide-accent-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%);
    }

    /* Slide Header */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 10px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo-pill {
      background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .brand-title-text {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .category-pill {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    }
    .slide-counter {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      font-family: 'Fira Code', monospace;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Title Block */
    .title-block {
      margin-bottom: 10px;
    }
    .slide-headline {
      font-size: 21px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .slide-subheadline {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }

    /* Slide Main Canvas */
    .slide-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 10px;
      overflow: hidden;
    }

    /* Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      height: 100%;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      height: 100%;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .grid-1-2 {
      display: grid;
      grid-template-columns: 1.1fr 1.6fr;
      gap: 12px;
    }
    .grid-2-1 {
      display: grid;
      grid-template-columns: 1.6fr 1.1fr;
      gap: 12px;
    }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      position: relative;
    }
    .card.slate { background: #f8fafc; border-color: #e2e8f0; }
    .card.indigo { background: #faf5ff; border-color: #e9d5ff; }
    .card.blue { background: #eff6ff; border-color: #bfdbfe; }
    .card.emerald { background: #f0fdf4; border-color: #bbf7d0; }
    .card.amber { background: #fffbeb; border-color: #fde68a; }
    .card.rose { background: #fff1f2; border-color: #fecdd3; }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 5px;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-badge {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .badge-indigo { background: #e0e7ff; color: #4338ca; }
    .badge-emerald { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-rose { background: #fee2e2; color: #b91c1c; }
    .badge-blue { background: #e0f2fe; color: #0369a1; }

    p, li {
      font-size: 11px;
      color: #334155;
      line-height: 1.45;
    }
    ul, ol {
      padding-left: 14px;
      margin-top: 3px;
    }
    li {
      margin-bottom: 3px;
    }

    /* Executive Analogy Callout */
    .exec-callout {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-left: 3.5px solid #10b981;
      border-radius: 0 6px 6px 0;
      padding: 6px 10px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .exec-callout-icon {
      font-size: 14px;
      line-height: 1;
      margin-top: 2px;
    }
    .exec-callout-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 1px;
    }
    .exec-callout-text {
      font-size: 10.5px;
      color: #047857;
      line-height: 1.35;
    }

    /* IDE / Terminal Window */
    .ide-window {
      background: #0f172a;
      border-radius: 6px;
      border: 1px solid #1e293b;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .ide-topbar {
      background: #1e293b;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #334155;
    }
    .ide-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #eab308; }
    .dot-green { background: #22c55e; }
    .ide-filename {
      color: #94a3b8;
      font-size: 9.5px;
      font-family: 'Fira Code', monospace;
      margin-left: 6px;
    }
    .ide-code {
      padding: 8px 10px;
      color: #e2e8f0;
      font-family: 'Fira Code', monospace;
      font-size: 9.5px;
      line-height: 1.45;
    }
    .kw { color: #f472b6; font-weight: 600; }
    .fn { color: #60a5fa; }
    .str { color: #34d399; }
    .cm { color: #64748b; font-style: italic; }
    .var { color: #fbbf24; }
    .num { color: #a78bfa; }

    /* Interactive Pipeline Flowchart */
    .pipeline {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 4px 0 8px 0;
    }
    .pipe-step {
      flex: 1;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      position: relative;
    }
    .pipe-step.active {
      border-color: #4f46e5;
      background: #f5f3ff;
    }
    .pipe-num {
      font-size: 9px;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pipe-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1px;
    }
    .pipe-desc {
      font-size: 9px;
      color: #64748b;
      margin-top: 1px;
    }
    .pipe-arrow {
      color: #94a3b8;
      font-size: 12px;
      font-weight: bold;
    }

    /* Comparison Table */
    table.comp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table.comp-table th, table.comp-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      text-align: left;
    }
    table.comp-table th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 700;
      font-size: 10.5px;
    }
    table.comp-table tr:nth-child(even) { background: #fafafa; }

    /* Key Stat Pill */
    .stat-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-num {
      font-size: 18px;
      font-weight: 800;
      color: #4f46e5;
      font-family: 'Fira Code', monospace;
      line-height: 1;
    }
    .stat-meta {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.25;
    }

    /* Footer */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 5px;
      font-size: 9px;
      color: #94a3b8;
    }
    .footer-progress-bar {
      height: 2px;
      background: #e2e8f0;
      width: 80px;
      border-radius: 2px;
      overflow: hidden;
      margin-right: 6px;
      display: inline-block;
      vertical-align: middle;
    }
    .progress-fill {
      height: 100%;
      background: #4f46e5;
    }

    /* Cover Slide Styling */
    .cover-theme {
      background: radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 60%, #020617 100%);
      color: #ffffff;
      padding: 16mm 20mm;
      justify-content: space-between;
    }
    .cover-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cover-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cover-brand-logo {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #fff;
      font-weight: 800;
      font-size: 16px;
      padding: 4px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .cover-brand-text {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }
    .cover-badge {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(165, 180, 252, 0.3);
      color: #c7d2fe;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 999px;
    }
    .cover-hero {
      margin-top: 10px;
    }
    .cover-tagline {
      color: #818cf8;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .cover-title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .cover-desc {
      font-size: 14px;
      color: #94a3b8;
      max-width: 780px;
      line-height: 1.5;
    }
    .cover-stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .cover-stat-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 8px 12px;
    }
    .cover-stat-val {
      font-size: 18px;
      font-weight: 700;
      color: #38bdf8;
      font-family: 'Fira Code', monospace;
    }
    .cover-stat-label {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .cover-footer-text {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 8px;
      font-size: 10px;
      color: #64748b;
    }

    /* Section Break Slide */
    .section-break-theme {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20mm;
    }
    .section-part-pill {
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid #818cf8;
      color: #c7d2fe;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 999px;
      display: inline-block;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 30px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .section-desc {
      font-size: 13px;
      color: #94a3b8;
      max-width: 600px;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <!-- ==================== SLIDE 1: EXECUTIVE COVER ==================== -->
  <div class="slide cover-theme">
    <div class="cover-topbar">
      <div class="cover-brand">
        <span class="cover-brand-logo">FP</span>
        <span class="cover-brand-text">FlowPay Enterprise Web Suite</span>
      </div>
      <span class="cover-badge">Executive Technical Presentation • v1.2</span>
    </div>

    <div class="cover-hero">
      <div class="cover-tagline">Architectural Blueprint & Engineering Handbook</div>
      <h1 class="cover-title">FlowPay পেরোল সিস্টেম আর্কিটেকচার<br>কিভাবে কাজ করে? (বেসিক প্রোগ্রামার গাইড)</h1>
      <p class="cover-desc">
        ফ্রন্টএন্ড কম্পোনেন্ট, ইন-ব্রাউজার লোকাল-ফার্স্ট ব্যাকএন্ড আর্কিটেকচার, স্টেট ম্যানেজমেন্ট, বেতন ও অনুপস্থিতি কর্তন অ্যালগরিদম এবং ফুলস্ট্যাক কোডবেসের প্রতিটি অংশের স্টেপ-বাই-স্টেপ ভিজ্যুয়াল গাইড।
      </p>

      <div class="cover-stats-row">
        <div class="cover-stat-box">
          <div class="cover-stat-val">React 18</div>
          <div class="cover-stat-label">কম্পোনেন্ট ভিত্তিক আর্কিটেকচার</div>
        </div>
        <div class="cover-stat-box">
          <div class="cover-stat-val">Zustand 4.5</div>
          <div class="cover-stat-label">ইন-মেমোরি গ্লোবাল ডাটাবেস</div>
        </div>
        <div class="cover-stat-box">
          <div class="cover-stat-val">0ms Latency</div>
          <div class="cover-stat-label">লোকাল-ফার্স্ট ইনস্ট্যান্ট এক্সিকিউশন</div>
        </div>
        <div class="cover-stat-box">
          <div class="cover-stat-val">30/30 Test</div>
          <div class="cover-stat-label">১০০% ভেরিফাইড অ্যালগরিদম</div>
        </div>
      </div>
    </div>

    <div class="cover-footer-text">
      <span>প্রস্তুতকারক: FlowPay আর্কিটেকচার ও কোর সফটওয়্যার টিম</span>
      <span>টার্গেট অডিয়েন্স: যারা বেসিক কোডিং জানেন (HTML, JS, Logic)</span>
      <span>নভেম্বর ২০২৬ • সর্বস্বত্ব সংরক্ষিত</span>
    </div>
  </div>

  <!-- ==================== SLIDE 2: AGENDA & OBJECTIVES ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">এজেন্ডা ও রূপরেখা</span>
      </div>
      <span class="slide-counter">SLIDE 02 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🎯 এই প্রেজেন্টেশনের লক্ষ্য ও আলোচনার বিষয়বস্তু</h2>
      <p class="slide-subheadline">এই স্লাইড ডেকটি সম্পন্ন করার পর আপনি একটি আধুনিক এন্টারপ্রাইজ ওয়েব অ্যাপ্লিকেশনের প্রতিটি স্তরের কাজ স্পষ্টভাবে ব্যাখ্যা করতে পারবেন।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-3">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">১. সিস্টেম আর্কিটেকচার</span>
            <span class="card-badge badge-indigo">মডিউল ১-৩</span>
          </div>
          <ul>
            <li>ফ্রন্টএন্ড বনাম ব্যাকএন্ডের সম্পর্ক।</li>
            <li><strong>Local-First Single Page Application (SPA)</strong> কি?</li>
            <li>ব্রাউজারে কিভাবে কোনো রিমোট সার্ভার ছাড়া ডেটাবেস চলে?</li>
            <li>রিয়েল-টাইম ডেটা পারসিস্টেন্স (LocalStorage)।</li>
          </ul>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">২. কোড স্ট্রাকচার ও সিকিউরিটি</span>
            <span class="card-badge badge-emerald">মডিউল ৪-৬</span>
          </div>
          <ul>
            <li>ভিজ্যুয়াল কোড ফোল্ডার ম্যাপ (VS Code)।</li>
            <li>TypeScript টাইপ ও স্কিমা ডেফিনিশন।</li>
            <li>React Router ও ৫টি রোলের নিরাপত্তা (RBAC)।</li>
            <li>একটি ব্যবহারকারী ক্লিকের এন্ড-টু-এন্ড লাইফসাইকেল।</li>
          </ul>
        </div>

        <div class="card amber">
          <div class="card-top">
            <span class="card-title">৩. কোর পেরোল ইঞ্জিন</span>
            <span class="card-badge badge-amber">মডিউল ৭-১০</span>
          </div>
          <ul>
            <li>বেতন গণনার গাণিতিক অ্যালগরিদম ও সূত্র।</li>
            <li>অনুপস্থিতি স্বয়ংক্রিয় কর্তন (Auto-Deduct)।</li>
            <li>পে-স্লিপ ভল্ট ও ব্রাউজার-সাইড PDF রেন্ডারিং।</li>
            <li>নতুন ফিচার যুক্ত করার জুনিয়র ডেভেলপার গাইড।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">💡</div>
        <div>
          <div class="exec-callout-title">শিক্ষানবিস প্রোগ্রামারদের জন্য প্রতিশ্রুতি:</div>
          <div class="exec-callout-text">
            আপনাকে জটিল থিওরি মুখস্থ করতে হবে না। প্রতিটি প্রযুক্তিকে বাস্তব জীবনের সহজ উপমা (Analogy) এবং স্ক্রিনশট-স্টাইল ডায়াগ্রাম দিয়ে সহজভাবে বুঝানো হয়েছে।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 8%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১: ভিত্তি ও রূপরেখা</span>
    </div>
  </div>

  <!-- ==================== SLIDE 3: THE PROBLEM & SOLUTION ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">সমস্যা ও সমাধান</span>
      </div>
      <span class="slide-counter">SLIDE 03 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🏢 পেরোল ব্যবস্থাপনা কেন জটিল এবং FlowPay কিভাবে সমাধান করে?</h2>
      <p class="slide-subheadline">কোম্পানির শত শত কর্মীর বেতন, উপস্থিতি, ছুটি ও ঋণ সমন্বয়ের সনাতন জটিলতা দূর করার ডিজিটাল সমাধান।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card rose">
          <div class="card-top">
            <span class="card-title" style="color: #991b1b;">❌ সনাতন বা এক্সেল পদ্ধতির প্রধান ৪টি সমস্যা</span>
            <span class="card-badge badge-rose">ঝুঁকিপূর্ণ</span>
          </div>
          <ul>
            <li><strong>হাজিরা ও ছুটির গরমিল:</strong> কর্মচারীর লেট, হাফ-ডে ও ছুটির দিন এক্সেল শিটে মেলানো সময়সাপেক্ষ ও ভুলের শিকার।</li>
            <li><strong>লোন কিস্তি বাদ পড়া:</strong> কে কত টাকা অগ্রিম নিয়েছে তা ভুলে গিয়ে পূর্ণ বেতন দিয়ে দেওয়া।</li>
            <li><strong>অস্বচ্ছ কর্তন:</strong> মাস শেষে কর্মী জানতে পারে না তার কেন বেতন কাটা হলো।</li>
            <li><strong>ব্যাংক ও বিকাশ আলাদা হিসাব:</strong> সনাতন ব্যাংক বনাম মোবাইল ওয়ালেটে বেতন পাঠানোর আলাদা রেজিস্টার খাতা।</li>
          </ul>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title" style="color: #166534;">✅ FlowPay ইঞ্জিনিয়ারিং আর্কিটেকচারের সমাধান</span>
            <span class="card-badge badge-emerald">স্বয়ংক্রিয়</span>
          </div>
          <ul>
            <li><strong>স্বয়ংক্রিয় সিঙ্ক (Auto-Sync):</strong> ডিজিটাল উপস্থিতি থেকে সরাসরি অনুপস্থিত দিন গুনে বেতন থেকে কাটে।</li>
            <li><strong>সমন্বিত লোন অ্যামরটাইজেশন:</strong> প্রতি মাসে লোনের কিস্তি বেতনে স্বয়ংক্রিয় কর্তন হিসেবে অন্তর্ভুক্ত হয়।</li>
            <li><strong>দ্বৈত পেমেন্ট চ্যানেল:</strong> ব্যাংক ও বিকাশ/নগদ ওয়ালেট উভয়েই ১-ক্লিকে পেরোল ডিসবার্সমেন্ট।</li>
            <li><strong>ডিজিটাল পে-স্লিপ:</strong> প্রতিটি কর্তনের কারণ ও দৈনিক রেট পরিষ্কারভাবে আইটেমাইজড থাকে।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🏢</div>
        <div>
          <div class="exec-callout-title">বাস্তব জীবনের উপমা (Real-World Analogy):</div>
          <div class="exec-callout-text">
            একটি বড় কারখানার কথা ভাবুন: শত শত কর্মীর হাজিরার খাতা, ছুটির দরখাস্ত আর ঋণের হিসাব যদি আলাদা আলাদা ডায়েরিতে রাখা হয়—তবে মাস শেষে হিসাব মিলবে না। FlowPay হলো সেই একক ডিজিটাল মাস্টার-রেজিস্টার যা সব ডায়েরিকে এক সুতোয় বেঁধে দেয়।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 12%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১: ভিত্তি ও রূপরেখা</span>
    </div>
  </div>

  <!-- ==================== SLIDE 4: FRONTEND VS BACKEND ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">বেসিক সফটওয়্যার কনসেপ্ট</span>
      </div>
      <span class="slide-counter">SLIDE 04 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">💻 ফ্রন্টএন্ড বনাম ব্যাকএন্ড: একজন শিক্ষানবিসের জন্য সহজ পাঠ</h2>
      <p class="slide-subheadline">যেকোনো পূর্ণাঙ্গ সফটওয়্যার অ্যাপ্লিকেশনের দুটি অবিচ্ছেদ্য অংশ কিভাবে কাজ করে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">🎨 ফ্রন্টএন্ড (Frontend): যা স্ক্রিনে দেখা যায়</span>
            <span class="card-badge badge-indigo">Client Side</span>
          </div>
          <p style="margin-bottom: 6px;"><strong>ব্যবহারকারী ব্রাউজারে যা স্পর্শ ও অনুভব করে:</strong></p>
          <ul>
            <li><strong>UI Components:</strong> বাটন, টেক্সট বক্স, টেবিল, ড্রপডাউন মেনু ও ড্যাশবোর্ড কার্ড।</li>
            <li><strong>Styling (Tailwind):</strong> রঙ, মার্জিন, প্যাডিং, অ্যানিমেশন ও মোবাইল রেসপনসিভনেস।</li>
            <li><strong>Event Listening:</strong> মাউস ক্লিক বা কীবোর্ড টাইপিং শনাক্ত করে রিয়্যাক্ট করা।</li>
            <li><strong>FlowPay-তে উদাহরণ:</strong> <code>DashboardPage.tsx</code>, <code>AddEmployeePage.tsx</code> ইত্যাদি।</li>
          </ul>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">⚙️ ব্যাকএন্ড ও ডেটা লেয়ার: পর্দার পেছনের ইঞ্জিন</span>
            <span class="card-badge badge-indigo">Server / Store</span>
          </div>
          <p style="margin-bottom: 6px;"><strong>সফটওয়্যারের মস্তিষ্ক ও ডেটাবেস যা চোখে দেখা যায় না:</strong></p>
          <ul>
            <li><strong>বিজনেস লজিক (Business Logic):</strong> বেতন ও ট্যাক্স হিসাবের মূল গাণিতিক সূত্রাবলী।</li>
            <li><strong>ডেটা সংরক্ষণ (Data Persistence):</strong> কর্মীদের নাম, উপস্থিতি ও লোনের ইতিহাস লিখে রাখা।</li>
            <li><strong>নিরাপত্তা ও যাচাই (Validation):</strong> কে কোন পেজ দেখতে পারবে এবং অনুমোদনের অধিকার কার আছে।</li>
            <li><strong>FlowPay-তে উদাহরণ:</strong> <code>salary.ts</code>, <code>payrollStore.ts</code>, <code>attendanceStore.ts</code>।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🍽️</div>
        <div>
          <div class="exec-callout-title">রেস্তোরাঁর সহজ উপমা (Restaurant Analogy):</div>
          <div class="exec-callout-text">
            <strong>ফ্রন্টএন্ড</strong> হলো রেস্তোরাঁর মনোরম ডাইনিং রুম, সাজানো চেয়ার-টেবিল ও সুন্দর মেনু কার্ড। আর <strong>ব্যাকএন্ড</strong> হলো পেছনের সুরক্ষিত রান্নাঘর (Kitchen), যেখানে দক্ষ শেফ রেসিপি অনুযায়ী খাবার তৈরি করেন এবং স্টোররুমে সামগ্রী সংরক্ষণ করেন।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 16%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ২: সফটওয়্যার আর্কিটেকচার</span>
    </div>
  </div>

  <!-- ==================== SLIDE 5: LOCAL-FIRST ARCHITECTURE ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">সিস্টেম আর্কিটেকচার</span>
      </div>
      <span class="slide-counter">SLIDE 05 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">⚡ FlowPay আর্কিটেকচার: "Local-First" আধুনিক স্থাপত্য</h2>
      <p class="slide-subheadline">ট্র্যাডিশনাল ক্লাউড ক্লায়েন্ট-সার্ভার বনাম FlowPay-এর 0ms ল্যাগ লোকাল-ফার্স্ট কাঠামোর তুলনা।</p>
    </div>

    <div class="slide-canvas">
      <table class="comp-table">
        <thead>
          <tr>
            <th style="width: 25%;">বৈশিষ্ট্য</th>
            <th style="width: 37%;">🌐 সনাতন ক্লাউড আর্কিটেকচার</th>
            <th style="width: 38%;">🚀 FlowPay Local-First SPA আর্কিটেকচার</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ডেটা ফ্লো ও রিকোয়েস্ট</strong></td>
            <td>প্রতিটি ক্লিকে ইন্টারনেট দিয়ে দূরবর্তী সার্ভারে রিকোয়েস্ট পাঠাতে হয়।</td>
            <td><strong>ব্রাউজারের মেমরিতেই (Zustand Store)</strong> সমস্ত অপারেশন তৎক্ষণাৎ সম্পন্ন হয়।</td>
          </tr>
          <tr>
            <td><strong>রেসপন্স টাইম (Latency)</strong></td>
            <td>ধীরগতির (৩০০ms - ২০০০ms), নেট স্লো হলে পেজ আটকে থাকে।</td>
            <td><strong>০ মিলিসেকেন্ড (Instantaneous)</strong>, চোখের পলকে হিসাব ও রেন্ডার।</td>
          </tr>
          <tr>
            <td><strong>অফলাইন নির্ভরতা</strong></td>
            <td>ইন্টারনেট বিচ্ছিন্ন হলে সম্পূর্ণ সিস্টেম অচল।</td>
            <td><strong>১০০% অফলাইনে সক্ষম</strong>, ইন্টারনেট ছাড়াই ব্রাউজারে পূর্ণাঙ্গ পেরোল তৈরি করা যায়।</td>
          </tr>
          <tr>
            <td><strong>ডেটা সংরক্ষণাগার (Storage)</strong></td>
            <td>রিমোট SQL/PostgreSQL ক্লাউড ডাটাবেস।</td>
            <td>ব্রাউজারের <strong>LocalStorage-এ স্বয়ংক্রিয় JSON পারসিস্টেন্স</strong>।</td>
          </tr>
        </tbody>
      </table>

      <div class="exec-callout" style="margin-top: 6px;">
        <div class="exec-callout-icon">💡</div>
        <div>
          <div class="exec-callout-title">শিক্ষানবিস কোডারদের জন্য এই আর্কিটেকচারের সুবিধা:</div>
          <div class="exec-callout-text">
            আপনাকে জটিল ডাটাবেস সার্ভার (যেমন Docker, Postgres, AWS) কনফিগার করার ঝামেলা পোহাতে হবে না। আপনি সরাসরি ব্রাউজারেই একটি ফুলস্ট্যাক অ্যাপ্লিকেশনের স্টেট ম্যানেজমেন্ট, ক্রুড অপারেশন ও সিকিউরিটি লজিক হাতে-কলমে শিখতে পারবেন!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 20%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ২: সফটওয়্যার আর্কিটেকচার</span>
    </div>
  </div>

  <!-- ==================== SLIDE 6: TECH STACK MATRIX ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">প্রযুক্তি স্ট্যাক</span>
      </div>
      <span class="slide-counter">SLIDE 06 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🛠️ প্রযুক্তি স্ট্যাক ম্যাট্রিক্স: কোন টুল দিয়ে কী তৈরি করা হয়েছে?</h2>
      <p class="slide-subheadline">FlowPay-তে ব্যবহৃত প্রতিটি আধুনিক প্রযুক্তির সুনির্দিষ্ট ভূমিকা ও ইঞ্জিনিয়ারিং উদ্দেশ্য।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-4">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">⚛️ React 18.3</span>
            <span class="card-badge badge-indigo">UI Library</span>
          </div>
          <p>কম্পোনেন্ট-ভিত্তিক ফ্রন্টএন্ড। পেজকে ছোট ছোট ব্লকে বিভক্ত করে কোড বারবার রি-ইউজ করা হয়।</p>
        </div>

        <div class="card blue">
          <div class="card-top">
            <span class="card-title">🟦 TypeScript 5.5</span>
            <span class="card-badge badge-blue">Type Safety</span>
          </div>
          <p>টাইপ-সেফ জাভাস্ক্রিপ্ট। রানটাইম বাগ ও স্পেলিং মিসটেক কোড লেখার সময়ই কম্পাইলার ধরে ফেলে।</p>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">🐻 Zustand 4.5</span>
            <span class="card-badge badge-emerald">State Store</span>
          </div>
          <p>গ্লোবাল স্টেট ম্যানেজমেন্ট। পুরো অ্যাপের কর্মী, বেতন, উপস্থিতি ডেটা কেন্দ্রীয় মেমরিতে রাখে।</p>
        </div>

        <div class="card amber">
          <div class="card-top">
            <span class="card-title">🎨 Tailwind 3.4</span>
            <span class="card-badge badge-amber">CSS Engine</span>
          </div>
          <p>ইউটিলিটি-ফার্স্ট সিএসএস। আলাদা সিএসএস ফাইল না লিখে সরাসরি HTML ট্যাগের ভেতর রেসপনসিভ ক্লাস লেখা যায়।</p>
        </div>
      </div>

      <div class="grid-3" style="margin-top: 4px;">
        <div class="card slate">
          <div class="card-top">
            <span class="card-title">⚡ Vite 5.4</span>
            <span class="card-badge badge-indigo">Bundler</span>
          </div>
          <p>সুপারফাস্ট বিল্ড টুল ও ডেভ সার্ভার। কোড এডিটের সাথে সাথে ০.১ সেকেন্ডে ব্রাউজারে লাইভ আপডেট দেখায় (HMR)।</p>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">📑 jsPDF & html2canvas</span>
            <span class="card-badge badge-emerald">PDF Engine</span>
          </div>
          <p>ব্রাউজারে রেন্ডার হওয়া পে-স্লিপকে সরাসরি অফিসিয়াল ভেক্টরাইজড এ৪ পিডিএফ ফাইলে রূপান্তর করে ডাউনলোড করায়।</p>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">📊 Recharts & XLSX</span>
            <span class="card-badge badge-amber">Analytics</span>
          </div>
          <p>ইন্টারেক্টিভ এরিয়া ও বার চার্ট প্রদর্শন এবং এক ক্লিকে এক্সেল স্প্রেডশীট (.xlsx) ফাইল এক্সপোর্ট করে।</p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 25%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৩: প্রযুক্তি ও ফ্রেমওয়ার্ক</span>
    </div>
  </div>

  <!-- ==================== SLIDE 7: CODEBASE MAP ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">কোডবেস নেভিগেশন</span>
      </div>
      <span class="slide-counter">SLIDE 07 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📂 কোডবেস ডিরেক্টরি ম্যাপ: ফোল্ডারে কোথায় কী ফাইল রয়েছে?</h2>
      <p class="slide-subheadline">VS Code-এ প্রজেক্ট ওপেন করলে কিভাবে দ্রুত ফাইল খুঁজে পাবেন তার মানচিত্র।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2-1">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">FlowPay Project Explorer</span>
          </div>
          <div class="ide-code">
            <span class="cm">📁 FlowPay/</span><br>
            ├── <span class="kw">📁 src/</span><br>
            │ &nbsp; ├── <span class="fn">📁 pages/</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># প্রতিটি ইউআরএল রুটের আলাদা পেজ কম্পোনেন্ট</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 auth/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># LoginPage.tsx (ডিফল্ট প্রবেশদ্বার)</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 dashboard/<span class="cm"># DashboardPage.tsx (কেপিআই মেট্রিক্স)</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 employees/<span class="cm"># AddEmployee, AllEmployees, Profile</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 attendance/<span class="cm"># হাজিরা ম্যাট্রিক্স ও ছুটির আবেদন</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 loans/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># ঋণ ও বেতন অগ্রিম ম্যানেজমেন্ট</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 payroll/ &nbsp;&nbsp;&nbsp;<span class="cm"># ৩-ধাপের পেরোল জেনারেটর ও হিস্ট্রি</span><br>
            │ &nbsp; │ &nbsp; ├── 📁 payslips/ &nbsp;&nbsp;<span class="cm"># পে-স্লিপ ভিউ ও অফ-স্ক্রিন PDF</span><br>
            │ &nbsp; │ &nbsp; └── 📁 settings/ &nbsp;&nbsp;<span class="cm"># রুলস, ব্যবহারকারী ও অডিট লগ</span><br>
            │ &nbsp; ├── <span class="var">📁 stores/</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># Zustand ডেটা স্টোর (ইন-ব্রাউজার ব্যাকএন্ড)</span><br>
            │ &nbsp; ├── <span class="str">📁 lib/</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># types.ts (ডেটা মডেল), salary.ts (হিসাব ইঞ্জিন)</span><br>
            │ &nbsp; └── <span class="kw">📁 components/</span> &nbsp;&nbsp;&nbsp;<span class="cm"># সাইডবার, হেডার ও বাটন-ইনপুট UI</span><br>
            └── <span class="fn">📁 tests/</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm"># payrollCalculations.test.ts (৩০টি টেস্ট)</span>
          </div>
        </div>

        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">💡 শিক্ষানবিস কোডারদের নিয়ম</span>
            <span class="card-badge badge-indigo">Golden Path</span>
          </div>
          <ol>
            <li><strong>১. ডেটা দেখতে:</strong> <code>src/lib/types.ts</code> খুলুন।</li>
            <li><strong>২. মেথড দেখতে:</strong> <code>src/stores/</code> ফোল্ডারটি দেখুন।</li>
            <li><strong>৩. স্ক্রিন দেখতে:</strong> <code>src/pages/</code> ফোল্ডারের কোড দেখুন।</li>
          </ol>
          <div class="exec-callout" style="margin-top: 8px;">
            <div class="exec-callout-icon">🧭</div>
            <div class="exec-callout-text">
              এই তিনটি জায়গা বুঝলেই আপনি যেকোনো বড় এন্টারপ্রাইজ প্রজেক্টের কোড খুব সহজেই বুঝতে পারবেন।
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 29%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৪: কোডবেস স্ট্রাকচার</span>
    </div>
  </div>

  <!-- ==================== SLIDE 8: TYPESCRIPT MODELS ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">ডেটা স্কিমা ও মডেল</span>
      </div>
      <span class="slide-counter">SLIDE 08 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📐 ডেটা টাইপ ও স্কিমা: TypeScript-এর টাইপ-সেফটি কেন দরকার?</h2>
      <p class="slide-subheadline"><code>src/lib/types.ts</code> ফাইলে কিভাবে ডেটার মানচিত্র ও কঠোর নিয়ম আঁকা থাকে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">src/lib/types.ts</span>
          </div>
          <div class="ide-code">
            <span class="kw">export interface</span> <span class="fn">Employee</span> {<br>
            &nbsp;&nbsp;id: <span class="kw">string</span>; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm">// ইউনিক আইডি (UUID)</span><br>
            &nbsp;&nbsp;employeeId: <span class="kw">string</span>; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm">// যেমন 'EMP-001'</span><br>
            &nbsp;&nbsp;fullName: <span class="kw">string</span>;<br>
            &nbsp;&nbsp;department: <span class="kw">string</span>;<br>
            &nbsp;&nbsp;basicSalary: <span class="kw">number</span>; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm">// সংখ্যা ছাড়া অন্য কিছু ঢুকবে না!</span><br>
            &nbsp;&nbsp;paymentMethod?: <span class="fn">PaymentMethod</span>;<br>
            &nbsp;&nbsp;mobileBankingInfo?: {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;provider: <span class="str">'bkash'</span> | <span class="str">'nagad'</span> | <span class="str">'rocket'</span>;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;accountNumber: <span class="kw">string</span>;<br>
            &nbsp;&nbsp;};<br>
            }
          </div>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">🛡️ TypeScript কেন সাধারণ JS থেকে সেরা?</span>
            <span class="card-badge badge-emerald">Zero Bug</span>
          </div>
          <ul>
            <li><strong>টাইপো প্রতিরোধ:</strong> ধরুন আপনি ভুলে লিখলেন <code>employee.basicsalary</code> (ছোট হাতের 's')—সাধারণ জাভাস্ক্রিপ্ট রানটাইমে এরর না দিয়ে <code>undefined</code> রিটার্ন করত, কিন্তু TypeScript সাথে সাথে কোডে লাল দাগ দিয়ে বলবে ফিল্ডের নাম <code>basicSalary</code>।</li>
            <li><strong>ইনভ্যালিড ডেটা ব্লক:</strong> বেসিক স্যালারির জায়গায় কেউ টেক্সট ঢুকাতে চাইলে কম্পাইলার বিল্ড আটকে দেবে।</li>
            <li><strong>স্মার্ট অটো-কমপ্লিট:</strong> কোড লেখার সময় ডট দিলেই সব ফিল্ডের তালিকা ভেসে ওঠে।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🏗️</div>
        <div>
          <div class="exec-callout-title">ভবনের ব্লু-প্রিন্টের উপমা (Blueprint Analogy):</div>
          <div class="exec-callout-text">
            Interface হলো সরকারি বাড়ি নির্মাণের ইঞ্জিনিয়ারিং নকশার মতো। একজন কর্মী অবজেক্ট তৈরি হতে হলে সে অবশ্যই এই ব্লু-প্রিন্টের নিয়ম মেনে তৈরি হবে—কোনো ভুল মাপের ডেটা সিস্টেমে ঢুকতে পারবে না।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 33%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৫: ডেটা স্কিমা ও মডেল</span>
    </div>
  </div>

  <!-- ==================== SLIDE 9: ROUTING ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">রাউটিং ও নেভিগেশন</span>
      </div>
      <span class="slide-counter">SLIDE 09 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🗺️ রাউটিং ও পেজ নেভিগেশন: React Router DOM কিভাবে কাজ করে?</h2>
      <p class="slide-subheadline">সিঙ্গেল পেজ অ্যাপ্লিকেশনে ব্রাউজার রিফ্রেশ ছাড়াই কিভাবে নিমিষে এক পেজ থেকে অন্য পেজে যাওয়া যায়?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">src/App.tsx</span>
          </div>
          <div class="ide-code">
            <span class="kw">&lt;Routes&gt;</span><br>
            &nbsp;&nbsp;<span class="cm">{/* ১. পাবলিক রুট: যে কেউ ঢুকতে পারে */}</span><br>
            &nbsp;&nbsp;&lt;<span class="fn">Route</span> path=<span class="str">"/login"</span> element={&lt;<span class="var">LoginPage</span> /&gt;} /&gt;<br><br>
            &nbsp;&nbsp;<span class="cm">{/* ২. প্রটেক্টেড রুট: লগইন বাধ্যতামূলক */}</span><br>
            &nbsp;&nbsp;&lt;<span class="fn">Route</span> element={&lt;<span class="var">ProtectedRoute</span> /&gt;}&gt;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="fn">Route</span> element={&lt;<span class="var">MainLayout</span> /&gt;}&gt;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="fn">Route</span> index element={&lt;<span class="var">DashboardPage</span> /&gt;} /&gt;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="fn">Route</span> path=<span class="str">"employees"</span> element={&lt;<span class="var">AllEmployeesPage</span> /&gt;} /&gt;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="fn">Route</span> path=<span class="str">"payroll/generate"</span> element={&lt;<span class="var">GeneratePayrollPage</span> /&gt;} /&gt;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span class="fn">Route</span>&gt;<br>
            &nbsp;&nbsp;&lt;/<span class="fn">Route</span>&gt;<br>
            <span class="kw">&lt;/Routes&gt;</span>
          </div>
        </div>

        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">🔄 সিঙ্গেল পেজ নেভিগেশনের জাদু</span>
            <span class="card-badge badge-indigo">Instant Swap</span>
          </div>
          <ul>
            <li><strong>কোনো সাদা পর্দা নয় (Zero Flash):</strong> সনাতন ওয়েবসাইটে লিংকে চাপ দিলে পুরো পর্দা সাদা হয়ে নতুন করে লোড হতো। React Router শুধুমাত্র মাঝখানের কন্টেন্ট অদলবদল করে।</li>
            <li><strong>নেস্টেড লেআউট (MainLayout):</strong> সাইডবার ও হেডার একবারই রেন্ডার হয়, পেজ বদলালেও সাইডবার রি-রেন্ডার হয় না—ফলে মোবাইল অ্যাপের মত স্মুথ অভিজ্ঞতা পাওয়া যায়।</li>
            <li><strong>ডাইনামিক রুট:</strong> <code>/employees/:id</code> দিয়ে যেকোনো কর্মীর ইউনিক প্রোফাইল এক ফাইলে রেন্ডার করা যায়।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🚪</div>
        <div>
          <div class="exec-callout-title">স্মার্ট ট্র্যাফিক কন্ট্রোলারের উপমা (Traffic Police Analogy):</div>
          <div class="exec-callout-text">
            React Router হলো ভবনের স্মার্ট গাইড। আপনি ব্রাউজারে <code>/payroll</code> টাইপ করলে সে পেছনের পুরো বিল্ডিং ধ্বংস না করে আপনাকে সরাসরি পেরোল রুমে নিয়ে যায়।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 37%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৬: রাউটিং ও পেজ আর্কিটেকচার</span>
    </div>
  </div>

  <!-- ==================== SLIDE 10: RBAC SECURITY ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">নিরাপত্তা ও অ্যাক্সেস</span>
      </div>
      <span class="slide-counter">SLIDE 10 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🔒 নিরাপত্তা ও ভূমিকাভিত্তিক প্রবেশাধিকার (Authentication & RBAC)</h2>
      <p class="slide-subheadline"><code>ProtectedRoute.tsx</code> কম্পোনেন্ট কিভাবে অননুমোদিত ইউজারকে সুরক্ষিত পেজ থেকে আটকে দেয়?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">src/components/auth/ProtectedRoute.tsx</span>
          </div>
          <div class="ide-code">
            <span class="kw">export function</span> <span class="fn">ProtectedRoute</span>({ allowedRoles }) {<br>
            &nbsp;&nbsp;<span class="kw">const</span> { isAuthenticated, currentUser } = <span class="fn">useAuthStore</span>();<br><br>
            &nbsp;&nbsp;<span class="cm">// ১. লগইন না থাকলে সোজা লগইন পেজে রিডাইরেক্ট করো</span><br>
            &nbsp;&nbsp;<span class="kw">if</span> (!isAuthenticated) {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">return</span> &lt;<span class="fn">Navigate</span> to=<span class="str">"/login"</span> replace /&gt;;<br>
            &nbsp;&nbsp;}<br><br>
            &nbsp;&nbsp;<span class="cm">// ২. অনুমতি না থাকলে অ্যাক্সেস ব্লক!</span><br>
            &nbsp;&nbsp;<span class="kw">if</span> (allowedRoles &amp;&amp; !allowedRoles.includes(currentUser.role)) {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">return</span> &lt;<span class="fn">Navigate</span> to=<span class="str">"/"</span> replace /&gt;;<br>
            &nbsp;&nbsp;}<br><br>
            &nbsp;&nbsp;<span class="kw">return</span> &lt;<span class="fn">Outlet</span> /&gt;; &nbsp;<span class="cm">// অনুমোদন থাকলে পেজটি রেন্ডার হবে</span><br>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-top">
            <span class="card-title">👥 ৫টি ব্যবহারকারী ভূমিকার বাস্তব অধিকার</span>
            <span class="card-badge badge-indigo">Role Matrix</span>
          </div>
          <table class="comp-table">
            <thead>
              <tr><th>রোল (Role)</th><th>অনুমোদিত প্রধান ক্ষমতা</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Owner</strong></td><td>সর্বময় কর্তৃত্ব, কোম্পানি সেটিংস ও পেরোল চূড়ান্ত অনুমোদন।</td></tr>
              <tr><td><strong>Admin</strong></td><td>কর্মী অনবোর্ডিং, উপস্থিতি পর্যবেক্ষণ ও পেরোল ড্রাফট।</td></tr>
              <tr><td><strong>HR Manager</strong></td><td>কর্মী তথ্য, উপস্থিতি সংশোধন ও ছুটি অনুমোদন। <em>(অর্থ বিতরণ নিষিদ্ধ)</em></td></tr>
              <tr><td><strong>Accountant</strong></td><td>পেরোল ড্রাফট রিভিউ ও ব্যাংক/MFS-এ বেতন বিতরণ।</td></tr>
              <tr><td><strong>Employee</strong></td><td>সেলফ-সার্ভিস: নিজের চেক-ইন, ছুটি ও নিজের পে-স্লিপ।</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🏢</div>
        <div>
          <div class="exec-callout-title">স্মার্ট এক্সেস কার্ডের উপমা (Access Card Analogy):</div>
          <div class="exec-callout-text">
            ProtectedRoute হলো অফিসের ডিজিটাল ডোর লকের মতো। দরজায় কার্ড ছোঁয়ালে সে চেক করে আপনি সাধারণ কর্মী নাকি অ্যাকাউন্ট্যান্ট। একাউন্টসের রুমে সাধারণ কর্মী কার্ড ঠেকালে লাল বাতি জ্বলে দরজা বন্ধ থাকবে!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 41%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৭: প্রমাণীকরণ ও ভূমিকাভিত্তিক অ্যাক্সেস</span>
    </div>
  </div>

  <!-- ==================== SLIDE 11: ZUSTAND STATE STORES ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">স্টেট ম্যানেজমেন্ট</span>
      </div>
      <span class="slide-counter">SLIDE 11 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🐻 Zustand: ব্রাউজারে ইন-মেমোরি ডাটাবেস ইঞ্জিন</h2>
      <p class="slide-subheadline">স্টেট ও অ্যাকশন কিভাবে পুরো অ্যাপ্লিকেশনে ডেটা পরিচালনা ও সিঙ্ক করে রাখে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">src/stores/employeeStore.ts</span>
          </div>
          <div class="ide-code">
            <span class="kw">export const</span> <span class="fn">useEmployeeStore</span> = <span class="fn">create</span>(<span class="fn">persist</span>((set, get) =&gt; ({<br>
            &nbsp;&nbsp;<span class="cm">// ১. স্টেট (State): ডেটা অ্যারে</span><br>
            &nbsp;&nbsp;employees: [],<br><br>
            &nbsp;&nbsp;<span class="cm">// ২. অ্যাকশন (Action): নতুন কর্মী যোগ (INSERT)</span><br>
            &nbsp;&nbsp;<span class="fn">addEmployee</span>: (newEmp) =&gt; set((state) =&gt; ({<br>
            &nbsp;&nbsp;&nbsp;&nbsp;employees: [...state.employees, { ...newEmp, id: <span class="fn">generateId</span>() }]<br>
            &nbsp;&nbsp;})),<br><br>
            &nbsp;&nbsp;<span class="cm">// ৩. অ্যাকশন: কর্মী ডিলিট (DELETE)</span><br>
            &nbsp;&nbsp;<span class="fn">deleteEmployee</span>: (id) =&gt; set((state) =&gt; ({<br>
            &nbsp;&nbsp;&nbsp;&nbsp;employees: state.employees.filter(e =&gt; e.id !== id)<br>
            &nbsp;&nbsp;}))<br>
            }), { name: <span class="str">'flowpay-employees'</span> }));
          </div>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">🌟 কেন Zustand এত শক্তিশালী ও হালকা?</span>
            <span class="card-badge badge-emerald">Ultra Fast</span>
          </div>
          <ul>
            <li><strong>সহজ হুক কলিং:</strong> যেকোনো পেজে শুধু লিখবেন <code>const { employees } = useEmployeeStore();</code>—সাথে সাথে সব ডেটা হাজির!</li>
            <li><strong>প্রপস ড্রিলিংয়ের অবসান:</strong> প্যারেন্ট থেকে চাইল্ড, চাইল্ড থেকে গ্র্যান্ডচাইল্ডে ডেটা পাস করার মাথাব্যথা নেই।</li>
            <li><strong>প্রতিক্রিয়াশীল রি-রেন্ডার:</strong> স্টোরের ডেটা পরিবর্তন হলে কেবল যে কম্পোনেন্টটি সেই ডেটা দেখাচ্ছে শুধু সেটাই রি-রেন্ডার হয়, পুরো পেজ নয়।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">📢</div>
        <div>
          <div class="exec-callout-title">মাইক বা ব্রডকাস্ট সিস্টেমের উপমা (Broadcast Analogy):</div>
          <div class="exec-callout-text">
            Zustand হলো অফিসের সেন্ট্রাল লাউডস্পিকার। স্টোরে কোনো পরিবর্তন হলে লাউডস্পিকারে ঘোষণা হয়ে যায়, আর যে যে টেবিলে ঐ তথ্যের প্রয়োজন ছিল তারা তৎক্ষণাৎ নিজ নিজ খাতা আপডেট করে নেয়!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 45%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৮: স্টেট ম্যানেজমেন্ট ও ডেটা স্টোর</span>
    </div>
  </div>

  <!-- ==================== SLIDE 12: LOCALSTORAGE PERSISTENCE ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">পারসিস্টেন্স স্টোরেজ</span>
      </div>
      <span class="slide-counter">SLIDE 12 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">💾 ডেটা পারসিস্টেন্স: LocalStorage কিভাবে হার্ডডিস্কের মতো কাজ করে?</h2>
      <p class="slide-subheadline">কম্পিউটার শাটডাউন করে পরের দিন খুললেও FlowPay-এর সমস্ত পেরোল রেকর্ড কিভাবে সংরক্ষিত থাকে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">🔄 স্বয়ংক্রিয় সিরিয়ালাইজেশন লাইফসাইকেল</span>
            <span class="card-badge badge-indigo">Auto Sync</span>
          </div>
          <ol>
            <li><strong>স্টেট চেঞ্জ:</strong> ইউজার নতুন উপস্থিতি দিলেন বা লোন মঞ্জুর করলেন।</li>
            <li><strong>JSON রূপান্তর:</strong> Zustand-এর <code>persist</code> মিডলওয়্যার ডেটাকে <code>JSON.stringify()</code> করে টেক্সটে রূপান্তর করে।</li>
            <li><strong>লোকালস্টোরেজে সেভ:</strong> ব্রাউজারের অভ্যন্তরীণ মেমোরি স্লটে টেক্সটটি সংরক্ষিত হয়।</li>
            <li><strong>পরের বার রিকভারি:</strong> পেজ রিফ্রেশ দিলে <code>JSON.parse()</code> করে আবার অবজেক্টে ফিরিয়ে আনা হয়।</li>
          </ol>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">📦 ব্রাউজারে সংরক্ষিত ৭টি মাস্টার Key</span>
            <span class="card-badge badge-indigo">F12 Application</span>
          </div>
          <table class="comp-table" style="font-family: 'Fira Code', monospace; font-size: 9.5px;">
            <tr><td>'flowpay-employees'</td><td>কর্মীদের প্রোফাইল ও বেতন কাঠামো</td></tr>
            <tr><td>'flowpay-payroll-storage'</td><td>মাসিক চূড়ান্ত পেরোল রেকর্ড</td></tr>
            <tr><td>'flowpay-attendance'</td><td>দৈনিক হাজিরা লগ ও ছুটির ইতিহাস</td></tr>
            <tr><td>'flowpay-loans'</td><td>কর্মচারীদের সক্রিয় ঋণ ও কিস্তি হিস্ট্রি</td></tr>
            <tr><td>'flowpay-company-settings'</td><td>ন্যূনতম মজুরি, কার্যদিবস ও কর নিয়ম</td></tr>
            <tr><td>'flowpay-audit-logs'</td><td>নিরাপত্তা অডিট ট্রেইল ও টাইমস্ট্যাম্প</td></tr>
            <tr><td>'flowpay-auth-session'</td><td>বর্তমান লগইন সেশন ও ইউজার রোল</td></tr>
          </table>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">📔</div>
        <div>
          <div class="exec-callout-title">পাকা খাতার উপমা (Permanent Ledger Analogy):</div>
          <div class="exec-callout-text">
            র‍্যাম (RAM) হলো ব্ল্যাকবোর্ডের মতো—কম্পিউটার বন্ধ করলে লেখা মুছে যায়। আর LocalStorage হলো পাকা বাঁধানো রেজিস্টার খাতা—একবার কলম দিয়ে লিখলে কম্পিউটার অফ করলেও তা অক্ষত থাকে!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 50%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ৯: ব্রাউজার স্টোরেজ ও পারসিস্টেন্স</span>
    </div>
  </div>

  <!-- ==================== SLIDE 13: LIFE OF A USER ACTION ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">এন্ড-টু-এন্ড ফ্লো</span>
      </div>
      <span class="slide-counter">SLIDE 13 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">⚡ একটি ক্লিকের জীবনচক্র: বাটন প্রেস থেকে স্ক্রিনে রেন্ডার</h2>
      <p class="slide-subheadline">কেস স্টাডি: অ্যাডমিন যখন "Confirm & Generate Drafts" বাটনে চাপ দেন, তখন নেপথ্যে কী ঘটে?</p>
    </div>

    <div class="slide-canvas">
      <div class="pipeline">
        <div class="pipe-step active">
          <div class="pipe-num">১. UI ইভেন্ট</div>
          <div class="pipe-title">Button Click</div>
          <div class="pipe-desc">onClick হ্যান্ডলার ট্রিগার হয়</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">২. লজিক কল</div>
          <div class="pipe-title">handleGenerate()</div>
          <div class="pipe-desc">ডাটা ভ্যালিডেশন সম্পন্ন হয়</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">৩. ক্যালকুলেশন</div>
          <div class="pipe-title">salary.ts</div>
          <div class="pipe-desc">ট্যাক্স ও অনুপস্থিতি বিয়োগ</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">৪. স্টোরে সেভ</div>
          <div class="pipe-title">payrollStore</div>
          <div class="pipe-desc">LocalStorage-এ লেখা হয়</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">৫. রি-রেন্ডার</div>
          <div class="pipe-title">UI Update</div>
          <div class="pipe-desc">টোস্ট ও পেজ রিডাইরেক্ট</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card slate">
          <div class="card-top">
            <span class="card-title">🔍 পর্দার পেছনের ৪টি অদৃশ্য কাজ</span>
            <span class="card-badge badge-indigo">Internal Ops</span>
          </div>
          <ul>
            <li><strong>উপস্থিতি সিঙ্ক:</strong> প্রতিটি কর্মীর অনুপস্থিত দিন <code>attendanceStore</code> থেকে গুনে আনে।</li>
            <li><strong>লোন সমন্বয়:</strong> কর্মীর সক্রিয় লোনের কিস্তি কেটে ব্যালেন্স কমিয়ে দেয়।</li>
            <li><strong>নিট স্যালারি লক:</strong> গ্রস থেকে কর্তন বিয়োগ করে ড্রাফট রেকর্ড তৈরি করে।</li>
            <li><strong>অডিট লগিং:</strong> <code>auditStore</code>-এ লিখে দেয় "Generated payroll for 21 employees"।</li>
          </ul>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">🎯 রিঅ্যাক্টিভ রি-রেন্ডারিংয়ের ম্যাজিক</span>
            <span class="card-badge badge-emerald">Declarative UI</span>
          </div>
          <p>
            React-এর সবচেয়ে বড় ক্ষমতা হলো—আপনাকে ম্যানুয়ালি গিয়ে টেবিল বা গ্রাফ এডিট করতে হয় না। আপনি শুধুমাত্র Zustand স্টোরে নতুন রেকর্ড যুক্ত করেন, আর React নিজে থেকেই চোখের পলকে সমস্ত চার্ট ও টেবিল আপডেট করে দেয়!
          </p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 54%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১০: ইভেন্ট ড্রাইভেন আর্কিটেকচার</span>
    </div>
  </div>

  <!-- ==================== SLIDE 14: EMPLOYEE MODULE ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">মডিউল অ্যানাটমি</span>
      </div>
      <span class="slide-counter">SLIDE 14 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">👥 মডিউল ১: কর্মী ব্যবস্থাপনা ও দ্বৈত ব্যাংক/MFS ওয়ালেট</h2>
      <p class="slide-subheadline"><code>AddEmployeePage.tsx</code> এবং <code>employeeStore.ts</code>-এর অভ্যন্তরীণ ডেটা স্ট্রাকচার।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">📝 অনবোর্ডিং ফর্ম ফিল্ডসমূহ</span>
            <span class="card-badge badge-indigo">React Hook Form</span>
          </div>
          <ul>
            <li><strong>ব্যক্তিগত তথ্য:</strong> নাম, অফিসিয়াল ইমেইল, মোবাইল ও যোগদানের তারিখ।</li>
            <li><strong>পদায়ন:</strong> বিভাগ (Engineering, Marketing ইত্যাদি) ও পদবি।</li>
            <li><strong>বেতন ও ভাতা:</strong> বেসিক স্যালারি, বাড়িভাড়া ও চিকিৎসা ভাতা।</li>
            <li><strong>দ্বৈত চ্যানেল:</strong> সনাতন ব্যাংক অ্যাকাউন্ট ও মোবাইল ব্যাংকিং ওয়ালেট।</li>
          </ul>
        </div>

        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">Dual Payment Channel Schema</span>
          </div>
          <div class="ide-code">
            <span class="cm">// ডাটাবেসে সেভ হওয়া পেমেন্ট অবজেক্ট</span><br>
            paymentMethod: <span class="str">'mobile_banking'</span>,<br>
            bankInfo: {<br>
            &nbsp;&nbsp;bankName: <span class="str">'Dutch-Bangla Bank'</span>,<br>
            &nbsp;&nbsp;accountNumber: <span class="str">'1234567890'</span><br>
            },<br>
            mobileBankingInfo: {<br>
            &nbsp;&nbsp;provider: <span class="str">'bkash'</span>, &nbsp;<span class="cm">// বিকাশ, নগদ বা রকেট</span><br>
            &nbsp;&nbsp;accountNumber: <span class="str">'01712345678'</span>,<br>
            &nbsp;&nbsp;accountType: <span class="str">'personal'</span><br>
            }
          </div>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">💡</div>
        <div>
          <div class="exec-callout-title">দ্বৈত পেমেন্ট চ্যানেলের বাস্তব উপযোগিতা:</div>
          <div class="exec-callout-text">
            বাংলাদেশের প্রেক্ষাপটে অনেক কর্মী ব্যাংকের চেয়ে সরাসরি বিকাশ বা নগদে বেতন নিতে পছন্দ করেন। FlowPay একই প্রোফাইলে ব্যাংক ও মোবাইল ফিনান্সিয়াল সার্ভিস (MFS) উভয় তথ্য সংরক্ষণ করে এবং ডিসবার্সমেন্টের সময় অপশন দেয়।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 58%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১১: কর্মী মডিউল</span>
    </div>
  </div>

  <!-- ==================== SLIDE 15: ATTENDANCE & LEAVES ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">মডিউল অ্যানাটমি</span>
      </div>
      <span class="slide-counter">SLIDE 15 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📅 মডিউল ২: উপস্থিতি ও ছুটি অনুমোদন ইঞ্জিন (Attendance & Leaves)</h2>
      <p class="slide-subheadline"><code>attendanceStore.ts</code> কিভাবে দৈনিক হাজিরা ট্র্যাক করে এবং ছুটির কোটা স্বয়ংক্রিয়ভাবে নিয়ন্ত্রণ করে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-3">
        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">⏱️ ৫টি উপস্থিতি স্ট্যাটাস</span>
            <span class="card-badge badge-emerald">Daily Matrix</span>
          </div>
          <ul>
            <li><strong>Present:</strong> সময়মত আগমন (পূর্ণ বেতন)।</li>
            <li><strong>Late:</strong> নির্ধারিত সময়ের পরে আগমন।</li>
            <li><strong>Half Day:</strong> অর্ধ-দিবস উপস্থিতি।</li>
            <li><strong>On Leave:</strong> পূর্বে অনুমোদিত পেইড ছুটি।</li>
            <li><strong>Absent:</strong> বিনা অনুমতিতে অনুপস্থিত (বেতন কাটার যোগ্য)।</li>
          </ul>
        </div>

        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">🌴 ছুটির কোটা ব্যালেন্স</span>
            <span class="card-badge badge-indigo">Auto Quota</span>
          </div>
          <ul>
            <li><strong>নৈমিত্তিক ছুটি (Casual):</strong> ১০ দিন।</li>
            <li><strong>অসুস্থতাজনিত (Sick):</strong> ১৪ দিন।</li>
            <li><strong>বার্ষিক অর্জিত (Annual):</strong> ১৫ দিন।</li>
            <li><strong>অবৈতনিক ছুটি (Unpaid):</strong> সরাসরি বেতন কাটার সাথে সম্পৃক্ত।</li>
          </ul>
        </div>

        <div class="card amber">
          <div class="card-top">
            <span class="card-title">✏️ অডিট-ব্যাকড সংশোধন</span>
            <span class="card-badge badge-amber">Audit Logged</span>
          </div>
          <ul>
            <li>কোনো কর্মী পাঞ্চ করতে ভুলে গেলে এইচআর ম্যানেজার সঠিক সময় লিখে হাজিরা সংশোধন করতে পারেন।</li>
            <li>প্রতিটি সংশোধনের পেছনের কারণ ও পরিবর্তনের ইতিহাস সিস্টেমে স্থায়ীভাবে রেকর্ড থাকে।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🔗</div>
        <div>
          <div class="exec-callout-title">পেরোল ইঞ্জিনের সাথে অটো-কানেকশন:</div>
          <div class="exec-callout-text">
            মাস শেষে যখন পেরোল রান করা হয়, পেরোল ইঞ্জিন attendanceStore থেকে স্বয়ংক্রিয়ভাবে একটি ফাংশন কল করে: <code>summary = getMonthlyEmployeeSummary(empId, month, year)</code>। এখান থেকে মোট Absent দিন সরাসরি বেতন কর্তনে চলে যায়!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 62%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১২: উপস্থিতি ও ছুটি মডিউল</span>
    </div>
  </div>

  <!-- ==================== SLIDE 16: LOANS MODULE ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">মডিউল অ্যানাটমি</span>
      </div>
      <span class="slide-counter">SLIDE 16 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">💰 মডিউল ৩: লোন ও বেতন অগ্রিম কিস্তি ব্যবস্থাপনা (Loans Engine)</h2>
      <p class="slide-subheadline"><code>loanStore.ts</code> কিভাবে ঋণ মঞ্জুর, মাসিক কিস্তি নির্ধারণ ও প্রাক-নিষ্পত্তি (Early Settlement) পরিচালনা করে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card slate">
          <div class="card-top">
            <span class="card-title">📈 লোন কিস্তি গণনার অ্যালগরিদম</span>
            <span class="card-badge badge-indigo">Amortization</span>
          </div>
          <div class="ide-code" style="background: #1e293b; border-radius: 4px; padding: 6px;">
            <span class="cm">// মাসিক কিস্তি নির্ধারণের কোড সূত্র</span><br>
            principalAmount = <span class="var">30000</span>; &nbsp;<span class="cm">// মোট ঋণ ৳৩০,০০০</span><br>
            termMonths = <span class="var">6</span>; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="cm">// মেয়ার ৬ মাস</span><br>
            monthlyInstallment = Math.round(principalAmount / termMonths);<br>
            <span class="cm">// রেজাল্ট: ৳৫,০০০ / প্রতি মাসে বেতন থেকে কর্তন</span>
          </div>
          <p style="margin-top: 6px;">প্রতি মাসে পেরোল প্রসেসের সময় এই কিস্তি স্বয়ংক্রিয়ভাবে কর্মীর বেতন থেকে বাদ পড়ে এবং অবশিষ্ট মূলধন হ্রাস পায়।</p>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">⚡ প্রাক-নিষ্পত্তি (Early Settlement)</span>
            <span class="card-badge badge-emerald">One-Click</span>
          </div>
          <ul>
            <li>যদি কোনো কর্মী ৬ মাস শেষ হওয়ার আগেই এককালীন ক্যাশ টাকায় পুরো ঋণ শোধ করে দিতে চান—</li>
            <li>অ্যাকাউন্ট্যান্ট এক ক্লিকে <strong>"Early Settlement"</strong> বোতাম চাপলে লোনটি তৎক্ষণাৎ সমাপ্ত (Settled) হয়ে যায়।</li>
            <li>পরবর্তী মাসের পেরোল থেকে সিস্টেম আর কোনো কিস্তি কাটবে না।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🛡️</div>
        <div>
          <div class="exec-callout-title">ডুপ্লিকেট কর্তন সুরক্ষা লজিক:</div>
          <div class="exec-callout-text">
            সিস্টেমের ক্যালকুলেশন লজিকে পাহারা দেওয়া আছে: <code>Math.min(activeLoan.monthlyInstallment, activeLoan.remainingBalance)</code>। অর্থাৎ কোনো অবস্থাতেই অবশিষ্ট ঋণের চেয়ে বেশি টাকা বেতন থেকে কাটা সম্ভব নয়!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 66%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৩: লোন ও অগ্রিম মডিউল</span>
    </div>
  </div>

  <!-- ==================== SLIDE 17: PAYROLL GENERATION WIZARD ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">কোর ইঞ্জিন</span>
      </div>
      <span class="slide-counter">SLIDE 17 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">⚙️ মডিউল ৪: ৩-ধাপের স্বয়ংক্রিয় পেরোল জেনারেশন উইজার্ড</h2>
      <p class="slide-subheadline"><code>GeneratePayrollPage.tsx</code>-এর মাধ্যমে শত শত কর্মীর বেতন নিরাপদে প্রস্তুত করার ধাপসমূহ।</p>
    </div>

    <div class="slide-canvas">
      <div class="pipeline">
        <div class="pipe-step active">
          <div class="pipe-num">ধাপ ১: সময়কাল ও পলিসি</div>
          <div class="pipe-title">Period & Policy</div>
          <div class="pipe-desc">মাস, বছর ও অনুপস্থিতি কর্তন সুইচ</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">ধাপ ২: পরিবর্তনশীল সমন্বয়</div>
          <div class="pipe-title">Variable Adjustments</div>
          <div class="pipe-desc">বোনাস, ওভারটাইম ও হাজিরা রিভিউ</div>
        </div>
        <div class="pipe-arrow">➔</div>
        <div class="pipe-step active">
          <div class="pipe-num">ধাপ ৩: প্রিভিউ ও লক</div>
          <div class="pipe-title">Preview & Finalize</div>
          <div class="pipe-desc">গ্রস, কর্তন ও নিট বেতনের ড্রাফট তৈরি</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">🔘 Auto-Deduct Absent Days পলিসি সুইচ</span>
            <span class="card-badge badge-indigo">Feature Highlight</span>
          </div>
          <ul>
            <li><strong>সুইচ ON থাকলে:</strong> সিস্টেম হাজিরা রেকর্ড থেকে স্বয়ংক্রিয়ভাবে অনুপস্থিত দিন ও অবৈতনিক ছুটি টেনে এনে বেতন থেকে কর্তন করে।</li>
            <li><strong>সুইচ OFF থাকলে:</strong> অনুপস্থিতির কোনো স্বয়ংক্রিয় কর্তন হয় না (০ দিন ধরে পূর্ণ বেতন প্রসেস হয়)।</li>
            <li>ম্যানেজার স্টেপ ২-এর টুলবার থেকেও এক ক্লিকে পলিসি পরিবর্তন করতে পারেন।</li>
          </ul>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">🔍 লাইভ ক্যালকুলেশন টেবিল</span>
            <span class="card-badge badge-emerald">Real-time Reactive</span>
          </div>
          <p>
            স্টেপ ২-এ ইনপুট বক্সে বোনাস বা ওভারটাইম সংখ্যা পরিবর্তন করার সাথে সাথে নিচের ফর্মুলা ইঞ্জিন সাথে সাথে নিট বেতন রি-ক্যালকুলেট করে স্ক্রিনে দেখায়—কোনো পেজ রিলোড লাগে না!
          </p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 70%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৪: পেরোল ইঞ্জিন কার্যপ্রবাহ</span>
    </div>
  </div>

  <!-- ==================== SLIDE 18: PAYROLL FORMULAS ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">গাণিতিক অ্যালগরিদম</span>
      </div>
      <span class="slide-counter">SLIDE 18 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🧮 পেরোল গণনার অ্যালগরিদম ও অনুপস্থিতি কর্তন সূত্র</h2>
      <p class="slide-subheadline"><code>src/lib/salary.ts</code> ফাইলে থাকা সংবিধিবদ্ধ বেতন হিসাবের নিখুঁত গাণিতিক মডেল।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">💵 আয়ের হিসাব (Gross Earnings)</span>
            <span class="card-badge badge-emerald">Addition</span>
          </div>
          <div class="ide-code" style="background: #1e293b; border-radius: 4px; padding: 6px; font-size: 9px;">
            <span class="cm">// ১. ওভারটাইম পারিশ্রমিক</span><br>
            hourlyRate = basicSalary / (workingDays * 8);<br>
            overtimePay = overtimeHours * hourlyRate * 1.5;<br><br>
            <span class="cm">// ২. মোট গ্রস বেতন</span><br>
            grossSalary = basicSalary + allowances + bonus + overtimePay;
          </div>
        </div>

        <div class="card rose">
          <div class="card-top">
            <span class="card-title">📉 কর্তনের হিসাব (Total Deductions)</span>
            <span class="card-badge badge-rose">Deduction</span>
          </div>
          <div class="ide-code" style="background: #1e293b; border-radius: 4px; padding: 6px; font-size: 9px;">
            <span class="cm">// ৩. অনুপস্থিতি দৈনিক কর্তন</span><br>
            dailyRate = basicSalary / standardWorkingDays;<br>
            absenceDeduction = absentDays * dailyRate;<br><br>
            <span class="cm">// ৪. প্রভিডেন্ট ফান্ড (PF - ৮.৩৩%)</span><br>
            pfEmployee = (basicSalary * 8.33) / 100;<br><br>
            <span class="cm">// ৫. নিট প্রদেয় বেতন (মাইনাস প্রতিরোধে নূন্যতম ০ ক্যাপ)</span><br>
            netSalary = Math.max(0, grossSalary - totalDeductions);
          </div>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🛡️</div>
        <div>
          <div class="exec-callout-title">ডেসিমাল সেফ রাউন্ডিং ইউটিলিটি (Floating Point Precision):</div>
          <div class="exec-callout-text">
            জাভাস্ক্রিপ্টে <code>0.1 + 0.2 = 0.30000000000000004</code> এর মতো অদ্ভুত সমস্যা হতে পারে। FlowPay-তে <code>roundCurrency()</code> ইউটিলিটি ব্যবহার করে <code>Math.round((val + Number.EPSILON) * 100) / 100</code> দিয়ে ভগ্নাংশের নির্ভুল হিসাব নিশ্চিত করা হয়েছে।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 75%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৫: গাণিতিক অ্যালগরিদম</span>
    </div>
  </div>

  <!-- ==================== SLIDE 19: PAYSLIPS PDF ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">ডকুমেন্ট জেনারেশন</span>
      </div>
      <span class="slide-counter">SLIDE 19 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📄 মডিউল ৫: পে-স্লিপ জেনারেশন ও ব্রাউজার-সাইড PDF ইঞ্জিন</h2>
      <p class="slide-subheadline"><code>PayslipTemplate.tsx</code> ও <code>export.ts</code> কিভাবে কোনো সার্ভার ছাড়া ক্লায়েন্টে সরাসরি পিডিএফ প্রিন্ট করে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">📋 অফিশিয়াল পে-স্লিপের উপাদানসমূহ</span>
            <span class="card-badge badge-indigo">Template Spec</span>
          </div>
          <ul>
            <li><strong>কোম্পানির ব্র্যান্ডিং:</strong> লোগো, ঠিকানা, অফিসিয়াল ইমেইল ও ফোন।</li>
            <li><strong>কর্মীর ডেজিগনেশন:</strong> নাম, এমপ্লয়ি আইডি, পদবি ও পে-পিরিয়ড।</li>
            <li><strong>আয়ের বিবরণ:</strong> বেসিক, বাড়িভাড়া (৫০%), চিকিৎসা (৩০%), যাতায়াত (২০%), বোনাস।</li>
            <li><strong>কর্তনের বিবরণ:</strong> আয়কর, প্রভিডেন্ট ফান্ড, লোনের কিস্তি এবং <strong>"Absent Days (২ দিন @ ৳২,০০০)"</strong>।</li>
            <li><strong>পেমেন্ট ট্রানজেকশন রেফারেন্স:</strong> ব্যাংক বা বিকাশ ট্রানজেকশন আইডি।</li>
          </ul>
        </div>

        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">src/lib/export.ts (Client-side PDF)</span>
          </div>
          <div class="ide-code">
            <span class="kw">export async function</span> <span class="fn">exportToPDF</span>(elementId, filename) {<br>
            &nbsp;&nbsp;<span class="cm">// ১. ব্রাউজারের DOM উপাদানটি ধরো</span><br>
            &nbsp;&nbsp;<span class="kw">const</span> element = document.getElementById(elementId);<br>
            &nbsp;&nbsp;<span class="cm">// ২. html2canvas দিয়ে ছবি ক্যানভাসে আঁকো</span><br>
            &nbsp;&nbsp;<span class="kw">const</span> canvas = <span class="kw">await</span> html2canvas(element, { scale: 2 });<br>
            &nbsp;&nbsp;<span class="cm">// ৩. jsPDF দিয়ে A4 সাইজ ফাইলে ঢুকিয়ে ডাউনলোড করো</span><br>
            &nbsp;&nbsp;<span class="kw">const</span> pdf = <span class="kw">new</span> jsPDF(<span class="str">'p'</span>, <span class="str">'mm'</span>, <span class="str">'a4'</span>);<br>
            &nbsp;&nbsp;pdf.addImage(canvas.toDataURL(<span class="str">'image/png'</span>), <span class="str">'PNG'</span>, ...);<br>
            &nbsp;&nbsp;pdf.save(<span class="str">\`\${filename}.pdf\`</span>);<br>
            }
          </div>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">💡</div>
        <div>
          <div class="exec-callout-title">অফ-স্ক্রিন রেন্ডারিং কৌশল (Off-screen Rendering):</div>
          <div class="exec-callout-text">
            পে-স্লিপ পেজের তালিকায় প্রিভিউ না খুলেও পাশের "PDF" বাটনে চাপ দিলেই ডাউনলোড হয়ে যায়। কারণ FlowPay পর্দার আড়ালে <code>left: -9999px</code>-এ পে-স্লিপের লেআউট রেন্ডার করে রাখে এবং সেখান থেকে সরাসরি পিডিএফ বানায়!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 79%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৬: পে-স্লিপ ও ডকুমেন্টেশন</span>
    </div>
  </div>

  <!-- ==================== SLIDE 20: REPORTS & EXPORTS ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">অ্যানালিটিক্স ও এক্সপোর্ট</span>
      </div>
      <span class="slide-counter">SLIDE 20 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📊 মডিউল ৬: অ্যানালিটিক্স, গ্রাফিক্যাল চার্ট ও ডেটা এক্সপোর্ট</h2>
      <p class="slide-subheadline"><code>src/pages/reports/</code> ডিরেক্টরির অ্যানালিটিক্যাল ইঞ্জিন ও মাল্টি-ফরম্যাট এক্সপোর্ট সিস্টেম।</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">📈 ৪টি এক্সক্লুসিভ রিপোর্টিং মডিউল</span>
            <span class="card-badge badge-indigo">Recharts Engine</span>
          </div>
          <ul>
            <li><strong>১. স্যালারি রিপোর্ট:</strong> মাস, বছর ও বিভাগভিত্তিক পেরোল ব্যয়ের ট্রেন্ড।</li>
            <li><strong>২. ডিপার্টমেন্ট রিপোর্ট:</strong> কোন বিভাগের বেতন গড় কত এবং সর্বোচ্চ/সর্বনিম্ন বেতন।</li>
            <li><strong>৩. পেমেন্ট মেথড রিপোর্ট:</strong> ব্যাংক ট্রান্সফার বনাম বিকাশ/নগদে ব্যয়ের আনুপাতিক পাই-চার্ট।</li>
            <li><strong>৪. বাৎসরিক সারসংক্ষেপ:</strong> পুরো ১২ মাসের সামগ্রিক আর্থিক অডিট সামারি।</li>
          </ul>
        </div>

        <div class="card slate">
          <div class="card-top">
            <span class="card-title">📤 ৩টি আন্তর্জাতিক এক্সপোর্ট ফরম্যাট</span>
            <span class="card-badge badge-emerald">Data Portability</span>
          </div>
          <ul>
            <li><strong>CSV Export:</strong> হালকা টেক্সট ফাইল, যা অন্য যেকোনো সফটওয়্যার বা ডেটাবেসে ইমপোর্ট করা যায়।</li>
            <li><strong>Excel (.xlsx) Export:</strong> <code>xlsx</code> লাইব্রেরি ব্যবহার করে আসল মাইক্রোসফট এক্সেল স্প্রেডশীট জেনারেট হয় যেখানে সূত্রসহ হিসাব করা যায়।</li>
            <li><strong>Print-Ready PDF:</strong> এক্সিকিউটিভ ও বোর্ড মিটিংয়ে উপস্থাপনের উপযোগী ফরম্যাট।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">📊</div>
        <div>
          <div class="exec-callout-title">Recharts ডাইনামিক রেন্ডারিং:</div>
          <div class="exec-callout-text">
            চার্টগুলো সাধারণ ছবি নয়—মাউস নিলে লাইভ টুলটিপে টাকার অংক ও কর্মীর সংখ্যা ভেসে ওঠে। নতুন পেরোল অনুমোদিত হলে সাথে সাথে চার্টের স্তম্ভগুলো নতুন উচ্চতায় আপডেট হয়।
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 83%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৭: রিপোর্টিং ও অ্যানালিটিক্স</span>
    </div>
  </div>

  <!-- ==================== SLIDE 21: AUDIT LOGS ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">নিরাপত্তা ও কমপ্লায়েন্স</span>
      </div>
      <span class="slide-counter">SLIDE 21 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">📜 মডিউল ৭: সিস্টেম অডিট ট্রেইল ও সিকিউরিটি লগিং</h2>
      <p class="slide-subheadline"><code>auditStore.ts</code> কিভাবে প্রতিটি আর্থিক পদক্ষেপ ও প্রশাসনিক পরিবর্তন ডিজিটাল ডায়েরিতে রেকর্ড করে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="card rose">
          <div class="card-top">
            <span class="card-title" style="color: #991b1b;">🕵️ অডিট লগের প্রয়োজনীয়তা কেন?</span>
            <span class="card-badge badge-rose">Compliance</span>
          </div>
          <ul>
            <li>আর্থিক সফটওয়্যারে কোনো টাকার অংক বা উপস্থিতি পরিবর্তন হলে তার প্রমাণ থাকা বাধ্যতামূলক।</li>
            <li>অ্যাডমিন বা অ্যাকাউন্ট্যান্ট যেকোনো বেতন অনুমোদন বা পরিবর্তন করলে সিস্টেমে তার নাম ও টাইমস্ট্যাম্প সেভ হয়।</li>
            <li>কেউ পেছনের তারিখে গিয়ে অসদুপায়ে হাজিরা পরিবর্তন করতে চাইলে সাথে সাথে ধরা পড়ে যায়।</li>
          </ul>
        </div>

        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">Audit Log Data Structure</span>
          </div>
          <div class="ide-code">
            {<br>
            &nbsp;&nbsp;id: <span class="str">"AUD-8921"</span>,<br>
            &nbsp;&nbsp;userId: <span class="str">"USR-003"</span>,<br>
            &nbsp;&nbsp;userName: <span class="str">"Finance Admin"</span>,<br>
            &nbsp;&nbsp;action: <span class="str">"Disburse Salary"</span>,<br>
            &nbsp;&nbsp;module: <span class="str">"Payroll"</span>,<br>
            &nbsp;&nbsp;details: <span class="str">"Disbursed Tanvir Hasan's salary via bkash (Ref: TXN-94Z)"</span>,<br>
            &nbsp;&nbsp;timestamp: <span class="str">"2026-10-28T14:20:00Z"</span><br>
            }
          </div>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">📹</div>
        <div>
          <div class="exec-callout-title">ডিজিটাল সিসিটিভি ক্যামেরার উপমা (CCTV Analogy):</div>
          <div class="exec-callout-text">
            অডিট লগ হলো ব্যাংকের ভল্টের সিসিটিভি ক্যামেরার মতো। ভল্ট কে খুলেছে, কার একাউন্টে কত টাকা গেছে আর কখন তালা দিয়েছে—প্রতিটি মুহূর্ত ফ্রেম বাই ফ্রেম চিরতরে রেকর্ড হয়ে থাকে!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 87%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৮: অডিট ট্রেইল ও অখণ্ডতা</span>
    </div>
  </div>

  <!-- ==================== SLIDE 22: AUTOMATED TESTING ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">গুণগত মান ও টেস্টিং</span>
      </div>
      <span class="slide-counter">SLIDE 22 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🧪 কোড কোয়ালিটি ও টেস্টিং: স্বয়ংক্রিয় টেস্ট কিভাবে চলে?</h2>
      <p class="slide-subheadline"><code>npm test</code> কমান্ড দিলে টার্মিনালে ৩০টি সবুজ পাস মার্ক কিভাবে ওঠে?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-2">
        <div class="ide-window">
          <div class="ide-topbar">
            <span class="ide-dot dot-red"></span>
            <span class="ide-dot dot-yellow"></span>
            <span class="ide-dot dot-green"></span>
            <span class="ide-filename">tests/payrollCalculations.test.ts</span>
          </div>
          <div class="ide-code">
            <span class="cm">// টেস্ট কেস: ২ দিন অনুপস্থিত থাকলে কর্তন সঠিক কিনা</span><br>
            <span class="kw">const</span> basic = <span class="var">50000</span>;<br>
            <span class="kw">const</span> workingDays = <span class="var">25</span>; &nbsp;<span class="cm">// দৈনিক রেট = ৳২,০০০</span><br>
            <span class="kw">const</span> absentDays = <span class="var">2</span>; &nbsp;&nbsp;&nbsp;<span class="cm">// কর্তন হওয়া উচিত = ৳৪,০০০</span><br><br>
            <span class="kw">const</span> result = <span class="fn">calculateFullSalary</span>({ basic, absentDays }, { workingDays });<br><br>
            <span class="cm">// যাচাই (Assertion)</span><br>
            assert(<span class="str">"Absence deduction is 4000"</span>, result.absenceDeduction === <span class="num">4000</span>);<br>
            assert(<span class="str">"Net salary is 46000"</span>, result.netSalary === <span class="num">46000</span>);
          </div>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">🏆 ৩০/৩০ ভেরিফাইড টেস্ট কভারেজ</span>
            <span class="card-badge badge-emerald">100% Passed</span>
          </div>
          <ul>
            <li><strong>বেসিক স্যালারি ক্যালকুলেশন:</strong> কোনো কর্তন না থাকলে নিট ও গ্রস সমান।</li>
            <li><strong>ওভারটাইম মাল্টিপ্লায়ার:</strong> ১.৫x গুণক সঠিক কাজ করছে কিনা।</li>
            <li><strong>অনুপস্থিতি অটো-ডিডাকশন:</strong> টগল চালু বনাম বন্ধ অবস্থায় হিসাব।</li>
            <li><strong>প্রভিডেন্ট ফান্ড অবদান:</strong> ৮.৩৩% রাউন্ডিং হিসাব।</li>
            <li><strong>হেডলেস ব্রাউজার টেস্ট:</strong> Puppeteer দিয়ে সমস্ত ২১টি ইউআরএল স্বয়ংক্রিয়ভাবে ব্রাউজ করে রানটাইম এরর পরীক্ষা।</li>
          </ul>
        </div>
      </div>

      <div class="exec-callout">
        <div class="exec-callout-icon">🚗</div>
        <div>
          <div class="exec-callout-title">গাড়ি ক্র্যাশ টেস্টের উপমা (Crash Test Analogy):</div>
          <div class="exec-callout-text">
            রাস্তায় গাড়ি নামানোর আগে যেমন ল্যাবরেটরিতে ব্রেক ও ইঞ্জিন টেস্ট করে নিশ্চিত হতে হয়, তেমনি কোটি কোটি টাকার পেরোল সফটওয়্যার চালানোর আগে স্বয়ংক্রিয় টেস্ট কোড দিয়ে হিসাবের নির্ভুলতা শতভাগ নিশ্চিত করতে হয়!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 91%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ১৯: টেস্টিং ও গুণগত মান</span>
    </div>
  </div>

  <!-- ==================== SLIDE 23: JUNIOR DEVELOPER GUIDE ==================== -->
  <div class="slide">
    <div class="slide-accent-line"></div>
    <div class="slide-header">
      <div class="header-left">
        <span class="brand-logo-pill">FP</span>
        <span class="brand-title-text">FlowPay Enterprise</span>
        <span class="category-pill">প্র্যাকটিক্যাল গাইড</span>
      </div>
      <span class="slide-counter">SLIDE 23 / 24</span>
    </div>

    <div class="title-block">
      <h2 class="slide-headline">🚀 জুনিয়র প্রোগ্রামার গাইড: নতুন ফিচার কিভাবে যোগ করবেন?</h2>
      <p class="slide-subheadline">উদাহরণ: আপনি যদি কর্মীদের প্রোফাইলে "রক্তের গ্রুপ (Blood Group)" যুক্ত করতে চান, তবে কোন ৪টি ধাপে করবেন?</p>
    </div>

    <div class="slide-canvas">
      <div class="grid-4">
        <div class="card indigo">
          <div class="card-top">
            <span class="card-title">ধাপ ১: টাইপ স্কিমা</span>
            <span class="card-badge badge-indigo">types.ts</span>
          </div>
          <p><code>src/lib/types.ts</code> ফাইলে <code>Employee</code> ইন্টারফেসে একটি নতুন ফিল্ড যোগ করুন:</p>
          <div class="ide-code" style="margin-top: 4px; font-size: 8.5px; padding: 4px;">
            bloodGroup?: <span class="kw">string</span>;
          </div>
        </div>

        <div class="card blue">
          <div class="card-top">
            <span class="card-title">ধাপ ২: স্টোর ও সিড</span>
            <span class="card-badge badge-blue">employeeStore</span>
          </div>
          <p><code>employeeStore.ts</code> ও <code>seedData.ts</code>-এ নিশ্চিত করুন ফিল্ডটি অবজেক্টে সেভ হচ্ছে।</p>
        </div>

        <div class="card emerald">
          <div class="card-top">
            <span class="card-title">ধাপ ৩: ফর্ম ইনপুট</span>
            <span class="card-badge badge-emerald">AddEmployee</span>
          </div>
          <p><code>AddEmployeePage.tsx</code>-এ একটি ড্রপডাউন সিলেক্ট বক্স বসান যাতে ইউজার A+, B+, O+ বেছে নিতে পারে।</p>
        </div>

        <div class="card amber">
          <div class="card-top">
            <span class="card-title">ধাপ ৪: ভিউ প্রদর্শন</span>
            <span class="card-badge badge-amber">ProfilePage</span>
          </div>
          <p><code>EmployeeProfilePage.tsx</code>-এ একটি ব্যাজ দিয়ে রক্ত গ্রুপটি প্রোফাইলে সুন্দরভাবে প্রদর্শন করুন।</p>
        </div>
      </div>

      <div class="exec-callout" style="margin-top: 6px;">
        <div class="exec-callout-icon">🎯</div>
        <div>
          <div class="exec-callout-title">ফুলস্ট্যাকের গোল্ডেন রুল (The Golden Rule for Beginners):</div>
          <div class="exec-callout-text">
            যেকোনো পূর্ণাঙ্গ সফটওয়্যারের ডেটা প্রবাহ সবসময় একই থাকে: <strong>Type (মডেল) ➔ Store (ডেটাবেস লজিক) ➔ Page Form (ইনপুট গ্রহণ) ➔ View Component (প্রদর্শন)</strong>। এই ধারাবাহিকতা মনে রাখলে যেকোনো জটিল সফটওয়্যার পরিবর্তন করা একদম সহজ!
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 95%;"></span></span> FlowPay Engineering Presentation</div>
      <span>অধ্যায় ২০: ডেভেলপমেন্ট হ্যান্ডবুক</span>
    </div>
  </div>

  <!-- ==================== SLIDE 24: SUMMARY & ROADMAP ==================== -->
  <div class="slide section-break-theme">
    <div>
      <span class="section-part-pill">CONCLUSION & CLOUD ROADMAP</span>
      <h2 class="section-title">উপসংহার ও ভবিষ্যতের পূর্ণাঙ্গ ক্লাউডে রূপান্তর</h2>
      <p class="section-desc">
        FlowPay প্রজেক্ট প্রমাণ করে যে আধুনিক ওয়েব প্রযুক্তিতে ব্রাউজারের ভেতরেই শক্তিশালী, নিরাপদ ও রিয়েল-টাইম এন্টারপ্রাইজ সিস্টেম তৈরি করা সম্ভব।
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; max-width: 650px; margin: 18px auto 0 auto; text-align: left;">
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #38bdf8; font-size: 12px; display: block; margin-bottom: 3px;">🎉 আমরা যা শিখলাম:</strong>
          <span style="font-size: 10.5px; color: #cbd5e1; line-height: 1.4; display: block;">
            React 18 কম্পোনেন্ট, TypeScript টাইপ-সেফটি, Zustand ইন-মেমোরি ডাটাবেস, বেতন হিসাবের অ্যালগরিদম ও ক্লায়েন্ট-সাইড অফ-স্ক্রিন PDF রেন্ডারিং।
          </span>
        </div>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-size: 12px; display: block; margin-bottom: 3px;">🔮 ক্লাউড বিস্তার (Next Steps):</strong>
          <span style="font-size: 10.5px; color: #cbd5e1; line-height: 1.4; display: block;">
            ভবিষ্যতে রিমোট PostgreSQL লাগাতে চাইলে শুধুমাত্র Zustand অ্যাকশনে <code>fetch('/api/...')</code> যুক্ত করলেই নিমেষে মাল্টি-সার্ভার ক্লাউড অ্যাপে রূপান্তর হবে!
          </span>
        </div>
      </div>

      <div style="margin-top: 18px; font-size: 12px; color: #818cf8; font-weight: 600;">
        ধন্যবাদ! হ্যাপি ফুলস্ট্যাক কোডিং! 🚀 • FlowPay Enterprise Payroll System
      </div>
    </div>

    <div class="slide-footer" style="position: absolute; bottom: 8mm; left: 16mm; right: 16mm; border-top: 1px solid rgba(255,255,255,0.1); color: #64748b;">
      <div><span class="footer-progress-bar"><span class="progress-fill" style="width: 100%;"></span></span> FlowPay Engineering Presentation</div>
      <span>কপিরাইট © ২০২৬ FlowPay Inc. সর্বস্বত্ব সংরক্ষিত।</span>
    </div>
  </div>

</body>
</html>`;

async function generateProfessionalPresentationPdf() {
  console.log('Generating FlowPay 24-Slide Executive Bangla Presentation PDF (16:9 Widescreen)...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Generate 16:9 Landscape Widescreen Presentation PDF
  await page.pdf({
    path: OUTPUT_FILE,
    width: '297mm',
    height: '167.06mm', // Exact 16:9 Widescreen ratio
    printBackground: true,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  // Copy to public directory for immediate live web preview
  fs.copyFileSync(OUTPUT_FILE, PUBLIC_OUTPUT_FILE);

  await browser.close();

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`✓ Professional Bangla Presentation PDF Generated Successfully!`);
  console.log(`  - File Path: ${OUTPUT_FILE}`);
  console.log(`  - Public Path: ${PUBLIC_OUTPUT_FILE}`);
  console.log(`  - File Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

generateProfessionalPresentationPdf().catch(err => {
  console.error('Failed to generate Professional Bangla Presentation PDF:', err);
  process.exit(1);
});
