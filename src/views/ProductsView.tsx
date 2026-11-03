import React, { useState, useMemo } from 'react';
import { Plus, Package, ThermometerSnowflake, ShieldAlert, Barcode, Search, Building2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Product, DosageCategory } from '../types/pdms';

export const ProductsView: React.FC = () => {
  const { products, companies, batches, addProduct, selectedCompanyFilter } = usePDMS();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // New Product Form State
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [category, setCategory] = useState<DosageCategory>('Tablets');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('500mg');
  const [packSize, setPackSize] = useState('20s');
  const [mrp, setMrp] = useState(400);
  const [tradePrice, setTradePrice] = useState(340);
  const [purchasePrice, setPurchasePrice] = useState(300);
  const [isRefrigerated, setIsRefrigerated] = useState(false);
  const [isControlled, setIsControlled] = useState(false);
  const [reorderLevel, setReorderLevel] = useState(300);
  const [minStock, setMinStock] = useState(100);
  const [maxStock, setMaxStock] = useState(2500);

  const categoriesList: DosageCategory[] = [
    'Tablets',
    'Capsules',
    'Syrups',
    'Suspensions',
    'Injections',
    'Infusions',
    'Creams',
    'Ointments',
    'Drops',
    'Eye Drops',
    'Sachets',
    'Nutraceuticals',
    'Medical Devices'
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCompany = selectedCompanyFilter === 'all' || p.companyId === selectedCompanyFilter;
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchCompany && matchCategory;
    });
  }, [products, selectedCompanyFilter, categoryFilter]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      code: code.toUpperCase() || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: barcode || `${Math.floor(8964000000000 + Math.random() * 99999999)}`,
      name,
      genericName,
      companyId,
      category,
      dosageForm,
      strength,
      packSize,
      unitOfMeasure: 'Pack',
      mrp,
      tradePrice,
      purchasePrice,
      wholesalePrice: tradePrice * 0.98,
      gstPercent: 0,
      isRefrigerated,
      isControlled,
      minStock,
      maxStock,
      reorderLevel,
      rackLocation: 'GEN-RACK',
      isActive: true
    });

    setIsModalOpen(false);
    setName('');
    setGenericName('');
  };

  const columns: Column<Product>[] = [
    {
      header: 'Code / Barcode',
      accessorKey: 'code',
      sortable: true,
      render: row => (
        <div>
          <span className="font-mono font-semibold text-emerald-400">{row.code}</span>
          <div className="text-[10px] text-slate-500 font-mono">{row.barcode}</div>
        </div>
      )
    },
    {
      header: 'Brand Name',
      accessorKey: 'name',
      sortable: true,
      render: row => (
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span>{row.name}</span>
            {row.isRefrigerated && (
              <span title="Cold Chain 2-8°C">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              </span>
            )}
            {row.isControlled && (
              <span title="Controlled Schedule G / Narcotic">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">{row.packSize}</div>
        </div>
      )
    },
    {
      header: 'Generic Formula',
      accessorKey: 'genericName',
      sortable: true,
      render: row => (
        <div>
          <span className="text-slate-300">{row.genericName}</span>
          <div className="text-[10px] text-slate-500">
            {row.dosageForm} · {row.strength}
          </div>
        </div>
      )
    },
    {
      header: 'Pharma Company',
      render: row => {
        const comp = companies.find(c => c.id === row.companyId);
        return <span className="font-medium text-slate-200">{comp?.shortCode || 'N/A'}</span>;
      }
    },
    {
      header: 'Available Stock',
      align: 'right',
      render: row => {
        const totalStock = batches
          .filter(b => b.productId === row.id && b.status !== 'Expired')
          .reduce((acc, curr) => acc + curr.availableQuantity, 0);

        const isLow = totalStock <= row.reorderLevel;

        return (
          <div className="font-mono tabular-nums">
            <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-white'}`}>
              {totalStock.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-500">Min: {row.minStock}</div>
          </div>
        );
      }
    },
    {
      header: 'Trade Price (TP)',
      accessorKey: 'tradePrice',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono font-bold text-white tabular-nums">
          Rs. {row.tradePrice.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Retail (MRP)',
      accessorKey: 'mrp',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-400">
          Rs. {row.mrp.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Margin',
      align: 'right',
      render: row => {
        const marginPct = ((row.tradePrice - row.purchasePrice) / row.tradePrice) * 100;
        return (
          <span className="font-mono tabular-nums text-emerald-400 text-xs font-semibold">
            {marginPct.toFixed(1)}%
          </span>
        );
      }
    },
    {
      header: 'Details',
      align: 'center',
      render: row => (
        <button
          onClick={() => setSelectedProductDetails(row)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
        >
          View Specs
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Pharmaceutical Product Master</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generic formulas, dosage forms, cold chain requirements, trade prices (TP), MRP and stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Dosage Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search by brand name, generic formula or barcode..."
        searchFilterKeys={['name', 'genericName', 'code', 'barcode']}
        exportFilename="Product_Master_Database"
      />

      {/* ADD PRODUCT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Pharmaceutical Product"
        subtitle="Configure generic formulation, strength, packaging, pricing & storage criteria"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Risek 20mg"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Generic Name / Formula *</label>
              <input
                type="text"
                required
                placeholder="e.g., Omeprazole"
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Pharma Company *</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Code</label>
              <input
                type="text"
                placeholder="e.g., GETZ-RSK-20"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Barcode (EAN-13)</label>
              <input
                type="text"
                placeholder="e.g., 8964000100214"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Dosage Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DosageCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Pack Size</label>
              <input
                type="text"
                placeholder="e.g., 14s (2 x 7)"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Purchase Cost (PKR)</label>
              <input
                type="number"
                step="0.5"
                value={purchasePrice}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Trade Price (TP) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={tradePrice}
                onChange={e => setTradePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Maximum Retail (MRP) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={mrp}
                onChange={e => setMrp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 p-2 bg-slate-950/40 rounded border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRefrigerated}
                onChange={e => setIsRefrigerated(e.target.checked)}
                className="rounded text-sky-500 focus:ring-0"
              />
              <span className="text-slate-300 flex items-center gap-1">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400" />
                <span>Requires Cold Chain Storage (2-8°C)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isControlled}
                onChange={e => setIsControlled(e.target.checked)}
                className="rounded text-rose-500 focus:ring-0"
              />
              <span className="text-slate-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Controlled Drug (Narcotics / Schedule G)</span>
              </span>
            </label>
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
              Save Product Record
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT SPECS MODAL */}
      {selectedProductDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedProductDetails(null)}
          title={selectedProductDetails.name}
          subtitle={`Generic: ${selectedProductDetails.genericName} · Code: ${selectedProductDetails.code}`}
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Dosage Form:</span>
                <span className="font-semibold text-white">{selectedProductDetails.dosageForm}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Strength:</span>
                <span className="font-semibold text-white">{selectedProductDetails.strength}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pack Size:</span>
                <span className="font-semibold text-white">{selectedProductDetails.packSize}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Barcode:</span>
                <span className="font-mono text-emerald-400">{selectedProductDetails.barcode}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Purchase Rate</span>
                <span className="text-white font-bold">Rs. {selectedProductDetails.purchasePrice}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Trade Price (TP)</span>
                <span className="text-emerald-400 font-bold">Rs. {selectedProductDetails.tradePrice}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MRP</span>
                <span className="text-white font-bold">Rs. {selectedProductDetails.mrp}</span>
              </div>
            </div>

            {/* Current Batches for this product */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Active Batches in Warehouses
              </h4>
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr className="border-b border-slate-800">
                      <th className="p-2">Batch #</th>
                      <th className="p-2">Expiry Date</th>
                      <th className="p-2 text-right">Available Qty</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batches
                      .filter(b => b.productId === selectedProductDetails.id)
                      .map(b => (
                        <tr key={b.id}>
                          <td className="p-2 font-semibold text-emerald-400">{b.batchNumber}</td>
                          <td className="p-2 text-slate-300">{b.expiryDate}</td>
                          <td className="p-2 text-right text-white font-bold">
                            {b.availableQuantity.toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={b.status === 'Active' ? 'emerald' : 'amber'}>
                              {b.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
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
