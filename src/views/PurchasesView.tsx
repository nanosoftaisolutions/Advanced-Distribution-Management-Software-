import React, { useState } from 'react';
import { Plus, CheckCircle2, ShoppingCart, Truck, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { GoodsReceivingNote, PurchaseOrder } from '../types/pdms';

export const PurchasesView: React.FC = () => {
  const {
    companies,
    products,
    warehouses,
    purchaseOrders,
    grns,
    addGoodsReceivingNote,
    addPurchaseOrder,
    selectedCompanyFilter
  } = usePDMS();

  const [activeTab, setActiveTab] = useState<'grn' | 'po'>('grn');
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedGrnForDetails, setSelectedGrnForDetails] = useState<GoodsReceivingNote | null>(null);

  // New GRN Form State
  const [grnCompanyId, setGrnCompanyId] = useState(companies[0]?.id || '');
  const [grnWarehouseId, setGrnWarehouseId] = useState(warehouses[0]?.id || '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [freightCharges, setFreightCharges] = useState(0);

  interface DraftGrnItem {
    productId: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    receivedQuantity: number;
    bonusQuantity: number;
    damagedQuantity: number;
    purchaseRate: number;
  }

  const [grnItems, setGrnItems] = useState<DraftGrnItem[]>([
    {
      productId: products[0]?.id || '',
      batchNumber: `B-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      mfgDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      receivedQuantity: 500,
      bonusQuantity: 50,
      damagedQuantity: 0,
      purchaseRate: products[0]?.purchasePrice || 250
    }
  ]);

  // Handle PO submit
  const [poCompanyId, setPoCompanyId] = useState(companies[0]?.id || '');
  const [poExpectedDate, setPoExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [poRemarks, setPoRemarks] = useState('');

  const handleCreateGrn = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === grnCompanyId);
    if (!comp) return;

    let subTotal = 0;
    const computedItems = grnItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const lineCost = item.receivedQuantity * item.purchaseRate;
      subTotal += lineCost;

      return {
        id: `grni-${Date.now()}-${Math.random()}`,
        productId: item.productId,
        productName: prod?.name || 'Medicine',
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        receivedQuantity: item.receivedQuantity,
        bonusQuantity: item.bonusQuantity,
        damagedQuantity: item.damagedQuantity,
        purchaseRate: item.purchaseRate,
        tradePrice: prod?.tradePrice || item.purchaseRate * 1.15,
        netAmount: lineCost
      };
    });

    addGoodsReceivingNote({
      grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierInvoiceNumber,
      supplierInvoiceDate,
      companyId: comp.id,
      companyName: comp.name,
      warehouseId: grnWarehouseId,
      receivingDate: new Date().toISOString().split('T')[0],
      items: computedItems,
      subTotal,
      freightCharges,
      taxAmount: 0,
      netTotal: subTotal + freightCharges,
      remarks: 'Goods received and inspected for quality & expiry dates'
    });

    setIsGrnModalOpen(false);
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === poCompanyId);
    if (!comp) return;

    const companyProds = products.filter(p => p.companyId === comp.id);
    const selectedProd = companyProds[0] || products[0];

    addPurchaseOrder({
      poNumber: `PO-${comp.shortCode}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      companyId: comp.id,
      companyName: comp.name,
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poExpectedDate,
      items: [
        {
          id: `poi-${Date.now()}`,
          productId: selectedProd.id,
          productName: selectedProd.name,
          quantity: 1000,
          bonusExpected: 100,
          unitPrice: selectedProd.purchasePrice,
          totalPrice: 1000 * selectedProd.purchasePrice
        }
      ],
      totalAmount: 1000 * selectedProd.purchasePrice,
      status: 'Sent',
      remarks: poRemarks || 'Standard monthly replenishment'
    });

    setIsPoModalOpen(false);
  };

  // Filter based on global company
  const filteredGrns = grns.filter(
    g => selectedCompanyFilter === 'all' || g.companyId === selectedCompanyFilter
  );

  const filteredPos = purchaseOrders.filter(
    p => selectedCompanyFilter === 'all' || p.companyId === selectedCompanyFilter
  );

  const grnColumns: Column<GoodsReceivingNote>[] = [
    {
      header: 'GRN #',
      accessorKey: 'grnNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-emerald-400">{row.grnNumber}</span>
    },
    {
      header: 'Receiving Date',
      accessorKey: 'receivingDate',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.receivingDate}</span>
    },
    {
      header: 'Pharmaceutical Principal',
      accessorKey: 'companyName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.companyName}</span>
    },
    {
      header: 'Supplier Inv #',
      accessorKey: 'supplierInvoiceNumber',
      render: row => (
        <div>
          <span className="font-mono text-slate-300">{row.supplierInvoiceNumber}</span>
          <div className="text-[10px] text-slate-500">Dated: {row.supplierInvoiceDate}</div>
        </div>
      )
    },
    {
      header: 'Total Items',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          {row.items.length} products ({row.items.reduce((a, b) => a + b.receivedQuantity, 0)} units)
        </span>
      )
    },
    {
      header: 'Net Payable (PKR)',
      accessorKey: 'netTotal',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.netTotal.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => <Badge variant="emerald">{row.status}</Badge>
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedGrnForDetails(row)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
        >
          View GRN →
        </button>
      )
    }
  ];

  const poColumns: Column<PurchaseOrder>[] = [
    {
      header: 'PO #',
      accessorKey: 'poNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-sky-400">{row.poNumber}</span>
    },
    {
      header: 'PO Date',
      accessorKey: 'date',
      sortable: true,
      render: row => <span className="font-mono text-slate-300">{row.date}</span>
    },
    {
      header: 'Pharmaceutical Company',
      accessorKey: 'companyName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.companyName}</span>
    },
    {
      header: 'Expected Delivery',
      accessorKey: 'expectedDeliveryDate',
      render: row => <span className="font-mono text-slate-300">{row.expectedDeliveryDate}</span>
    },
    {
      header: 'Order Total (PKR)',
      accessorKey: 'totalAmount',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.totalAmount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => <Badge variant="sky">{row.status}</Badge>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Purchase & Stock Receiving (GRN)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage manufacturer purchase orders, goods receiving notes, batch onboarding, and supplier bill reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('grn')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'grn' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Goods Receiving Notes (GRN)
            </button>
            <button
              onClick={() => setActiveTab('po')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'po' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchase Orders (PO)
            </button>
          </div>

          {activeTab === 'grn' ? (
            <button
              onClick={() => setIsGrnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New GRN</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {activeTab === 'grn' ? (
        <DataTable
          columns={grnColumns}
          data={filteredGrns}
          searchPlaceholder="Search GRN by number, company, or supplier invoice..."
          searchFilterKeys={['grnNumber', 'companyName', 'supplierInvoiceNumber']}
          exportFilename="Goods_Receiving_Notes_Register"
        />
      ) : (
        <DataTable
          columns={poColumns}
          data={filteredPos}
          searchPlaceholder="Search purchase orders..."
          searchFilterKeys={['poNumber', 'companyName']}
          exportFilename="Purchase_Orders_Register"
        />
      )}

      {/* CREATE GRN MODAL */}
      <Modal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        title="Record Goods Receiving Note (GRN)"
        subtitle="Verify manufacturer consignment, record batch numbers & automatically onboard stock"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateGrn} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pharma Company *</label>
              <select
                value={grnCompanyId}
                onChange={e => setGrnCompanyId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Receiving Warehouse *</label>
              <select
                value={grnWarehouseId}
                onChange={e => setGrnWarehouseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Supplier Invoice # *</label>
              <input
                type="text"
                required
                placeholder="e.g., INV-GP-10928"
                value={supplierInvoiceNumber}
                onChange={e => setSupplierInvoiceNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Invoice Date</label>
              <input
                type="date"
                value={supplierInvoiceDate}
                onChange={e => setSupplierInvoiceDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Consignment Items */}
          <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3">Batch #</th>
                  <th className="py-2 px-3">Mfg Date</th>
                  <th className="py-2 px-3">Expiry Date</th>
                  <th className="py-2 px-3 w-20">Recv Qty</th>
                  <th className="py-2 px-3 w-20">Bonus Qty</th>
                  <th className="py-2 px-3 w-24">Purchase Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {grnItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3">
                      <select
                        value={item.productId}
                        onChange={e => {
                          const prod = products.find(p => p.id === e.target.value);
                          const updated = [...grnItems];
                          updated[idx] = {
                            ...updated[idx],
                            productId: e.target.value,
                            purchaseRate: prod?.purchasePrice || updated[idx].purchaseRate
                          };
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-xs"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].batchNumber = e.target.value;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={item.mfgDate}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].mfgDate = e.target.value;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].expiryDate = e.target.value;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.receivedQuantity}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].receivedQuantity = parseInt(e.target.value) || 0;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-center text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={item.bonusQuantity}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].bonusQuantity = parseInt(e.target.value) || 0;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-emerald-400 font-mono text-center text-xs"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.5"
                        value={item.purchaseRate}
                        onChange={e => {
                          const updated = [...grnItems];
                          updated[idx].purchaseRate = parseFloat(e.target.value) || 0;
                          setGrnItems(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-right text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-400 mr-2">Inbound Freight (PKR):</label>
              <input
                type="number"
                value={freightCharges}
                onChange={e => setFreightCharges(parseFloat(e.target.value) || 0)}
                className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsGrnModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm cursor-pointer"
              >
                Verify & Ingest to Stock
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* CREATE PO MODAL */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Issue Purchase Order to Manufacturer"
        subtitle="Order fresh pharmaceutical stock under contractual payment terms"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Pharma Principal</label>
            <select
              value={poCompanyId}
              onChange={e => setPoCompanyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={poExpectedDate}
              onChange={e => setPoExpectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Remarks & Order Notes</label>
            <textarea
              rows={3}
              placeholder="e.g., Cold chain temperature control mandatory on transit"
              value={poRemarks}
              onChange={e => setPoRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPoModalOpen(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold"
            >
              Dispatch Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW GRN DETAILS MODAL */}
      {selectedGrnForDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedGrnForDetails(null)}
          title={`Goods Receiving Note: ${selectedGrnForDetails.grnNumber}`}
          subtitle={`Supplier Invoice: ${selectedGrnForDetails.supplierInvoiceNumber} · Ingested by ${selectedGrnForDetails.verifiedBy}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Manufacturer:</span>
                <span className="font-semibold text-white">{selectedGrnForDetails.companyName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Receiving Date:</span>
                <span className="font-mono text-white">{selectedGrnForDetails.receivingDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Supplier Invoice Date:</span>
                <span className="font-mono text-white">{selectedGrnForDetails.supplierInvoiceDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <Badge variant="emerald">{selectedGrnForDetails.status}</Badge>
              </div>
            </div>

            <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="p-2">Product</th>
                  <th className="p-2">Batch #</th>
                  <th className="p-2">Expiry Date</th>
                  <th className="p-2 text-center">Recv Qty</th>
                  <th className="p-2 text-center">Bonus Qty</th>
                  <th className="p-2 text-right">Purchase Rate</th>
                  <th className="p-2 text-right">Net (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {selectedGrnForDetails.items.map(item => (
                  <tr key={item.id}>
                    <td className="p-2 font-semibold text-white">{item.productName}</td>
                    <td className="p-2 font-mono text-emerald-400">{item.batchNumber}</td>
                    <td className="p-2 font-mono text-slate-400">{item.expiryDate}</td>
                    <td className="p-2 font-mono text-center text-white">{item.receivedQuantity}</td>
                    <td className="p-2 font-mono text-center text-emerald-400">+{item.bonusQuantity}</td>
                    <td className="p-2 font-mono text-right text-slate-300">
                      Rs. {item.purchaseRate.toFixed(2)}
                    </td>
                    <td className="p-2 font-mono text-right font-bold text-white">
                      Rs. {item.netAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">
                Inbound Freight: Rs. {selectedGrnForDetails.freightCharges.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                Consignment Total: Rs. {selectedGrnForDetails.netTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
