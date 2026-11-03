import React, { useState } from 'react';
import { Plus, HandCoins, CheckCircle2, Clock, AlertTriangle, FileText, Building2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { CustomerRecovery } from '../types/pdms';

export const RecoveryView: React.FC = () => {
  const {
    recoveries,
    customers,
    salesReps,
    salesInvoices,
    bankAccounts,
    addCustomerRecovery
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Recovery Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState(50000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Cheque' | 'Bank Transfer'>('Cheque');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeStatus, setChequeStatus] = useState<'Cleared' | 'Pending'>('Cleared');
  const [remarks, setRemarks] = useState('');

  const selectedCust = customers.find(c => c.id === customerId);
  const pendingInvoices = salesInvoices.filter(
    i => i.customerId === customerId && (i.status === 'Unpaid' || i.status === 'Partially Paid')
  );

  const handleCreateRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || amount <= 0) return;

    // Allocate across pending invoices if any
    let remainingToAllocate = amount;
    const allocated: { invoiceId: string; invoiceNumber: string; amountAllocated: number }[] = [];

    for (const inv of pendingInvoices) {
      if (remainingToAllocate <= 0) break;
      const take = Math.min(remainingToAllocate, inv.balanceDue);
      allocated.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amountAllocated: take
      });
      remainingToAllocate -= take;
    }

    addCustomerRecovery({
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedCust.id,
      customerName: selectedCust.storeName,
      paymentDate,
      amount,
      paymentMethod,
      bankAccountId: paymentMethod !== 'Cash' ? bankAccountId : undefined,
      chequeNumber: paymentMethod === 'Cheque' ? chequeNumber : undefined,
      chequeDate: paymentMethod === 'Cheque' ? chequeDate : undefined,
      chequeStatus: paymentMethod === 'Cheque' ? chequeStatus : undefined,
      salesRepId: selectedCust.salesRepId,
      allocatedInvoices: allocated,
      unallocatedAmount: remainingToAllocate,
      remarks: remarks || `Recovery collected via ${paymentMethod}`
    });

    setIsModalOpen(false);
  };

  const columns: Column<CustomerRecovery>[] = [
    {
      header: 'Receipt #',
      accessorKey: 'receiptNumber',
      sortable: true,
      render: row => (
        <span className="font-mono font-semibold text-emerald-400">{row.receiptNumber}</span>
      )
    },
    {
      header: 'Date',
      accessorKey: 'paymentDate',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.paymentDate}</span>
    },
    {
      header: 'Customer / Store',
      accessorKey: 'customerName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.customerName}</span>
    },
    {
      header: 'Amount Collected (PKR)',
      accessorKey: 'amount',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums text-sm">
          Rs. {row.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Method & Ref',
      render: row => (
        <div className="text-xs">
          <Badge variant={row.paymentMethod === 'Cash' ? 'emerald' : 'sky'}>
            {row.paymentMethod}
          </Badge>
          {row.chequeNumber && (
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Chq: {row.chequeNumber} ({row.chequeStatus})
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Allocated Invoices',
      render: row => (
        <div className="text-xs text-slate-300">
          {row.allocatedInvoices && row.allocatedInvoices.length > 0 ? (
            <span className="font-mono">
              {row.allocatedInvoices.map(a => a.invoiceNumber).join(', ')}
            </span>
          ) : (
            <span className="text-slate-500 italic">Unallocated Advance</span>
          )}
        </div>
      )
    },
    {
      header: 'Collected By',
      render: row => {
        const rep = salesReps.find(r => r.id === row.salesRepId);
        return <span className="text-slate-400 text-xs">{rep?.name || 'Cash Desk'}</span>;
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Recovery & Accounts Receivable</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log market collections, cheque clearance workflows, unallocated advances and customer balance reconciliation
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Collection Receipt</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={recoveries}
        searchPlaceholder="Search receipts by number or customer store..."
        searchFilterKeys={['receiptNumber', 'customerName', 'chequeNumber']}
        exportFilename="Customer_Recovery_Register"
      />

      {/* LOG RECOVERY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Payment Collection Receipt"
        subtitle="Record cash, bank transfer or cheque from retail pharmacy customer"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateRecovery} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Customer Pharmacy *</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.storeName} · Outstanding: Rs. {c.currentBalance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Amount Collected (PKR) *</label>
              <input
                type="number"
                step="100"
                min="1"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Payment Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Cheque', 'Bank Transfer'] as const).map(method => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'Cheque' && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Cheque Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CHQ-481920"
                  value={chequeNumber}
                  onChange={e => setChequeNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cheque Date</label>
                <input
                  type="date"
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cheque Clearance</label>
                <select
                  value={chequeStatus}
                  onChange={e => setChequeStatus(e.target.value as 'Cleared' | 'Pending')}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                >
                  <option value="Cleared">Cleared Immediately</option>
                  <option value="Pending">Pending Clearance</option>
                </select>
              </div>
            </div>
          )}

          {paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Deposit To Bank Account</label>
              <select
                value={bankAccountId}
                onChange={e => setBankAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountTitle} ({b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g., Recovery collected during weekly market visit"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold cursor-pointer"
            >
              Post Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
