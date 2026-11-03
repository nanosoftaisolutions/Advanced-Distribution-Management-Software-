import React, { useMemo } from 'react';
import {
  TrendingUp,
  Boxes,
  HandCoins,
  AlertTriangle,
  Receipt,
  Building2,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  onNewInvoice: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onNewInvoice }) => {
  const {
    companies,
    products,
    batches,
    customers,
    salesInvoices,
    recoveries,
    claims,
    selectedCompanyFilter,
    setSelectedCompanyFilter
  } = usePDMS();

  // Filtered computations based on selected company
  const filteredInvoices = useMemo(() => {
    if (selectedCompanyFilter === 'all') return salesInvoices;
    return salesInvoices.filter(inv => inv.companyId === selectedCompanyFilter);
  }, [salesInvoices, selectedCompanyFilter]);

  const filteredBatches = useMemo(() => {
    if (selectedCompanyFilter === 'all') return batches;
    return batches.filter(b => b.companyId === selectedCompanyFilter);
  }, [batches, selectedCompanyFilter]);

  const filteredProducts = useMemo(() => {
    if (selectedCompanyFilter === 'all') return products;
    return products.filter(p => p.companyId === selectedCompanyFilter);
  }, [products, selectedCompanyFilter]);

  // Financial KPIs
  const totalSalesValue = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, inv) => sum + inv.netPayable, 0);
  }, [filteredInvoices]);

  const totalCashSales = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'Cancelled' && i.paymentMethod === 'Cash')
      .reduce((sum, inv) => sum + inv.netPayable, 0);
  }, [filteredInvoices]);

  const totalCreditSales = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'Cancelled' && i.paymentMethod === 'Credit')
      .reduce((sum, inv) => sum + inv.netPayable, 0);
  }, [filteredInvoices]);

  const totalRecoveryAmount = useMemo(() => {
    return recoveries.reduce((sum, r) => sum + r.amount, 0);
  }, [recoveries]);

  const totalCustomerReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customers]);

  const totalInventoryValue = useMemo(() => {
    return filteredBatches
      .filter(b => b.status !== 'Expired')
      .reduce((sum, b) => sum + b.availableQuantity * b.purchaseRate, 0);
  }, [filteredBatches]);

  // Expiry analysis
  const nearExpiryBatches = useMemo(() => {
    return filteredBatches.filter(b => b.status === 'Near Expiry' || b.status === 'Expired');
  }, [filteredBatches]);

  const nearExpiryValue = useMemo(() => {
    return nearExpiryBatches.reduce((sum, b) => sum + b.availableQuantity * b.sellingRate, 0);
  }, [nearExpiryBatches]);

  // Active selected company object
  const activeCompanyObj = companies.find(c => c.id === selectedCompanyFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Distribution Command Center</h1>
            {activeCompanyObj ? (
              <Badge variant="indigo">{activeCompanyObj.name}</Badge>
            ) : (
              <Badge variant="emerald">Consolidated Overview</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time batch inventory, multi-company performance, receivables and FEFO distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCompanyFilter !== 'all' && (
            <button
              onClick={() => setSelectedCompanyFilter('all')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded bg-slate-800 transition-colors cursor-pointer"
            >
              Reset to All Companies
            </button>
          )}

          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Net Sales (Posted)"
          value={`Rs. ${(totalSalesValue / 1000).toFixed(1)}k`}
          subValue={`Cash: Rs. ${(totalCashSales / 1000).toFixed(0)}k · Credit: Rs. ${(totalCreditSales / 1000).toFixed(0)}k`}
          trend="+14.2% MoM"
          trendType="positive"
          icon={TrendingUp}
          actionLabel="View Invoices"
          onAction={() => onNavigate('sales')}
        />

        <StatCard
          label="Total Market Recovery"
          value={`Rs. ${(totalRecoveryAmount / 1000).toFixed(1)}k`}
          subValue={`${recoveries.length} Collection Receipts Logged`}
          trend="88% Target Reached"
          trendType="positive"
          icon={HandCoins}
          actionLabel="Log Recovery"
          onAction={() => onNavigate('recovery')}
        />

        <StatCard
          label="Customer Receivables"
          value={`Rs. ${(totalCustomerReceivables / 1000000).toFixed(2)}M`}
          subValue={`${customers.filter(c => c.currentBalance > c.creditLimit).length} Stores Over Credit Limit`}
          trendType="negative"
          icon={Receipt}
          actionLabel="Review Aging"
          onAction={() => onNavigate('customers')}
        />

        <StatCard
          label="Current Stock Valuation (Cost)"
          value={`Rs. ${(totalInventoryValue / 1000000).toFixed(2)}M`}
          subValue={`${filteredBatches.length} Active Batches Tracked`}
          trend="Strict FEFO"
          trendType="neutral"
          icon={Boxes}
          actionLabel="Check Batches"
          onAction={() => onNavigate('inventory')}
        />
      </div>

      {/* Near-Expiry & Operational Action Row */}
      {nearExpiryBatches.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">
                  {nearExpiryBatches.length} Batches Nearing Expiry or Expired
                </h4>
                <Badge variant="amber">Urgent Action</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Total commercial exposure: <span className="font-mono font-semibold text-amber-300">Rs. {nearExpiryValue.toLocaleString()}</span>. Automatic FEFO routing active; recommend immediate replacement or company claim submission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('analyzers')}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-700/60 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              Run Expiry Analyzer
            </button>
            <button
              onClick={() => onNavigate('claims')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              File Company Claim
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Multi-Company Performance & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pharmaceutical Companies Performance & Targets */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Pharma Principal Target & Sales Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly distribution quota achievements across contracted manufacturers
              </p>
            </div>
            <button
              onClick={() => onNavigate('companies')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({companies.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {companies.map(comp => {
              // Calculate company sales from invoices
              const companySales = salesInvoices
                .filter(i => i.companyId === comp.id && i.status !== 'Cancelled')
                .reduce((sum, inv) => sum + inv.netPayable, 0);

              const percent = Math.min(100, Math.round((companySales / comp.salesTargetMonthly) * 100));

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompanyFilter(comp.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedCompanyFilter === comp.id
                      ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] text-emerald-400 border border-slate-700">
                        {comp.logoText}
                      </div>
                      <span className="font-semibold text-white">{comp.name}</span>
                      <span className="text-slate-500">· {comp.city}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono tabular-nums font-semibold text-white">
                        Rs. {companySales.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-1">
                        / {comp.salesTargetMonthly >= 1000000 ? `${(comp.salesTargetMonthly / 1000000).toFixed(1)}M` : comp.salesTargetMonthly}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0 w-9 text-right">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Top Products */}
        <div className="space-y-6">
          {/* Quick Action Hub */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onNewInvoice}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 text-left transition-colors cursor-pointer group"
              >
                <Receipt className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-white">Sales Invoice</div>
                <div className="text-[10px] text-slate-400 mt-0.5">FEFO Auto-Batch</div>
              </button>

              <button
                onClick={() => onNavigate('recovery')}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 text-left transition-colors cursor-pointer group"
              >
                <HandCoins className="w-4 h-4 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-white">Payment Receipt</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cash / Cheque</div>
              </button>

              <button
                onClick={() => onNavigate('purchases')}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 text-left transition-colors cursor-pointer group"
              >
                <Boxes className="w-4 h-4 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-white">Receive Stock</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Verify GRN</div>
              </button>

              <button
                onClick={() => onNavigate('claims')}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/40 text-left transition-colors cursor-pointer group"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-white">Company Claim</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Expiry / Damage</div>
              </button>
            </div>
          </div>

          {/* Top Moving Medicines */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">High Velocity Medicines</h3>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Products Master →
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredProducts.slice(0, 5).map(prod => {
                const totalStock = batches
                  .filter(b => b.productId === prod.id && b.status !== 'Expired')
                  .reduce((acc, curr) => acc + curr.availableQuantity, 0);

                return (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{prod.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {prod.genericName} · {prod.packSize}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono tabular-nums text-white font-medium">
                        TP: Rs. {prod.tradePrice.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] font-mono ${
                          totalStock <= prod.reorderLevel ? 'text-amber-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {totalStock} in stock
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
