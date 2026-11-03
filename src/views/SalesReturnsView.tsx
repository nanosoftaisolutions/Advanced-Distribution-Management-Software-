import React, { useState } from 'react';
import { Plus, RotateCcw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { SalesReturn } from '../types/pdms';

export const SalesReturnsView: React.FC = () => {
  const { salesReturns, customers, products, salesInvoices, addSalesReturn } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [condition, setCondition] = useState<'Saleable' | 'Damaged' | 'Expired'>('Saleable');
  const [remarks, setRemarks] = useState('');

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === customerId);
    const prod = products.find(p => p.id === productId);
    if (!cust || !prod || quantity <= 0) return;

    const totalAmount = quantity * prod.tradePrice;
    const creditNoteNum = `CRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    addSalesReturn({
      returnNumber: `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: invoiceNumber || 'MANUAL-RET',
      customerId: cust.id,
      customerName: cust.storeName,
      companyId: prod.companyId,
      returnDate,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          batchNumber: batchNumber || 'BATCH-RTN-01',
          expiryDate: '2027-12-31',
          quantity,
          tradePrice: prod.tradePrice,
          amount: totalAmount,
          condition
        }
      ],
      totalAmount,
      creditNoteNumber: creditNoteNum,
      status: 'Inspected & Approved',
      remarks
    });

    setIsModalOpen(false);
  };

  const columns: Column<SalesReturn>[] = [
    {
      header: 'Return #',
      accessorKey: 'returnNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-rose-400">{row.returnNumber}</span>
    },
    {
      header: 'Return Date',
      accessorKey: 'returnDate',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.returnDate}</span>
    },
    {
      header: 'Customer Pharmacy',
      accessorKey: 'customerName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.customerName}</span>
    },
    {
      header: 'Original Invoice',
      accessorKey: 'invoiceNumber',
      render: row => <span className="font-mono text-slate-400">{row.invoiceNumber || 'Manual'}</span>
    },
    {
      header: 'Products & Condition',
      render: row => (
        <div className="text-xs">
          {row.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="text-slate-200">
                {item.productName} ({item.quantity} units)
              </span>
              <Badge variant={item.condition === 'Saleable' ? 'emerald' : 'amber'}>
                {item.condition}
              </Badge>
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Credit Note Amount',
      accessorKey: 'totalAmount',
      align: 'right',
      sortable: true,
      render: row => (
        <div className="font-mono tabular-nums text-right">
          <span className="font-bold text-emerald-400">Rs. {row.totalAmount.toLocaleString()}</span>
          <div className="text-[10px] text-slate-500 font-mono">{row.creditNoteNumber}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Sales Returns & Credit Notes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process customer medicine returns, conduct physical inspection (saleable vs damaged), restore stock and issue credit notes
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Process Sales Return</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={salesReturns}
        searchPlaceholder="Search sales returns by customer, credit note or invoice..."
        searchFilterKeys={['returnNumber', 'customerName', 'creditNoteNumber', 'invoiceNumber']}
        exportFilename="Sales_Returns_Register"
      />

      {/* PROCESS RETURN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Customer Sales Return"
        subtitle="Physically inspect returned drug cartons and generate customer credit note"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Store *</label>
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.storeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Original Invoice #</label>
              <input
                type="text"
                placeholder="e.g., INV-2026-00491"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Returned *</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} · TP: Rs. {p.tradePrice}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g., B-RSK20-24A"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Return Quantity (Units)</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Physical Inspection Condition *</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as 'Saleable' | 'Damaged' | 'Expired')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-semibold"
              >
                <option value="Saleable">Saleable (Restores back to Active Stock)</option>
                <option value="Damaged">Damaged / Broken (Route to Quarantine)</option>
                <option value="Expired">Near Expiry / Expired (Route to Company Claim)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Return Reason</label>
            <input
              type="text"
              placeholder="e.g., Customer over-ordered; sealed carton returned"
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
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold cursor-pointer"
            >
              Accept Return & Credit Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
