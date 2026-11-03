import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Boxes,
  HandCoins,
  CreditCard,
  FileBadge,
  Sparkles,
  Warehouse,
  Truck,
  BookOpen,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Settings,
  Cpu
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';

export type NavTabId =
  | 'dashboard'
  | 'analyzers'
  | 'sales'
  | 'purchases'
  | 'sales-returns'
  | 'recovery'
  | 'companies'
  | 'products'
  | 'customers'
  | 'sales-reps'
  | 'inventory'
  | 'warehouses'
  | 'logistics'
  | 'claims'
  | 'company-payables'
  | 'schemes'
  | 'accounting'
  | 'payroll'
  | 'reports'
  | 'audit'
  | 'settings';

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  counter?: number;
  counterType?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { batches } = usePDMS();

  // Near expiry count
  const nearExpiryCount = batches.filter(
    b => b.status === 'Near Expiry' || b.status === 'Expired'
  ).length;

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analyzers', label: 'Smart Analyzers', icon: Cpu, badge: 'AI' }
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { id: 'sales', label: 'Sales & Invoicing', icon: Receipt },
        { id: 'purchases', label: 'Purchases & GRN', icon: ShoppingCart },
        { id: 'recovery', label: 'Recovery & Receivables', icon: HandCoins },
        { id: 'sales-returns', label: 'Sales Returns', icon: RotateCcw }
      ]
    },
    {
      group: 'INVENTORY & BATCHES',
      items: [
        {
          id: 'inventory',
          label: 'Inventory & FEFO',
          icon: Boxes,
          counter: nearExpiryCount > 0 ? nearExpiryCount : undefined,
          counterType: 'amber'
        },
        { id: 'warehouses', label: 'Warehouses & Racks', icon: Warehouse },
        { id: 'logistics', label: 'Fleet & Deliveries', icon: Truck }
      ]
    },
    {
      group: 'PHARMA PARTNERS & MASTER',
      items: [
        { id: 'companies', label: 'Pharma Companies', icon: Building2 },
        { id: 'products', label: 'Products Master', icon: Package },
        { id: 'customers', label: 'Customers & Stores', icon: Users },
        { id: 'sales-reps', label: 'Sales Representatives', icon: UserCheck }
      ]
    },
    {
      group: 'COMMERCIAL & CLAIMS',
      items: [
        { id: 'claims', label: 'Claims Management', icon: FileBadge },
        { id: 'company-payables', label: 'Company Payables', icon: CreditCard },
        { id: 'schemes', label: 'Schemes & Bonuses', icon: Sparkles }
      ]
    },
    {
      group: 'FINANCE & HR',
      items: [
        { id: 'accounting', label: 'Financial Accounting', icon: BookOpen },
        { id: 'payroll', label: 'HR & Payroll', icon: Users }
      ]
    },
    {
      group: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
        { id: 'settings', label: 'System & Backup', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto no-print">
      {/* Distribution info bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/30">
        <div className="text-[11px] font-semibold text-slate-300 truncate">
          Shaheen Pharma Logistics
        </div>
        <div className="text-[10px] text-slate-500 font-mono truncate">
          Lic: PB-LHR-DIST-2024-00482
        </div>
      </div>

      {/* Nav items list */}
      <nav className="flex-1 py-3 px-2 space-y-4">
        {navGroups.map(group => (
          <div key={group.group}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 text-[9px] font-bold rounded border border-emerald-800/60">
                          {item.badge}
                        </span>
                      )}
                      {item.counter !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-mono rounded font-semibold ${
                            item.counterType === 'amber'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {item.counter}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">FEFO Engine</span>
          <span className="text-emerald-400 font-mono text-[10px]">ACTIVE</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span>Currency</span>
          <span className="font-mono text-slate-400">PKR (Rs.)</span>
        </div>
      </div>
    </aside>
  );
};
