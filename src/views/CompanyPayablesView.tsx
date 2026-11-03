import React, { useState } from 'react';
import { Plus, CreditCard, Landmark, CheckCircle2, Building2, FileText } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { CompanyPayment } from '../types/pdms';

export const CompanyPayablesView: React.FC = () => {
  const {
    companies,
    companyPayments,
    bankAccounts,
    grns,
    claims,
    addCompanyPayment,
    selectedCompanyFilter
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [amount, setAmount] = useState(500000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Pay Order'>('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [transactionReference, setTransactionReference] = useState('');
  const [remarks, setRemarks] = useState('');

  const filteredPayments = companyPayments.filter(
    p => selectedCompanyFilter === 'all' || p.companyId === selectedCompanyFilter
  );

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === companyId);
    if (!comp || amount <= 0) return;

    addCompanyPayment({
      voucherNumber: `BPV-COMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      companyId: comp.id,
      companyName: comp.name,
      paymentDate,
      amount,
      paymentMethod,
      bankAccountId,
      transactionReference: transactionReference || `TR-${Date.now().toString().slice(-6)}`,
      remarks
    });

    setIsModalOpen(false);
  };

  const columns: Column<CompanyPayment>[] = [
    {
      header: 'Voucher #',
      accessorKey: 'voucherNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-sky-400">{row.voucherNumber}</span>
    },
    {
      header: 'Disbursement Date',
      accessorKey: 'paymentDate',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.paymentDate}</span>
    },
    {
      header: 'Pharmaceutical Principal',
      accessorKey: 'companyName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.companyName}</span>
    },
    {
      header: 'Amount Paid (PKR)',
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
      header: 'Payment Channel',
      render: row => (
        <div className="text-xs">
          <Badge variant="emerald">{row.paymentMethod}</Badge>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {row.transactionReference}</div>
        </div>
      )
    },
    {
      header: 'Authorizer',
      accessorKey: 'createdBy',
      render: row => <span className="text-slate-400 text-xs">{row.createdBy}</span>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Company Payable Accounts & Settlements</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage manufacturer consignments, bank settlements, claim deductions, and outstanding company payables
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Disburse Manufacturer Payment</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search company payments by voucher, company or transaction ref..."
        searchFilterKeys={['voucherNumber', 'companyName', 'transactionReference']}
        exportFilename="Company_Payables_Register"
      />

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Disburse Payment to Pharmaceutical Company"
        subtitle="Issue Bank Payment Voucher (BPV) and deduct from distribution bank account"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Principal *</label>
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shortCode}) · Credit Limit: Rs. {(c.creditLimit / 1000000).toFixed(1)}M
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Disbursement Amount (PKR) *</label>
              <input
                type="number"
                step="1000"
                min="1"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Disbursement Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as 'Bank Transfer' | 'Cheque' | 'Pay Order')}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="Bank Transfer">Online Bank Transfer (RTGS / Raast)</option>
                <option value="Cheque">Corporate Cross Cheque</option>
                <option value="Pay Order">Banker's Cheque / Pay Order</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Debit From Bank Account *</label>
              <select
                value={bankAccountId}
                onChange={e => setBankAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} (Bal: Rs. {(b.currentBalance / 1000000).toFixed(2)}M)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Transaction Ref / Cheque # *</label>
            <input
              type="text"
              required
              placeholder="e.g., RTGS-MEEZ-994819"
              value={transactionReference}
              onChange={e => setTransactionReference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Settlement Remarks</label>
            <input
              type="text"
              placeholder="e.g., Fortnightly settlement for October consignment"
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
              Confirm Disbursement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
