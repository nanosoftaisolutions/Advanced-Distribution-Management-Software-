import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Calendar,
  Warehouse as WarehouseIcon,
  ShieldAlert
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StockBatch } from '../types/pdms';

export const InventoryView: React.FC = () => {
  const {
    batches,
    products,
    companies,
    warehouses,
    addStockAdjustment,
    addNewBatch,
    selectedCompanyFilter,
    settings
  } = usePDMS();

  const [filterMode, setFilterMode] = useState<'all' | 'near-expiry' | 'expired' | 'active'>('all');
  const [adjustBatch, setAdjustBatch] = useState<StockBatch | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);

  // New Batch Form State
  const [batchProductId, setBatchProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchWarehouseId, setBatchWarehouseId] = useState(warehouses[0]?.id || '');
  const [rackShelf, setRackShelf] = useState('A-01-01');
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [initialQty, setInitialQty] = useState(500);

  // Filter batches
  const filteredBatches = useMemo(() => {
    let result = batches;
    if (selectedCompanyFilter !== 'all') {
      result = result.filter(b => b.companyId === selectedCompanyFilter);
    }

    const now = new Date().getTime();
    if (filterMode === 'near-expiry') {
      result = result.filter(b => {
        const diffDays = Math.ceil((new Date(b.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= settings.nearExpiryThresholdDays && b.availableQuantity > 0;
      });
    } else if (filterMode === 'expired') {
      result = result.filter(b => {
        const diffDays = Math.ceil((new Date(b.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 0 || b.status === 'Expired';
      });
    } else if (filterMode === 'active') {
      result = result.filter(b => b.status === 'Active' && b.availableQuantity > 0);
    }

    return result;
  }, [batches, selectedCompanyFilter, filterMode, settings.nearExpiryThresholdDays]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch || adjustmentDelta === 0 || !adjustmentReason.trim()) return;
    addStockAdjustment(adjustBatch.id, adjustmentDelta, adjustmentReason);
    setAdjustBatch(null);
    setAdjustmentDelta(0);
    setAdjustmentReason('');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === batchProductId);
    if (!prod) return;

    addNewBatch({
      batchNumber: batchNumber.toUpperCase() || `B-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: prod.id,
      companyId: prod.companyId,
      warehouseId: batchWarehouseId,
      rackShelf,
      mfgDate,
      expiryDate,
      purchaseRate: prod.purchasePrice,
      sellingRate: prod.tradePrice,
      initialQuantity: initialQty,
      availableQuantity: initialQty,
      reservedQuantity: 0,
      damagedQuantity: 0,
      status: 'Active'
    });

    setIsNewBatchModalOpen(false);
    setBatchNumber('');
  };

  const columns: Column<StockBatch>[] = [
    {
      header: 'Batch Number',
      accessorKey: 'batchNumber',
      sortable: true,
      render: row => (
        <span className="font-mono font-semibold text-emerald-400">{row.batchNumber}</span>
      )
    },
    {
      header: 'Product & Generic',
      render: row => {
        const prod = products.find(p => p.id === row.productId);
        const comp = companies.find(c => c.id === row.companyId);
        return (
          <div>
            <div className="font-semibold text-white">{prod?.name || 'Medicine'}</div>
            <div className="text-[10px] text-slate-400">
              {prod?.genericName} · <span className="text-emerald-400">{comp?.shortCode}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Warehouse & Rack',
      render: row => {
        const wh = warehouses.find(w => w.id === row.warehouseId);
        return (
          <div className="text-xs">
            <span className="text-slate-300">{wh?.code || 'Central'}</span>
            <div className="text-[10px] text-slate-500 font-mono">Rack: {row.rackShelf}</div>
          </div>
        );
      }
    },
    {
      header: 'Mfg Date',
      accessorKey: 'mfgDate',
      sortable: true,
      render: row => <span className="font-mono text-slate-400">{row.mfgDate}</span>
    },
    {
      header: 'Expiry Date',
      accessorKey: 'expiryDate',
      sortable: true,
      render: row => {
        const now = new Date().getTime();
        const diffDays = Math.ceil((new Date(row.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
        const isExp = diffDays <= 0;
        const isNear = diffDays > 0 && diffDays <= 90;

        return (
          <div>
            <span
              className={`font-mono font-semibold ${
                isExp ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {row.expiryDate}
            </span>
            <div className="text-[10px] font-mono text-slate-500">
              {isExp ? 'EXPIRED' : `${diffDays} days left`}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Available Stock',
      accessorKey: 'availableQuantity',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums text-sm">
          {row.availableQuantity.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Trade Rate (TP)',
      accessorKey: 'sellingRate',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          Rs. {row.sellingRate.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Valuation (PKR)',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums font-semibold text-emerald-400">
          Rs. {(row.availableQuantity * row.sellingRate).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => {
        const variants: { [k: string]: 'emerald' | 'amber' | 'rose' | 'slate' } = {
          Active: 'emerald',
          'Near Expiry': 'amber',
          Expired: 'rose',
          Quarantined: 'slate'
        };
        return <Badge variant={variants[row.status] || 'slate'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => {
            setAdjustBatch(row);
            setAdjustmentDelta(0);
            setAdjustmentReason('');
          }}
          className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
        >
          Adjust Stock
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Batch Inventory & FEFO Engine</h2>
            <Badge variant="indigo">First Expiry First Out</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time batch-wise inventory tracking, expiry monitoring, warehouse racks, and stock reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter segment */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Batches
            </button>
            <button
              onClick={() => setFilterMode('near-expiry')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'near-expiry'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-600/50'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Near Expiry (≤90d)
            </button>
            <button
              onClick={() => setFilterMode('expired')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterMode === 'expired'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-600/50'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Expired / Quarantine
            </button>
          </div>

          <button
            onClick={() => setIsNewBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <DataTable
        columns={columns}
        data={filteredBatches}
        searchPlaceholder="Search batches by batch number, product or company..."
        searchFilterKeys={['batchNumber', 'rackShelf']}
        exportFilename="Batches_Master_Register"
      />

      {/* ADJUST STOCK MODAL */}
      {adjustBatch && (
        <Modal
          isOpen={true}
          onClose={() => setAdjustBatch(null)}
          title={`Stock Adjustment: Batch ${adjustBatch.batchNumber}`}
          subtitle="Record physical stock reconciliation or warehouse damage with audit logging"
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Current Available Quantity:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {adjustBatch.availableQuantity.toLocaleString()} units
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expiry Date:</span>
                <span className="font-mono text-slate-300">{adjustBatch.expiryDate}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Quantity Delta (e.g. +50 for surplus, -20 for breakage) *
              </label>
              <input
                type="number"
                required
                value={adjustmentDelta}
                onChange={e => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Projected New Balance:{' '}
                <strong className="text-emerald-400 font-mono">
                  {Math.max(0, adjustBatch.availableQuantity + adjustmentDelta)} units
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Authorized Reason for Adjustment *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g., Physical cycle count variance approved by Warehouse Manager"
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAdjustBatch(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustmentDelta === 0 || !adjustmentReason.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-semibold cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE BATCH MODAL */}
      <Modal
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        title="Add Pharmaceutical Stock Batch"
        subtitle="Register incoming batch with manufacturing and expiration details"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Product *</label>
            <select
              value={batchProductId}
              onChange={e => setBatchProductId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.strength}) · TP: Rs. {p.tradePrice}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Batch Number *</label>
              <input
                type="text"
                required
                placeholder="e.g., B-RSK-26A"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Rack Location</label>
              <input
                type="text"
                value={rackShelf}
                onChange={e => setRackShelf(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Mfg Date</label>
              <input
                type="date"
                value={mfgDate}
                onChange={e => setMfgDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Initial Qty</label>
              <input
                type="number"
                min="1"
                value={initialQty}
                onChange={e => setInitialQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Warehouse *</label>
            <select
              value={batchWarehouseId}
              onChange={e => setBatchWarehouseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewBatchModalOpen(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
