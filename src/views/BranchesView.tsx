import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Building,
  Users,
  Target,
  Warehouse,
  Phone,
  Mail,
  CheckCircle2,
  TrendingUp,
  Filter,
  DollarSign
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Branch } from '../types/pdms';

export const BranchesView: React.FC = () => {
  const {
    branches,
    addBranch,
    companies,
    warehouses,
    batches,
    salesInvoices,
    selectedBranchFilter,
    setSelectedBranchFilter
  } = usePDMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [email, setEmail] = useState('');
  const [territoriesInput, setTerritoriesInput] = useState('');
  const [monthlySalesTarget, setMonthlySalesTarget] = useState<number>(10000000);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

  // Calculate metrics per branch
  const branchMetrics = useMemo(() => {
    return branches.map(branch => {
      // Find warehouses assigned to this branch
      const branchWarehouseIds = branch.assignedWarehouseIds;
      
      // Stock valuation for this branch
      const branchStockVal = batches
        .filter(b => branchWarehouseIds.includes(b.warehouseId))
        .reduce((sum, b) => sum + (b.availableQuantity * b.purchaseRate), 0);

      // Branch sales
      const branchSales = salesInvoices
        .filter(inv => inv.branchId === branch.id && inv.status !== 'Cancelled')
        .reduce((sum, inv) => sum + inv.netPayable, 0);

      const targetAchievementPercent = branch.monthlySalesTarget > 0
        ? Math.min(100, Math.round((branchSales / branch.monthlySalesTarget) * 100))
        : 0;

      return {
        ...branch,
        stockValuation: branchStockVal,
        mtdSales: branchSales,
        achievementPercent: targetAchievementPercent
      };
    });
  }, [branches, batches, salesInvoices]);

  const filteredBranches = useMemo(() => {
    return branchMetrics.filter(b => {
      const matchSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [branchMetrics, searchTerm]);

  // Overall KPIs
  const totalTarget = branches.reduce((sum, b) => sum + b.monthlySalesTarget, 0);
  const totalStockVal = branchMetrics.reduce((sum, b) => sum + b.stockValuation, 0);
  const totalMtdSales = branchMetrics.reduce((sum, b) => sum + b.mtdSales, 0);

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !city.trim()) return;

    addBranch({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      assignedCompanyIds: selectedCompanies.length > 0 ? selectedCompanies : companies.map(c => c.id),
      assignedWarehouseIds: selectedWarehouses.length > 0 ? selectedWarehouses : [warehouses[0]?.id || 'wh-central'],
      salesTerritories: territoriesInput
        ? territoriesInput.split(',').map(s => s.trim()).filter(Boolean)
        : ['City Central', 'Suburbs'],
      monthlySalesTarget: Number(monthlySalesTarget) || 0,
      isActive: true
    });

    setIsModalOpen(false);
    // Reset form
    setCode('');
    setName('');
    setAddress('');
    setManagerName('');
    setPhone('+92 ');
    setEmail('');
    setTerritoriesInput('');
    setSelectedCompanies([]);
    setSelectedWarehouses([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            Multi-Branch Management & Regional Depots
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized governance of provincial distribution branches, sales territories, and regional warehouse quotas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Operating Branches"
          value={branches.length}
          subValue="Lahore, Karachi, Isb, Multan"
          icon={Building}
        />
        <StatCard
          label="Combined Monthly Target"
          value={`Rs. ${(totalTarget / 1000000).toFixed(1)}M`}
          subValue="Cumulative sales quota"
          icon={Target}
        />
        <StatCard
          label="MTD Branch Sales"
          value={`Rs. ${(totalMtdSales / 1000000).toFixed(2)}M`}
          subValue={`${Math.round((totalMtdSales / (totalTarget || 1)) * 100)}% achieved`}
          icon={TrendingUp}
          trend="+12.4%"
          trendType="positive"
        />
        <StatCard
          label="Branch Stock In-Hand"
          value={`Rs. ${(totalStockVal / 1000000).toFixed(2)}M`}
          subValue="Valued at manufacturer cost"
          icon={DollarSign}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search branch code, name, city, or manager..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Active Global Filter:</span>
          {selectedBranchFilter === 'all' ? (
            <Badge variant="neutral">Consolidated (All Branches)</Badge>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="emerald">
                {branches.find(b => b.id === selectedBranchFilter)?.name || selectedBranchFilter}
              </Badge>
              <button
                onClick={() => setSelectedBranchFilter('all')}
                className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBranches.map(branch => {
          const isSelected = selectedBranchFilter === branch.id;
          const assignedComps = companies.filter(c => branch.assignedCompanyIds.includes(c.id));
          const assignedWhs = warehouses.filter(w => branch.assignedWarehouseIds.includes(w.id));

          return (
            <div
              key={branch.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900/90 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-sky-950 text-sky-400 text-[10px] font-mono font-bold rounded border border-sky-800/60">
                      {branch.code}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{branch.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{branch.city} &bull; {branch.address}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBranchFilter(isSelected ? 'all' : branch.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isSelected ? 'Clear branch filter' : 'Focus all PDMS data on this branch'}
                >
                  {isSelected ? 'Focused ✓' : 'Focus Branch'}
                </button>
              </div>

              {/* Manager & Contact */}
              <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Branch Manager</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {branch.managerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {branch.phone}
                  </span>
                </div>
              </div>

              {/* Target & Sales Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Sales Target</span>
                  <span className="font-mono text-slate-200">
                    Rs. {(branch.mtdSales / 1000000).toFixed(2)}M / Rs. {(branch.monthlySalesTarget / 1000000).toFixed(2)}M ({branch.achievementPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      branch.achievementPercent >= 80
                        ? 'bg-emerald-500'
                        : branch.achievementPercent >= 40
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, branch.achievementPercent)}%` }}
                  />
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Inventory Stock Value</span>
                  <span className="font-mono font-bold text-emerald-400">
                    Rs. {(branch.stockValuation / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="p-2 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Assigned Warehouses</span>
                  <span className="font-medium text-slate-300 truncate block">
                    {assignedWhs.map(w => w.code).join(', ') || 'Central Hub'}
                  </span>
                </div>
              </div>

              {/* Territories Covered */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Territories & Beats
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {branch.salesTerritories.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Associated Principals */}
              <div className="mt-2.5">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Authorized Principals
                </div>
                <div className="flex flex-wrap gap-1">
                  {assignedComps.map(c => (
                    <span
                      key={c.id}
                      className="px-1.5 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-medium rounded"
                    >
                      {c.shortCode}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Branch */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Distribution Branch / Depot"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Branch Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. BR-FSD-01"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono uppercase focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Faisalabad, Rawalpindi"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Faisalabad Central Regional Depot"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Physical Address</label>
              <input
                type="text"
                placeholder="e.g. Plot 18-A, Small Industrial Estate, Faisalabad"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Branch Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Tariq Saeed"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+92 41 8501234"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Official Email</label>
              <input
                type="email"
                placeholder="fsd.branch@shaheenpharmadist.com.pk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Monthly Sales Target (PKR)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={monthlySalesTarget}
                onChange={e => setMonthlySalesTarget(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Sales Territories & Beats (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Clock Tower, D-Ground, Susan Road, Jaranwala"
                value={territoriesInput}
                onChange={e => setTerritoriesInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
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
              Save Branch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
