import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Warehouse,
  Boxes,
  Calendar,
  AlertCircle,
  Eye
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { StockTransfer } from '../types/pdms';

export const StockTransfersView: React.FC = () => {
  const {
    stockTransfers,
    addStockTransfer,
    receiveStockTransfer,
    warehouses,
    products,
    batches,
    currentUser
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransferForPrint, setSelectedTransferForPrint] = useState<StockTransfer | null>(null);

  // Form State
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || 'wh-central');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(warehouses[1]?.id || 'wh-isb');
  const [remarks, setRemarks] = useState('');
  
  // Line items state
  const [transferLines, setTransferLines] = useState<
    { productId: string; productName: string; batchNumber: string; expiryDate: string; quantity: number; availableInSource: number }[]
  >([]);

  // Item selector in form
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [itemQty, setItemQty] = useState<number>(50);

  // Filter available batches located in the source warehouse
  const availableBatchesInSource = useMemo(() => {
    return batches.filter(
      b => b.warehouseId === sourceWarehouseId && b.availableQuantity > 0 && b.status === 'Active'
    );
  }, [batches, sourceWarehouseId]);

  const handleAddLine = () => {
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return;
    const prod = products.find(p => p.id === batch.productId);
    if (!prod) return;
    if (itemQty <= 0 || itemQty > batch.availableQuantity) return;

    // Check if batch already added
    const existingIndex = transferLines.findIndex(l => l.batchNumber === batch.batchNumber);
    if (existingIndex >= 0) {
      const updated = [...transferLines];
      updated[existingIndex].quantity = Math.min(batch.availableQuantity, updated[existingIndex].quantity + itemQty);
      setTransferLines(updated);
    } else {
      setTransferLines([
        ...transferLines,
        {
          productId: prod.id,
          productName: prod.name,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: itemQty,
          availableInSource: batch.availableQuantity
        }
      ]);
    }

    // Reset item input
    setSelectedBatchId('');
    setItemQty(50);
  };

  const handleRemoveLine = (idx: number) => {
    setTransferLines(transferLines.filter((_, i) => i !== idx));
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceWarehouseId === destinationWarehouseId) {
      alert('Source and destination warehouses cannot be the same!');
      return;
    }
    if (transferLines.length === 0) {
      alert('Please add at least one medicine batch to transfer.');
      return;
    }

    const srcWh = warehouses.find(w => w.id === sourceWarehouseId);
    const destWh = warehouses.find(w => w.id === destinationWarehouseId);

    const transferNumber = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    addStockTransfer({
      transferNumber,
      date: new Date().toISOString().slice(0, 10),
      sourceWarehouseId,
      sourceWarehouseName: srcWh?.name || 'Source Warehouse',
      destinationWarehouseId,
      destinationWarehouseName: destWh?.name || 'Destination Warehouse',
      items: transferLines.map(l => ({
        productId: l.productId,
        productName: l.productName,
        batchNumber: l.batchNumber,
        expiryDate: l.expiryDate,
        quantity: l.quantity
      })),
      status: 'Dispatched',
      dispatchedBy: currentUser.name,
      remarks: remarks.trim() || 'Inter-warehouse inventory balancing'
    });

    setIsModalOpen(false);
    setTransferLines([]);
    setRemarks('');
  };

  const handleConfirmReceipt = (transferId: string) => {
    if (confirm('Confirm receipt of transfer at destination warehouse? Stocks will be immediately updated.')) {
      receiveStockTransfer(transferId);
    }
  };

  // Stats
  const totalTransfersCount = stockTransfers.length;
  const inTransitCount = stockTransfers.filter(t => t.status === 'Dispatched').length;
  const receivedCount = stockTransfers.filter(t => t.status === 'Received').length;
  const totalPacksMoved = stockTransfers.reduce(
    (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            Inter-Warehouse & Inter-Branch Stock Transfers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch, track, and acknowledge inventory movements between central hubs, cold vaults, and regional sub-depots
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Transfers"
          value={totalTransfersCount}
          subValue="All recorded movements"
          icon={ArrowLeftRight}
        />
        <StatCard
          label="In Transit / Dispatched"
          value={inTransitCount}
          subValue="Awaiting destination GRN"
          icon={Truck}
        />
        <StatCard
          label="Received & Reconciled"
          value={receivedCount}
          subValue="Stock merged in depot"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Packs Relocated"
          value={totalPacksMoved.toLocaleString()}
          subValue="Inter-branch volume"
          icon={Boxes}
        />
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            Stock Transfer Register & Gate Pass History
          </h2>
          <span className="text-[11px] text-slate-400">Total {stockTransfers.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Transfer #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Source Facility</th>
                <th className="py-2.5 px-3">Destination Facility</th>
                <th className="py-2.5 px-3">Items & Batches</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Dispatched / Received By</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stockTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                    No stock transfers recorded yet.
                  </td>
                </tr>
              ) : (
                stockTransfers.map(trf => {
                  const totalQty = trf.items.reduce((s, it) => s + it.quantity, 0);
                  const isDispatched = trf.status === 'Dispatched';

                  return (
                    <tr key={trf.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-white">
                        {trf.transferNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {trf.date}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200">{trf.sourceWarehouseName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-400">{trf.destinationWarehouseName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-medium">
                          {trf.items.length} Product Line(s) &bull; {totalQty.toLocaleString()} Packs
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {trf.items.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            trf.status === 'Received'
                              ? 'emerald'
                              : trf.status === 'Dispatched'
                              ? 'amber'
                              : 'rose'
                          }
                        >
                          {trf.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="text-[11px]">{trf.dispatchedBy}</div>
                        {trf.receivedBy && (
                          <div className="text-[10px] text-emerald-400">
                            Rcvd by: {trf.receivedBy}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDispatched && (
                            <button
                              onClick={() => handleConfirmReceipt(trf.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Mark as Received at Destination Warehouse"
                            >
                              Receive
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransferForPrint(trf)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Print Transfer Gate Pass"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Stock Transfer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Inter-Warehouse Stock Transfer"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          {/* Source and Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Source Warehouse (From) *</label>
              <select
                value={sourceWarehouseId}
                onChange={e => {
                  setSourceWarehouseId(e.target.value);
                  setTransferLines([]); // clear lines if source warehouse changes
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Destination Warehouse (To) *</label>
              <select
                value={destinationWarehouseId}
                onChange={e => setDestinationWarehouseId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                {warehouses
                  .filter(w => w.id !== sourceWarehouseId)
                  .map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.city})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Add Batch Line Selector */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Select Batch from Source Facility
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-8">
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Medicine Batch to Dispatch --</option>
                  {availableBatchesInSource.map(b => {
                    const prod = products.find(p => p.id === b.productId);
                    return (
                      <option key={b.id} value={b.id}>
                        {prod?.name || b.productId} &bull; Batch: {b.batchNumber} (Avail: {b.availableQuantity} packs) &bull; Exp: {b.expiryDate}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={itemQty}
                  onChange={e => setItemQty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium cursor-pointer"
                >
                  + Add Line
                </button>
              </div>
            </div>

            {/* Added lines list */}
            {transferLines.length > 0 && (
              <div className="mt-2 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2.5">Product</th>
                      <th className="py-1.5 px-2.5">Batch</th>
                      <th className="py-1.5 px-2.5">Expiry</th>
                      <th className="py-1.5 px-2.5 text-right">Transfer Qty</th>
                      <th className="py-1.5 px-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transferLines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2.5 font-medium text-white">{line.productName}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-300">{line.batchNumber}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-400">{line.expiryDate}</td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-400">{line.quantity}</td>
                        <td className="py-2 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="text-xs">
            <label className="block text-slate-400 mb-1">Transfer Remarks / Bilty / Vehicle Number</label>
            <input
              type="text"
              placeholder="e.g. Dispatched via Suzuki Bolan (LES-2024), driver Muhammad Ramzan"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferLines.length === 0}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded cursor-pointer"
            >
              Dispatch Stock Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Print Transfer Gate Pass / Bilty */}
      {selectedTransferForPrint && (
        <Modal
          isOpen={!!selectedTransferForPrint}
          onClose={() => setSelectedTransferForPrint(null)}
          title={`Inter-Depot Stock Transfer Gate Pass (${selectedTransferForPrint.transferNumber})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 p-2 font-sans text-xs">
            <div className="border-b border-slate-700 pb-3 text-center">
              <h2 className="text-base font-bold text-white uppercase">Shaheen Pharma Distribution Ltd.</h2>
              <div className="text-slate-400 text-[11px]">Inter-Warehouse Stock Transfer Delivery Challan / Gate Pass</div>
              <div className="font-mono text-emerald-400 font-bold mt-1">Pass #: {selectedTransferForPrint.transferNumber}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Source Facility</span>
                <span className="font-semibold text-white block">{selectedTransferForPrint.sourceWarehouseName}</span>
                <span className="text-slate-400 text-[10px]">Date: {selectedTransferForPrint.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Destination Facility</span>
                <span className="font-semibold text-emerald-400 block">{selectedTransferForPrint.destinationWarehouseName}</span>
                <span className="text-slate-400 text-[10px]">Status: {selectedTransferForPrint.status}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2">Batch #</th>
                    <th className="p-2">Expiry</th>
                    <th className="p-2 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedTransferForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-white">{it.productName}</td>
                      <td className="p-2 font-mono text-slate-300">{it.batchNumber}</td>
                      <td className="p-2 font-mono text-slate-400">{it.expiryDate}</td>
                      <td className="p-2 text-right font-mono font-bold text-white">{it.quantity} Packs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Remarks / Bilty: {selectedTransferForPrint.remarks || 'Standard transfer'}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800 text-center text-xs">
              <div>
                <div className="h-8 border-b border-dashed border-slate-700 w-3/4 mx-auto mb-1"></div>
                <span className="text-slate-400">Dispatched By: {selectedTransferForPrint.dispatchedBy}</span>
              </div>
              <div>
                <div className="h-8 border-b border-dashed border-slate-700 w-3/4 mx-auto mb-1"></div>
                <span className="text-slate-400">Received By: {selectedTransferForPrint.receivedBy || '(Pending Destination Receipt)'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setSelectedTransferForPrint(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Gate Pass</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
