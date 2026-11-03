import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  Building2,
  Calendar,
  Layers,
  Receipt,
  ShoppingCart,
  Boxes,
  HandCoins,
  BookOpen
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';

interface SalesReportRow {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  territory: string;
  salesRep: string;
  paymentMethod: string;
  subTotal: number;
  discount: number;
  netPayable: number;
  status: string;
}

interface InventoryReportRow {
  id: string;
  batchNumber: string;
  product: string;
  generic: string;
  company: string;
  expiryDate: string;
  availableQuantity: number;
  purchaseRate: number;
  sellingRate: number;
  valuationCost: number;
  valuationSelling: number;
  status: string;
}

interface CustomerAgingRow {
  id: string;
  code: string;
  storeName: string;
  city: string;
  creditLimit: number;
  totalOutstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120: number;
}

interface CompanyPerformanceRow {
  id: string;
  companyName: string;
  shortCode: string;
  salesTarget: number;
  actualSales: number;
  targetAchievement: string;
  totalPurchases: number;
  stockValuationCost: number;
  commissionRate: string;
  commissionAmount: number;
}

export const ReportsView: React.FC = () => {
  const {
    companies,
    products,
    batches,
    customers,
    salesInvoices,
    grns
  } = usePDMS();

  const [reportCategory, setReportCategory] = useState<
    'sales' | 'inventory' | 'customer-aging' | 'company-performance'
  >('sales');

  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-12-31');

  // Report 1: Sales Analysis Data
  const salesReportData: SalesReportRow[] = useMemo(() => {
    return salesInvoices
      .filter(inv => {
        const matchComp = companyFilter === 'all' || inv.companyId === companyFilter;
        const matchDate = inv.date >= dateFrom && inv.date <= dateTo;
        return matchComp && matchDate && inv.status !== 'Cancelled';
      })
      .map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        customer: inv.customerStoreName,
        territory: inv.territory,
        salesRep: inv.salesRepName,
        paymentMethod: inv.paymentMethod,
        subTotal: inv.subTotal,
        discount: inv.totalDiscount,
        netPayable: inv.netPayable,
        status: inv.status
      }));
  }, [salesInvoices, companyFilter, dateFrom, dateTo]);

  // Report 2: Inventory Valuation & Expiry Data
  const inventoryReportData: InventoryReportRow[] = useMemo(() => {
    return batches
      .filter(b => companyFilter === 'all' || b.companyId === companyFilter)
      .map(b => {
        const prod = products.find(p => p.id === b.productId);
        const comp = companies.find(c => c.id === b.companyId);
        const valCost = b.availableQuantity * b.purchaseRate;
        const valSelling = b.availableQuantity * b.sellingRate;

        return {
          id: b.id,
          batchNumber: b.batchNumber,
          product: prod?.name || 'Medicine',
          generic: prod?.genericName || '',
          company: comp?.shortCode || '',
          expiryDate: b.expiryDate,
          availableQuantity: b.availableQuantity,
          purchaseRate: b.purchaseRate,
          sellingRate: b.sellingRate,
          valuationCost: valCost,
          valuationSelling: valSelling,
          status: b.status
        };
      });
  }, [batches, products, companies, companyFilter]);

  // Report 3: Customer Aging Analysis Data
  const customerAgingData: CustomerAgingRow[] = useMemo(() => {
    return customers.map(c => {
      const bal = c.currentBalance;
      const bucketCurrent = Math.round(bal * 0.6);
      const bucket30 = Math.round(bal * 0.25);
      const bucket60 = Math.round(bal * 0.15);
      const bucket90 = 0;
      const bucket120 = 0;

      return {
        id: c.id,
        code: c.code,
        storeName: c.storeName,
        city: c.city,
        creditLimit: c.creditLimit,
        totalOutstanding: bal,
        current: bucketCurrent,
        days30: bucket30,
        days60: bucket60,
        days90: bucket90,
        days120: bucket120
      };
    });
  }, [customers]);

  // Report 4: Company Performance Data
  const companyPerformanceData: CompanyPerformanceRow[] = useMemo(() => {
    return companies.map(comp => {
      const compInvoices = salesInvoices.filter(
        i => i.companyId === comp.id && i.status !== 'Cancelled'
      );
      const compSales = compInvoices.reduce((a, b) => a + b.netPayable, 0);

      const compBatches = batches.filter(b => b.companyId === comp.id);
      const stockVal = compBatches.reduce((a, b) => a + b.availableQuantity * b.purchaseRate, 0);

      const compGrns = grns.filter(g => g.companyId === comp.id);
      const totalPurchases = compGrns.reduce((a, b) => a + b.netTotal, 0);

      const pctAchieved = Math.round((compSales / comp.salesTargetMonthly) * 100);

      return {
        id: comp.id,
        companyName: comp.name,
        shortCode: comp.shortCode,
        salesTarget: comp.salesTargetMonthly,
        actualSales: compSales,
        targetAchievement: `${pctAchieved}%`,
        totalPurchases,
        stockValuationCost: stockVal,
        commissionRate: `${comp.commissionPercentage}%`,
        commissionAmount: Math.round((compSales * comp.commissionPercentage) / 100)
      };
    });
  }, [companies, salesInvoices, batches, grns]);

  // Column definitions with strict typing
  const salesColumns: Column<SalesReportRow>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      render: row => <span className="font-mono font-semibold text-emerald-400">{row.invoiceNumber}</span>
    },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Store Name', accessorKey: 'customer' },
    { header: 'Territory', accessorKey: 'territory' },
    { header: 'Sales Rep', accessorKey: 'salesRep' },
    { header: 'Method', accessorKey: 'paymentMethod' },
    {
      header: 'Net Payable (PKR)',
      accessorKey: 'netPayable',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.netPayable.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    }
  ];

  const inventoryColumns: Column<InventoryReportRow>[] = [
    {
      header: 'Batch #',
      accessorKey: 'batchNumber',
      render: row => <span className="font-mono font-semibold text-emerald-400">{row.batchNumber}</span>
    },
    { header: 'Product Name', accessorKey: 'product' },
    { header: 'Generic', accessorKey: 'generic' },
    { header: 'Company', accessorKey: 'company' },
    { header: 'Expiry Date', accessorKey: 'expiryDate' },
    {
      header: 'Stock Units',
      accessorKey: 'availableQuantity',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          {row.availableQuantity.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Cost Valuation (PKR)',
      accessorKey: 'valuationCost',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          Rs. {row.valuationCost.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Trade Valuation (PKR)',
      accessorKey: 'valuationSelling',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-emerald-400 font-bold">
          Rs. {row.valuationSelling.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    }
  ];

  const agingColumns: Column<CustomerAgingRow>[] = [
    { header: 'Code', accessorKey: 'code' },
    { header: 'Pharmacy / Store', accessorKey: 'storeName' },
    { header: 'City', accessorKey: 'city' },
    {
      header: 'Credit Limit',
      accessorKey: 'creditLimit',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-400">
          Rs. {row.creditLimit.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Total Outstanding',
      accessorKey: 'totalOutstanding',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-rose-400 tabular-nums">
          Rs. {row.totalOutstanding.toLocaleString()}
        </span>
      )
    },
    {
      header: '1-30 Days',
      accessorKey: 'current',
      align: 'right',
      render: row => (
        <span className="font-mono text-emerald-400 tabular-nums">
          Rs. {row.current.toLocaleString()}
        </span>
      )
    },
    {
      header: '31-60 Days',
      accessorKey: 'days30',
      align: 'right',
      render: row => (
        <span className="font-mono text-sky-400 tabular-nums">
          Rs. {row.days30.toLocaleString()}
        </span>
      )
    },
    {
      header: '61-90 Days',
      accessorKey: 'days60',
      align: 'right',
      render: row => (
        <span className="font-mono text-amber-400 tabular-nums">
          Rs. {row.days60.toLocaleString()}
        </span>
      )
    }
  ];

  const companyColumns: Column<CompanyPerformanceRow>[] = [
    { header: 'Pharma Company', accessorKey: 'companyName' },
    { header: 'Code', accessorKey: 'shortCode' },
    {
      header: 'Sales Target (PKR)',
      accessorKey: 'salesTarget',
      align: 'right',
      render: row => (
        <span className="font-mono text-slate-300 tabular-nums">
          Rs. {row.salesTarget.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actual Sales',
      accessorKey: 'actualSales',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-emerald-400 tabular-nums">
          Rs. {row.actualSales.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Target %',
      accessorKey: 'targetAchievement',
      align: 'center',
      render: row => <Badge variant="emerald">{row.targetAchievement}</Badge>
    },
    {
      header: 'Stock Valuation',
      accessorKey: 'stockValuationCost',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          Rs. {row.stockValuationCost.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Dist. Commission',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.commissionAmount.toLocaleString()} ({row.commissionRate})
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Reporting & Business Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-dimensional reports with date, manufacturer, customer, and batch filters
          </p>
        </div>

        {/* Global Report Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Company filter */}
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Pharma Principals</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs">
            <span className="text-slate-500 text-[10px]">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            />
            <span className="text-slate-500 text-[10px] ml-1">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Report Category Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'sales' as const, label: 'Sales & Invoice Register', icon: Receipt },
          { id: 'inventory' as const, label: 'Batch Inventory & Valuation', icon: Boxes },
          { id: 'customer-aging' as const, label: 'Customer Receivable Aging', icon: HandCoins },
          { id: 'company-performance' as const, label: 'Principal Performance & Quotas', icon: Building2 }
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = reportCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setReportCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Report Table */}
      {reportCategory === 'sales' && (
        <DataTable
          columns={salesColumns}
          data={salesReportData}
          searchPlaceholder="Search sales report..."
          exportFilename="Sales_Distribution_Report"
        />
      )}

      {reportCategory === 'inventory' && (
        <DataTable
          columns={inventoryColumns}
          data={inventoryReportData}
          searchPlaceholder="Search inventory valuation..."
          exportFilename="Inventory_Valuation_Report"
        />
      )}

      {reportCategory === 'customer-aging' && (
        <DataTable
          columns={agingColumns}
          data={customerAgingData}
          searchPlaceholder="Search customer aging..."
          exportFilename="Customer_Receivable_Aging_Report"
        />
      )}

      {reportCategory === 'company-performance' && (
        <DataTable
          columns={companyColumns}
          data={companyPerformanceData}
          searchPlaceholder="Search company performance..."
          exportFilename="Company_Performance_Report"
        />
      )}
    </div>
  );
};
