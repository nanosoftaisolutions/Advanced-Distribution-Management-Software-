import React, { useState } from 'react';
import { Plus, FileBadge, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { CompanyClaim } from '../types/pdms';

export const ClaimsView: React.FC = () => {
  const { claims, companies, products, batches, addCompanyClaim, updateClaimStatus, selectedCompanyFilter } =
    usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<CompanyClaim | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // New Claim Form State
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [claimType, setClaimType] = useState<CompanyClaim['claimType']>('Expiry Return');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [claimAmount, setClaimAmount] = useState(15000);
  const [supportingDocRef, setSupportingDocRef] = useState('DRAP-INSP-2026-081');
  const [remarks, setRemarks] = useState('');

  const filteredClaims = claims.filter(
    c => selectedCompanyFilter === 'all' || c.companyId === selectedCompanyFilter
  );

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === companyId);
    const prod = products.find(p => p.id === productId);
    if (!comp) return;

    addCompanyClaim({
      claimNumber: `CLM-${comp.shortCode}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      companyId: comp.id,
      companyName: comp.name,
      claimType,
      submissionDate: new Date().toISOString().split('T')[0],
      productId: prod?.id,
      productName: prod?.name,
      batchNumber: batchNumber || 'BATCH-SAMPLE-01',
      quantity,
      claimAmount,
      status: 'Submitted',
      settledAmount: 0,
      supportingDocRef,
      remarks
    });

    setIsModalOpen(false);
  };

  const handleSettleClaim = () => {
    if (!selectedClaimForAction) return;
    updateClaimStatus(selectedClaimForAction.id, 'Settled', settleAmount || selectedClaimForAction.claimAmount);
    setSelectedClaimForAction(null);
  };

  const columns: Column<CompanyClaim>[] = [
    {
      header: 'Claim Ref #',
      accessorKey: 'claimNumber',
      sortable: true,
      render: row => <span className="font-mono font-semibold text-rose-400">{row.claimNumber}</span>
    },
    {
      header: 'Manufacturer',
      accessorKey: 'companyName',
      sortable: true,
      render: row => <span className="font-semibold text-white">{row.companyName}</span>
    },
    {
      header: 'Claim Type',
      accessorKey: 'claimType',
      render: row => <Badge variant="amber">{row.claimType}</Badge>
    },
    {
      header: 'Product & Batch',
      render: row => (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">{row.productName || 'General Claim'}</div>
          {row.batchNumber && (
            <div className="text-[10px] text-slate-400 font-mono">
              Batch: {row.batchNumber} ({row.quantity} units)
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Claim Amount',
      accessorKey: 'claimAmount',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.claimAmount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Settled Amount',
      accessorKey: 'settledAmount',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-emerald-400 font-semibold">
          Rs. {row.settledAmount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      render: row => {
        const variants: { [k: string]: 'emerald' | 'amber' | 'rose' | 'slate' | 'sky' } = {
          Submitted: 'sky',
          'Under Review': 'amber',
          Approved: 'emerald',
          Settled: 'emerald',
          Rejected: 'rose',
          Draft: 'slate'
        };
        return <Badge variant={variants[row.status] || 'slate'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Action',
      align: 'right',
      render: row =>
        row.status !== 'Settled' ? (
          <button
            onClick={() => {
              setSelectedClaimForAction(row);
              setSettleAmount(row.claimAmount);
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Settle Claim →
          </button>
        ) : (
          <span className="text-slate-500 text-xs">Settled</span>
        )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Company Claims & Credit Note Tracking</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage manufacturer claims for near-expiry, expired drugs, breakage, promotional schemes & price variance
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>File Company Claim</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={filteredClaims}
        searchPlaceholder="Search claims by ref number or company..."
        searchFilterKeys={['claimNumber', 'companyName', 'productName']}
        exportFilename="Company_Claims_Register"
      />

      {/* FILE CLAIM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Manufacturer Claim"
        subtitle="Submit formal claim for expired stock, damage or scheme units under distribution contract"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pharmaceutical Principal *</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
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
              <label className="block text-slate-300 font-medium mb-1">Claim Type *</label>
              <select
                value={claimType}
                onChange={e => setClaimType(e.target.value as CompanyClaim['claimType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="Expiry Return">Expiry Return</option>
                <option value="Damaged Goods">Damaged Goods</option>
                <option value="Breakage">Transit Breakage</option>
                <option value="Promotional / Scheme">Promotional / Scheme Bonus Claim</option>
                <option value="Short Supply">Short Supply / Invoicing Discrepancy</option>
                <option value="Price Difference">Price Difference Claim</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g., B-PAN50-23Z"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Claim Units / Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Total Claim Amount (PKR) *</label>
              <input
                type="number"
                step="100"
                required
                value={claimAmount}
                onChange={e => setClaimAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-rose-400 font-mono font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Inspection / Regulatory Ref</label>
            <input
              type="text"
              placeholder="e.g., DRAP-EXP-INSPECT-7712"
              value={supportingDocRef}
              onChange={e => setSupportingDocRef(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-xs"
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
              Submit Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* SETTLE CLAIM MODAL */}
      {selectedClaimForAction && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClaimForAction(null)}
          title={`Settle Claim: ${selectedClaimForAction.claimNumber}`}
          subtitle={`Company: ${selectedClaimForAction.companyName} · Original Amount: Rs. ${selectedClaimForAction.claimAmount.toLocaleString()}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Confirm settlement received via manufacturer Credit Note for this claim.
            </p>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Credit Note Settled Amount (PKR) *
              </label>
              <input
                type="number"
                step="100"
                value={settleAmount}
                onChange={e => setSettleAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-mono font-bold text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedClaimForAction(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettleClaim}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold cursor-pointer"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
