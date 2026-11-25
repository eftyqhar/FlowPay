/**
 * Deterministic, print-safe inline vector SVG diagrams for FlowPay_FYP_Thesis_Report.pdf.
 * Keeps standard Mermaid blocks in FINAL_YEAR_PROJECT_REPORT.md while guaranteeing crystal-clear
 * A4 vector graphics offline in Chromium PDF output.
 */

export const THESIS_SVGS = [
  // 0: Figure 3.1 - Use Case Diagram (5 Roles)
  `<div class="diagram-box">
    <svg viewBox="0 0 820 440" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:390px;font-family:Inter,Segoe UI,sans-serif;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569"/>
        </marker>
      </defs>
      <rect x="205" y="12" width="420" height="416" rx="12" fill="#f8fafc" stroke="#4f46e5" stroke-width="2"/>
      <text x="415" y="34" text-anchor="middle" font-size="13" font-weight="700" fill="#1e1b4b">FlowPay Enterprise System Boundary</text>

      <!-- Use Case Ellipses -->
      <g fill="#ffffff" stroke="#6366f1" stroke-width="1.5" font-size="11" font-weight="600">
        <ellipse cx="415" cy="68" rx="165" ry="18"/><text x="415" y="72" text-anchor="middle" fill="#1e293b" stroke="none">Manage Users, Roles (create-user) &amp; Audit Logs</text>
        <ellipse cx="415" cy="112" rx="165" ry="18"/><text x="415" y="116" text-anchor="middle" fill="#1e293b" stroke="none">Configure Company &amp; Provident Fund (PF) Rules</text>
        <ellipse cx="415" cy="156" rx="165" ry="18"/><text x="415" y="160" text-anchor="middle" fill="#1e293b" stroke="none">Manage Employees &amp; Organizational Departments</text>
        <ellipse cx="415" cy="200" rx="165" ry="18"/><text x="415" y="204" text-anchor="middle" fill="#1e293b" stroke="none">Audit Attendance &amp; Apply Manual Corrections</text>
        <ellipse cx="415" cy="244" rx="165" ry="18"/><text x="415" y="248" text-anchor="middle" fill="#1e293b" stroke="none">Approve / Reject Employee Leave Applications</text>
        <ellipse cx="415" cy="288" rx="165" ry="18"/><text x="415" y="292" text-anchor="middle" fill="#1e293b" stroke="none">Approve / Settle Loans &amp; Salary Advances</text>
        <ellipse cx="415" cy="332" rx="165" ry="18"/><text x="415" y="336" text-anchor="middle" fill="#1e293b" stroke="none">Generate, Approve &amp; Disburse Payroll (RPC)</text>
        <ellipse cx="415" cy="376" rx="165" ry="18"/><text x="415" y="380" text-anchor="middle" fill="#1e293b" stroke="none">View Total PF Reserve, Bank Advice &amp; Reports</text>
      </g>

      <!-- Left Actors: Owner, Admin, HR -->
      <g font-size="11.5" font-weight="700" fill="#0f172a">
        <rect x="20" y="54" width="120" height="36" rx="8" fill="#eef2ff" stroke="#4f46e5" stroke-width="1.5"/>
        <text x="80" y="76" text-anchor="middle">Owner</text>
        <rect x="20" y="138" width="120" height="36" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
        <text x="80" y="160" text-anchor="middle">Admin</text>
        <rect x="20" y="226" width="120" height="36" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
        <text x="80" y="248" text-anchor="middle">HR Manager</text>
      </g>

      <!-- Right Actors: Accountant, Employee -->
      <g font-size="11.5" font-weight="700" fill="#0f172a">
        <rect x="680" y="290" width="120" height="36" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="740" y="312" text-anchor="middle">Accountant</text>
        <rect x="680" y="120" width="120" height="58" rx="8" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
        <text x="740" y="143" text-anchor="middle">Employee</text>
        <text x="740" y="161" text-anchor="middle" font-size="9.5" font-weight="500" fill="#475569">(Self-Service)</text>
      </g>

      <!-- Right Self-Service box -->
      <rect x="645" y="196" width="165" height="68" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1.2"/>
      <text x="727" y="214" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b">Employee Use Cases:</text>
      <text x="727" y="229" text-anchor="middle" font-size="9.5" fill="#334155">- Punch In/Out &amp; Leave Req.</text>
      <text x="727" y="243" text-anchor="middle" font-size="9.5" fill="#334155">- Loan App &amp; Own Payslips</text>
      <text x="727" y="257" text-anchor="middle" font-size="9.5" fill="#334155">- My Total PF Reserve</text>

      <!-- Connector Lines -->
      <g stroke="#64748b" stroke-width="1.2">
        <line x1="140" y1="72" x2="250" y2="68"/><line x1="140" y1="72" x2="250" y2="112"/>
        <line x1="140" y1="156" x2="250" y2="68"/><line x1="140" y1="156" x2="250" y2="112"/>
        <line x1="140" y1="156" x2="250" y2="156"/><line x1="140" y1="156" x2="250" y2="200"/>
        <line x1="140" y1="156" x2="250" y2="244"/><line x1="140" y1="156" x2="250" y2="332"/>
        <line x1="140" y1="244" x2="250" y2="156"/><line x1="140" y1="244" x2="250" y2="200"/><line x1="140" y1="244" x2="250" y2="244"/>
        <line x1="680" y1="308" x2="580" y2="288"/><line x1="680" y1="308" x2="580" y2="332"/><line x1="680" y1="308" x2="580" y2="376"/>
        <line x1="740" y1="178" x2="740" y2="196"/>
      </g>
    </svg>
  </div>`,

  // 1: Figure 3.2 - Entity-Relationship Diagram (11 PostgreSQL Tables)
  `<div class="diagram-box">
    <svg viewBox="0 0 860 520" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:460px;font-family:Inter,Segoe UI,sans-serif;">
      <style>
        .tbl-hdr { fill: #312e81; }
        .tbl-title { fill: #ffffff; font-size: 11px; font-weight: 700; }
        .tbl-body { fill: #ffffff; stroke: #4f46e5; stroke-width: 1.3; }
        .tbl-txt { fill: #1e293b; font-size: 9.5px; }
        .rel { stroke: #475569; stroke-width: 1.4; fill: none; }
        .rel-lbl { fill: #4338ca; font-size: 9px; font-weight: 700; }
      </style>

      <!-- Row 1: departments, users, employees, company_settings -->
      <rect x="15" y="18" width="175" height="90" rx="6" class="tbl-body"/>
      <rect x="15" y="18" width="175" height="22" rx="5" class="tbl-hdr"/>
      <text x="102" y="33" text-anchor="middle" class="tbl-title">1. public.departments</text>
      <text x="23" y="54" class="tbl-txt">PK: id (TEXT)</text>
      <text x="23" y="68" class="tbl-txt">UK: name (TEXT NOT NULL)</text>
      <text x="23" y="82" class="tbl-txt">head, head_id, description</text>
      <text x="23" y="96" class="tbl-txt">created_at (TIMESTAMPTZ)</text>

      <rect x="240" y="18" width="185" height="98" rx="6" class="tbl-body"/>
      <rect x="240" y="18" width="185" height="22" rx="5" class="tbl-hdr"/>
      <text x="332" y="33" text-anchor="middle" class="tbl-title">2. public.users</text>
      <text x="248" y="54" class="tbl-txt">PK: id (TEXT)</text>
      <text x="248" y="68" class="tbl-txt">UK: email, role (RBAC)</text>
      <text x="248" y="82" class="tbl-txt">FK: employee_id -&gt; employees</text>
      <text x="248" y="96" class="tbl-txt">is_active, avatar, name</text>

      <rect x="460" y="18" width="195" height="122" rx="6" class="tbl-body"/>
      <rect x="460" y="18" width="195" height="22" rx="5" class="tbl-hdr"/>
      <text x="557" y="33" text-anchor="middle" class="tbl-title">3. public.employees</text>
      <text x="468" y="54" class="tbl-txt">PK: id | UK: employee_id (EMP-)</text>
      <text x="468" y="68" class="tbl-txt">full_name, email, department</text>
      <text x="468" y="82" class="tbl-txt">designation, joining_date (DATE)</text>
      <text x="468" y="96" class="tbl-txt">basic_salary, allowances, tax</text>
      <text x="468" y="110" class="tbl-txt">pf_eligible, leave_balance (JSONB)</text>
      <text x="468" y="124" class="tbl-txt">bank_info, mobile_banking_info</text>

      <rect x="675" y="18" width="170" height="106" rx="6" class="tbl-body"/>
      <rect x="675" y="18" width="170" height="22" rx="5" class="tbl-hdr"/>
      <text x="760" y="33" text-anchor="middle" class="tbl-title">4. company_settings</text>
      <text x="683" y="54" class="tbl-txt">PK: id ('default')</text>
      <text x="683" y="68" class="tbl-txt">standard_working_days (22)</text>
      <text x="683" y="82" class="tbl-txt">overtime_multiplier (1.5)</text>
      <text x="683" y="96" class="tbl-txt">pf_employee_percent</text>
      <text x="683" y="110" class="tbl-txt">pf_employer_percent, rules</text>

      <!-- Row 2: attendance_records, leave_requests, loans, payroll_records -->
      <rect x="15" y="195" width="190" height="102" rx="6" class="tbl-body"/>
      <rect x="15" y="195" width="190" height="22" rx="5" class="tbl-hdr"/>
      <text x="110" y="210" text-anchor="middle" class="tbl-title">5. attendance_records</text>
      <text x="23" y="231" class="tbl-txt">PK: id</text>
      <text x="23" y="245" class="tbl-txt">FK: employee_id -&gt; employees</text>
      <text x="23" y="259" class="tbl-txt">date (DATE), check_in, check_out</text>
      <text x="23" y="273" class="tbl-txt">status, late_check_in, early_out</text>
      <text x="23" y="287" class="tbl-txt">UK: (employee_id, date)</text>

      <rect x="225" y="195" width="190" height="102" rx="6" class="tbl-body"/>
      <rect x="225" y="195" width="190" height="22" rx="5" class="tbl-hdr"/>
      <text x="320" y="210" text-anchor="middle" class="tbl-title">6. leave_requests</text>
      <text x="233" y="231" class="tbl-txt">PK: id</text>
      <text x="233" y="245" class="tbl-txt">FK: employee_id -&gt; employees</text>
      <text x="233" y="259" class="tbl-txt">leave_type, start_date, end_date</text>
      <text x="233" y="273" class="tbl-txt">days_count (CHECK &gt; 0)</text>
      <text x="233" y="287" class="tbl-txt">status, approved_by</text>

      <rect x="435" y="195" width="195" height="102" rx="6" class="tbl-body"/>
      <rect x="435" y="195" width="195" height="22" rx="5" class="tbl-hdr"/>
      <text x="532" y="210" text-anchor="middle" class="tbl-title">7. public.loans</text>
      <text x="443" y="231" class="tbl-txt">PK: id</text>
      <text x="443" y="245" class="tbl-txt">FK: employee_id -&gt; employees</text>
      <text x="443" y="259" class="tbl-txt">principal_amount, term_months</text>
      <text x="443" y="273" class="tbl-txt">monthly_installment, status</text>
      <text x="443" y="287" class="tbl-txt">remaining_balance (&gt;= 0)</text>

      <rect x="650" y="195" width="195" height="118" rx="6" class="tbl-body"/>
      <rect x="650" y="195" width="195" height="22" rx="5" class="tbl-hdr"/>
      <text x="747" y="210" text-anchor="middle" class="tbl-title">8. payroll_records</text>
      <text x="658" y="231" class="tbl-txt">PK: id | UK: (emp_id, month, yr)</text>
      <text x="658" y="245" class="tbl-txt">FK: employee_id -&gt; employees</text>
      <text x="658" y="259" class="tbl-txt">gross_salary, total_deductions</text>
      <text x="658" y="273" class="tbl-txt">pf_employee_ded, pf_employer</text>
      <text x="658" y="287" class="tbl-txt">loan_deduction, net_salary (&gt;=0)</text>
      <text x="658" y="301" class="tbl-txt">status, payment_date, txn_ref</text>

      <!-- Row 3: notifications, audit_logs, loan_repayments -->
      <rect x="30" y="385" width="215" height="96" rx="6" class="tbl-body"/>
      <rect x="30" y="385" width="215" height="22" rx="5" class="tbl-hdr"/>
      <text x="137" y="400" text-anchor="middle" class="tbl-title">9. public.notifications</text>
      <text x="38" y="421" class="tbl-txt">PK: id | title, message, type</text>
      <text x="38" y="435" class="tbl-txt">target_roles (TEXT[])</text>
      <text x="38" y="449" class="tbl-txt">target_user_id, target_emp_id</text>
      <text x="38" y="463" class="tbl-txt">is_read (BOOLEAN), created_at</text>

      <rect x="295" y="385" width="215" height="96" rx="6" class="tbl-body"/>
      <rect x="295" y="385" width="215" height="22" rx="5" class="tbl-hdr"/>
      <text x="402" y="400" text-anchor="middle" class="tbl-title">10. public.audit_logs</text>
      <text x="303" y="421" class="tbl-txt">PK: id</text>
      <text x="303" y="435" class="tbl-txt">user_id, user_name</text>
      <text x="303" y="449" class="tbl-txt">action, module, details</text>
      <text x="303" y="463" class="tbl-txt">created_at (INDEX DESC)</text>

      <rect x="560" y="385" width="245" height="104" rx="6" class="tbl-body"/>
      <rect x="560" y="385" width="245" height="22" rx="5" class="tbl-hdr"/>
      <text x="682" y="400" text-anchor="middle" class="tbl-title">11. public.loan_repayments</text>
      <text x="568" y="421" class="tbl-txt">PK: id</text>
      <text x="568" y="435" class="tbl-txt">FK: loan_id -&gt; loans(id) CASCADE</text>
      <text x="568" y="449" class="tbl-txt">payroll_record_id, amount (&gt;= 0)</text>
      <text x="568" y="463" class="tbl-txt">month, year, date (TIMESTAMPTZ)</text>
      <text x="568" y="477" class="tbl-txt">UK: (loan_id, month, year)</text>

      <!-- Relationships -->
      <path d="M 425 65 L 460 65" class="rel"/><text x="442" y="59" text-anchor="middle" class="rel-lbl">1:0..1</text>
      <path d="M 190 50 L 220 50 L 220 155 L 495 155 L 495 140" class="rel"/><text x="225" y="150" class="rel-lbl">1:N dept</text>
      <path d="M 557 140 L 557 170 L 110 170 L 110 195" class="rel"/><text x="175" y="166" class="rel-lbl">1:N (fk_attendance)</text>
      <path d="M 320 170 L 320 195" class="rel"/><text x="348" y="185" class="rel-lbl">1:N</text>
      <path d="M 532 170 L 532 195" class="rel"/><text x="560" y="185" class="rel-lbl">1:N</text>
      <path d="M 557 170 L 747 170 L 747 195" class="rel"/><text x="712" y="166" class="rel-lbl">1:N (fk_payroll)</text>
      <path d="M 532 297 L 532 345 L 640 345 L 640 385" class="rel"/><text x="595" y="340" class="rel-lbl">1:N CASCADE</text>
      <path d="M 747 313 L 747 385" class="rel"/><text x="772" y="352" class="rel-lbl">ref</text>
      <path d="M 300 116 L 300 350 L 137 350 L 137 385" class="rel" stroke-dasharray="4,3"/>
      <path d="M 340 116 L 340 365 L 402 365 L 402 385" class="rel" stroke-dasharray="4,3"/>
    </svg>
  </div>`,

  // 2: Figure 3.3(a) - DFD Level 0
  `<div class="diagram-box">
    <svg viewBox="0 0 820 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px;font-family:Inter,Segoe UI,sans-serif;">
      <defs>
        <marker id="arr0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155"/>
        </marker>
      </defs>
      <rect x="20" y="25" width="130" height="44" rx="6" fill="#eef2ff" stroke="#4f46e5" stroke-width="1.5"/>
      <text x="85" y="51" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1e1b4b">Employee</text>

      <rect x="20" y="145" width="130" height="44" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
      <text x="85" y="171" text-anchor="middle" font-size="11.5" font-weight="700" fill="#064e3b">HR / Admin / Owner</text>

      <circle cx="410" cy="108" r="68" fill="#4f46e5" stroke="#312e81" stroke-width="2"/>
      <text x="410" y="96" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff">0.0</text>
      <text x="410" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="#e0e7ff">FlowPay Enterprise</text>
      <text x="410" y="128" text-anchor="middle" font-size="10" fill="#c7d2fe">HR &amp; Payroll System</text>

      <rect x="665" y="25" width="135" height="44" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <text x="732" y="51" text-anchor="middle" font-size="11.5" font-weight="700" fill="#78350f">Accountant</text>

      <rect x="665" y="145" width="135" height="44" rx="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
      <text x="732" y="165" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0f172a">Supabase PostgreSQL</text>
      <text x="732" y="180" text-anchor="middle" font-size="9" fill="#475569">(11 Tables + RLS + RPC)</text>

      <line x1="150" y1="40" x2="345" y2="85" stroke="#334155" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="242" y="50" text-anchor="middle" font-size="9" fill="#334155">Punches, Leave, Loan Req</text>
      <line x1="345" y1="100" x2="150" y2="58" stroke="#4f46e5" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="235" y="95" text-anchor="middle" font-size="9" fill="#4338ca">PDF Payslips &amp; My PF</text>

      <line x1="150" y1="160" x2="344" y2="122" stroke="#334155" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="242" y="162" text-anchor="middle" font-size="9" fill="#334155">Staff, Policies, Audit</text>

      <line x1="665" y1="42" x2="475" y2="88" stroke="#334155" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="572" y="52" text-anchor="middle" font-size="9" fill="#334155">Disbursement Batch</text>
      <line x1="476" y1="104" x2="665" y2="58" stroke="#d97706" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="580" y="98" text-anchor="middle" font-size="9" fill="#b45309">Bank Advice &amp; PF Reserve</text>

      <line x1="474" y1="130" x2="665" y2="165" stroke="#334155" stroke-width="1.4" marker-end="url(#arr0)"/>
      <line x1="665" y1="176" x2="466" y2="142" stroke="#334155" stroke-width="1.4" marker-end="url(#arr0)"/>
      <text x="570" y="176" text-anchor="middle" font-size="9" fill="#334155">JWT SQL, Triggers, RPC</text>
    </svg>
  </div>`,

  // 3: Figure 3.3(b) - DFD Level 1
  `<div class="diagram-box">
    <svg viewBox="0 0 840 310" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:285px;font-family:Inter,Segoe UI,sans-serif;">
      <defs>
        <marker id="arr1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155"/>
        </marker>
      </defs>
      <!-- Processes -->
      <g font-size="10" font-weight="700" text-anchor="middle">
        <rect x="20" y="25" width="140" height="50" rx="25" fill="#eef2ff" stroke="#4f46e5" stroke-width="1.5"/>
        <text x="90" y="47" fill="#1e1b4b">1.0 Auth &amp; RBAC</text>
        <text x="90" y="61" fill="#4338ca" font-size="9">(JWT + create-user)</text>

        <rect x="220" y="25" width="155" height="50" rx="25" fill="#eef2ff" stroke="#4f46e5" stroke-width="1.5"/>
        <text x="297" y="47" fill="#1e1b4b">2.0 Attendance &amp; Leave</text>
        <text x="297" y="61" fill="#4338ca" font-size="9">(Absent Synthesis)</text>

        <rect x="440" y="25" width="155" height="50" rx="25" fill="#eef2ff" stroke="#4f46e5" stroke-width="1.5"/>
        <text x="517" y="47" fill="#1e1b4b">3.0 Loans &amp; PF Config</text>
        <text x="517" y="61" fill="#4338ca" font-size="9">(Installments &amp; PF %)</text>

        <rect x="290" y="135" width="200" height="52" rx="25" fill="#4f46e5" stroke="#312e81" stroke-width="1.5"/>
        <text x="390" y="157" fill="#ffffff">4.0 Deterministic Salary Engine</text>
        <text x="390" y="172" fill="#e0e7ff" font-size="9">(salary.ts -&gt; Draft Payroll)</text>

        <rect x="570" y="135" width="215" height="52" rx="25" fill="#ecfdf5" stroke="#059669" stroke-width="1.5"/>
        <text x="677" y="157" fill="#064e3b">5.0 Atomic Disbursement RPC</text>
        <text x="677" y="172" fill="#047857" font-size="9">(disburse_payroll_batch)</text>

        <rect x="290" y="240" width="230" height="50" rx="25" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="405" y="262" fill="#78350f">6.0 Payslips, ExcelJS &amp; PF Analytics</text>
        <text x="405" y="276" fill="#92400e" font-size="9">(jsPDF, ExcelJS, Total PF Reserve)</text>
      </g>

      <!-- Data Stores -->
      <g font-size="9.5" font-weight="600" fill="#0f172a">
        <rect x="20" y="142" width="150" height="34" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
        <text x="95" y="163" text-anchor="middle">D1: users / audit_logs</text>
        <rect x="650" y="248" width="170" height="34" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
        <text x="735" y="269" text-anchor="middle">D2: loans &amp; loan_repayments</text>
        <rect x="20" y="248" width="180" height="34" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
        <text x="110" y="269" text-anchor="middle">D3: payroll_records</text>
      </g>

      <!-- Arrows -->
      <g stroke="#334155" stroke-width="1.3" marker-end="url(#arr1)">
        <line x1="90" y1="75" x2="90" y2="142"/>
        <line x1="297" y1="75" x2="345" y2="135"/>
        <line x1="517" y1="75" x2="435" y2="135"/>
        <line x1="490" y1="161" x2="570" y2="161"/>
        <line x1="690" y1="187" x2="725" y2="248"/>
        <line x1="290" y1="166" x2="120" y2="248"/>
        <line x1="200" y1="265" x2="290" y2="265"/>
        <line x1="650" y1="265" x2="520" y2="265"/>
      </g>
    </svg>
  </div>`,

  // 4: Figure 3.4 - Sequence Diagram
  `<div class="diagram-box">
    <svg viewBox="0 0 840 370" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:350px;font-family:Inter,Segoe UI,sans-serif;">
      <defs>
        <marker id="seqArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b"/>
        </marker>
      </defs>
      <!-- Lifelines -->
      <g font-size="10.5" font-weight="700" text-anchor="middle">
        <rect x="18" y="14" width="110" height="32" rx="6" fill="#eef2ff" stroke="#4f46e5"/><text x="73" y="34" fill="#1e1b4b">Accountant</text>
        <rect x="165" y="14" width="120" height="32" rx="6" fill="#eef2ff" stroke="#4f46e5"/><text x="225" y="34" fill="#1e1b4b">Payroll UI &amp; Store</text>
        <rect x="325" y="14" width="120" height="32" rx="6" fill="#ecfdf5" stroke="#059669"/><text x="385" y="34" fill="#064e3b">salary.ts Engine</text>
        <rect x="485" y="14" width="150" height="32" rx="6" fill="#fef3c7" stroke="#d97706"/><text x="560" y="34" fill="#78350f">disburse_payroll_batch()</text>
        <rect x="675" y="14" width="145" height="32" rx="6" fill="#f1f5f9" stroke="#475569"/><text x="747" y="34" fill="#0f172a">PostgreSQL 15 DB</text>
      </g>
      <g stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4">
        <line x1="73" y1="46" x2="73" y2="355"/>
        <line x1="225" y1="46" x2="225" y2="355"/>
        <line x1="385" y1="46" x2="385" y2="355"/>
        <line x1="560" y1="46" x2="560" y2="355"/>
        <line x1="747" y1="46" x2="747" y2="355"/>
      </g>

      <!-- Sequence Steps -->
      <g font-size="9.5" fill="#1e293b">
        <line x1="73" y1="74" x2="225" y2="74" stroke="#1e293b" stroke-width="1.3" marker-end="url(#seqArr)"/>
        <text x="149" y="68" text-anchor="middle">1. Generate Payroll (Month/Year)</text>

        <line x1="225" y1="100" x2="385" y2="100" stroke="#1e293b" stroke-width="1.3" marker-end="url(#seqArr)"/>
        <text x="305" y="94" text-anchor="middle">2. calculateFullSalary()</text>

        <line x1="385" y1="122" x2="225" y2="122" stroke="#4f46e5" stroke-width="1.3" stroke-dasharray="3,2" marker-end="url(#seqArr)"/>
        <text x="305" y="116" text-anchor="middle" fill="#4338ca">3. Gross, PF, Loan, Net &gt;= 0</text>

        <line x1="225" y1="148" x2="747" y2="148" stroke="#1e293b" stroke-width="1.3" marker-end="url(#seqArr)"/>
        <text x="486" y="142" text-anchor="middle">4. Persist draft rows (uq_payroll_emp_month_year)</text>

        <line x1="73" y1="176" x2="225" y2="176" stroke="#1e293b" stroke-width="1.3" marker-end="url(#seqArr)"/>
        <text x="149" y="170" text-anchor="middle">5. Batch Approve -&gt; approved</text>

        <line x1="73" y1="204" x2="225" y2="204" stroke="#1e293b" stroke-width="1.3" marker-end="url(#seqArr)"/>
        <text x="149" y="198" text-anchor="middle">6. Mark Paid (Bank/MFS + TXN Ref)</text>

        <line x1="225" y1="232" x2="560" y2="232" stroke="#b45309" stroke-width="1.5" marker-end="url(#seqArr)"/>
        <text x="392" y="226" text-anchor="middle" font-weight="700" fill="#b45309">7. supabase.rpc('disburse_payroll_batch', ...)</text>

        <rect x="550" y="246" width="215" height="62" rx="6" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.2"/>
        <text x="657" y="262" text-anchor="middle" font-size="9" font-weight="700" fill="#92400e">8. Atomic PostgreSQL Transaction:</text>
        <text x="657" y="276" text-anchor="middle" font-size="8.5" fill="#78350f">- SELECT ... FOR UPDATE lock</text>
        <text x="657" y="289" text-anchor="middle" font-size="8.5" fill="#78350f">- Update payroll = 'paid' &amp; insert loan_repayments</text>
        <text x="657" y="302" text-anchor="middle" font-size="8.5" fill="#78350f">- Decrement loans &amp; auto-complete if 0</text>

        <line x1="560" y1="330" x2="225" y2="330" stroke="#059669" stroke-width="1.4" stroke-dasharray="3,2" marker-end="url(#seqArr)"/>
        <text x="392" y="324" text-anchor="middle" font-weight="600" fill="#065f46">9. COMMIT (or Rollback Zustand Snapshot on Error)</text>
      </g>
    </svg>
  </div>`,

  // 5: Figure 3.5 - System Architecture Diagram
  `<div class="diagram-box">
    <svg viewBox="0 0 840 310" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:285px;font-family:Inter,Segoe UI,sans-serif;">
      <!-- Left Box: Vercel Frontend -->
      <rect x="15" y="18" width="380" height="275" rx="10" fill="#f8fafc" stroke="#4f46e5" stroke-width="2"/>
      <rect x="15" y="18" width="380" height="28" rx="8" fill="#4f46e5"/>
      <text x="205" y="36" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">Client Tier — React 18 / Vite SPA on Vercel CDN</text>

      <rect x="32" y="60" width="346" height="38" rx="6" fill="#ffffff" stroke="#818cf8"/>
      <text x="205" y="77" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1e1b4b">Vercel Edge &amp; Security Headers (vercel.json)</text>
      <text x="205" y="91" text-anchor="middle" font-size="9" fill="#475569">X-Frame-Options: DENY | nosniff | Vite manualChunks</text>

      <rect x="32" y="110" width="346" height="44" rx="6" fill="#ffffff" stroke="#818cf8"/>
      <text x="205" y="128" text-anchor="middle" font-size="10.5" font-weight="700" fill="#1e1b4b">React 18.3 + TypeScript 5.5 + Tailwind + Radix UI</text>
      <text x="205" y="143" text-anchor="middle" font-size="9" fill="#475569">Role-Based Views, ProtectedRoute &amp; Total PF Dashboards</text>

      <rect x="32" y="166" width="166" height="50" rx="6" fill="#eef2ff" stroke="#6366f1"/>
      <text x="115" y="185" text-anchor="middle" font-size="10" font-weight="700" fill="#1e1b4b">9 Zustand Stores</text>
      <text x="115" y="200" text-anchor="middle" font-size="9" fill="#334155">Optimistic UI + Rollback</text>

      <rect x="212" y="166" width="166" height="50" rx="6" fill="#eef2ff" stroke="#6366f1"/>
      <text x="295" y="185" text-anchor="middle" font-size="10" font-weight="700" fill="#1e1b4b">salary.ts Engine</text>
      <text x="295" y="200" text-anchor="middle" font-size="9" fill="#334155">Deterministic + PF Summary</text>

      <rect x="32" y="228" width="346" height="48" rx="6" fill="#ffffff" stroke="#818cf8"/>
      <text x="205" y="247" text-anchor="middle" font-size="10" font-weight="700" fill="#1e1b4b">Client Reports &amp; Verification</text>
      <text x="205" y="262" text-anchor="middle" font-size="9" fill="#475569">ExcelJS (.xlsx) | jsPDF + html2canvas | Recharts | 48/48 Vitest</text>

      <!-- Right Box: Supabase Cloud -->
      <rect x="445" y="18" width="380" height="275" rx="10" fill="#f0fdf4" stroke="#059669" stroke-width="2"/>
      <rect x="445" y="18" width="380" height="28" rx="8" fill="#059669"/>
      <text x="635" y="36" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">Backend Tier — Supabase Cloud (PostgreSQL 15)</text>

      <rect x="462" y="60" width="166" height="50" rx="6" fill="#ffffff" stroke="#10b981"/>
      <text x="545" y="80" text-anchor="middle" font-size="10" font-weight="700" fill="#064e3b">Supabase Auth</text>
      <text x="545" y="96" text-anchor="middle" font-size="9" fill="#334155">JWT Session Verification</text>

      <rect x="642" y="60" width="166" height="50" rx="6" fill="#ffffff" stroke="#10b981"/>
      <text x="725" y="80" text-anchor="middle" font-size="10" font-weight="700" fill="#064e3b">Edge Function</text>
      <text x="725" y="96" text-anchor="middle" font-size="9" fill="#334155">create-user (service_role)</text>

      <rect x="462" y="124" width="346" height="98" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.4"/>
      <text x="635" y="143" text-anchor="middle" font-size="10.5" font-weight="700" fill="#064e3b">PostgreSQL 15 Relational Core</text>
      <text x="635" y="160" text-anchor="middle" font-size="9" fill="#334155">11 Normalized Tables + 5 Indexes + emp_id_seq</text>
      <text x="635" y="176" text-anchor="middle" font-size="9" fill="#334155">Hardened RLS Policies + REVOKE ALL FROM anon</text>
      <text x="635" y="192" text-anchor="middle" font-size="9" fill="#334155">Security Triggers &amp; disburse_payroll_batch() Atomic RPC</text>
      <text x="635" y="208" text-anchor="middle" font-size="9" fill="#334155">Incremental Migrations (supabase/migrations/*.sql)</text>

      <rect x="462" y="234" width="346" height="42" rx="6" fill="#ecfdf5" stroke="#10b981"/>
      <text x="635" y="259" text-anchor="middle" font-size="10" font-weight="700" fill="#064e3b">Supabase Storage (Employee Vault &amp; Avatars)</text>

      <!-- Bridge Arrows -->
      <line x1="395" y1="85" x2="445" y2="85" stroke="#0f172a" stroke-width="2"/>
      <line x1="395" y1="155" x2="445" y2="155" stroke="#0f172a" stroke-width="2"/>
      <text x="420" y="78" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">TLS/JWT</text>
      <text x="420" y="148" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">REST/RPC</text>
    </svg>
  </div>`
];
