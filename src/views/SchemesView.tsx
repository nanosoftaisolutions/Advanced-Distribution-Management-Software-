import React, { useState } from 'react';
import { Plus, Sparkles, Gift, Tag, CheckCircle2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { PromotionalScheme } from '../types/pdms';

export const SchemesView: React.FC = () => {
  const { schemes, companies, products, addScheme, selectedCompanyFilter } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [schemeName, setSchemeName] = useState('');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [schemeType, setSchemeType] = useState<PromotionalScheme['schemeType']>('Buy X Get Y Free');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [buyQuantity, setBuyQuantity] = useState(10);
  const [freeQuantity, setFreeQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const filteredSchemes = schemes.filter(
    s => selectedCompanyFilter === 'all' || s.companyId === selectedCompanyFilter
  );

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === companyId);
    const prod = products.find(p => p.id === productId);
    if (!comp || !prod) return;

    addScheme({
      schemeName,
      companyId: comp.id,
      companyName: comp.name,
      schemeType,
      productId: prod.id,
      productName: prod.name,
      buyQuantity,
      freeQuantity,
      discountPercent: schemeType === 'Percentage Slab' ? discountPercent : undefined,
      startDate,
      endDate,
      isActive: true
    });

    setIsModalOpen(false);
    setSchemeName('');
  };

  const columns: Column<PromotionalScheme>[] = [
    {
      header: 'Scheme Name',
      accessorKey: 'schemeName',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">{row.schemeName}</span>
        </div>
      )
    },
    {
      header: 'Manufacturer',
      accessorKey: 'companyName',
      sortable: true,
      render: row => <span className="text-slate-300 font-medium">{row.companyName}</span>
    },
    {
      header: 'Target Product',
      accessorKey: 'productName',
      sortable: true,
      render: row => <span className="font-semibold text-emerald-300">{row.productName}</span>
    },
    {
      header: 'Mechanism',
      render: row => (
        <div className="font-mono text-xs">
          {row.schemeType === 'Buy X Get Y Free' ? (
            <Badge variant="emerald">
              Buy {row.buyQuantity} ➔ Get {row.freeQuantity} Free
            </Badge>
          ) : (
            <Badge variant="sky">
              {row.discountPercent}% Off on {row.buyQuantity}+ packs
            </Badge>
          )}
        </div>
      )
    },
    {
      header: 'Valid Period',
      render: row => (
        <div className="text-xs font-mono text-slate-400">
          {row.startDate} to {row.endDate}
        </div>
      )
    },
    {
      header: 'Status',
      align: 'center',
      render: row =>
        row.isActive ? <Badge variant="emerald">Active Scheme</Badge> : <Badge variant="slate">Expired</Badge>
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Promotional Schemes & Free Bonus Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Buy X Get Y Free deals, quantity slab discounts, and manufacturer-funded promotional offers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Promotion Scheme</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredSchemes}
        searchPlaceholder="Search promotional schemes..."
        searchFilterKeys={['schemeName', 'companyName', 'productName']}
        exportFilename="Promotional_Schemes_Directory"
      />

      {/* CREATE SCHEME MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Promotional Trade Scheme"
        subtitle="Automatic calculation during sales invoice entry with DRAP compliance"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateScheme} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Scheme Campaign Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Risek 20mg Winter Blast (10+2 Free)"
              value={schemeName}
              onChange={e => setSchemeName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pharmaceutical Principal</label>
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
              <label className="block text-slate-300 font-medium mb-1">Applicable Product *</label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Scheme Mechanism</label>
              <select
                value={schemeType}
                onChange={e => setSchemeType(e.target.value as PromotionalScheme['schemeType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="Buy X Get Y Free">Buy X Get Y Free (Bonus Units)</option>
                <option value="Percentage Slab">Percentage Discount Slab</option>
              </select>
            </div>

            {schemeType === 'Buy X Get Y Free' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Buy Units (X)</label>
                  <input
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={e => setBuyQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Free Units (Y)</label>
                  <input
                    type="number"
                    min="1"
                    value={freeQuantity}
                    onChange={e => setFreeQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-mono text-center font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Minimum Slab Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={e => setBuyQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount %</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-center"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Campaign Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Campaign End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold cursor-pointer"
            >
              Activate Scheme
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
