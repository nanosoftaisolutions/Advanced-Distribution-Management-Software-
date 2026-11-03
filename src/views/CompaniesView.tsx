import React, { useState } from 'react';
import { Plus, Building2, Phone, Mail, Award, TrendingUp, CreditCard, FileText } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { PharmaCompany } from '../types/pdms';

export const CompaniesView: React.FC = () => {
  const {
    companies,
    salesInvoices,
    grns,
    claims,
    addCompany,
    setSelectedCompanyFilter
  } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<PharmaCompany | null>(null);

  // New Company State
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Karachi');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salesManager, setSalesManager] = useState('');
  const [ntn, setNtn] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [creditLimit, setCreditLimit] = useState(25000000);
  const [commissionPercentage, setCommissionPercentage] = useState(8.0);
  const [salesTargetMonthly, setSalesTargetMonthly] = useState(10000000);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    addCompany({
      name,
      shortCode: shortCode.toUpperCase() || name.substring(0, 4).toUpperCase(),
      logoText: (shortCode || name).substring(0, 3).toUpperCase(),
      address,
      city,
      phone,
      email,
      salesManager,
      regionalManager: 'Assigned RM',
      ntn,
      gstNumber,
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0],
      paymentTermsDays,
      creditLimit,
      commissionPercentage,
      discountPolicy: 'Standard distribution terms',
      expiryReturnPolicy: 'Full credit note on expired stock under DRAP guidelines',
      damageReturnPolicy: 'Reconciliation within 14 days of GRN',
      salesTargetMonthly,
      remarks: 'Contract signed and verified',
      isActive: true
    });

    setIsModalOpen(false);
    setName('');
  };

  const columns: Column<PharmaCompany>[] = [
    {
      header: 'Company Name',
      accessorKey: 'name',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
            {row.logoText}
          </div>
          <div>
            <div className="font-semibold text-white">{row.name}</div>
            <div className="text-[10px] text-slate-400">
              {row.city} · Code: <span className="text-emerald-400 font-mono">{row.shortCode}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Tax Identifiers',
      render: row => (
        <div className="font-mono text-xs">
          <div className="text-slate-300">NTN: {row.ntn}</div>
          <div className="text-[10px] text-slate-500">GST: {row.gstNumber}</div>
        </div>
      )
    },
    {
      header: 'Monthly Sales Target',
      accessorKey: 'salesTargetMonthly',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono tabular-nums font-semibold text-white">
          Rs. {row.salesTargetMonthly.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actual Sales',
      align: 'right',
      render: row => {
        const sales = salesInvoices
          .filter(i => i.companyId === row.id && i.status !== 'Cancelled')
          .reduce((sum, inv) => sum + inv.netPayable, 0);

        return (
          <span className="font-mono tabular-nums font-bold text-emerald-400">
            Rs. {sales.toLocaleString()}
          </span>
        );
      }
    },
    {
      header: 'Commission %',
      accessorKey: 'commissionPercentage',
      align: 'right',
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">{row.commissionPercentage}%</span>
      )
    },
    {
      header: 'Credit Terms',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-300">{row.paymentTermsDays} Days</span>
          <div className="text-[10px] font-mono text-slate-500">
            Limit: Rs. {(row.creditLimit / 1000000).toFixed(1)}M
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedCompanyFilter(row.id)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs cursor-pointer"
            title="Filter entire ERP to this company"
          >
            Filter App
          </button>
          <button
            onClick={() => setSelectedCompanyDetails(row)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Ledger & Terms →
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Multi-Pharmaceutical Company Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain independent accounts, purchase ledgers, commissions, sales targets, claims & returns for each manufacturer
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pharma Company</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={companies}
        searchPlaceholder="Search company by name, code or NTN..."
        searchFilterKeys={['name', 'shortCode', 'ntn', 'city']}
        exportFilename="Pharma_Companies_Directory"
      />

      {/* ADD COMPANY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Pharmaceutical Principal"
        subtitle="Register new pharmaceutical manufacturing partner with contract & commercial terms"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Ferozsons Laboratories Ltd."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Short Code *</label>
              <input
                type="text"
                required
                placeholder="e.g., FEROZ"
                value={shortCode}
                onChange={e => setShortCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">NTN Number</label>
              <input
                type="text"
                placeholder="e.g., 0719284-1"
                value={ntn}
                onChange={e => setNtn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">GST Registration #</label>
              <input
                type="text"
                placeholder="e.g., 02-01-3000-881-12"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Commission %</label>
              <input
                type="number"
                step="0.5"
                value={commissionPercentage}
                onChange={e => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                value={paymentTermsDays}
                onChange={e => setPaymentTermsDays(parseInt(e.target.value) || 30)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Monthly Sales Target (PKR)</label>
              <input
                type="number"
                value={salesTargetMonthly}
                onChange={e => setSalesTargetMonthly(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
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
              Register Principal
            </button>
          </div>
        </form>
      </Modal>

      {/* COMPANY DETAILS & COMMERCIAL LEDGER MODAL */}
      {selectedCompanyDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCompanyDetails(null)}
          title={`${selectedCompanyDetails.name} (${selectedCompanyDetails.shortCode})`}
          subtitle={`Contract Terms · Payment Cycle: ${selectedCompanyDetails.paymentTermsDays} Days · Commission: ${selectedCompanyDetails.commissionPercentage}%`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Sales Manager:</span>
                <span className="font-semibold text-white">{selectedCompanyDetails.salesManager}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Phone:</span>
                <span className="font-mono text-white">{selectedCompanyDetails.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Credit Limit:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Rs. {selectedCompanyDetails.creditLimit.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Contract End:</span>
                <span className="font-mono text-white">{selectedCompanyDetails.contractEndDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-1">Expiry Return Policy:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedCompanyDetails.expiryReturnPolicy}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-semibold text-sky-400 block mb-1">Damage & Breakage Policy:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedCompanyDetails.damageReturnPolicy}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
