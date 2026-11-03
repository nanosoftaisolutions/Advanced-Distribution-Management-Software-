import React from 'react';
import {
  Search,
  Bell,
  Building2,
  Plus,
  Shield,
  Sun,
  Moon,
  Sparkles,
  MapPin
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { UserRole } from '../types/pdms';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onNewInvoice: () => void;
  onQuickAction?: (action: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onNewInvoice
}) => {
  const {
    currentUser,
    setCurrentRole,
    companies,
    branches,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    selectedBranchFilter,
    setSelectedBranchFilter,
    notifications,
    isDarkMode,
    toggleDarkMode
  } = usePDMS();

  const userRolesList: UserRole[] = [
    'Distribution Owner',
    'Super Administrator',
    'Accountant',
    'Sales Manager',
    'Sales Representative',
    'Warehouse Manager',
    'Storekeeper',
    'Purchase Officer',
    'Auditor'
  ];

  const criticalAlertsCount = notifications.filter(
    n => n.severity === 'critical' || n.severity === 'high'
  ).length;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 sticky top-0 z-30 select-none no-print">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-sm group-hover:bg-emerald-500 transition-colors">
            PD
          </div>
          <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
            PharmaDist <span className="text-emerald-400 font-semibold text-xs tracking-normal">PDMS</span>
          </span>
        </a>
      </div>

      {/* Zone 2: Company Filter, Branch Filter & Global Search */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl mx-2">
        {/* Company Filter Selector */}
        <div className="relative flex items-center min-w-[170px] max-w-[210px]">
          <Building2 className="w-3.5 h-3.5 absolute left-2.5 text-emerald-400 pointer-events-none" />
          <select
            value={selectedCompanyFilter}
            onChange={e => setSelectedCompanyFilter(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-medium text-slate-200 hover:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none truncate"
            title="Filter by Pharma Principal"
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.shortCode} - {c.name.split(' ')[0]}
              </option>
            ))}
          </select>
          <div className="absolute right-2 pointer-events-none text-[10px] text-slate-500">▼</div>
        </div>

        {/* Branch Filter Selector */}
        <div className="relative flex items-center min-w-[160px] max-w-[200px]">
          <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-sky-400 pointer-events-none" />
          <select
            value={selectedBranchFilter}
            onChange={e => setSelectedBranchFilter(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-medium text-slate-200 hover:border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer appearance-none truncate"
            title="Filter by Branch / Depot"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.city}: {b.name.replace(' Hub', '').replace(' Depot', '')}
              </option>
            ))}
          </select>
          <div className="absolute right-2 pointer-events-none text-[10px] text-slate-500">▼</div>
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-slate-400 transition-colors cursor-pointer group min-w-[160px]"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            <span className="truncate">Search products, batches...</span>
          </span>
          <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Active RBAC Switcher, Notifications, Theme & Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-500 hidden xl:inline text-[11px]">Role:</span>
          <select
            value={currentUser.role}
            onChange={e => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer pr-1"
            title="Switch User Role to test permissions"
          >
            {userRolesList.map(r => (
              <option key={r} value={r} className="bg-slate-900 text-slate-200">
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          title="Alerts & Expiry Notifications"
        >
          <Bell className="w-4 h-4" />
          {criticalAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Dark/Light toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary CTA: New Sales Invoice */}
        <button
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </button>
      </div>
    </header>
  );
};
