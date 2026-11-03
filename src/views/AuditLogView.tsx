import React from 'react';
import { ShieldAlert, Clock, User, Layers, Search } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { AuditLog } from '../types/pdms';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = usePDMS();

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      render: row => (
        <span className="font-mono text-slate-300 text-xs">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      )
    },
    {
      header: 'User & Role',
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.userName}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.userRole}</div>
        </div>
      )
    },
    {
      header: 'Module',
      accessorKey: 'module',
      render: row => <Badge variant="slate">{row.module}</Badge>
    },
    {
      header: 'Action Code',
      accessorKey: 'action',
      render: row => (
        <span className="font-mono text-xs font-semibold text-emerald-400">{row.action}</span>
      )
    },
    {
      header: 'Transaction Details',
      accessorKey: 'details',
      render: row => (
        <span className="text-slate-300 text-xs leading-relaxed max-w-md block truncate">
          {row.details}
        </span>
      )
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      render: row => <span className="font-mono text-[10px] text-slate-500">{row.ipAddress}</span>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">System Audit Trail & Security Logs</h2>
          <Badge variant="emerald">Tamper-Evident</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable chronological record of every sales invoice, stock adjustment, return, and payment disbursement
        </p>
      </div>

      <DataTable
        columns={columns}
        data={auditLogs}
        searchPlaceholder="Search audit trail by user, module or transaction ID..."
        searchFilterKeys={['userName', 'userRole', 'module', 'action', 'details']}
        exportFilename="System_Audit_Trail_Log"
      />
    </div>
  );
};
