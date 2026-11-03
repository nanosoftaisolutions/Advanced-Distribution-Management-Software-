import React, { useState, useMemo } from 'react';
import { Search, X, Package, Users, Building2, FileText, Layers, ChevronRight } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (module: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const { products, customers, companies, salesInvoices, batches } = usePDMS();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return null;
    const q = query.toLowerCase();

    const matchedProducts = products
      .filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.genericName.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      )
      .slice(0, 5);

    const matchedCustomers = customers
      .filter(
        c =>
          c.storeName.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedInvoices = salesInvoices
      .filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerStoreName.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedCompanies = companies
      .filter(
        comp =>
          comp.name.toLowerCase().includes(q) ||
          comp.shortCode.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedBatches = batches
      .filter(b => b.batchNumber.toLowerCase().includes(q))
      .slice(0, 4);

    const totalCount =
      matchedProducts.length +
      matchedCustomers.length +
      matchedInvoices.length +
      matchedCompanies.length +
      matchedBatches.length;

    return {
      products: matchedProducts,
      customers: matchedCustomers,
      invoices: matchedInvoices,
      companies: matchedCompanies,
      batches: matchedBatches,
      totalCount
    };
  }, [query, products, customers, companies, salesInvoices, batches]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search products, formulas, invoices, pharmacies, batches, or companies..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-slate-300 rounded mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!searchResults && (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Type at least 2 characters to search</p>
              <p className="text-xs text-slate-600 mt-1">
                E.g. "Risek", "Augmentin", "Servaid", "Fazal Din", "INV-2026", "Getz"
              </p>
            </div>
          )}

          {searchResults && searchResults.totalCount === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm text-slate-400">No matching records found for "{query}"</p>
            </div>
          )}

          {searchResults && searchResults.products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Products ({searchResults.products.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectResult('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.genericName} · {p.strength} · TP: Rs. {p.tradePrice.toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults && searchResults.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Customers & Pharmacies ({searchResults.customers.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectResult('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-white">{c.storeName}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.city} · DSL: {c.drugSaleLicenseNumber} · Balance: Rs.{' '}
                        {c.currentBalance.toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults && searchResults.invoices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sales Invoices ({searchResults.invoices.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.invoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onSelectResult('sales', inv.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-white font-mono">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.customerStoreName} · Rs. {inv.netPayable.toLocaleString()} · {inv.status}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults && searchResults.companies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Pharmaceutical Companies ({searchResults.companies.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.companies.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => {
                      onSelectResult('companies', comp.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-white">{comp.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {comp.city} · Code: {comp.shortCode} · NTN: {comp.ntn}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults && searchResults.batches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Batches ({searchResults.batches.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.batches.map(b => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onSelectResult('inventory', b.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-white font-mono">{b.batchNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        Exp: {b.expiryDate} · Avail: {b.availableQuantity} units · Status: {b.status}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
