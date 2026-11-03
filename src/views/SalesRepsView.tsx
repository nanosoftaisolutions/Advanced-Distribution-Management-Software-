import React, { useState } from 'react';
import { UserCheck, Award, TrendingUp, HandCoins, Phone, Shield } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { SalesRep } from '../types/pdms';

export const SalesRepsView: React.FC = () => {
  const { salesReps, customers } = usePDMS();

  const columns: Column<SalesRep>[] = [
    {
      header: 'Representative',
      accessorKey: 'name',
      sortable: true,
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.name}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            {row.employeeCode} · CNIC: {row.cnic}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Territories',
      render: row => (
        <div className="text-xs text-slate-300 space-y-0.5">
          {row.assignedTerritories.map((t, idx) => (
            <span key={idx} className="inline-block bg-slate-800 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1">
              {t}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Customers Managed',
      align: 'center',
      render: row => {
        const count = customers.filter(c => c.salesRepId === row.id).length;
        return <span className="font-mono tabular-nums text-white font-semibold">{count} Stores</span>;
      }
    },
    {
      header: 'Monthly Sales Target',
      accessorKey: 'monthlySalesTarget',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono tabular-nums font-semibold text-slate-300">
          Rs. {row.monthlySalesTarget.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Sales Achieved',
      accessorKey: 'currentMonthSales',
      align: 'right',
      sortable: true,
      render: row => {
        const pct = Math.round((row.currentMonthSales / row.monthlySalesTarget) * 100);
        return (
          <div className="font-mono tabular-nums text-right">
            <span className="font-bold text-emerald-400">Rs. {row.currentMonthSales.toLocaleString()}</span>
            <div className="text-[10px] text-slate-400">{pct}% of quota</div>
          </div>
        );
      }
    },
    {
      header: 'Recovery Collected',
      accessorKey: 'currentMonthRecovery',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono tabular-nums font-bold text-sky-400">
          Rs. {row.currentMonthRecovery.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Commission Earned',
      align: 'right',
      render: row => {
        const comm = (row.currentMonthRecovery * row.commissionRate) / 100;
        return (
          <div className="font-mono tabular-nums text-right">
            <span className="font-bold text-white">Rs. {Math.round(comm).toLocaleString()}</span>
            <div className="text-[10px] text-slate-500">Rate: {row.commissionRate}%</div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Sales Representatives & Field Force</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Monitor field sales reps, assigned territories, sales quotas, collection performance, and commission disbursements
        </p>
      </div>

      <DataTable
        columns={columns}
        data={salesReps}
        searchPlaceholder="Search field officers by name or territory..."
        searchFilterKeys={['name', 'employeeCode', 'cnic']}
        exportFilename="Sales_Representatives_Register"
      />
    </div>
  );
};
