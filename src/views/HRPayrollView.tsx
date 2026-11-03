import React, { useState } from 'react';
import { Plus, Users, DollarSign, Printer, CheckCircle2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Employee } from '../types/pdms';

export const HRPayrollView: React.FC = () => {
  const { employees } = usePDMS();
  const [selectedPaySlip, setSelectedPaySlip] = useState<Employee | null>(null);

  const columns: Column<Employee>[] = [
    {
      header: 'Employee Code',
      accessorKey: 'employeeCode',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-emerald-400">{row.employeeCode}</span>
    },
    {
      header: 'Full Name',
      accessorKey: 'name',
      sortable: true,
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.name}</div>
          <div className="text-[10px] text-slate-400 font-mono">CNIC: {row.cnic}</div>
        </div>
      )
    },
    {
      header: 'Designation & Dept',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-200">{row.designation}</span>
          <div className="text-[10px] text-slate-500">{row.department}</div>
        </div>
      )
    },
    {
      header: 'Basic Salary (PKR)',
      accessorKey: 'basicSalary',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          Rs. {row.basicSalary.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Allowances',
      accessorKey: 'allowances',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-emerald-400">
          Rs. {row.allowances.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Gross Monthly Pay',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums font-bold text-white">
          Rs. {(row.basicSalary + row.allowances).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedPaySlip(row)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
        >
          View Salary Slip →
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Human Resources & Payroll Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Employee staff profiles, CNIC records, salary structures, allowances, deductions, and monthly salary slips
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Search staff by name, code or designation..."
        searchFilterKeys={['name', 'employeeCode', 'designation', 'cnic']}
        exportFilename="Employees_Payroll_Register"
      />

      {/* SALARY SLIP MODAL */}
      {selectedPaySlip && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPaySlip(null)}
          title={`Monthly Salary Slip: ${selectedPaySlip.name}`}
          subtitle={`Employee Code: ${selectedPaySlip.employeeCode} · Designation: ${selectedPaySlip.designation}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          }
        >
          <div className="bg-white text-slate-950 p-5 rounded-lg text-xs space-y-4 font-mono shadow-sm">
            <div className="text-center border-b pb-3">
              <h3 className="font-bold text-sm tracking-tight">SHAHEEN PHARMA LOGISTICS</h3>
              <p className="text-[10px] text-slate-600">CONFIDENTIAL SALARY DISBURSEMENT SLIP</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                Employee: <strong>{selectedPaySlip.name}</strong>
              </div>
              <div className="text-right">
                Emp Code: <strong>{selectedPaySlip.employeeCode}</strong>
              </div>
              <div>
                CNIC: <strong>{selectedPaySlip.cnic}</strong>
              </div>
              <div className="text-right">
                Dept: <strong>{selectedPaySlip.department}</strong>
              </div>
            </div>

            <div className="border-t border-b py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-bold">Rs. {selectedPaySlip.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Medical & Fleet Allowance:</span>
                <span className="font-bold">+ Rs. {selectedPaySlip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Tax & Social Security Deductions:</span>
                <span className="font-bold">- Rs. 0</span>
              </div>
            </div>

            <div className="flex justify-between text-sm font-bold bg-slate-100 p-2 rounded">
              <span>Net Payable Disbursed:</span>
              <span className="text-emerald-800">
                Rs. {(selectedPaySlip.basicSalary + selectedPaySlip.allowances).toLocaleString()}
              </span>
            </div>

            <div className="pt-4 flex justify-between text-[10px] text-slate-500 text-center">
              <div>
                <div className="h-6 border-b border-dashed border-slate-400 mb-1 w-24"></div>
                <span>Accountant Sign</span>
              </div>
              <div>
                <div className="h-6 border-b border-dashed border-slate-400 mb-1 w-24"></div>
                <span>Employee Signature</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
