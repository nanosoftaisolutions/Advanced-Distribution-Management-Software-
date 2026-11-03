import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  Printer,
  Share2,
  CheckCircle2,
  Users,
  Boxes,
  FileText,
  Phone,
  ArrowRight
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { ProductRecall, ProductRecallAffectedCustomer } from '../types/pdms';

export const ProductRecallView: React.FC = () => {
  const {
    productRecalls,
    companies,
    products,
    batches,
    initiateProductRecall,
    updateCustomerRecallStatus,
    settings
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecallDetails, setSelectedRecallDetails] = useState<ProductRecall | null>(null);

  // New Recall Form State
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [drapRefNumber, setDrapRefNumber] = useState('DRAP/QA/NOTIF-2026-');
  const [severity, setSeverity] = useState<ProductRecall['severity']>('Class II (Temporary Risk)');
  const [reason, setReason] = useState('');

  // Customer Return Input in Details Modal
  const [customerReturnId, setCustomerReturnId] = useState<string>('');
  const [customerReturnQty, setCustomerReturnQty] = useState<number>(0);

  const handleInitiateRecall = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === companyId);
    const prod = products.find(p => p.id === productId);
    if (!comp || !prod || !batchNumber.trim() || !reason.trim()) return;

    const newRecall = initiateProductRecall({
      recallNumber: `REC-${comp.shortCode}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      drapRefNumber,
      companyId: comp.id,
      companyName: comp.name,
      productId: prod.id,
      productName: prod.name,
      batchNumber: batchNumber.toUpperCase().trim(),
      recallDate: new Date().toISOString().split('T')[0],
      severity,
      reason,
      status: 'Active Recall',
      initiatedBy: 'Muhammad Tariq Chaudhry (Distribution Manager)'
    });

    setIsModalOpen(false);
    setSelectedRecallDetails(newRecall);
  };

  const handleUpdateCustomerReturn = (recallId: string, customerId: string, currentSupplied: number) => {
    const qty = customerReturnQty || currentSupplied;
    updateCustomerRecallStatus(recallId, customerId, qty, 'Stock Recovered');
    setCustomerReturnId('');
    setCustomerReturnQty(0);
    // Refresh local selected state
    const refreshed = productRecalls.find(r => r.id === recallId);
    if (refreshed) setSelectedRecallDetails(refreshed);
  };

  const handleSendWhatsAppRecallNotice = (customer: ProductRecallAffectedCustomer, recall: ProductRecall) => {
    const text = `*URGENT: DRAP STATUTORY MEDICINE RECALL NOTICE*
*To:* ${customer.customerStoreName}
*From:* ${settings.distributionName}
*Regulatory Order:* ${recall.drapRefNumber}
----------------------------------------
*Product:* ${recall.productName}
*Batch:* ${recall.batchNumber}
*Supplied on Inv:* ${customer.invoiceNumber} (${customer.suppliedQuantity} units)
*Recall Severity:* ${recall.severity}
*Mandatory Action:* Please quarantine all remaining units immediately. Our delivery representative will collect these units for full credit replacement.
----------------------------------------
Contact Distribution Recall Cell: ${settings.phone}`;

    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(customer.phone)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const columns: Column<ProductRecall>[] = [
    {
      header: 'Recall Ref #',
      accessorKey: 'recallNumber',
      sortable: true,
      render: row => <span className="font-mono font-bold text-rose-400">{row.recallNumber}</span>
    },
    {
      header: 'DRAP Order #',
      accessorKey: 'drapRefNumber',
      render: row => <span className="font-mono text-slate-300 text-xs">{row.drapRefNumber}</span>
    },
    {
      header: 'Product & Recalled Batch',
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.productName}</div>
          <div className="text-[10px] text-slate-400">
            Batch: <span className="font-mono font-bold text-rose-400">{row.batchNumber}</span> · {row.companyName}
          </div>
        </div>
      )
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      render: row => (
        <Badge variant={row.severity.includes('Class I') ? 'rose' : 'amber'}>
          {row.severity.split(' ')[0]} {row.severity.split(' ')[1]}
        </Badge>
      )
    },
    {
      header: 'Warehouse Quarantined',
      accessorKey: 'blockedInWarehouseQty',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-rose-400 tabular-nums">
          {row.blockedInWarehouseQty} units
        </span>
      )
    },
    {
      header: 'Retail Traced (Supplied)',
      align: 'right',
      render: row => (
        <div className="font-mono tabular-nums text-right">
          <span className="text-white font-semibold">{row.totalDistributedQty} units</span>
          <div className="text-[10px] text-slate-400">{row.affectedCustomers.length} stores</div>
        </div>
      )
    },
    {
      header: 'Recovered',
      align: 'right',
      render: row => (
        <span className="font-mono font-bold text-emerald-400 tabular-nums">
          {row.totalRecoveredQty} units
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => (
        <Badge variant={row.status === 'Completed & Reported' ? 'emerald' : 'rose'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Traceability Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedRecallDetails(row)}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
        >
          Trace & Recover →
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">DRAP Statutory Product Recall Engine</h2>
            <Badge variant="rose">Statutory Quality Mandate</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Emergency drug quarantine, automated invoice-level pharmacy recipient tracing, WhatsApp regulatory notice dispatch, and return certificates
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Product Recall</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={productRecalls}
        searchPlaceholder="Search recalls by batch, product or DRAP reference..."
        searchFilterKeys={['recallNumber', 'drapRefNumber', 'batchNumber', 'productName', 'companyName']}
        exportFilename="DRAP_Product_Recalls_Register"
      />

      {/* INITIATE RECALL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate DRAP-Mandated Product Recall"
        subtitle="Immediately block stock across warehouses and scan invoice history to trace recipient pharmacies"
        maxWidth="2xl"
      >
        <form onSubmit={handleInitiateRecall} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Manufacturer *</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Formulation *</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.strength})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Affected Batch Number *</label>
              <input
                type="text"
                required
                placeholder="e.g., B-PAN50-23Z"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">DRAP Ref / Government Notification *</label>
              <input
                type="text"
                required
                placeholder="e.g., DRAP/QA/FBR-7712/2026"
                value={drapRefNumber}
                onChange={e => setDrapRefNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Recall Classification *</label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as ProductRecall['severity'])}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold"
            >
              <option value="Class I (Critical Health Hazard)">
                Class I (Critical - Reasonable probability of serious adverse health consequences)
              </option>
              <option value="Class II (Temporary Risk)">
                Class II (Temporary or medically reversible adverse health consequences)
              </option>
              <option value="Class III (Defective Labeling/Packaging)">
                Class III (Not likely to cause adverse health consequences; technical/label defect)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Statutory Cause / Lab Findings *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g., Provincial Drug Testing Laboratory reported dissolution assay standard deviation..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            />
          </div>

          <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Executing this recall will immediately lock any matching batch stock in warehouses into quarantined status, preventing new invoices, and compile an exhaustive list of all retail pharmacies that purchased this batch.
            </span>
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
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold cursor-pointer shadow-sm"
            >
              Lock Batch & Trace Customers
            </button>
          </div>
        </form>
      </Modal>

      {/* RECALL DETAILS & CUSTOMER TRACEABILITY DOSSIER */}
      {selectedRecallDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRecallDetails(null)}
          title={`DRAP Recall Traceability Dossier: ${selectedRecallDetails.recallNumber}`}
          subtitle={`Batch: ${selectedRecallDetails.batchNumber} (${selectedRecallDetails.productName}) · Order: ${selectedRecallDetails.drapRefNumber}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-400 text-xs">
                Initiated by: {selectedRecallDetails.initiatedBy} on {selectedRecallDetails.recallDate}
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print DRAP Recall Report</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Warehouse Quarantined</span>
                <span className="text-base font-bold text-rose-400">
                  {selectedRecallDetails.blockedInWarehouseQty} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Retail Distributed</span>
                <span className="text-base font-bold text-white">
                  {selectedRecallDetails.totalDistributedQty} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Stock Recovered</span>
                <span className="text-base font-bold text-emerald-400">
                  {selectedRecallDetails.totalRecoveredQty} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Recovery Rate</span>
                <span className="text-base font-bold text-sky-400">
                  {selectedRecallDetails.totalDistributedQty > 0
                    ? Math.round(
                        (selectedRecallDetails.totalRecoveredQty /
                          selectedRecallDetails.totalDistributedQty) *
                          100
                      )
                    : 100}
                  %
                </span>
              </div>
            </div>

            {/* Recipient Pharmacies Traceability Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Traced Recipient Medical Stores & Pharmacies ({selectedRecallDetails.affectedCustomers.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Auto-scanned from historical sales invoices
                </span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <tr className="border-b border-slate-800">
                      <th className="p-2">Pharmacy Store</th>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2 text-right">Supplied</th>
                      <th className="p-2 text-right">Returned</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {selectedRecallDetails.affectedCustomers.length > 0 ? (
                      selectedRecallDetails.affectedCustomers.map(cust => (
                        <tr key={cust.customerId} className="hover:bg-slate-800/40">
                          <td className="p-2">
                            <div className="font-semibold text-white font-sans">{cust.customerStoreName}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{cust.customerName}</div>
                          </td>
                          <td className="p-2 text-slate-300">{cust.invoiceNumber}</td>
                          <td className="p-2 text-slate-400">{cust.phone}</td>
                          <td className="p-2 text-right text-white font-bold">{cust.suppliedQuantity}</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">
                            {cust.returnedQuantity}
                          </td>
                          <td className="p-2 text-center">
                            <Badge
                              variant={
                                cust.notificationStatus === 'Stock Recovered'
                                  ? 'emerald'
                                  : cust.notificationStatus.includes('Notified')
                                  ? 'sky'
                                  : 'amber'
                              }
                            >
                              {cust.notificationStatus}
                            </Badge>
                          </td>
                          <td className="p-2 text-right space-x-1 font-sans">
                            <button
                              onClick={() => handleSendWhatsAppRecallNotice(cust, selectedRecallDetails)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-700/60 rounded text-[10px] font-semibold cursor-pointer"
                              title="Send WhatsApp Notice"
                            >
                              WhatsApp
                            </button>
                            {cust.returnedQuantity < cust.suppliedQuantity && (
                              <button
                                onClick={() =>
                                  handleUpdateCustomerReturn(
                                    selectedRecallDetails.id,
                                    cust.customerId,
                                    cust.suppliedQuantity
                                  )
                                }
                                className="px-2 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-700/60 rounded text-[10px] font-semibold cursor-pointer"
                              >
                                Mark Recovered
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">
                          No retail pharmacy invoices found for this batch (batch remains 100% inside warehouse).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
