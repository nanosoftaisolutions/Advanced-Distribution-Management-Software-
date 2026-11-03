import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Receipt,
  HandCoins,
  Truck,
  ShieldAlert,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

export const DailyPerformanceSheetView: React.FC = () => {
  const {
    settings,
    salesInvoices,
    recoveries,
    batches,
    customers,
    salesReps,
    companies,
    branches,
    selectedBranchFilter,
    productRecalls,
    vouchers,
    bankAccounts
  } = usePDMS();

  // Selected performance date (default to today / latest active date)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-02');
  const [activeBranchId, setActiveBranchId] = useState<string>('all');

  // Filter items by selected date and branch
  const dailyData = useMemo(() => {
    // Invoices for date
    const dailyInvoices = salesInvoices.filter(inv => {
      const matchDate = inv.date === selectedDate;
      const matchBranch = activeBranchId === 'all' || inv.branchId === activeBranchId;
      return matchDate && matchBranch && inv.status !== 'Cancelled';
    });

    // Recoveries for date
    const dailyRecoveries = recoveries.filter(rec => {
      const matchDate = rec.paymentDate === selectedDate;
      return matchDate;
    });

    // Expenses / Vouchers for date
    const dailyVouchers = vouchers.filter(v => v.date === selectedDate);
    const dailyExpenseTotal = dailyVouchers
      .filter(v => v.voucherType === 'CPV' || v.voucherType === 'BPV')
      .reduce((sum, v) => sum + v.debit, 0);

    // Sales totals
    const totalSales = dailyInvoices.reduce((sum, inv) => sum + inv.netPayable, 0);
    const totalGross = dailyInvoices.reduce((sum, inv) => sum + inv.subTotal, 0);
    const totalDiscounts = dailyInvoices.reduce((sum, inv) => sum + (inv.totalDiscount || 0), 0);
    const totalBonusPacks = dailyInvoices.reduce(
      (sum, inv) => sum + inv.items.reduce((s, it) => s + (it.bonusQuantity || 0), 0),
      0
    );

    // Recovery totals
    const totalRecovery = dailyRecoveries.reduce((sum, rec) => sum + rec.amount, 0);
    const cashRecovery = dailyRecoveries
      .filter(rec => rec.paymentMethod === 'Cash')
      .reduce((sum, rec) => sum + rec.amount, 0);
    const chequeRecovery = dailyRecoveries
      .filter(rec => rec.paymentMethod === 'Cheque' || rec.paymentMethod === 'Online Deposit' || rec.paymentMethod === 'Bank Transfer')
      .reduce((sum, rec) => sum + rec.amount, 0);

    // Net daily cash inflow
    const netDailyFlow = totalRecovery - dailyExpenseTotal;

    // Near expiry items to watch out for
    const nearExpiryBatches = batches.filter(
      b => b.status === 'Near Expiry' || b.status === 'Expired'
    ).slice(0, 5);

    // Over-credit customers
    const overCreditCustomers = customers.filter(
      c => c.currentBalance > c.creditLimit
    ).slice(0, 5);

    // Sales rep performance for date
    const repPerformance = salesReps.map(rep => {
      const repInvoices = dailyInvoices.filter(inv => inv.salesRepId === rep.id);
      const repSales = repInvoices.reduce((sum, inv) => sum + inv.netPayable, 0);
      const repRecoveries = dailyRecoveries.filter(rec => rec.salesRepId === rep.id);
      const repRecovery = repRecoveries.reduce((sum, rec) => sum + rec.amount, 0);

      return {
        rep,
        orderCount: repInvoices.length,
        salesAmount: repSales,
        recoveryAmount: repRecovery
      };
    }).sort((a, b) => b.salesAmount - a.salesAmount);

    return {
      dailyInvoices,
      dailyRecoveries,
      dailyExpenseTotal,
      totalSales,
      totalGross,
      totalDiscounts,
      totalBonusPacks,
      totalRecovery,
      cashRecovery,
      chequeRecovery,
      netDailyFlow,
      nearExpiryBatches,
      overCreditCustomers,
      repPerformance
    };
  }, [salesInvoices, recoveries, vouchers, batches, customers, salesReps, selectedDate, activeBranchId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Distribution Manager Daily Performance Sheet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Executive daily operational sheet for sales volume, cash collections, delivery clearances, and risk alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* Branch Picker */}
          <select
            value={activeBranchId}
            onChange={e => setActiveBranchId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet (A4)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              Distribution Management ERP &bull; Pakistan Edition
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {settings.distributionName}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Drug Sale License (DSL): <span className="font-mono text-slate-300 font-semibold">{settings.distributorDrugLicense}</span> &bull; NTN: <span className="font-mono text-slate-300">{settings.ntn}</span>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-xs font-semibold text-slate-300">
              Daily Operations Closing Report
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              Date: {selectedDate}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Branch: {activeBranchId === 'all' ? 'Consolidated (All Branches)' : branches.find(b => b.id === activeBranchId)?.name}
            </div>
          </div>
        </div>

        {/* 5-Card Operational Pulse */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Today's Sales Invoiced</span>
            <span className="text-base font-mono font-bold text-white">
              Rs. {dailyData.totalSales.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              {dailyData.dailyInvoices.length} invoices generated
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Total Recovery Collected</span>
            <span className="text-base font-mono font-bold text-emerald-400">
              Rs. {dailyData.totalRecovery.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Cash: Rs. {dailyData.cashRecovery.toLocaleString()} &bull; Cheque: Rs. {dailyData.chequeRecovery.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Daily Expenses Paid</span>
            <span className="text-base font-mono font-bold text-rose-400">
              Rs. {dailyData.dailyExpenseTotal.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Fuel, utilities & freight
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Net Cash Flow Today</span>
            <span className="text-base font-mono font-bold text-sky-400">
              Rs. {dailyData.netDailyFlow.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Recoveries minus outlays
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Schemes & Bonus Units</span>
            <span className="text-base font-mono font-bold text-amber-400">
              {dailyData.totalBonusPacks} Packs
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Rs. {dailyData.totalDiscounts.toLocaleString()} trade discount
            </div>
          </div>
        </div>

        {/* Section 1: Invoicing & Orders Generated Today */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              1. Sales Invoices Issued on {selectedDate} ({dailyData.dailyInvoices.length} Orders)
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              Total: Rs. {dailyData.totalSales.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Inv #</th>
                  <th className="py-2 px-3">Customer / Pharmacy</th>
                  <th className="py-2 px-3">Principal / Items</th>
                  <th className="py-2 px-3 text-right">Gross</th>
                  <th className="py-2 px-3 text-right">Discounts</th>
                  <th className="py-2 px-3 text-right">Net Payable</th>
                  <th className="py-2 px-3">Sales Rep</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dailyData.dailyInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                      No invoices found for this date. Select another date or book new sales.
                    </td>
                  </tr>
                ) : (
                  dailyData.dailyInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-200 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{inv.customerStoreName}</div>
                        <div className="text-[10px] text-slate-400">{inv.customerName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {inv.items.length} product lines ({inv.items.reduce((s, it) => s + it.quantity, 0)} packs)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        Rs. {inv.subTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        Rs. {(inv.totalDiscount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        Rs. {inv.netPayable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {inv.salesRepName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'emerald'
                              : inv.status === 'Partially Paid'
                              ? 'amber'
                              : 'sky'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Recoveries Collected Today */}
        <div className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-sky-400" />
              2. Cash & Cheque Recoveries Logged on {selectedDate} ({dailyData.dailyRecoveries.length} Receipts)
            </h3>
            <span className="text-xs font-mono text-sky-400 font-semibold">
              Total: Rs. {dailyData.totalRecovery.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Receipt #</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Mode</th>
                  <th className="py-2 px-3">Ref / Cheque #</th>
                  <th className="py-2 px-3">Deposited Bank</th>
                  <th className="py-2 px-3 text-right">Amount (PKR)</th>
                  <th className="py-2 px-3">Recovery Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dailyData.dailyRecoveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                      No recoveries recorded on this date.
                    </td>
                  </tr>
                ) : (
                  dailyData.dailyRecoveries.map(rec => {
                    const bAccount = bankAccounts.find(b => b.id === rec.bankAccountId);
                    const rep = salesReps.find(r => r.id === rec.salesRepId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {rec.receiptNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">
                          {rec.customerName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            rec.paymentMethod === 'Cash'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-sky-950 text-sky-400 border border-sky-800/60'
                          }`}>
                            {rec.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {rec.chequeNumber || 'CASH-SLIP'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {bAccount?.bankName || 'Meezan Bank Ltd'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          Rs. {rec.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {rep?.name || 'Recovery Officer'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Manager Watchlist & Risk Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3">
          {/* Near Expiry Watchlist */}
          <div className="p-3 bg-slate-950/80 border border-amber-900/40 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Critical Near-Expiry Batches (Liquidation Alert)
            </h4>
            <div className="space-y-1.5">
              {dailyData.nearExpiryBatches.map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <div>
                    <span className="font-medium text-slate-200">{b.productId}</span>
                    <span className="font-mono text-slate-500 text-[10px] ml-1.5">Batch: {b.batchNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-amber-400 font-semibold">{b.availableQuantity} packs</span>
                    <span className="text-[10px] text-slate-500 block">Exp: {b.expiryDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Over Credit Limit Customers */}
          <div className="p-3 bg-slate-950/80 border border-rose-900/40 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Customers Requiring Credit Clearance
            </h4>
            <div className="space-y-1.5">
              {dailyData.overCreditCustomers.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <div>
                    <span className="font-medium text-slate-200">{c.storeName}</span>
                    <span className="text-[10px] text-slate-500 block">{c.city} &bull; DSL: {c.drugSaleLicenseNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-rose-400 font-bold">
                      Rs. {c.currentBalance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Limit: Rs. {c.creditLimit.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Daily Field Rep Scorecard */}
        <div className="pt-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Field Sales Force Daily Booking & Recovery Scorecard
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {dailyData.repPerformance.map(item => (
              <div key={item.rep.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{item.rep.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.rep.phone}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.rep.assignedTerritories.join(', ')}</div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Booked Sales</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Rs. {item.salesAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Recovery</span>
                    <span className="font-mono font-bold text-sky-400">
                      Rs. {item.recoveryAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Sign-off Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 mx-auto w-3/4 mb-1"></div>
            <span className="text-slate-400 text-[11px] block">Prepared By (Data Entry)</span>
            <span className="text-[10px] text-slate-500">Billing Officer</span>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 mx-auto w-3/4 mb-1"></div>
            <span className="text-slate-400 text-[11px] block">Verified By (Accounts)</span>
            <span className="text-[10px] text-slate-500">Chief Accountant</span>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 mx-auto w-3/4 mb-1"></div>
            <span className="text-slate-300 font-semibold text-[11px] block">Approved By (Distribution Manager)</span>
            <span className="text-[10px] text-emerald-400 font-mono">Muhammad Tariq Chaudhry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
