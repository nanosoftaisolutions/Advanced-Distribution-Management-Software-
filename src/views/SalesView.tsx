import React, { useState, useMemo } from 'react';
import {
  Plus,
  Printer,
  Share2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  FileText,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { SalesInvoice, SalesInvoiceItem } from '../types/pdms';

interface SalesViewProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ isCreateOpen = false, onCloseCreate }) => {
  const {
    salesInvoices,
    customers,
    products,
    batches,
    warehouses,
    salesReps,
    companies,
    settings,
    currentUser,
    addSalesInvoice,
    cancelSalesInvoice,
    getFEFOBatchesForProduct,
    getCalculatedSchemeBonus,
    selectedCompanyFilter
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(isCreateOpen);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<SalesInvoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<SalesInvoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isThermalFormat, setIsThermalFormat] = useState(false);

  // New Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-central');
  const [paymentMethod, setPaymentMethod] = useState<'Credit' | 'Cash' | 'Bank Transfer' | 'Cheque'>('Credit');
  const [paidUpfront, setPaidUpfront] = useState(0);
  const [invoiceRemarks, setInvoiceRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Line items state
  interface DraftLineItem {
    productId: string;
    batchId: string;
    quantity: number;
    bonusQuantity: number;
    discountPercent: number;
    appliedSchemeName?: string;
  }

  const [lineItems, setLineItems] = useState<DraftLineItem[]>([
    {
      productId: products[0]?.id || '',
      batchId: '',
      quantity: 10,
      bonusQuantity: 0,
      discountPercent: 0
    }
  ]);

  // Sync external open request
  React.useEffect(() => {
    if (isCreateOpen) {
      setIsModalOpen(true);
    }
  }, [isCreateOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseCreate) onCloseCreate();
  };

  // Filter invoices based on global company filter
  const filteredInvoices = useMemo(() => {
    if (selectedCompanyFilter === 'all') return salesInvoices;
    return salesInvoices.filter(inv => inv.companyId === selectedCompanyFilter);
  }, [salesInvoices, selectedCompanyFilter]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Line item helpers
  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    // FEFO batch recommendation
    const fefoResult = getFEFOBatchesForProduct(prodId, 10);
    const recommendedBatch = fefoResult.allocatedBatches[0]?.batch;
    const scheme = getCalculatedSchemeBonus(prodId, 10);

    const updated = [...lineItems];
    updated[index] = {
      productId: prodId,
      batchId: recommendedBatch?.id || '',
      quantity: 10,
      bonusQuantity: scheme.bonusQty,
      discountPercent: scheme.discountPercent,
      appliedSchemeName: scheme.schemeName
    };
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const currentItem = lineItems[index];
    const scheme = getCalculatedSchemeBonus(currentItem.productId, qty);

    const updated = [...lineItems];
    updated[index] = {
      ...currentItem,
      quantity: qty,
      bonusQuantity: scheme.bonusQty,
      discountPercent: scheme.discountPercent || currentItem.discountPercent,
      appliedSchemeName: scheme.schemeName
    };
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    const fefo = getFEFOBatchesForProduct(firstProd.id, 10);
    const recBatch = fefo.allocatedBatches[0]?.batch;
    const scheme = getCalculatedSchemeBonus(firstProd.id, 10);

    setLineItems(prev => [
      ...prev,
      {
        productId: firstProd.id,
        batchId: recBatch?.id || '',
        quantity: 10,
        bonusQuantity: scheme.bonusQty,
        discountPercent: scheme.discountPercent,
        appliedSchemeName: scheme.schemeName
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations for current draft
  const draftCalculations = useMemo(() => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    const computedItems: SalesInvoiceItem[] = [];

    lineItems.forEach((line, idx) => {
      const prod = products.find(p => p.id === line.productId);
      const batchObj = batches.find(b => b.id === line.batchId);
      if (!prod || !batchObj) return;

      const lineGross = line.quantity * prod.tradePrice;
      const lineDisc = (lineGross * line.discountPercent) / 100;
      const lineGst = ((lineGross - lineDisc) * prod.gstPercent) / 100;
      const lineNet = lineGross - lineDisc + lineGst;

      subTotal += lineGross;
      totalDiscount += lineDisc;
      totalGst += lineGst;

      computedItems.push({
        id: `item-${idx}-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        genericName: prod.genericName,
        companyId: prod.companyId,
        batchId: batchObj.id,
        batchNumber: batchObj.batchNumber,
        expiryDate: batchObj.expiryDate,
        packSize: prod.packSize,
        quantity: line.quantity,
        bonusQuantity: line.bonusQuantity,
        mrp: prod.mrp,
        tradePrice: prod.tradePrice,
        discountPercentage: line.discountPercent,
        discountAmount: lineDisc,
        gstPercentage: prod.gstPercent,
        gstAmount: lineGst,
        netAmount: lineNet
      });
    });

    const netPayable = subTotal - totalDiscount + totalGst;
    const balanceDue = Math.max(0, netPayable - paidUpfront);

    return {
      computedItems,
      subTotal,
      totalDiscount,
      totalGst,
      netPayable,
      balanceDue
    };
  }, [lineItems, paidUpfront, products, batches]);

  // Submit invoice
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCustomerId) {
      setFormError('Please select a customer pharmacy or medical store.');
      return;
    }

    if (draftCalculations.computedItems.length === 0) {
      setFormError('Please configure at least one valid product line with batch.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    const repObj = salesReps.find(r => r.id === customerObj.salesRepId) || salesReps[0];
    const primaryCompany = draftCalculations.computedItems[0]?.companyId || 'comp-getz';

    // Due date (credit terms days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (customerObj.creditDays || 30));

    const invoiceData: Omit<SalesInvoice, 'id' | 'createdAt' | 'createdBy'> = {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: customerObj.id,
      customerName: customerObj.name,
      customerStoreName: customerObj.storeName,
      customerLicense: customerObj.drugSaleLicenseNumber,
      customerNtn: customerObj.ntn,
      companyId: primaryCompany,
      salesRepId: repObj?.id || '',
      salesRepName: repObj?.name || 'Unassigned',
      territory: customerObj.territory,
      warehouseId: selectedWarehouseId,
      items: draftCalculations.computedItems,
      subTotal: draftCalculations.subTotal,
      totalDiscount: draftCalculations.totalDiscount,
      totalGst: draftCalculations.totalGst,
      netPayable: draftCalculations.netPayable,
      paidAmount: paidUpfront,
      balanceDue: draftCalculations.balanceDue,
      paymentMethod,
      dueDate: dueDate.toISOString().split('T')[0],
      status: draftCalculations.balanceDue <= 0 ? 'Paid' : paidUpfront > 0 ? 'Partially Paid' : 'Unpaid',
      remarks: invoiceRemarks
    };

    const res = addSalesInvoice(invoiceData);
    if (!res.success) {
      setFormError(res.error || 'Failed to generate sales invoice.');
      return;
    }

    handleCloseModal();
    if (res.invoice) {
      setSelectedInvoiceForPrint(res.invoice);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalInvoice || !cancelReason.trim()) return;
    cancelSalesInvoice(cancelModalInvoice.id, cancelReason);
    setCancelModalInvoice(null);
    setCancelReason('');
  };

  const handleShareWhatsApp = (inv: SalesInvoice) => {
    const text = `*SHAHEEN PHARMA LOGISTICS & DISTRIBUTION*
*Invoice #:* ${inv.invoiceNumber}
*Customer:* ${inv.customerStoreName}
*Date:* ${inv.date}
*Due Date:* ${inv.dueDate}
*Net Payable:* Rs. ${inv.netPayable.toLocaleString()}
*Status:* ${inv.status}
--------------------------------
Thank you for your business. For queries, contact +92 42 35920110.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Table Columns
  const columns: Column<SalesInvoice>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      sortable: true,
      render: row => (
        <span className="font-mono font-semibold text-emerald-400">{row.invoiceNumber}</span>
      )
    },
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.date}</span>
    },
    {
      header: 'Pharmacy / Store',
      accessorKey: 'customerStoreName',
      sortable: true,
      render: row => (
        <div>
          <div className="font-medium text-white">{row.customerStoreName}</div>
          <div className="text-[10px] text-slate-500 font-mono">DSL: {row.customerLicense}</div>
        </div>
      )
    },
    {
      header: 'Territory / Rep',
      accessorKey: 'territory',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-300">{row.territory}</span>
          <div className="text-[10px] text-slate-500">{row.salesRepName}</div>
        </div>
      )
    },
    {
      header: 'Items',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          {row.items.length} items ({row.items.reduce((a, b) => a + b.quantity, 0)} units)
        </span>
      )
    },
    {
      header: 'Net Payable (PKR)',
      accessorKey: 'netPayable',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.netPayable.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Balance Due',
      accessorKey: 'balanceDue',
      align: 'right',
      render: row => (
        <span
          className={`font-mono tabular-nums ${
            row.balanceDue > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'
          }`}
        >
          Rs. {row.balanceDue.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => {
        const variants: { [key: string]: 'emerald' | 'amber' | 'rose' | 'slate' } = {
          Paid: 'emerald',
          'Partially Paid': 'amber',
          Unpaid: 'rose',
          Cancelled: 'slate'
        };
        return <Badge variant={variants[row.status] || 'slate'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: row => (
        <div className="flex items-center justify-end gap-1.5 no-print">
          <button
            onClick={() => setSelectedInvoiceForPrint(row)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="View & Print Invoice"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleShareWhatsApp(row)}
            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {row.status !== 'Cancelled' && (
            <button
              onClick={() => setCancelModalInvoice(row)}
              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Cancel Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Sales & Distribution Invoices</h2>
            <Badge variant="emerald">Strict FEFO</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Create Drug Act 1976 compliant sales invoices with automatic FEFO batch allocation and customer credit limits
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError('');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Invoices Data Grid */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search invoices by number, pharmacy or customer..."
        searchFilterKeys={['invoiceNumber', 'customerStoreName', 'customerName', 'salesRepName']}
        exportFilename="Sales_Invoices_Register"
      />

      {/* CREATE NEW SALES INVOICE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Generate Pharmaceutical Sales Invoice"
        subtitle="Automatic FEFO batch allocation with DRAP & Drug Act compliance"
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmitInvoice} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Customer & Warehouse Selector Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            {/* Customer Select */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer Pharmacy / Store *
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Retail Pharmacy or Hospital --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.storeName} ({c.city} - {c.territory}) · Bal: Rs. {c.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>DSL: <strong className="text-slate-300">{selectedCustomer.drugSaleLicenseNumber}</strong></span>
                  <span>NTN: <strong className="text-slate-300">{selectedCustomer.ntn || 'N/A'}</strong></span>
                  <span>
                    Credit Limit:{' '}
                    <strong className="text-slate-300">
                      Rs. {selectedCustomer.creditLimit.toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    Current Balance:{' '}
                    <strong
                      className={
                        selectedCustomer.currentBalance > selectedCustomer.creditLimit
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }
                    >
                      Rs. {selectedCustomer.currentBalance.toLocaleString()}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Warehouse Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dispatch Warehouse *
              </label>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Product Lines (FEFO Batches)
              </h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Allocated Batch (FEFO)</th>
                    <th className="py-2 px-3 w-20">Qty</th>
                    <th className="py-2 px-3 w-20">Bonus/Free</th>
                    <th className="py-2 px-3 w-24">TP (Rs.)</th>
                    <th className="py-2 px-3 w-20">Disc %</th>
                    <th className="py-2 px-3 text-right">Net (Rs.)</th>
                    <th className="py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lineItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    const prodBatches = batches.filter(
                      b => b.productId === item.productId && b.availableQuantity > 0 && b.status !== 'Expired'
                    );

                    const lineGross = item.quantity * (prod?.tradePrice || 0);
                    const lineNet = lineGross * (1 - item.discountPercent / 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        {/* Product selection */}
                        <td className="py-2 px-3">
                          <select
                            value={item.productId}
                            onChange={e => handleProductChange(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.packSize})
                              </option>
                            ))}
                          </select>
                          {item.appliedSchemeName && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{item.appliedSchemeName}</span>
                            </div>
                          )}
                        </td>

                        {/* Batch selection */}
                        <td className="py-2 px-3">
                          <select
                            value={item.batchId}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[idx].batchId = e.target.value;
                              setLineItems(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                          >
                            {prodBatches.length > 0 ? (
                              prodBatches.map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.batchNumber} (Exp: {b.expiryDate} · Avail: {b.availableQuantity})
                                </option>
                              ))
                            ) : (
                              <option value="">No Active Stock Batches!</option>
                            )}
                          </select>
                        </td>

                        {/* Qty */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleQuantityChange(idx, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs text-center font-mono"
                          />
                        </td>

                        {/* Bonus Free */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            value={item.bonusQuantity}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[idx].bonusQuantity = Math.max(0, parseInt(e.target.value) || 0);
                              setLineItems(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-emerald-400 text-xs text-center font-mono"
                          />
                        </td>

                        {/* Trade Price */}
                        <td className="py-2 px-3 font-mono text-slate-300">
                          {prod ? prod.tradePrice.toLocaleString() : '0'}
                        </td>

                        {/* Disc % */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={item.discountPercent}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[idx].discountPercent = Math.max(0, parseFloat(e.target.value) || 0);
                              setLineItems(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs text-center font-mono"
                          />
                        </td>

                        {/* Line Net */}
                        <td className="py-2 px-3 text-right font-mono font-semibold text-white">
                          Rs. {lineNet.toLocaleString()}
                        </td>

                        {/* Remove */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            disabled={lineItems.length === 1}
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-slate-500 hover:text-rose-400 disabled:opacity-20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms & Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Credit', 'Cash', 'Bank Transfer', 'Cheque'] as const).map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Cash' || paymentMethod === 'Bank Transfer' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Upfront Received Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={draftCalculations.netPayable}
                    value={paidUpfront}
                    onChange={e => setPaidUpfront(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Authorized by regional manager; delivery route van-02"
                  value={invoiceRemarks}
                  onChange={e => setInvoiceRemarks(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Gross Trade Total:</span>
                <span className="font-mono tabular-nums">
                  Rs. {draftCalculations.subTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Scheme & Trade Discounts:</span>
                <span className="font-mono tabular-nums text-rose-400">
                  - Rs. {draftCalculations.totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax / GST:</span>
                <span className="font-mono tabular-nums">
                  Rs. {draftCalculations.totalGst.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>Net Payable:</span>
                <span className="font-mono tabular-nums text-emerald-400">
                  Rs. {draftCalculations.netPayable.toLocaleString()}
                </span>
              </div>
              {paidUpfront > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Upfront Paid:</span>
                  <span className="font-mono tabular-nums text-sky-400">
                    Rs. {paidUpfront.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Balance Due:</span>
                <span className="font-mono tabular-nums">
                  Rs. {draftCalculations.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Post & Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW & PRINT OFFICIAL INVOICE MODAL (A4 & THERMAL) */}
      {selectedInvoiceForPrint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoiceForPrint(null)}
          title={`Sales Invoice: ${selectedInvoiceForPrint.invoiceNumber}`}
          subtitle="Drug Act 1976 / DRAP Compliant Pharmaceutical Tax Invoice"
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsThermalFormat(prev => !prev)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer ${
                    isThermalFormat
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isThermalFormat ? 'Thermal Receipt (80mm)' : 'Standard A4 Invoice'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(selectedInvoiceForPrint)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-medium cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Share</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          }
        >
          <div
            className={`bg-white text-slate-900 rounded-lg p-6 shadow-md ${
              isThermalFormat ? 'max-w-sm mx-auto font-mono text-[11px]' : 'text-xs'
            }`}
          >
            {/* INVOICE HEADER */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
                    {settings.distributionName}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Pharmaceutical Distributors & Supply Chain Logistics
                  </p>
                  <p className="text-[11px] text-slate-600">{settings.distributionAddress}</p>
                  <p className="text-[11px] text-slate-600">
                    Ph: {settings.phone} · Email: {settings.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs mb-1">
                    SALES INVOICE
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900">
                    {selectedInvoiceForPrint.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Date: <strong className="font-mono">{selectedInvoiceForPrint.date}</strong>
                  </div>
                </div>
              </div>

              {/* License Strip */}
              <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-700 font-mono bg-slate-50 p-2 rounded">
                <div>
                  Dist. License: <strong>{settings.distributorDrugLicense}</strong>
                </div>
                <div>
                  NTN: <strong>{settings.ntn}</strong>
                </div>
                <div>
                  STRN: <strong>{settings.strn}</strong>
                </div>
                <div>
                  Payment: <strong>{selectedInvoiceForPrint.paymentMethod}</strong>
                </div>
              </div>
            </div>

            {/* CUSTOMER & INVOICE META */}
            <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Billed To (Retailer / Hospital):</div>
                <div className="font-bold text-sm text-slate-950 mt-0.5">
                  {selectedInvoiceForPrint.customerStoreName}
                </div>
                <div className="text-slate-700">Attn: {selectedInvoiceForPrint.customerName}</div>
                <div className="font-mono text-slate-700">
                  Drug Sale License (DSL): <strong>{selectedInvoiceForPrint.customerLicense}</strong>
                </div>
                {selectedInvoiceForPrint.customerNtn && (
                  <div className="font-mono text-slate-700">
                    Customer NTN: <strong>{selectedInvoiceForPrint.customerNtn}</strong>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Order Details:</div>
                <div className="text-slate-700">
                  Territory: <strong>{selectedInvoiceForPrint.territory}</strong>
                </div>
                <div className="text-slate-700">
                  Sales Representative: <strong>{selectedInvoiceForPrint.salesRepName}</strong>
                </div>
                <div className="text-slate-700">
                  Payment Due Date: <strong className="font-mono">{selectedInvoiceForPrint.dueDate}</strong>
                </div>
                <div className="text-slate-700">
                  Status:{' '}
                  <span className="font-semibold uppercase text-emerald-700">
                    {selectedInvoiceForPrint.status}
                  </span>
                </div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="w-full border-collapse mb-4 text-xs">
              <thead>
                <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-900 font-semibold text-[11px]">
                  <th className="py-2 px-1 text-left">#</th>
                  <th className="py-2 px-2 text-left">Product Name & Generic</th>
                  <th className="py-2 px-2 text-left">Batch #</th>
                  <th className="py-2 px-2 text-left">Expiry</th>
                  <th className="py-2 px-1 text-center">Pack</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-1 text-center">Free</th>
                  <th className="py-2 px-2 text-right">TP (Rs.)</th>
                  <th className="py-2 px-1 text-right">Disc %</th>
                  <th className="py-2 px-2 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedInvoiceForPrint.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2 px-1 text-slate-500 font-mono">{index + 1}</td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-slate-950">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.genericName}</div>
                    </td>
                    <td className="py-2 px-2 font-mono font-semibold text-slate-800">
                      {item.batchNumber}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="py-2 px-1 text-center text-slate-600">{item.packSize}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-950">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-1 text-center font-mono text-emerald-700 font-bold">
                      {item.bonusQuantity > 0 ? `+${item.bonusQuantity}` : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">
                      {item.tradePrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-1 text-right font-mono">
                      {item.discountPercentage > 0 ? `${item.discountPercentage}%` : '0%'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold tabular-nums text-slate-950">
                      {item.netAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS & STATUTORY WARRANTY */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-slate-900">
              {/* Drugs Act Warranty */}
              <div className="border border-slate-300 p-2.5 rounded text-[10px] text-slate-600 leading-relaxed bg-slate-50">
                <div className="font-bold text-slate-800 mb-1 uppercase">
                  Statutory Warranty (Drugs Act 1976 / DRAP Rules):
                </div>
                "We hereby give this warranty that the drugs specified and contained in this invoice do not contravene the provisions of Section 23 of the Drugs Act, 1976."
                <div className="mt-2 text-[9px] text-slate-500">
                  Goods once sold will only be accepted for return as per company expiry policy.
                </div>
              </div>

              {/* Numerical Totals */}
              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Total:</span>
                  <span className="font-mono tabular-nums">
                    Rs. {selectedInvoiceForPrint.subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Discount:</span>
                  <span className="font-mono tabular-nums text-rose-700">
                    - Rs. {selectedInvoiceForPrint.totalDiscount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax:</span>
                  <span className="font-mono tabular-nums">
                    Rs. {selectedInvoiceForPrint.totalGst.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between text-sm font-bold text-slate-950">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono tabular-nums text-emerald-800">
                    Rs. {selectedInvoiceForPrint.netPayable.toLocaleString()}
                  </span>
                </div>
                {selectedInvoiceForPrint.paidAmount > 0 && (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Paid Upfront:</span>
                    <span className="font-mono tabular-nums">
                      Rs. {selectedInvoiceForPrint.paidAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-xs">
                  <span>Balance Due:</span>
                  <span className="font-mono tabular-nums">
                    Rs. {selectedInvoiceForPrint.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                <span>Prepared By (Billing Officer)</span>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                <span>Checked & Dispatched By</span>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                <span>Customer Signature & Stamp</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CANCEL INVOICE CONFIRMATION MODAL */}
      {cancelModalInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setCancelModalInvoice(null)}
          title="Confirm Invoice Cancellation"
          subtitle={`Invoice #${cancelModalInvoice.invoiceNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Are you sure you want to cancel Invoice <strong>{cancelModalInvoice.invoiceNumber}</strong> for{' '}
              <strong>{cancelModalInvoice.customerStoreName}</strong>?
            </p>
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded text-amber-300">
              Cancellation will automatically return <strong>{cancelModalInvoice.items.length} line items</strong> back to stock batches and reverse customer ledger balance.
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify valid reason for audit trail..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalInvoice(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
