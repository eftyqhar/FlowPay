import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_FILE = path.resolve('FlowPay_Full_Documentation_Bangla.pdf');
const PUBLIC_OUTPUT_FILE = path.resolve('public/FlowPay_Full_Documentation_Bangla.pdf');

const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>FlowPay - পূর্ণাঙ্গ সিস্টেম ও ব্যবহারকারী নির্দেশিকা</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Hind Siliguri', 'Nirmala UI', 'Kalpurush', 'SolaimanLipi', sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 13.5px;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 960px;
      padding: 40px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
    }
    .cover-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      background-color: #4f46e5;
      color: #ffffff;
      font-weight: 700;
      font-size: 24px;
      padding: 8px 16px;
      border-radius: 8px;
      letter-spacing: 1px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 700;
      color: #312e81;
    }
    .cover-body {
      margin-top: 60px;
      text-align: center;
    }
    .cover-badge {
      display: inline-block;
      background-color: #e0e7ff;
      color: #4338ca;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 16px;
      border-radius: 9999px;
      margin-bottom: 20px;
      border: 1px solid #c7d2fe;
    }
    .main-title {
      font-size: 36px;
      font-weight: 700;
      color: #1e1b4b;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .subtitle {
      font-size: 18px;
      color: #475569;
      max-width: 650px;
      margin: 0 auto 30px auto;
      line-height: 1.5;
    }
    .cover-footer {
      border-top: 2px solid #cbd5e1;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }

    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
    }
    h1 {
      font-size: 24px;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 8px;
      margin-top: 24px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h2 {
      font-size: 18px;
      color: #3730a3;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 15px;
      color: #1e293b;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin: 0 0 10px 0;
      text-align: justify;
    }

    .toc {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 13.5px;
    }
    .toc-item:last-child {
      border-bottom: none;
    }
    .toc-title {
      font-weight: 600;
      color: #334155;
    }

    .card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-title {
      font-weight: 700;
      font-size: 15px;
      color: #1e1b4b;
      margin-bottom: 8px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-primary { background: #e0e7ff; color: #4338ca; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0369a1; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 12.5px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .formula-box {
      background: #fdf4ff;
      border-left: 4px solid #c026d3;
      padding: 12px 16px;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
    }
    .formula-title {
      font-weight: 700;
      color: #86198f;
      margin-bottom: 4px;
    }

    .highlight-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 12px 16px;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
    }

    .note-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
    }

    ul, ol {
      margin: 8px 0 12px 20px;
      padding: 0;
    }
    li {
      margin-bottom: 5px;
    }
    code {
      background-color: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      font-size: 12px;
      color: #be185d;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="brand-logo">FP</div>
      <div>
        <div class="brand-title">FlowPay Enterprise</div>
        <div style="font-size: 12px; color: #64748b;">আধুনিক কর্পোরেট পেরোল ও বেতন ব্যবস্থাপনা প্ল্যাটফর্ম</div>
      </div>
    </div>

    <div class="cover-body">
      <span class="cover-badge">অফিসিয়াল সিস্টেম ডকুমেনটেশন ও হ্যান্ডবুক • v1.0.0</span>
      <h1 class="main-title">FlowPay পেরোল ম্যানেজমেন্ট সিস্টেম<br>পূর্ণাঙ্গ ব্যবহারকারী ও টেকনিক্যাল ম্যানুয়াল</h1>
      <p class="subtitle">
        প্রতিষ্ঠানের মানবসম্পদ, ডিজিটাল উপস্থিতি, ছুটি ব্যবস্থাপনা, ঋণ ও বেতন অগ্রিম, দ্বৈত ব্যাংক ও মোবাইল ফিনান্সিয়াল সার্ভিসেস (MFS) ওয়ালেট এবং সংবিধিবদ্ধ নিয়মসহ স্বয়ংক্রিয় বেতন হিসাব ও বিতরণের পরিপূর্ণ নির্দেশিকা।
      </p>

      <div style="display: inline-flex; gap: 15px; margin-top: 20px;">
        <span class="badge badge-success" style="font-size: 12px; padding: 6px 12px;">✓ প্রোডাকশন রেডি</span>
        <span class="badge badge-primary" style="font-size: 12px; padding: 6px 12px;">✓ ১০০% টেস্ট ভেরিফাইড</span>
        <span class="badge badge-info" style="font-size: 12px; padding: 6px 12px;">✓ ভূমিকাভিত্তিক অ্যাক্সেস (RBAC)</span>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>প্ল্যাটফর্ম:</strong> FlowPay Web Suite<br>
        <strong>প্রযুক্তি স্ট্যাক:</strong> React 18, TypeScript, Vite, Zustand, Tailwind
      </div>
      <div style="text-align: right;">
        <strong>প্রকাশনার তারিখ:</strong> অক্টোবর ২০২৬<br>
        <strong>প্রস্তুতকারক:</strong> FlowPay আর্কিটেকচার ও ইঞ্জিনিয়ারিং টিম
      </div>
    </div>
  </div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div class="page-break"></div>
  <h1>সূচিপত্র (Table of Contents)</h1>
  <div class="toc">
    <div class="toc-item"><span class="toc-title">অধ্যায় ১: প্রজেক্ট পরিচিতি, আর্কিটেকচার ও প্রযুক্তি কাঠামো</span><span>পৃষ্ঠা ৩</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ২: ব্যবহারকারী ভূমিকা ও নিরাপত্তা মডেল (RBAC)</span><span>পৃষ্ঠা ৪</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৩: এক্সিকিউটিভ ড্যাশবোর্ড ও লাইভ পরিসংখ্যান</span><span>পৃষ্ঠা ৫</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৪: কর্মী ব্যবস্থাপনা ও দ্বৈত ব্যাংক/MFS ওয়ালেট ইন্টিগ্রেশন</span><span>পৃষ্ঠা ৬</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৫: উপস্থিতি ও ছুটি অনুমোদন কার্যপ্রবাহ (Attendance & Leaves)</span><span>পৃষ্ঠা ৮</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৬: ঋণ ও বেতন অগ্রিম ব্যবস্থাপনা (Loans & Salary Advances)</span><span>পৃষ্ঠা ১০</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৭: স্বয়ংক্রিয় মাসিক পেরোল ইঞ্জিন ও অনুপস্থিতি কর্তন পলিসি</span><span>পৃষ্ঠা ১১</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৮: অফিশিয়াল পে-স্লিপ তৈরি ও বেতন বিতরণ চ্যানেল</span><span>পৃষ্ঠা ১৩</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ৯: আর্থিক অ্যানালিটিক্স, অডিট লগ ও এক্সপোর্ট সিস্টেম</span><span>পৃষ্ঠা ১৫</span></div>
    <div class="toc-item"><span class="toc-title">অধ্যায় ১০: সিস্টেম টেস্ট সুইট ও প্রোডাকশন ডেপ্লয়মেন্ট গাইড</span><span>পৃষ্ঠা ১৬</span></div>
  </div>

  <!-- ==================== CHAPTER 1 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ১: প্রজেক্ট পরিচিতি, আর্কিটেকচার ও প্রযুক্তি কাঠামো</h1>
  
  <p>
    <strong>FlowPay</strong> হলো একটি আধুনিক, এন্টারপ্রাইজ-গ্রেড পূর্ণাঙ্গ পেরোল ও মানবসম্পদ ব্যবস্থাপনা ওয়েব অ্যাপ্লিকেশন। এটি যেকোনো প্রতিষ্ঠানের কর্মকর্তা ও কর্মচারীদের প্রোফাইল, দৈনিক উপস্থিতি, অর্জিত ও নৈমিত্তিক ছুটি, কর্মচারী ঋণ এবং প্রতি মাসের বেতন নির্ভুল ও স্বয়ংক্রিয়ভাবে প্রসেস করার জন্য তৈরি করা হয়েছে।
  </p>

  <h2>১.১ প্রযুক্তি স্ট্যাক (Technology Architecture)</h2>
  <div class="grid-2 avoid-break">
    <div class="card">
      <div class="card-title">ফ্রন্টএন্ড ও ইউজার ইন্টারফেস</div>
      <ul>
        <li><strong>React 18.3:</strong> কম্পোনেন্ট-ভিত্তিক আধুনিক সিঙ্গেল পেজ অ্যাপ্লিকেশন (SPA)।</li>
        <li><strong>TypeScript 5.5:</strong> টাইপ-নিরাপদ কোডবেস যা রানটাইম বাগ দূর করে।</li>
        <li><strong>Vite 5:</strong> দ্রুতগতির এইচএমআর এবং অপ্টিমাইজড বান্ডলার।</li>
        <li><strong>Tailwind CSS 3.4:</strong> রেসপনসিভ ও প্রফেশনাল ইউআই ডিজাইন।</li>
        <li><strong>Radix UI & Lucide:</strong> অ্যাক্সেসিবল কম্পোনেন্ট ও আইকন সিস্টেম।</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">স্টেট ম্যানেজমেন্ট ও স্টোরেজ</div>
      <ul>
        <li><strong>Zustand 4.5:</strong> হাই-পারফরম্যান্স গ্লোবাল স্টেট ম্যানেজমেন্ট।</li>
        <li><strong>Persistent LocalStorage:</strong> ব্রাউজার রিফ্রেশেও সম্পূর্ণ ডেটা সংরক্ষিত থাকে।</li>
        <li><strong>Decimal-Safe Arithmetic:</strong> ভগ্নাংশ ও মুদ্রার নির্ভুল রাউন্ডিং।</li>
        <li><strong>jsPDF & html2canvas:</strong> ক্লায়েন্ট-সাইড হাই-কোয়ালিটি পিডিএফ জেনারেশন।</li>
        <li><strong>XLSX & CSV:</strong> এক্সেল ও স্প্রেডশীট এক্সপোর্টার।</li>
      </ul>
    </div>
  </div>

  <h2>১.২ ডেটাবেস স্টোর ও মডিউল সম্পর্ক (Store Architecture)</h2>
  <p>সিস্টেমটি ৭টি সমন্বিত স্টেট স্টোরের উপর ভিত্তি করে পরিচালিত হয়:</p>
  <ul>
    <li><code>authStore:</code> ব্যবহারকারীর সেশন, প্রমাণীকরণ ও ভূমিকাভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ।</li>
    <li><code>employeeStore:</code> কর্মকর্তা-কর্মচারীদের বিবরণ, পদবি, মূল বেতন, ভাতা, ব্যাংক ও মোবাইল ব্যাংকিং তথ্য।</li>
    <li><code>attendanceStore:</code> দৈনিক উপস্থিতি লগ, চেক-ইন/আউট সময়, লেট ট্র্যাকিং এবং ছুটির আবেদন ও কোটা ব্যালেন্স।</li>
    <li><code>loanStore:</code> কর্মচারীদের গৃহীত লোন/অগ্রিম, মাসিক কিস্তির শিডিউল, অবশিষ্ট মূলধন ও পরিশোধের ইতিহাস।</li>
    <li><code>payrollStore:</code> ৩-ধাপের পেরোল রান, ড্রাফট, অনুমোদন, বিতরণ ও পে-স্লিপ রেকর্ড।</li>
    <li><code>settingsStore:</code> কোম্পানি তথ্য, ন্যূনতম মজুরি, কার্যদিবস, ওভারটাইম গুণক, পিএফ ও অনুপস্থিতি কর্তন পলিসি।</li>
    <li><code>auditStore:</code> সিস্টেমের প্রতিটি গুরুত্বপূর্ণ কাজের টাইমস্ট্যাম্পযুক্ত সিকিউরিটি অডিট ট্রেইল।</li>
  </ul>

  <!-- ==================== CHAPTER 2 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ২: ব্যবহারকারী ভূমিকা ও নিরাপত্তা মডেল (RBAC)</h1>

  <p>
    FlowPay সিস্টেমে প্রতিটি ভূমিকা (Role) কর্পোরেট নীতি ও প্রাকৃতিক ক্ষমতার সাথে সংগতিপূর্ণ করে ডিজাইন করা হয়েছে। কোনো ভূমিকাই তার নির্ধারিত কাজের বাইরের অনধিকার চর্চা করতে পারে না।
  </p>

  <div class="avoid-break">
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">ভূমিকা (Role)</th>
          <th style="width: 38%;">প্রধান অনুমোদিত কাজ (Allowed Permissions)</th>
          <th style="width: 40%;">কঠোর নিষেধাজ্ঞা (Strict Restrictions)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Owner (মালিক)</strong></td>
          <td>সম্পূর্ণ সিস্টেমে পূর্ণ কর্তৃত্ব, সমস্ত সেটিংস পরিবর্তন, পেরোল অনুমোদন, সিস্টেম রুলস ও ব্যবহারকারী নিয়ন্ত্রণ।</td>
          <td>কোনো নিষেধাজ্ঞা নেই (Super Admin Authority)।</td>
        </tr>
        <tr>
          <td><strong>Admin (সিস্টেম অ্যাডমিন)</strong></td>
          <td>কর্মী ব্যবস্থাপনা, উপস্থিতি পর্যবেক্ষণ, লোন অনুমোদন, পেরোল তৈরি ও কোম্পানির অপারেশন পরিচালনা।</td>
          <td>মালিকের প্রোফাইল বা ওনারশিপ ট্রান্সফার ছাড়া সমস্ত রুটিন অপারেশন করতে পারে।</td>
        </tr>
        <tr>
          <td><strong>HR Manager (মানবসম্পদ ব্যবস্থাপক)</strong></td>
          <td>নতুন কর্মী অনবোর্ডিং, বিভাগ ও পদবি তৈরি, উপস্থিতি সংশোধন, ছুটির আবেদন মঞ্জুর বা বাতিল, ডিপার্টমেন্ট রিপোর্ট।</td>
          <td><strong>কঠোর নিষেধাজ্ঞা:</strong> কোনো পেরোল অর্থ বিতরণ (Disbursement) করতে পারবে না, কোম্পানির আর্থিক নিয়মাবলী পরিবর্তন করতে পারবে না।</td>
        </tr>
        <tr>
          <td><strong>Finance Manager / Accountant (অর্থ ব্যবস্থাপক)</strong></td>
          <td>পেরোল জেনারেট, ড্রাফট রিভিউ, ব্যাংক/MFS মাধ্যমে বেতন বিতরণ (Mark as Paid), ট্যাক্স ও পিএফ রিপোর্ট, লোন প্রদান।</td>
          <td><strong>কঠোর নিষেধাজ্ঞা:</strong> কর্মীদের উপস্থিতি রেকর্ড ম্যানুয়ালি এডিট বা মুছে ফেলতে পারবে না; কোনো কর্মীকে সিস্টেম থেকে ডিলিট করতে পারবে না।</td>
        </tr>
        <tr>
          <td><strong>Employee (সাধারণ কর্মী)</strong></td>
          <td>সেলফ-সার্ভিস পোর্টাল: নিজের প্রোফাইল দেখা, দৈনিক চেক-ইন/আউট, ছুটির আবেদন, নিজের লোন ও নিজের পে-স্লিপ দেখা/ডাউনলোড।</td>
          <td><strong>কঠোর নিষেধাজ্ঞা:</strong> অন্য কোনো সহকর্মীর তথ্য, বেতন বা পে-স্লিপ দেখতে পারবে না; কোনো সেটিংস বা পেরোল রান দেখতে পারবে না।</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="note-box avoid-break">
    <strong>ডিফল্ট লগইন পৃষ্ঠা (Default Login Flow):</strong> যখন কোনো ব্যবহারকারী প্রথমবার ওয়েবসাইটে প্রবেশ করে (<code>/</code>), সিস্টেম স্বয়ংক্রিয়ভাবে তাকে <code>/login</code> পেজে রিডাইরেক্ট করে। লগইন পেজে টেস্ট এবং ডেমোর সুবিধার্থে ১-ক্লিকে (One-Click Quick Login) ৫টি প্রধান রোলে লগইন করার সুবিধা রয়েছে।
  </div>

  <!-- ==================== CHAPTER 3 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৩: এক্সিকিউটিভ ড্যাশবোর্ড ও লাইভ পরিসংখ্যান</h1>

  <p>
    ড্যাশবোর্ডটি হলো ম্যানেজমেন্ট ও এইচআরের কেন্দ্রীয় স্ন্যাপশট। এখানে প্রদর্শিত প্রতিটি সংখ্যা সরাসরি ডেটাবেস স্টোর থেকে রিয়েল-টাইমে গণনা করা হয়।
  </p>

  <div class="grid-2 avoid-break">
    <div class="card">
      <div class="card-title">মূল মেট্রিক্স ও কেপিআই কার্ড</div>
      <ul>
        <li><strong>মোট সক্রিয় কর্মী (Total Active Employees):</strong> বর্তমানে প্রতিষ্ঠানে কর্মরত মোট কর্মীর সংখ্যা।</li>
        <li><strong>মাসিক পেরোল খরচ (Total Monthly Payroll):</strong> নির্বাচিত মাসের মোট অনুমোদিত নিট বেতন ব্যয়।</li>
        <li><strong>পরিশোধিত বনাম বকেয়া (Disbursed vs Pending):</strong> কত টাকা বিতরণ সম্পন্ন হয়েছে এবং কত টাকা অপেক্ষমাণ।</li>
        <li><strong>সক্রিয় ঋণ পোর্টফোলিও (Active Loans Balance):</strong> কর্মচারীদের নিকট কোম্পানির বর্তমান পাওনা।</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">উপস্থিতি ও অ্যাকশন সেন্টার</div>
      <ul>
        <li><strong>দৈনিক উপস্থিতি অনুপাত:</strong> আজকের তারিখে মোট উপস্থিত, দেরিতে আসা, ছুটিতে ও অনুপস্থিত কর্মী।</li>
        <li><strong>অ্যাকশন উইজেট:</strong> এক ক্লিকে উপস্থিতি চেক-ইন/আউট বোতাম।</li>
        <li><strong>পেন্ডিং অ্যাপ্রুভালস:</strong> অপেক্ষমাণ ছুটির আবেদন, ঋণের আবেদন ও ড্রাফট পেরোলের নোটিফিকেশন।</li>
        <li><strong>সাম্প্রতিক অডিট লগ:</strong> সিস্টেমে সংঘটিত সাম্প্রতিক ৫টি নিরাপত্তা কার্যকলাপ।</li>
      </ul>
    </div>
  </div>

  <h2>৩.১ অ্যানালিটিক্যাল চার্ট ও গ্রাফ</h2>
  <ul>
    <li><strong>মাসিক পেরোল প্রবণতা (Monthly Expenditure Area Chart):</strong> গত ৬ থেকে ১২ মাসের মোট গ্রস ও নিট খরচের তুলনামূলক গ্রাফ।</li>
    <li><strong>বিভাগভিত্তিক বেতন বণ্টন (Department Distribution Bar Chart):</strong> ইঞ্জিনিয়ারিং, মার্কেটিং, সেলস, অর্থ ইত্যাদি বিভাগের খরচ বিভাজন।</li>
    <li><strong>পেরোল স্ট্যাটাস পাই চার্ট (Status Pie Chart):</strong> ড্রাফট, অনুমোদিত ও পেইড রেকর্ডের শতকরা অনুপাত।</li>
  </ul>

  <!-- ==================== CHAPTER 4 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৪: কর্মী ব্যবস্থাপনা ও দ্বৈত ব্যাংক/MFS ওয়ালেট ইন্টিগ্রেশন</h1>

  <p>
    কর্মী ব্যবস্থাপনা মডিউল (<code>/employees</code>) প্রতিটি কর্মীর পূর্ণাঙ্গ লাইফসাইকেল ট্র্যাক করতে সক্ষম।
  </p>

  <h2>৪.১ নতুন কর্মী অনবোর্ডিং (Add Employee Workflow)</h2>
  <p>নতুন কর্মী যুক্ত করার সময় নিচের তথ্যগুলো ইনপুট নেওয়া হয়:</p>
  <ul>
    <li><strong>ব্যক্তিগত তথ্য:</strong> পূর্ণ নাম, অফিসিয়াল ইমেইল, মোবাইল নম্বর, যোগদানের তারিখ।</li>
    <li><strong>প্রাতিষ্ঠানিক পদায়ন:</strong> বিভাগ (Department), পদবি (Designation), এবং স্ট্যাটাস (Active/Inactive)।</li>
    <li><strong>বেতন কাঠামো:</strong> বেসিক স্যালারি (Basic Salary), মূল ভাতা (Allowances), আনুমানিক বোনাস ও ওভারটাইম।</li>
  </ul>

  <div class="highlight-box avoid-break">
    <div style="font-weight: 700; color: #15803d; margin-bottom: 4px;">দ্বৈত ব্যাংক ও মোবাইল ব্যাংকিং ইন্টিগ্রেশন (Dual Payment Channels):</div>
    বাংলাদেশে আধুনিক বেতন বিতরণের প্রয়োজনে প্রতিটি কর্মীর জন্য সনাতন ব্যাংকিং ও মোবাইল ফাইন্যান্সিয়াল সার্ভিস (MFS) উভয় মাধ্যমই যুক্ত করা হয়েছে:
    <ul>
      <li><strong>প্রথাগত ব্যাংক চ্যানেল:</strong> ব্যাংকের নাম (Dutch-Bangla, BRAC, Sonali, City ইত্যাদি), হিসাব নম্বর, রাউটিং নম্বর ও একাউন্ট টাইপ (Savings/Current)।</li>
      <li><strong>মোবাইল ব্যাংকিং চ্যানেল (MFS):</strong> বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket), অথবা উপায় (Upay) ওয়ালেট নম্বর ও একাউন্ট টাইপ (Personal/Agent/Merchant)।</li>
    </ul>
    পেরোল বিতরণের সময় অ্যাকাউন্ট্যান্ট যেকোনো একটি চ্যানেল নির্বাচন করে সরাসরি কর্পোরেট ডিসবার্সমেন্ট করতে পারেন।
  </div>

  <h2>৪.২ কর্মী প্রোফাইল ও নথি সংরক্ষণ (Profile & Documents)</h2>
  <p>
    প্রতিটি কর্মীর বিস্তারিত প্রোফাইল পেজে (<code>/employees/:id</code>) নিচের তথ্যগুলো সুসংগঠিত ট্যাবে দেখা যায়:
  </p>
  <ul>
    <li><strong>ওভারভিউ:</strong> মাসিক গ্রস বেতন, বাৎসরিক আয়, বর্তমান ছুটির ব্যালেন্স ও সক্রিয় ঋণ।</li>
    <li><strong>বেতন বিভাজন:</strong> মূল বেতন, বাড়ি ভাড়া (৫০%), চিকিৎসা ভাতা (৩০%), যাতায়াত ভাতা (২০%)।</li>
    <li><strong>পেমেন্ট ব্যাজ:</strong> সংশ্লিষ্ট কর্মীর নির্ধারিত ব্যাংক ও মোবাইল ওয়ালেটের ভেরিফাইড ব্যাজ।</li>
    <li><strong>ডকুমেন্টেশন ভল্ট:</strong> নিয়োগপত্র (Contract), এনআইডি (NID), শিক্ষাগত সনদ ও সার্টিফিকেট আপলোড ও সংরক্ষণের সুবিধা।</li>
  </ul>

  <!-- ==================== CHAPTER 5 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৫: উপস্থিতি ও ছুটি অনুমোদন কার্যপ্রবাহ (Attendance & Leaves)</h1>

  <p>
    দৈনিক উপস্থিতি ও ছুটির সঠিক হিসাব সরাসরি মাসিক পেরোল গণনার সাথে সম্পৃক্ত। FlowPay-তে একটি স্বয়ংক্রিয় ও নির্ভরযোগ্য উপস্থিতি ব্যবস্থাপনা রয়েছে।
  </p>

  <h2>৫.১ দৈনিক উপস্থিতি পর্যবেক্ষণ (Daily Attendance Matrix)</h2>
  <div class="avoid-break">
    <table>
      <thead>
        <tr>
          <th>স্ট্যাটাস</th>
          <th>ব্যাজ কালার</th>
          <th>শর্ত ও কার্যকারিতা</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>উপস্থিত (Present)</strong></td>
          <td><span class="badge badge-success">Present</span></td>
          <td>নির্ধারিত সময়ের মধ্যে চেক-ইন সম্পন্ন করেছে। কোনো বেতন কর্তন নেই।</td>
        </tr>
        <tr>
          <td><strong>দেরি (Late)</strong></td>
          <td><span class="badge badge-warning">Late</span></td>
          <td>অফিস শুরুর নির্ধারিত সময়ের (যেমন সকাল ৯:১৫) পরে প্রবেশ করেছে।</td>
        </tr>
        <tr>
          <td><strong>অর্ধ-দিবস (Half Day)</strong></td>
          <td><span class="badge badge-info">Half Day</span></td>
          <td>৪ ঘণ্টার বেশি কিন্তু পূর্ণ কার্যদিবসের কম সময় উপস্থিত থাকলে।</td>
        </tr>
        <tr>
          <td><strong>ছুটিতে (On Leave)</strong></td>
          <td><span class="badge badge-primary">On Leave</span></td>
          <td>পূর্বে অনুমোদিত নৈমিত্তিক, অসুস্থতাজনিত বা অর্জিত ছুটির দিন। বেতন কাটা হবে না।</td>
        </tr>
        <tr>
          <td><strong>অনুপস্থিত (Absent)</strong></td>
          <td><span class="badge badge-danger">Absent</span></td>
          <td>কোনো অনুমোদন বা আবেদন ছাড়াই অনুপস্থিত। <strong>স্বয়ংক্রিয়ভাবে বেতন কাটার যোগ্য।</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>৫.২ ছুটির আবেদন ও এইচআর অনুমোদন (Leave Workflow)</h2>
  <ol>
    <li><strong>আবেদন:</strong> কর্মী বা এইচআর ছুটির ধরন (Casual, Sick, Annual, Unpaid), শুরুর তারিখ, শেষ তারিখ এবং কারণ লিখে আবেদন দাখিল করে।</li>
    <li><strong>ব্যালেন্স যাচাই:</strong> সিস্টেম কর্মীর অবশিষ্ট ছুটির কোটা যাচাই করে।</li>
    <li><strong>অনুমোদন বা প্রত্যাখ্যান:</strong> এইচআর ম্যানেজার বা অ্যাডমিন এক ক্লিকে আবেদনটি মঞ্জুর (Approve) বা বাতিল (Reject) করতে পারেন। অনুমোদিত হলে কর্মীর সংশ্লিষ্ট কোটা থেকে স্বয়ংক্রিয়ভাবে দিন বিয়োগ হয়।</li>
  </ol>

  <h2>৫.৩ উপস্থিতি ম্যানুয়াল সংশোধন ও অডিট লগ (Attendance Correction)</h2>
  <p>
    যদি কোনো কর্মী কার্ড পাঞ্চ করতে ভুলে যান বা প্রযুক্তিগত ত্রুটি ঘটে, তবে এইচআর ম্যানেজার সঠিক টাইমস্ট্যাম্প ও নোট লিখে রেকর্ডটি সংশোধন করতে পারেন। প্রতিটি সংশোধনের জন্য সিস্টেমে একটি অডিট লগ সংরক্ষিত হয় যাতে কোনো অনিয়ম না ঘটে।
  </p>

  <!-- ==================== CHAPTER 6 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৬: ঋণ ও বেতন অগ্রিম ব্যবস্থাপনা (Loans & Salary Advances)</h1>

  <p>
    কর্মচারীদের জরুরি আর্থিক সহায়তায় ঋণ (Loan) বা বেতন অগ্রিম (Salary Advance) প্রদান এবং তা নিয়মিত কিস্তির মাধ্যমে মাসিক বেতন থেকে স্বয়ংক্রিয়ভাবে সমন্বয় করার জন্য এই মডিউলটি কাজ করে।
  </p>

  <h2>৬.১ লোন আবেদন ও শর্তাবলি (Loan Application)</h2>
  <ul>
    <li><strong>আবেদনের ধরন:</strong> দীর্ঘমেয়াদি পার্সোনাল লোন অথবা স্বল্পমেয়াদি বেতন অগ্রিম (Advance)।</li>
    <li><strong>মূলধন ও কিস্তির হিসাব:</strong> কর্মী মূলধনের পরিমাণ এবং কত মাসে পরিশোধ করতে চায় তা উল্লেখ করে। সিস্টেম স্বয়ংক্রিয়ভাবে মাসিক কিস্তির পরিমাণ নির্ধারণ করে:
      <div class="formula-box">
        <div class="formula-title">মাসিক কিস্তি নির্ধারণ সূত্র:</div>
        <code>মাসিক কিস্তি (Monthly Installment) = মূলধনের পরিমাণ (Principal Amount) ÷ কিস্তির মাস (Term Months)</code>
      </div>
    </li>
    <li><strong>অনুমোদন:</strong> অর্থ বিভাগ (Finance) বা মালিক আবেদনটি পর্যালোচনা করে অনুমোদন দেন। অনুমোদিত হওয়ার পর লোনটি সক্রিয় (Active) অবস্থায় চলে যায়।</li>
  </ul>

  <h2>৬.২ পেরোল কর্তন ও প্রাক-নিষ্পত্তি (Repayment & Early Settlement)</h2>
  <ul>
    <li><strong>স্বয়ংক্রিয় পেরোল সমন্বয়:</strong> যখন প্রতি মাসের পেরোল তৈরি করা হয়, সিস্টেম স্বয়ংক্রিয়ভাবে প্রতিটি সক্রিয় লোনের মাসিক কিস্তি বেতন কর্তন হিসেবে অন্তর্ভুক্ত করে।</li>
    <li><strong>অবশিষ্ট মূলধন হ্রাস:</strong> পেরোল পরিশোধিত (Paid) হওয়ার সাথে সাথে লোনের ব্যালেন্স হ্রাস পায়। ব্যালেন্স শূন্য হলে লোন স্বয়ংক্রিয়ভাবে 'Settled' হিসেবে বন্ধ হয়ে যায়।</li>
    <li><strong>এককালীন প্রাক-নিষ্পত্তি (Early Settlement):</strong> যদি কোনো কর্মী বেতনের বাইরে সরাসরি নগদ অর্থে অবশিষ্ট সম্পূর্ণ ঋণ পরিশোধ করে দেন, অ্যাডমিন 'Early Settlement' বোতাম চেপে ঋণটি তাৎক্ষণিক সমাপ্ত ঘোষণা করতে পারেন।</li>
  </ul>

  <!-- ==================== CHAPTER 7 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৭: স্বয়ংক্রিয় মাসিক পেরোল ইঞ্জিন ও অনুপস্থিতি কর্তন পলিসি</h1>

  <p>
    FlowPay-এর কেন্দ্রবিন্দু হলো এর নির্ভরযোগ্য ও শক্তিশালী মাসিক পেরোল প্রসেসিং ইঞ্জিন। এটি একটি স্বয়ংক্রিয় ৩-ধাপের উইজার্ডের মাধ্যমে পরিচালিত হয়।
  </p>

  <h2>৭.১ তিন-ধাপের পেরোল জেনারেশন উইজার্ড (3-Step Generation Wizard)</h2>
  <div class="avoid-break">
    <div class="card">
      <div class="card-title">ধাপ ১: সময়কাল নির্বাচন ও অনুপস্থিতি কর্তন পলিসি (Period & Policy Selection)</div>
      <p>মাস ও বছর নির্বাচন করা হয়। এখানেই ম্যানেজারের জন্য রয়েছে নতুন বৈশিষ্ট্য:</p>
      <div class="highlight-box">
        <strong>অনুপস্থিতির স্বয়ংক্রিয় কর্তন পলিসি (Auto-Deduct Absent Days Toggle):</strong>
        <p>
          ম্যানেজার একটি সুইচের মাধ্যমে নির্ধারণ করতে পারেন এই মাসের বেতনে কর্মীদের অনুপস্থিতির জন্য স্বয়ংক্রিয় বেতন কাটা হবে কি না।<br>
          • <strong>চালু (ON) থাকলে:</strong> উপস্থিতি স্টোর থেকে কর্মীদের মোট অনুপস্থিত দিন ও অবৈতনিক ছুটির দিন স্বয়ংক্রিয়ভাবে টেনে আনা হবে এবং দৈনিক রেট অনুযায়ী বেতন থেকে কাটা হবে।<br>
          • <strong>বন্ধ (OFF) থাকলে:</strong> কর্মীদের অনুপস্থিত দিনের জন্য কোনো স্বয়ংক্রিয় কর্তন হবে না (ডিফল্ট ০ দিন), ফলে কর্মীরা পূর্ণ বেতন পাবেন যদি না ম্যানুয়ালি কর্তন বসানো হয়।
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-title">ধাপ ২: পরিবর্তনশীল ভেরিয়েবল সমন্বয় (Variable Adjustments)</div>
      <p>
        সক্রিয় সকল কর্মীর একটি লাইভ ইন্টারঅ্যাক্টিভ টেবিল প্রদর্শিত হয়। এখানে বোনাস, ওভারটাইম, অনুপস্থিত দিন ও লোনের কিস্তি রিয়েল-টাইমে সম্পাদন করা যায়। কোনো ইনপুট পরিবর্তন করলেই সাথে সাথে প্রাক্কলিত নিট বেতন (Estimated Net) রি-ক্যালকুলেট হয়ে যায়।
      </p>
    </div>

    <div class="card">
      <div class="card-title">ধাপ ৩: চূড়ান্ত প্রিভিউ ও ড্রাফট তৈরি (Preview & Draft Generation)</div>
      <p>
        মোট গ্রস বেতন, মোট অনুপস্থিতি কর্তন, অন্যান্য কর্তন এবং মোট প্রদেয় নিট বেতনের বড় কেপিআই কার্ড প্রদর্শিত হয়। কনফার্ম করলেই সিস্টেম নিখুঁত পেরোল ড্রাফট রেকর্ড তৈরি করে।
      </p>
    </div>
  </div>

  <h2>৭.২ বেতন গণনার গাণিতিক মডেল (Mathematical Payroll Engine)</h2>
  <div class="formula-box avoid-break">
    <div class="formula-title">বেতন গণনার সার্বিক সূত্রাবলি (বাংলাদেশ শ্রম আইন ও পলিসি অনুবর্তী):</div>
    <ol>
      <li><strong>দৈনিক বেতনের হার (Daily Wage Rate):</strong><br>
        <code>Daily Rate = মূল বেতন (Basic Salary) ÷ মাসিক স্ট্যান্ডার্ড কার্যদিবস (Standard Working Days, সাধারণত ২২ বা ২৬ দিন)</code>
      </li>
      <li><strong>অনুপস্থিতি কর্তন (Absence Deduction):</strong><br>
        <code>Absence Deduction = মোট অনুপস্থিত দিন (Absent Days) × Daily Rate</code>
      </li>
      <li><strong>ওভারটাইম ঘণ্টার হার ও পারিশ্রমিক (Overtime Calculation):</strong><br>
        <code>Hourly Rate = Basic Salary ÷ (Working Days × ৮ ঘণ্টা)</code><br>
        <code>Overtime Pay = ওভারটাইম ঘণ্টা × Hourly Rate × ওভারটাইম মাল্টিপ্লায়ার (যেমন ১.৫x বা ২.০x)</code>
      </li>
      <li><strong>মোট গ্রস বেতন (Gross Earnings):</strong><br>
        <code>Gross = মূল বেতন + বাড়িভাড়া ভাতা + চিকিৎসা ভাতা + যাতায়াত ভাতা + বোনাস + ওভারটাইম</code>
      </li>
      <li><strong>প্রভিডেন্ট ফান্ড অবদান (Provident Fund - PF):</strong><br>
        <code>Employee PF (কর্মীর বেতন থেকে কর্তন) = Basic Salary × ৮.৩৩%</code><br>
        <code>Employer PF (কোম্পানির ম্যাচিং অনুদান) = Basic Salary × ৮.৩৩%</code>
      </li>
      <li><strong>মোট কর্তন (Total Deductions):</strong><br>
        <code>Total Deductions = আয়কর (Tax) + অনুপস্থিতি কর্তন + লোনের কিস্তি + Employee PF + অন্যান্য কর্তন</code>
      </li>
      <li><strong>চূড়ান্ত নিট প্রদেয় বেতন (Net Payable Salary):</strong><br>
        <code>Net Salary = Gross Earnings - Total Deductions (ঋণাত্মক হওয়া প্রতিরোধে নূন্যতম ০ সুরক্ষা)</code>
      </li>
    </ol>
  </div>

  <!-- ==================== CHAPTER 8 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৮: অফিশিয়াল পে-স্লিপ তৈরি ও বেতন বিতরণ চ্যানেল</h1>

  <p>
    পেরোল অনুমোদিত হওয়ার পর প্রতিটি কর্মীর জন্য স্বয়ংক্রিয়ভাবে প্রাতিষ্ঠানিক ডিজিটাল পে-স্লিপ তৈরি হয়।
  </p>

  <h2>৮.১ পে-স্লিপের কাঠামো ও বৈশিষ্ট্য (Payslip Features)</h2>
  <ul>
    <li><strong>কোম্পানির ব্র্যান্ডিং:</strong> প্রতিষ্ঠানের নাম, লোগো, ঠিকানা, ফোন ও অফিসিয়াল ইমেইল।</li>
    <li><strong>কর্মীর তথ্য:</strong> নাম, এমপ্লয়ি আইডি, পদবি, বিভাগ ও নির্দিষ্ট পে-পিরিয়ড।</li>
    <li><strong>আয়ের বিবরণ (Earnings):</strong> বেসিক স্যালারি, বাড়িভাড়া (৫০%), চিকিৎসা (৩০%), যাতায়াত (২০%), উৎসব বোনাস ও ওভারটাইম।</li>
    <li><strong>কর্তনের বিবরণ (Deductions):</strong> আয়কর, অনুপস্থিতি কর্তন (যেমন: <em>"Absent / Unpaid Days (2 days): -৳4,000"</em>), লোনের কিস্তি, এবং প্রভিডেন্ট ফান্ড (৮.৩৩%)।</li>
    <li><strong>বিতরণ তথ্য:</strong> নির্বাচিত পেমেন্ট মাধ্যম এবং ব্যাংক বা মোবাইল ওয়ালেট লেনদেন রেফারেন্স।</li>
    <li><strong>১-ক্লিকে অফ-স্ক্রিন সরাসরি ডাউনলোড:</strong> ডায়ালগ না খুলেও পে-স্লিপ তালিকা থেকে সরাসরি 'PDF' বোতামে চাপ দিলে তৎক্ষণাৎ ডিজিটাল পে-স্লিপ ডাউনলোড হয়।</li>
  </ul>

  <h2>৮.২ বেতন বিতরণ কার্যপ্রবাহ (Disbursement Lifecycle)</h2>
  <div class="avoid-break">
    <table>
      <thead>
        <tr>
          <th>পর্যায় (Status)</th>
          <th>কার্যক্রম ও অনুমতি</th>
          <th>পরবর্তী পদক্ষেপ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-warning">Draft</span></td>
          <td>সিস্টেমে হিসাব তৈরি হয়েছে। অ্যাডমিন বা অ্যাকাউন্ট্যান্ট যে কোনো ভুল সংশোধন বা ড্রাফট ডিলিট করতে পারেন।</td>
          <td>রিভিউ শেষে ব্যাচ বা এককভাবে <strong>Approve</strong> করা।</td>
        </tr>
        <tr>
          <td><span class="badge badge-primary">Approved</span></td>
          <td>অনুমোদন নিশ্চিত হয়েছে। রেকর্ডটি লক হয়ে যায় এবং বিতরণ উপযোগী হিসেবে চিহ্নিত হয়।</td>
          <td>পেমেন্ট মেথড ও ট্রানজেকশন রেফারেন্সসহ <strong>Disburse (Mark as Paid)</strong> করা।</td>
        </tr>
        <tr>
          <td><span class="badge badge-success">Paid</span></td>
          <td>বেতন সফলভাবে কর্মীর ব্যাংক বা মোবাইল ওয়ালেটে প্রেরণ করা হয়েছে। পে-স্লিপ ইস্যু সম্পন্ন।</td>
          <td>কর্মী তাৎক্ষণিক পে-স্লিপ ভিউ ও ডাউনলোড করতে পারে।</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ==================== CHAPTER 9 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ৯: আর্থিক অ্যানালিটিক্স, অডিট লগ ও এক্সপোর্ট সিস্টেম</h1>

  <p>
    অডিট ট্র্যাকিং এবং আর্থিক স্বচ্ছতা নিশ্চিতে FlowPay-তে একটি সমৃদ্ধ রিপোর্টিং ইঞ্জিন অন্তর্ভুক্ত রয়েছে।
  </p>

  <h2>৯.১ রিপোর্টিং মডিউলসমূহ (Financial Reports)</h2>
  <ul>
    <li><strong>স্যালারি রিপোর্ট (Salary & Compensation Report):</strong> মাস, বছর, বিভাগ ও স্ট্যাটাস ফিল্টারিং সুবিধাসহ বিস্তারিত আয়-ব্যয়ের হিসাব।</li>
    <li><strong>ডিপার্টমেন্ট রিপোর্ট (Department Analysis):</strong> বিভাগভিত্তিক মোট ব্যয়, গড় বেতন, সর্বোচ্চ ও সর্বনিম্ন বেতনের তুলনামূলক গ্রাফ ও পাই চার্ট।</li>
    <li><strong>পেমেন্ট মেথড রিপোর্ট (Disbursement Channels):</strong> ব্যাংক ট্রান্সফার বনাম মোবাইল ব্যাংকিং বনাম ক্যাশ পেমেন্টের আনুপাতিক বণ্টন।</li>
    <li><strong>বাৎসরিক সারসংক্ষেপ (Yearly Summary):</strong> পুরো বছরের ১২ মাসের মোট বেতনের ধারা ও ট্যাক্স উইথহোল্ডিং রিপোর্ট।</li>
  </ul>

  <h2>৯.২ ডেটা এক্সপোর্ট (Export Formats)</h2>
  <p>প্রতিটি রিপোর্ট পেজ থেকে ৩টি আন্তর্জাতিক ফরম্যাটে ডেটা এক্সপোর্ট করা যায়:</p>
  <ul>
    <li><strong>CSV:</strong> ডেটা অ্যানালাইসিস এবং অন্যান্য সফটওয়্যারে ডেটা ইমপোর্টের জন্য।</li>
    <li><strong>Microsoft Excel (.xlsx):</strong> ফর্ম্যাট করা স্প্রেডশীট যেখানে সরাসরি হিসাব করা যায়।</li>
    <li><strong>PDF Document:</strong> বোর্ড মিটিং বা অডিটরের কাছে উপস্থাপনের জন্য প্রিন্ট-রেডি পিডিএফ।</li>
  </ul>

  <h2>৯.৩ নিরাপত্তা অডিট ট্রেইল (Security Audit Logs)</h2>
  <p>
    সিস্টেমে সংঘটিত প্রতিটি গুরুত্বপূর্ণ কার্যক্রমের বিবরণ অডিট লগে (<code>/settings/audit-logs</code>) চিরস্থায়ীভাবে সংরক্ষিত থাকে:
  </p>
  <ul>
    <li>কে অ্যাকশনটি সম্পাদন করেছে (User ID & Name)।</li>
    <li>কোন মডিউলে পরিবর্তন আনা হয়েছে (Employees, Attendance, Loans, Payroll, Settings)।</li>
    <li>অ্যাকশনের নির্দিষ্ট বিবরণ (যেমন: <em>"Disbursed Tanvir Hasan's salary via bkash (Ref: TXN-M4Z)"</em>)।</li>
    <li>নির্ভুল তারিখ ও সময় (Exact Timestamp)।</li>
  </ul>

  <!-- ==================== CHAPTER 10 ==================== -->
  <div class="page-break"></div>
  <h1>অধ্যায় ১০: সিস্টেম টেস্ট সুইট ও প্রোডাকশন ডেপ্লয়মেন্ট গাইড</h1>

  <p>
    কোডবেসের উচ্চমান ও উৎপাদনের উপযোগিতা নিশ্চিতে একাধিক স্বয়ংক্রিয় টেস্ট ফ্রেমওয়ার্ক সংযুক্ত রয়েছে।
  </p>

  <h2>১০.১ স্বয়ংক্রিয় টেস্ট সুইট (Automated Test Suites)</h2>
  <div class="avoid-break">
    <table>
      <thead>
        <tr>
          <th>টেস্ট সুইট ফাইল</th>
          <th>কভারেজ ও টেস্টের পরিধি</th>
          <th>ফলাফল</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>tests/payrollCalculations.test.ts</code></td>
          <td>মূল বেতন, একাধিক ভাতা, ওভারটাইম গুণক, অবৈতনিক ছুটি, লোন কিস্তি, প্রভিডেন্ট ফান্ড, নেগেটিভ বেতন সুরক্ষা, ভগ্নাংশ রাউন্ডিং এবং অপশনাল অনুপস্থিতি কর্তন।</td>
          <td><strong>৩০ / ৩০ Passed ✓</strong></td>
        </tr>
        <tr>
          <td><code>tests/auditSite.mjs</code></td>
          <td>হেডলেস ব্রাউজার দিয়ে সমস্ত ২১টি রুট ব্রাউজ, আনঅথরাইজড রিডাইরেক্ট, কুইক লগইন ও এরর বাউন্ডারি কভারেজ।</td>
          <td><strong>৩১ / ৩১ Passed ✓</strong></td>
        </tr>
        <tr>
          <td><code>tests/deepFunctionalAudit.mjs</code></td>
          <td>ড্যাশবোর্ড, কর্মী অনবোর্ডিং, ছুটির আবেদন-অনুমোদন, ঋণ আবেদন, ৩-ধাপের পেরোল উইজার্ড ও অডিট লগের ডিপ ফাংশনাল টেস্ট।</td>
          <td><strong>১৬ / ১৬ Passed ✓</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>১০.২ প্রোডাকশন বিল্ড ও রান করার নিয়ম (Commands)</h2>
  <div class="card avoid-break">
    <ul>
      <li><strong>ইউনিট টেস্ট চালানো:</strong> <code>npm test</code></li>
      <li><strong>প্রোডাকশন অপ্টিমাইজড বিল্ড তৈরি:</strong> <code>npm run build</code> (TypeScript টাইপচেক ও Vite মিনিফিকেশন)</li>
      <li><strong>প্রোডাকশন প্রিভিউ দেখা:</strong> <code>npm run preview</code></li>
      <li><strong>লোকাল ডেভেলপমেন্ট সার্ভার:</strong> <code>npm run dev</code> (পোর্ট: <code>http://localhost:5173/</code>)</li>
    </ul>
  </div>

  <div style="margin-top: 50px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px;" class="avoid-break">
    <div style="font-weight: 700; color: #312e81; font-size: 16px;">FlowPay Enterprise Payroll System</div>
    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">একটি পূর্ণাঙ্গ, সুরক্ষিত ও প্রোডাকশন-রেডি বেতন ও মানবসম্পদ প্ল্যাটফর্ম</div>
    <div style="color: #94a3b8; font-size: 11px; margin-top: 8px;">কপিরাইট © ২০২৬ FlowPay Inc. সর্বস্বত্ব সংরক্ষিত।</div>
  </div>

</body>
</html>`;

async function generateBanglaPdf() {
  console.log('Generating FlowPay Comprehensive Bangla PDF Manual...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Generate PDF
  await page.pdf({
    path: OUTPUT_FILE,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8px; color: #94a3b8; width: 100%; text-align: right; padding-right: 15mm; font-family: sans-serif;">FlowPay Enterprise - পেরোল ও স্যালারি ম্যানেজমেন্ট সিস্টেম ম্যানুয়াল</div>',
    footerTemplate: '<div style="font-size: 8px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; font-family: sans-serif;"><span>গোপনীয় ও স্বত্বাধিকার সংরক্ষিত © FlowPay</span><span>পৃষ্ঠা <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
  });

  // Copy to public directory so it can also be downloaded via the web browser
  fs.copyFileSync(OUTPUT_FILE, PUBLIC_OUTPUT_FILE);

  await browser.close();

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`✓ Bangla PDF Manual Generated Successfully!`);
  console.log(`  - File Path: ${OUTPUT_FILE}`);
  console.log(`  - Public Path: ${PUBLIC_OUTPUT_FILE}`);
  console.log(`  - File Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

generateBanglaPdf().catch(err => {
  console.error('Failed to generate Bangla PDF:', err);
  process.exit(1);
});
