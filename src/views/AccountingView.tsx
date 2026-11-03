import React, { useState, useMemo } from 'react';
import { Plus, BookOpen, Landmark, DollarSign, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { AccountingVoucher } from '../types/pdms';

export const AccountingView: React.FC = () => {
  const { vouchers, bankAccounts, addVoucher, salesInvoices, grns, settings } = usePDMS();

  const [activeTab, setActiveTab] = useState<'vouchers' | 'banks' | 'pnl' | 'trial'>('vouchers');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Voucher Form
  const [voucherType, setVoucherType] = useState<AccountingVoucher['voucherType']>('CPV');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountHead, setAccountHead] = useState('Office Operational Expenses');
  const [category, setCategory] = useState<AccountingVoucher['category']>('Expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(5000);
  const [isDebit, setIsDebit] = useState(true);

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    addVoucher({
      voucherNumber: `${voucherType}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      voucherType,
      date,
      accountHead,
      category,
      description,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount
    });
    setIsModalOpen(false);
    setDescription('');
  };

  // P&L Calculations
  const pnlData = useMemo(() => {
    const grossSales = salesInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, inv) => sum + inv.subTotal, 0);

    const discounts = salesInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, inv) => sum + inv.totalDiscount, 0);

    const netSales = grossSales - discounts;

    // Cost of goods sold (COGS based on trade items sold at purchase rate)
    const cogs = salesInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, inv) => {
        return (
          sum +
          inv.items.reduce((iSum, item) => {
            const costEst = item.tradePrice * 0.88; // ~88% purchase cost
            return iSum + (item.quantity + item.bonusQuantity) * costEst;
          }, 0)
        );
      }, 0);

    const grossProfit = netSales - cogs;

    // Operating expenses from vouchers
    const operatingExpenses = vouchers
      .filter(v => v.category === 'Expense')
      .reduce((sum, v) => sum + v.debit, 0);

    const netProfit = grossProfit - operatingExpenses;

    return {
      grossSales,
      discounts,
      netSales,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      margin: netSales > 0 ? (netProfit / netSales) * 100 : 0
    };
  }, [salesInvoices, vouchers]);

  const voucherColumns: Column<AccountingVoucher>[] = [
    {
      header: 'Voucher #',
      accessorKey: 'voucherNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-emerald-400">{row.voucherNumber}</span>
    },
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.date}</span>
    },
    {
      header: 'Type',
      accessorKey: 'voucherType',
      render: row => {
        const typeVariants: { [k: string]: 'emerald' | 'sky' | 'amber' | 'slate' | 'rose' } = {
          CPV: 'amber',
          CRV: 'emerald',
          BPV: 'sky',
          BRV: 'emerald',
          JV: 'slate'
        };
        return <Badge variant={typeVariants[row.voucherType] || 'slate'}>{row.voucherType}</Badge>;
      }
    },
    {
      header: 'Account Head & Description',
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.accountHead}</div>
          <div className="text-[10px] text-slate-400 truncate max-w-sm">{row.description}</div>
        </div>
      )
    },
    {
      header: 'Debit (PKR)',
      accessorKey: 'debit',
      align: 'right',
      render: row =>
        row.debit > 0 ? (
          <span className="font-mono font-bold text-white tabular-nums">
            Rs. {row.debit.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-600 font-mono">-</span>
        )
    },
    {
      header: 'Credit (PKR)',
      accessorKey: 'credit',
      align: 'right',
      render: row =>
        row.credit > 0 ? (
          <span className="font-mono font-bold text-emerald-400 tabular-nums">
            Rs. {row.credit.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-600 font-mono">-</span>
        )
    },
    {
      header: 'Prepared By',
      accessorKey: 'createdBy',
      render: row => <span className="text-slate-400 text-xs">{row.createdBy}</span>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Financial Accounting & Ledgers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Double-entry bookkeeping, cash book, bank reconciliation, trial balance, and profit & loss statement in PKR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'vouchers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vouchers Register
            </button>
            <button
              onClick={() => setActiveTab('banks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'banks' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bank Accounts
            </button>
            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'pnl' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Profit & Loss (P&L)
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Voucher</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {activeTab === 'vouchers' && (
        <DataTable
          columns={voucherColumns}
          data={vouchers}
          searchPlaceholder="Search vouchers by number, account head or description..."
          searchFilterKeys={['voucherNumber', 'accountHead', 'description', 'voucherType']}
          exportFilename="Accounting_Vouchers_Register"
        />
      )}

      {activeTab === 'banks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map(b => (
            <div key={b.id} className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{b.bankName}</span>
                <Landmark className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Account Title:</span>
                <span className="font-medium text-slate-200 text-xs">{b.accountTitle}</span>
              </div>
              <div className="font-mono text-xs text-slate-400">
                A/C: <span className="text-white">{b.accountNumber}</span>
              </div>
              <div className="font-mono text-[10px] text-slate-500">IBAN: {b.iban}</div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Current Balance:</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  Rs. {b.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pnl' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">
              Statement of Profit & Loss (P&L)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive distribution revenues, cost of goods, gross margin and net operating profit
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 text-slate-300">
              <span>Gross Trade Invoicing Revenue:</span>
              <span className="font-bold text-white tabular-nums">
                Rs. {pnlData.grossSales.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1 text-rose-400">
              <span>Less: Promotional Schemes & Trade Discounts:</span>
              <span className="tabular-nums">- Rs. {pnlData.discounts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-t border-slate-800 text-sm font-bold text-slate-100">
              <span>Net Invoiced Revenue:</span>
              <span className="text-emerald-400 tabular-nums">
                Rs. {pnlData.netSales.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 flex justify-between py-1 text-slate-400">
              <span>Less: Cost of Goods Sold (Purchase Cost):</span>
              <span className="tabular-nums text-rose-400">
                - Rs. {pnlData.cogs.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-t border-slate-800 text-sm font-bold text-white bg-slate-950/40 p-2 rounded">
              <span>Gross Profit (Distribution Margin):</span>
              <span className="text-emerald-400 tabular-nums">
                Rs. {pnlData.grossProfit.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 flex justify-between py-1 text-slate-400">
              <span>Less: Fleet, Salaries & Operating Expenses:</span>
              <span className="tabular-nums text-rose-400">
                - Rs. {pnlData.operatingExpenses.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-2.5 border-t-2 border-emerald-500/80 text-base font-bold text-white bg-slate-950 p-3 rounded">
              <span>Net Operating Profit:</span>
              <span className="text-emerald-400 tabular-nums">
                Rs. {pnlData.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE VOUCHER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Accounting Voucher"
        subtitle="Double-entry journal entry, cash payment/receipt or bank transaction"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Voucher Type *</label>
              <select
                value={voucherType}
                onChange={e => setVoucherType(e.target.value as AccountingVoucher['voucherType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                <option value="CPV">CPV - Cash Payment Voucher</option>
                <option value="CRV">CRV - Cash Receipt Voucher</option>
                <option value="BPV">BPV - Bank Payment Voucher</option>
                <option value="BRV">BRV - Bank Receipt Voucher</option>
                <option value="JV">JV - Journal Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Account Head *</label>
              <input
                type="text"
                required
                placeholder="e.g., Warehouse Electricity & Rent"
                value={accountHead}
                onChange={e => setAccountHead(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AccountingVoucher['category'])}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                <option value="Expense">Expense</option>
                <option value="Revenue">Revenue</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Amount (PKR) *</label>
              <input
                type="number"
                step="50"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Entry Nature</label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="entryNature"
                    checked={isDebit}
                    onChange={() => setIsDebit(true)}
                  />
                  <span className="text-slate-200">Debit</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="entryNature"
                    checked={!isDebit}
                    onChange={() => setIsDebit(false)}
                  />
                  <span className="text-slate-200">Credit</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Transaction Description *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g., Paid monthly diesel bill for delivery vehicles"
              value={description}
              onChange={e => setDescription(e.target.value)}
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
              Post to Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
