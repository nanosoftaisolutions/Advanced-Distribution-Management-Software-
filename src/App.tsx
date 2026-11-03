import React, { useState, useEffect } from 'react';
import { PDMSProvider, usePDMS } from './context/PDMSContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Views
import { DashboardView } from './views/DashboardView';
import { SmartAnalyzersView } from './views/SmartAnalyzersView';
import { SalesView } from './views/SalesView';
import { PurchasesView } from './views/PurchasesView';
import { SalesReturnsView } from './views/SalesReturnsView';
import { RecoveryView } from './views/RecoveryView';
import { CompaniesView } from './views/CompaniesView';
import { ProductsView } from './views/ProductsView';
import { CustomersView } from './views/CustomersView';
import { SalesRepsView } from './views/SalesRepsView';
import { InventoryView } from './views/InventoryView';
import { WarehousesView } from './views/WarehousesView';
import { ClaimsView } from './views/ClaimsView';
import { CompanyPayablesView } from './views/CompanyPayablesView';
import { SchemesView } from './views/SchemesView';
import { AccountingView } from './views/AccountingView';
import { HRPayrollView } from './views/HRPayrollView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { BackupSettingsView } from './views/BackupSettingsView';
import { BranchesView } from './views/BranchesView';
import { CompanyProfitabilityView } from './views/CompanyProfitabilityView';
import { DailyPerformanceSheetView } from './views/DailyPerformanceSheetView';
import { StockTransfersView } from './views/StockTransfersView';
import { SuppliersView } from './views/SuppliersView';
import { ProductRecallView } from './views/ProductRecallView';

const PDMSMainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalSearchSelect = (module: string) => {
    const moduleMap: { [k: string]: NavTabId } = {
      products: 'products',
      customers: 'customers',
      sales: 'sales',
      companies: 'companies',
      inventory: 'inventory',
      branches: 'branches',
      recalls: 'product-recall',
      transfers: 'transfers',
      suppliers: 'suppliers'
    };
    if (moduleMap[module]) {
      setActiveTab(moduleMap[module]);
    }
  };

  const handleCreateNewInvoice = () => {
    setActiveTab('sales');
    setIsNewInvoiceOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(m: string) => setActiveTab(m as NavTabId)}
            onNewInvoice={handleCreateNewInvoice}
          />
        );
      case 'daily-sheet':
        return <DailyPerformanceSheetView />;
      case 'analyzers':
        return <SmartAnalyzersView />;
      case 'sales':
        return (
          <SalesView
            isCreateOpen={isNewInvoiceOpen}
            onCloseCreate={() => setIsNewInvoiceOpen(false)}
          />
        );
      case 'purchases':
        return <PurchasesView />;
      case 'sales-returns':
        return <SalesReturnsView />;
      case 'recovery':
        return <RecoveryView />;
      case 'transfers':
        return <StockTransfersView />;
      case 'inventory':
        return <InventoryView />;
      case 'product-recall':
        return <ProductRecallView />;
      case 'warehouses':
      case 'logistics':
        return <WarehousesView />;
      case 'companies':
        return <CompaniesView />;
      case 'company-profitability':
        return <CompanyProfitabilityView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'products':
        return <ProductsView />;
      case 'customers':
        return <CustomersView />;
      case 'sales-reps':
        return <SalesRepsView />;
      case 'branches':
        return <BranchesView />;
      case 'claims':
        return <ClaimsView />;
      case 'company-payables':
        return <CompanyPayablesView />;
      case 'schemes':
        return <SchemesView />;
      case 'accounting':
        return <AccountingView />;
      case 'payroll':
        return <HRPayrollView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLogView />;
      case 'settings':
        return <BackupSettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={(m: string) => setActiveTab(m as NavTabId)}
            onNewInvoice={handleCreateNewInvoice}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Bar Contract (1 Row, 3 Zones) */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onNewInvoice={handleCreateNewInvoice}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={tab => setActiveTab(tab)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/80">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Overlays */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleGlobalSearchSelect}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={module => setActiveTab(module as NavTabId)}
      />
    </div>
  );
};

export default function App() {
  return (
    <PDMSProvider>
      <PDMSMainLayout />
    </PDMSProvider>
  );
}
