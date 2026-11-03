import React, { useState } from 'react';
import { Plus, Users, ShieldAlert, CreditCard, FileText, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Customer, CustomerCategory } from '../types/pdms';

export const CustomersView: React.FC = () => {
  const { customers, salesReps, salesInvoices, recoveries, addCustomer } = usePDMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerLedger, setSelectedCustomerLedger] = useState<Customer | null>(null);

  // New Customer State
  const [storeName, setStoreName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [territory, setTerritory] = useState('Gulberg Commercial');
  const [category, setCategory] = useState<CustomerCategory>('Retail Pharmacy');
  const [salesRepId, setSalesRepId] = useState(salesReps[0]?.id || '');
  const [drugSaleLicenseNumber, setDrugSaleLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('2028-12-31');
  const [creditLimit, setCreditLimit] = useState(1500000);
  const [creditDays, setCreditDays] = useState(30);
  const [ntn, setNtn] = useState('');

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      code: `CUST-${city.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      name,
      storeName,
      ownerName: name,
      phone,
      whatsapp: phone,
      address,
      city,
      territory,
      category,
      salesRepId,
      drugSaleLicenseNumber: drugSaleLicenseNumber || `${city.substring(0, 3).toUpperCase()}-DSL-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpiryDate,
      creditLimit,
      creditDays,
      currentBalance: 0,
      openingBalance: 0,
      ntn,
      isActive: true
    });

    setIsModalOpen(false);
    setStoreName('');
    setName('');
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Store / Pharmacy',
      accessorKey: 'storeName',
      sortable: true,
      render: row => (
        <div>
          <div className="font-semibold text-white">{row.storeName}</div>
          <div className="text-[10px] text-slate-400">
            {row.ownerName} · <span className="text-slate-500 font-mono">DSL: {row.drugSaleLicenseNumber}</span>
          </div>
        </div>
      )
    },
    {
      header: 'City & Territory',
      render: row => (
        <div className="text-xs">
          <span className="text-slate-200">{row.city}</span>
          <div className="text-[10px] text-slate-500">{row.territory}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      render: row => <Badge variant="slate">{row.category}</Badge>
    },
    {
      header: 'Credit Limit (PKR)',
      accessorKey: 'creditLimit',
      align: 'right',
      sortable: true,
      render: row => (
        <span className="font-mono tabular-nums text-slate-300">
          Rs. {row.creditLimit.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Outstanding Balance',
      accessorKey: 'currentBalance',
      align: 'right',
      sortable: true,
      render: row => {
        const isExceeded = row.currentBalance > row.creditLimit;
        return (
          <div className="font-mono tabular-nums">
            <span className={`font-bold ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
              Rs. {row.currentBalance.toLocaleString()}
            </span>
            {isExceeded && (
              <div className="text-[9px] text-rose-400 font-semibold uppercase">Limit Exceeded</div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Assigned Rep',
      render: row => {
        const rep = salesReps.find(r => r.id === row.salesRepId);
        return <span className="text-slate-300 text-xs">{rep?.name || 'Unassigned'}</span>;
      }
    },
    {
      header: 'Action',
      align: 'right',
      render: row => (
        <button
          onClick={() => setSelectedCustomerLedger(row)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
        >
          Customer Ledger →
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Customer & Retail Pharmacy Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain drug sale licenses (DSL), credit limits, payment terms, outstanding aging, and customer ledger statements
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Store</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers by store name, owner, license or territory..."
        searchFilterKeys={['storeName', 'ownerName', 'drugSaleLicenseNumber', 'city', 'territory']}
        exportFilename="Customer_Accounts_Register"
      />

      {/* REGISTER CUSTOMER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Medical Store / Hospital Pharmacy"
        subtitle="Capture Drug Sale License (DSL), credit limits and territory allocation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pharmacy / Store Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Al-Madina Medicos"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Owner / Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g., Sheikh Muhammad Tariq"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Sales Territory</label>
              <input
                type="text"
                value={territory}
                onChange={e => setTerritory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Drug Sale License (DSL) # *</label>
              <input
                type="text"
                required
                placeholder="e.g., LHR-DSL-2025-9912"
                value={drugSaleLicenseNumber}
                onChange={e => setDrugSaleLicenseNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Assigned Sales Rep</label>
              <select
                value={salesRepId}
                onChange={e => setSalesRepId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs"
              >
                {salesReps.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Authorized Credit Limit (PKR) *</label>
              <input
                type="number"
                step="50000"
                value={creditLimit}
                onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Credit Days Term</label>
              <input
                type="number"
                value={creditDays}
                onChange={e => setCreditDays(parseInt(e.target.value) || 30)}
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
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER LEDGER STATEMENT MODAL */}
      {selectedCustomerLedger && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomerLedger(null)}
          title={`Customer Ledger: ${selectedCustomerLedger.storeName}`}
          subtitle={`DSL: ${selectedCustomerLedger.drugSaleLicenseNumber} · Current Outstanding: Rs. ${selectedCustomerLedger.currentBalance.toLocaleString()}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Aging summary cards */}
            <div className="grid grid-cols-5 gap-2 text-center font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Current (1-30d)</span>
                <span className="font-bold text-emerald-400">
                  Rs. {Math.round(selectedCustomerLedger.currentBalance * 0.6).toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">31-60 Days</span>
                <span className="font-bold text-sky-400">
                  Rs. {Math.round(selectedCustomerLedger.currentBalance * 0.25).toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">61-90 Days</span>
                <span className="font-bold text-amber-400">
                  Rs. {Math.round(selectedCustomerLedger.currentBalance * 0.15).toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">91-120 Days</span>
                <span className="font-bold text-rose-400">Rs. 0</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">&gt; 120 Days</span>
                <span className="font-bold text-rose-500">Rs. 0</span>
              </div>
            </div>

            {/* Invoices and Payments for this customer */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-2.5 bg-slate-950 font-semibold text-slate-300 border-b border-slate-800">
                Transaction History (Invoices & Payment Receipts)
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="p-2">Date</th>
                    <th className="p-2">Document Ref #</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Debit (Invoice)</th>
                    <th className="p-2 text-right">Credit (Receipt)</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {salesInvoices
                    .filter(i => i.customerId === selectedCustomerLedger.id)
                    .map(inv => (
                      <tr key={inv.id}>
                        <td className="p-2 text-slate-300">{inv.date}</td>
                        <td className="p-2 font-semibold text-white">{inv.invoiceNumber}</td>
                        <td className="p-2 text-sky-400">Sales Invoice</td>
                        <td className="p-2 text-right text-rose-400 font-bold">
                          Rs. {inv.netPayable.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-slate-500">-</td>
                        <td className="p-2 text-center">
                          <Badge variant={inv.status === 'Paid' ? 'emerald' : 'amber'}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}

                  {recoveries
                    .filter(r => r.customerId === selectedCustomerLedger.id)
                    .map(rec => (
                      <tr key={rec.id} className="bg-emerald-950/10">
                        <td className="p-2 text-slate-300">{rec.paymentDate}</td>
                        <td className="p-2 font-semibold text-emerald-400">{rec.receiptNumber}</td>
                        <td className="p-2 text-emerald-400">Payment Collection</td>
                        <td className="p-2 text-right text-slate-500">-</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">
                          Rs. {rec.amount.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="emerald">{rec.paymentMethod}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
