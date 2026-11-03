import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Building2,
  Sliders,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

export const CompanyProfitabilityView: React.FC = () => {
  const {
    companies,
    products,
    batches,
    salesInvoices,
    companyPayments
  } = usePDMS();

  // Operating Expense Allocation Method
  const [opexMethod, setOpexMethod] = useState<'revenue' | 'equal' | 'inventory'>('revenue');
  // Monthly Operating Costs of the Distribution (warehousing, fleet fuel, salaries, chilled storage electricity)
  const [totalMonthlyOpex, setTotalMonthlyOpex] = useState<number>(3800000); // 3.8 Million PKR

  // Calculate profitability and ROI metrics per pharmaceutical company
  const companyAnalytics = useMemo(() => {
    // Total sales across all companies
    const totalSalesAll = salesInvoices
      .filter(inv => inv.status !== 'Cancelled')
      .reduce((sum, inv) => sum + inv.netPayable, 0) || 1;

    // Total inventory investment across all companies
    const totalInventoryAll = batches.reduce(
      (sum, b) => sum + (b.availableQuantity * b.purchaseRate),
      0
    ) || 1;

    return companies.map(company => {
      // 1. Stock Investment (Batches for this company at purchase cost)
      const companyBatches = batches.filter(b => b.companyId === company.id);
      const stockInvestment = companyBatches.reduce(
        (sum, b) => sum + (b.availableQuantity * b.purchaseRate),
        0
      );
      const stockPacks = companyBatches.reduce((sum, b) => sum + b.availableQuantity, 0);

      // 2. Sales Turnover for this company
      // Iterate through sales invoices and item lines belonging to this company's products
      let totalSales = 0;
      let totalCostOfGoodsSold = 0;

      salesInvoices
        .filter(inv => inv.status !== 'Cancelled')
        .forEach(inv => {
          inv.items.forEach(item => {
            const prod = products.find(p => p.id === item.productId);
            if (prod && prod.companyId === company.id) {
              const lineSales = item.netAmount;
              const lineCost = (prod.purchasePrice || (item.tradePrice * 0.89)) * (item.quantity + item.bonusQuantity);
              totalSales += lineSales;
              totalCostOfGoodsSold += lineCost;
            }
          });
        });

      // If no item-level data, fallback based on company commission / sales ratio
      if (totalSales === 0) {
        totalSales = company.salesTargetMonthly * 0.85; // baseline simulation
        totalCostOfGoodsSold = totalSales * (1 - (company.commissionPercentage / 100));
      }

      // 3. Gross Profit & Gross Margin %
      const grossProfit = Math.max(0, totalSales - totalCostOfGoodsSold);
      const grossMarginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : company.commissionPercentage;

      // 4. OPEX Allocation
      let allocatedOpex = 0;
      if (opexMethod === 'revenue') {
        const revShare = totalSales / totalSalesAll;
        allocatedOpex = totalMonthlyOpex * revShare;
      } else if (opexMethod === 'inventory') {
        const invShare = stockInvestment / totalInventoryAll;
        allocatedOpex = totalMonthlyOpex * invShare;
      } else {
        allocatedOpex = totalMonthlyOpex / Math.max(1, companies.length);
      }

      // 5. Net Profit & Net Margin %
      const netProfit = grossProfit - allocatedOpex;
      const netMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

      // 6. Annualized ROI % = (Net Profit * 12) / Stock Investment * 100
      const annualizedROI = stockInvestment > 0 ? ((netProfit * 12) / stockInvestment) * 100 : 0;

      // 7. Stock Turnover Ratio = Sales / Avg Stock Investment
      const stockTurnoverRatio = stockInvestment > 0 ? (totalSales / stockInvestment) : 0;
      const daysOfInventory = stockTurnoverRatio > 0 ? Math.round(365 / (stockTurnoverRatio * 12)) : 45;

      // 8. Classification
      let strategicRating = 'Performing Well';
      let ratingVariant: 'emerald' | 'amber' | 'indigo' | 'sky' = 'emerald';

      if (annualizedROI > 35 && netProfit > 0) {
        strategicRating = 'Star Performer';
        ratingVariant = 'emerald';
      } else if (totalSales > 8000000 && netProfit > 0) {
        strategicRating = 'Cash Cow';
        ratingVariant = 'indigo';
      } else if (stockTurnoverRatio < 0.6 || daysOfInventory > 60) {
        strategicRating = 'Capital Heavy';
        ratingVariant = 'amber';
      } else {
        strategicRating = 'Stable Return';
        ratingVariant = 'sky';
      }

      return {
        company,
        stockInvestment,
        stockPacks,
        totalSales,
        totalCostOfGoodsSold,
        grossProfit,
        grossMarginPercent,
        allocatedOpex,
        netProfit,
        netMarginPercent,
        annualizedROI,
        stockTurnoverRatio,
        daysOfInventory,
        strategicRating,
        ratingVariant
      };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [companies, products, batches, salesInvoices, opexMethod, totalMonthlyOpex]);

  // Totals for top cards
  const totalStockInvestment = companyAnalytics.reduce((s, c) => s + c.stockInvestment, 0);
  const totalMonthlySales = companyAnalytics.reduce((s, c) => s + c.totalSales, 0);
  const totalGrossProfit = companyAnalytics.reduce((s, c) => s + c.grossProfit, 0);
  const totalNetProfit = companyAnalytics.reduce((s, c) => s + c.netProfit, 0);
  const weightedROI = totalStockInvestment > 0 ? ((totalNetProfit * 12) / totalStockInvestment) * 100 : 0;
  const overallGrossMargin = totalMonthlySales > 0 ? (totalGrossProfit / totalMonthlySales) * 100 : 0;

  const handleExportCSV = () => {
    const headers = [
      'Principal Company',
      'Code',
      'Stock Invested (PKR)',
      'Sales Turnover (PKR)',
      'Gross Profit (PKR)',
      'Gross Margin %',
      'Allocated OPEX (PKR)',
      'Net Profit (PKR)',
      'Net Margin %',
      'Annualized ROI %',
      'Days of Inventory (DOI)',
      'Classification'
    ];

    const rows = companyAnalytics.map(c => [
      `"${c.company.name}"`,
      c.company.shortCode,
      Math.round(c.stockInvestment),
      Math.round(c.totalSales),
      Math.round(c.grossProfit),
      c.grossMarginPercent.toFixed(2),
      Math.round(c.allocatedOpex),
      Math.round(c.netProfit),
      c.netMarginPercent.toFixed(2),
      c.annualizedROI.toFixed(1),
      c.daysOfInventory,
      c.strategicRating
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Company_Profitability_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Company-Wise Profitability & Investment Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate capital investment, stock rotation efficiency, net margin contribution, and annualized ROI per principal
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Analysis (CSV)</span>
          </button>
        </div>
      </div>

      {/* Top Level Financial Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Capital in Stock"
          value={`Rs. ${(totalStockInvestment / 1000000).toFixed(2)}M`}
          subValue="Inventory at manufacturer cost"
          icon={DollarSign}
        />
        <StatCard
          label="Monthly Sales Turnover"
          value={`Rs. ${(totalMonthlySales / 1000000).toFixed(2)}M`}
          subValue="Consolidated gross billings"
          icon={BarChart3}
        />
        <StatCard
          label="Overall Gross Margin"
          value={`${overallGrossMargin.toFixed(1)}%`}
          subValue={`Rs. ${(totalGrossProfit / 1000000).toFixed(2)}M GP`}
          icon={Percent}
        />
        <StatCard
          label="Net Distribution Profit"
          value={`Rs. ${(totalNetProfit / 1000000).toFixed(2)}M`}
          subValue={`After Rs. ${(totalMonthlyOpex / 1000000).toFixed(1)}M OPEX`}
          icon={TrendingUp}
        />
        <StatCard
          label="Weighted Annual ROI"
          value={`${weightedROI.toFixed(1)}%`}
          subValue="Net return on invested capital"
          icon={ArrowUpRight}
          trend="+4.8%"
          trendType="positive"
        />
      </div>

      {/* OPEX Model Selector Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">OPEX Allocation Model:</span>
          <span className="text-slate-400">Distribute monthly operating overheads across principals</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-md border border-slate-800">
            <button
              onClick={() => setOpexMethod('revenue')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                opexMethod === 'revenue'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sales Revenue %
            </button>
            <button
              onClick={() => setOpexMethod('inventory')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                opexMethod === 'inventory'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inventory Footprint %
            </button>
            <button
              onClick={() => setOpexMethod('equal')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                opexMethod === 'equal'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Equal Principal Split
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400">Total OPEX:</span>
            <input
              type="number"
              value={totalMonthlyOpex}
              onChange={e => setTotalMonthlyOpex(Number(e.target.value) || 0)}
              step="100000"
              className="w-28 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            Principal Profitability, Capital Employed & ROI Ranking
          </h2>
          <span className="text-[11px] text-slate-400">Sorted by Net Profit Contribution</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Principal Company</th>
                <th className="py-2.5 px-3 text-right">Capital Invested</th>
                <th className="py-2.5 px-3 text-right">Sales Turnover</th>
                <th className="py-2.5 px-3 text-right">Gross Profit</th>
                <th className="py-2.5 px-3 text-right">Gross Margin</th>
                <th className="py-2.5 px-3 text-right">Allocated OPEX</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-200">Net Profit</th>
                <th className="py-2.5 px-3 text-right font-bold text-emerald-400">Annual ROI</th>
                <th className="py-2.5 px-3 text-center">DOI</th>
                <th className="py-2.5 px-3 text-center">Strategic Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {companyAnalytics.map(row => {
                const isPositive = row.netProfit >= 0;
                return (
                  <tr key={row.company.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">
                          {row.company.shortCode}
                        </span>
                        <span>{row.company.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Commission: {row.company.commissionPercentage}% &bull; Terms: {row.company.paymentTermsDays} Days
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      Rs. {(row.stockInvestment / 1000000).toFixed(2)}M
                      <div className="text-[10px] text-slate-500 font-sans">
                        {row.stockPacks.toLocaleString()} packs
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                      Rs. {(row.totalSales / 1000000).toFixed(2)}M
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      Rs. {(row.grossProfit / 1000000).toFixed(2)}M
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {row.grossMarginPercent.toFixed(1)}%
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-400/80">
                      -Rs. {(row.allocatedOpex / 1000000).toFixed(2)}M
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        Rs. {(row.netProfit / 1000000).toFixed(2)}M
                      </span>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {row.netMarginPercent.toFixed(1)}% net
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        row.annualizedROI >= 30
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : row.annualizedROI >= 15
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {row.annualizedROI.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      <span title="Days of Inventory">{row.daysOfInventory} d</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge variant={row.ratingVariant}>
                        {row.strategicRating}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison: Capital Invested vs Monthly Net Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Capital Distribution Breakdown */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Capital Invested in Inventory by Principal
            </h3>
            <span className="text-[10px] text-slate-500">Valued at Purchase Rate</span>
          </div>

          <div className="space-y-2.5">
            {companyAnalytics.map(c => {
              const pct = (c.stockInvestment / (totalStockInvestment || 1)) * 100;
              return (
                <div key={c.company.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{c.company.name}</span>
                    <span className="font-mono text-slate-400">
                      Rs. {(c.stockInvestment / 1000000).toFixed(2)}M ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Annual ROI Ranking */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Annualized Return on Investment (ROI %)
            </h3>
            <span className="text-[10px] text-emerald-400">Target: &gt; 25%</span>
          </div>

          <div className="space-y-2.5">
            {companyAnalytics.map(c => {
              return (
                <div key={c.company.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{c.company.name}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {c.annualizedROI.toFixed(1)}% ROI
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.annualizedROI >= 30
                          ? 'bg-emerald-500'
                          : c.annualizedROI >= 15
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, c.annualizedROI))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
