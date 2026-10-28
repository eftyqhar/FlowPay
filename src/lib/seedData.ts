import { useEmployeeStore } from '@/stores/employeeStore';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useLoanStore } from '@/stores/loanStore';
import { Employee, AttendanceStatus } from '@/lib/types';

export const initializeSeedData = () => {
  const { employees, addEmployee } = useEmployeeStore.getState();
  const { payrollRecords, generatePayroll, markAsPaid, approvePayroll } = usePayrollStore.getState();
  const { attendanceRecords, recordAttendance, leaveRequests, applyLeave, approveLeave } = useAttendanceStore.getState();
  const { loans, applyLoan, approveLoan } = useLoanStore.getState();

  // Only seed if empty
  if (employees.length > 0 || payrollRecords.length > 0) {
    return;
  }

  const getBankInfo = () => {
    const banks = ['Sonali Bank', 'Dutch-Bangla Bank', 'BRAC Bank', 'Islami Bank', 'City Bank'];
    return {
      bankName: banks[Math.floor(Math.random() * banks.length)],
      accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      routingNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
      accountType: 'savings' as const,
    };
  };

  const seedEmployees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId'>[] = [
    // Engineering
    {
      fullName: 'Tanvir Hasan',
      email: 'tanvir@flowpay.com',
      phone: '01711000001',
      designation: 'Senior Software Engineer',
      department: 'Engineering',
      joiningDate: '2023-01-15',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 75000,
      allowances: 15000,
      deductions: 2000,
      tax: 4000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      leaveBalance: { casual: 8, sick: 12, annual: 14 },
      photo: 'https://ui-avatars.com/api/?name=Tanvir+Hasan&background=4f46e5&color=fff',
      documents: [
        { id: 'doc-1', name: 'Employment_Contract.pdf', type: 'Contract', uploadDate: '2023-01-15', size: '2.4 MB' },
        { id: 'doc-2', name: 'National_ID_Scan.pdf', type: 'Identity', uploadDate: '2023-01-15', size: '1.1 MB' },
      ],
    },
    {
      fullName: 'Arif Rahman',
      email: 'arif@flowpay.com',
      phone: '01711000002',
      designation: 'Software Engineer',
      department: 'Engineering',
      joiningDate: '2024-02-10',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 45000,
      allowances: 9000,
      deductions: 1000,
      tax: 2000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      leaveBalance: { casual: 10, sick: 14, annual: 15 },
      photo: 'https://ui-avatars.com/api/?name=Arif+Rahman&background=059669&color=fff',
    },
    {
      fullName: 'Nusrat Jahan',
      email: 'nusrat@flowpay.com',
      phone: '01711000003',
      designation: 'Junior Developer',
      department: 'Engineering',
      joiningDate: '2025-06-01',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 30000,
      allowances: 5000,
      deductions: 500,
      tax: 1000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Nusrat+Jahan&background=d97706&color=fff',
    },
    {
      fullName: 'Mehedi Hasan',
      email: 'mehedi@flowpay.com',
      phone: '01711000004',
      designation: 'QA Automation Lead',
      department: 'Engineering',
      joiningDate: '2024-08-20',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 40000,
      allowances: 8000,
      deductions: 800,
      tax: 1500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Mehedi+Hasan&background=7c3aed&color=fff',
    },
    {
      fullName: 'Shahriar Alam',
      email: 'shahriar@flowpay.com',
      phone: '01711000005',
      designation: 'DevOps Engineer',
      department: 'Engineering',
      joiningDate: '2023-11-12',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 60000,
      allowances: 12000,
      deductions: 1500,
      tax: 3000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Shahriar+Alam&background=2563eb&color=fff',
    },
    {
      fullName: 'Farhan Kabir',
      email: 'farhan@flowpay.com',
      phone: '01711000006',
      designation: 'Tech Lead',
      department: 'Engineering',
      joiningDate: '2022-03-05',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 100000,
      allowances: 20000,
      deductions: 3000,
      tax: 8000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Farhan+Kabir&background=db2777&color=fff',
    },

    // Marketing
    {
      fullName: 'Sadia Afrin',
      email: 'sadia@flowpay.com',
      phone: '01711000007',
      designation: 'Marketing Director',
      department: 'Marketing',
      joiningDate: '2023-05-18',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 65000,
      allowances: 13000,
      deductions: 1500,
      tax: 3500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Sadia+Afrin&background=ea580c&color=fff',
    },
    {
      fullName: 'Rakib Hossain',
      email: 'rakib@flowpay.com',
      phone: '01711000008',
      designation: 'Content Strategist',
      department: 'Marketing',
      joiningDate: '2024-09-01',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 35000,
      allowances: 7000,
      deductions: 800,
      tax: 1500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Rakib+Hossain&background=0284c7&color=fff',
    },
    {
      fullName: 'Tariqul Islam',
      email: 'tariqul@flowpay.com',
      phone: '01711000009',
      designation: 'SEO Specialist',
      department: 'Marketing',
      joiningDate: '2025-01-10',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 40000,
      allowances: 8000,
      deductions: 1000,
      tax: 2000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Tariqul+Islam&background=16a34a&color=fff',
    },
    {
      fullName: 'Ayesha Siddiqua',
      email: 'ayesha@flowpay.com',
      phone: '01711000010',
      designation: 'Social Media Manager',
      department: 'Marketing',
      joiningDate: '2024-11-22',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 45000,
      allowances: 9000,
      deductions: 1000,
      tax: 2500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Ayesha+Siddiqua&background=9333ea&color=fff',
    },

    // Sales
    {
      fullName: 'Imran Khan',
      email: 'imran@flowpay.com',
      phone: '01711000011',
      designation: 'Head of Sales',
      department: 'Sales',
      joiningDate: '2022-08-15',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 70000,
      allowances: 14000,
      deductions: 1500,
      tax: 4000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Imran+Khan&background=4f46e5&color=fff',
    },
    {
      fullName: 'Kamrul Hasan',
      email: 'kamrul@flowpay.com',
      phone: '01711000012',
      designation: 'Senior Account Executive',
      department: 'Sales',
      joiningDate: '2025-03-10',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 30000,
      allowances: 6000,
      deductions: 500,
      tax: 1000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Kamrul+Hasan&background=059669&color=fff',
    },
    {
      fullName: 'Rubel Mia',
      email: 'rubel@flowpay.com',
      phone: '01711000013',
      designation: 'Sales Representative',
      department: 'Sales',
      joiningDate: '2025-04-05',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 32000,
      allowances: 6000,
      deductions: 500,
      tax: 1200,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Rubel+Mia&background=d97706&color=fff',
    },
    {
      fullName: 'Sanjida Akter',
      email: 'sanjida@flowpay.com',
      phone: '01711000014',
      designation: 'Business Development',
      department: 'Sales',
      joiningDate: '2024-07-20',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 50000,
      allowances: 10000,
      deductions: 1200,
      tax: 2500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Sanjida+Akter&background=7c3aed&color=fff',
    },

    // Human Resources
    {
      fullName: 'Nasrin Akter',
      email: 'nasrin@flowpay.com',
      phone: '01711000015',
      designation: 'HR Director',
      department: 'Human Resources',
      joiningDate: '2022-10-10',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 65000,
      allowances: 13000,
      deductions: 1500,
      tax: 3500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Nasrin+Akter&background=2563eb&color=fff',
    },
    {
      fullName: 'Shamim Ahmed',
      email: 'shamim@flowpay.com',
      phone: '01711000016',
      designation: 'HR Executive',
      department: 'Human Resources',
      joiningDate: '2024-12-01',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 35000,
      allowances: 7000,
      deductions: 800,
      tax: 1500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Shamim+Ahmed&background=db2777&color=fff',
    },

    // Finance
    {
      fullName: 'Fatima Khan',
      email: 'fatima@flowpay.com',
      phone: '01711000019',
      designation: 'Finance Controller',
      department: 'Finance',
      joiningDate: '2022-12-05',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 75000,
      allowances: 15000,
      deductions: 2000,
      tax: 4500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Fatima+Khan&background=ea580c&color=fff',
    },
    {
      fullName: 'Karim Islam',
      email: 'karim@flowpay.com',
      phone: '01711000020',
      designation: 'Senior Accountant',
      department: 'Finance',
      joiningDate: '2023-09-15',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 55000,
      allowances: 11000,
      deductions: 1200,
      tax: 3000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Karim+Islam&background=0284c7&color=fff',
    },
    {
      fullName: 'Habibullah Belali',
      email: 'habib@flowpay.com',
      phone: '01711000021',
      designation: 'Junior Accountant',
      department: 'Finance',
      joiningDate: '2025-01-05',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 30000,
      allowances: 6000,
      deductions: 500,
      tax: 1000,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Habibullah+Belali&background=16a34a&color=fff',
    },

    // Operations
    {
      fullName: 'Mahmudul Hasan',
      email: 'mahmudul@flowpay.com',
      phone: '01711000023',
      designation: 'Operations Manager',
      department: 'Operations',
      joiningDate: '2023-04-12',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 65000,
      allowances: 13000,
      deductions: 1500,
      tax: 3500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Mahmudul+Hasan&background=9333ea&color=fff',
    },
    {
      fullName: 'Sajid Ali',
      email: 'sajid@flowpay.com',
      phone: '01711000024',
      designation: 'Office Admin',
      department: 'Operations',
      joiningDate: '2024-10-01',
      status: 'active',
      bankInfo: getBankInfo(),
      basicSalary: 25000,
      allowances: 5000,
      deductions: 400,
      tax: 500,
      bonus: 0,
      overtime: 0,
      pfEligible: true,
      photo: 'https://ui-avatars.com/api/?name=Sajid+Ali&background=4f46e5&color=fff',
    },
  ];

  // Add all employees with dual bank & mobile banking channels
  seedEmployees.forEach((emp, idx) => {
    const providers = ['bkash', 'nagad', 'rocket', 'upay'] as const;
    const provider = providers[idx % providers.length];
    addEmployee({
      ...emp,
      paymentMethod: idx % 3 === 0 ? 'mobile_banking' : 'bank_transfer',
      mobileBankingInfo: {
        provider,
        accountNumber: emp.phone,
        accountType: 'personal',
      },
    });
  });

  const stateEmployees = useEmployeeStore.getState().employees;

  // Generate historical payroll for April 2026 - September 2026
  const currentYear = 2026;
  const adminUserId = 'USR-002';

  for (let month = 4; month <= 9; month++) {
    const employeesWithVariations = stateEmployees.map((emp) => ({
      ...emp,
      bonus: Math.random() > 0.7 ? Math.floor(Math.random() * 5) * 1000 : 0,
      overtime: Math.random() > 0.5 ? Math.floor(Math.random() * 3000) : 0,
    }));

    const records = generatePayroll(month, currentYear, employeesWithVariations, adminUserId);
    const ids = records.map((r) => r.id);

    if (month < 9) {
      approvePayroll(ids, adminUserId);
      markAsPaid(ids, adminUserId, 'bank_transfer');
    } else {
      const draftIds = ids.slice(0, 7);
      const approvedIds = ids.slice(7, 14);
      const paidIds = ids.slice(14);

      approvePayroll([...approvedIds, ...paidIds], adminUserId);
      markAsPaid(paidIds, adminUserId, 'bank_transfer');
    }
  }

  // Seed daily attendance for today
  const today = new Date().toISOString().split('T')[0];
  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'late', 'present'];

  stateEmployees.forEach((emp, i) => {
    const status = statuses[i % statuses.length];
    recordAttendance({
      employeeId: emp.id,
      employeeName: emp.fullName,
      date: today,
      checkIn: status === 'late' ? '09:48' : '08:55',
      checkOut: '17:30',
      status,
      notes: status === 'late' ? 'Traffic delay reported' : undefined,
    });
  });

  // Seed Leave Requests
  if (stateEmployees.length >= 3) {
    applyLeave({
      employeeId: stateEmployees[0].id,
      employeeName: stateEmployees[0].fullName,
      department: stateEmployees[0].department,
      leaveType: 'casual',
      startDate: '2026-10-12',
      endDate: '2026-10-13',
      daysCount: 2,
      reason: 'Family event and personal matters',
    });

    applyLeave({
      employeeId: stateEmployees[1].id,
      employeeName: stateEmployees[1].fullName,
      department: stateEmployees[1].department,
      leaveType: 'sick',
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      daysCount: 2,
      reason: 'Fever and viral infection',
    });

    // Approve the second one
    const currentLeaves = useAttendanceStore.getState().leaveRequests;
    if (currentLeaves.length > 1) {
      approveLeave(currentLeaves[0].id, 'Nasrin Akter (HR)');
    }
  }

  // Seed Active Loans
  if (stateEmployees.length >= 2) {
    const loan1 = applyLoan({
      employeeId: stateEmployees[0].id,
      employeeName: stateEmployees[0].fullName,
      department: stateEmployees[0].department,
      type: 'loan',
      principalAmount: 50000,
      monthlyInstallment: 5000,
      termMonths: 10,
      reason: 'Home renovation and relocation expenses',
    });
    approveLoan(loan1.id, 'Fatima Khan (Finance)');

    const loan2 = applyLoan({
      employeeId: stateEmployees[2].id,
      employeeName: stateEmployees[2].fullName,
      department: stateEmployees[2].department,
      type: 'advance',
      principalAmount: 15000,
      monthlyInstallment: 7500,
      termMonths: 2,
      reason: 'Emergency medical treatment for parent',
    });
    approveLoan(loan2.id, 'Fatima Khan (Finance)');
  }
};
