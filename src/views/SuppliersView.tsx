import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Building2,
  Phone,
  Mail,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  Search,
  ShoppingCart
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Supplier } from '../types/pdms';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    companies,
    purchaseOrders,
    grns
  } = usePDMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Karachi');
  const [address, setAddress] = useState('');
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);

  const supplierStats = useMemo(() => {
    return suppliers.map(supplier => {
      const associatedCompany = companies.find(c => c.id === supplier.companyId);
      const orders = purchaseOrders.filter(po => po.companyId === supplier.companyId);
      const totalPoAmount = orders.reduce((sum, po) => sum + po.totalAmount, 0);

      return {
        ...supplier,
        companyName: associatedCompany?.name || 'Principal',
        companyCode: associatedCompany?.shortCode || 'PRN',
        totalOrders: orders.length,
        totalPoAmount
      };
    });
  }, [suppliers, companies, purchaseOrders]);

  const filteredSuppliers = useMemo(() => {
    return supplierStats.filter(s => {
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q)
      );
    });
  }, [supplierStats, searchTerm]);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addSupplier({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      companyId,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      address: address.trim(),
      ntn: ntn.trim(),
      strn: strn.trim(),
      paymentTermsDays: Number(paymentTermsDays) || 30,
      isActive: true
    });

    setIsModalOpen(false);
    // Reset
    setCode('');
    setName('');
    setContactPerson('');
    setPhone('+92 ');
    setEmail('');
    setAddress('');
    setNtn('');
    setStrn('');
    setPaymentTermsDays(30);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            Suppliers & Principal Logistics Hubs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of pharmaceutical manufacturers, dispatch warehouses, commercial credit terms, and NTN/STRN profiles
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Suppliers"
          value={suppliers.length}
          subValue="Manufacturers & factory hubs"
          icon={Building2}
        />
        <StatCard
          label="Avg Payment Window"
          value="38.5 Days"
          subValue="Manufacturer credit period"
          icon={Clock}
        />
        <StatCard
          label="Active Purchase Orders"
          value={purchaseOrders.filter(po => po.status === 'Sent' || po.status === 'Draft').length}
          subValue="Awaiting factory dispatch"
          icon={ShoppingCart}
        />
        <StatCard
          label="Verified Tax Payers"
          value={`${suppliers.filter(s => s.ntn).length} / ${suppliers.length}`}
          subValue="Active FBR NTN & STRN"
          icon={CheckCircle2}
        />
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search supplier, contact person, NTN, or city..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            Supplier Register & Commercial Terms
          </h2>
          <span className="text-[11px] text-slate-400">{filteredSuppliers.length} suppliers listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Supplier Code & Name</th>
                <th className="py-2.5 px-3">Principal Company</th>
                <th className="py-2.5 px-3">Contact Person & Phone</th>
                <th className="py-2.5 px-3">City & Address</th>
                <th className="py-2.5 px-3">Tax Profile (NTN / STRN)</th>
                <th className="py-2.5 px-3 text-center">Credit Terms</th>
                <th className="py-2.5 px-3 text-right">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">
                        {s.code}
                      </span>
                      <span className="font-bold text-white">{s.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold rounded text-[11px]">
                      {s.companyCode}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.companyName}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-200">{s.contactPerson}</div>
                    <div className="font-mono text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {s.phone}
                    </div>
                    {s.email && (
                      <div className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {s.email}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-300 font-medium">{s.city}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{s.address}</div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px]">
                    <div>NTN: <span className="text-slate-200">{s.ntn || 'N/A'}</span></div>
                    <div>STRN: <span className="text-slate-400">{s.strn || 'N/A'}</span></div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-200 font-mono font-medium rounded text-[11px]">
                      {s.paymentTermsDays} Days
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    <span className="font-bold">{s.totalOrders} POs</span>
                    {s.totalPoAmount > 0 && (
                      <div className="text-[10px] text-emerald-400">
                        Rs. {(s.totalPoAmount / 1000000).toFixed(2)}M
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Principal Supplier / Dispatch Unit"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Supplier Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SUP-ABBOTT-01"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Pharma Company Association *</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Supplier / Dispatch Center Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Abbott Laboratories National Distribution Centre"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Haris Qureshi"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+92 21 111-222-688"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="dispatch@abbott.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <input
                type="text"
                placeholder="Karachi, Lahore, Islamabad"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Dispatch Depot Address</label>
              <input
                type="text"
                placeholder="Plot / Sector, Industrial Area"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">NTN Number</label>
              <input
                type="text"
                placeholder="0711849-8"
                value={ntn}
                onChange={e => setNtn(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={paymentTermsDays}
                onChange={e => setPaymentTermsDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded cursor-pointer"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
