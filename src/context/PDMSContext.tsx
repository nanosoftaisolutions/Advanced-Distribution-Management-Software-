import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserRole,
  UserSession,
  PharmaCompany,
  Product,
  StockBatch,
  Warehouse,
  Customer,
  SalesRep,
  SalesInvoice,
  SalesInvoiceItem,
  PurchaseOrder,
  GoodsReceivingNote,
  CustomerRecovery,
  CompanyPayment,
  CompanyClaim,
  SalesReturn,
  PromotionalScheme,
  BankAccount,
  AccountingVoucher,
  DeliveryVehicle,
  Employee,
  AuditLog,
  SystemSettings
} from '../types/pdms';
import {
  initialCompanies,
  initialProducts,
  initialBatches,
  initialWarehouses,
  initialCustomers,
  initialSalesReps,
  initialSalesInvoices,
  initialPurchaseOrders,
  initialGRNs,
  initialRecoveries,
  initialCompanyPayments,
  initialClaims,
  initialSalesReturns,
  initialSchemes,
  initialBankAccounts,
  initialVouchers,
  initialVehicles,
  initialEmployees,
  initialAuditLogs,
  initialSettings
} from '../data/initialData';

export interface SystemNotification {
  id: string;
  type: 'expiry' | 'credit' | 'stock' | 'claim' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  linkModule?: string;
}

interface PDMSContextType {
  // Current user & RBAC
  currentUser: UserSession;
  setCurrentRole: (role: UserRole) => void;

  // Global filters & Theme
  selectedCompanyFilter: string; // 'all' or companyId
  setSelectedCompanyFilter: (companyId: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Master Data
  companies: PharmaCompany[];
  products: Product[];
  batches: StockBatch[];
  warehouses: Warehouse[];
  customers: Customer[];
  salesReps: SalesRep[];
  salesInvoices: SalesInvoice[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceivingNote[];
  recoveries: CustomerRecovery[];
  companyPayments: CompanyPayment[];
  claims: CompanyClaim[];
  salesReturns: SalesReturn[];
  schemes: PromotionalScheme[];
  bankAccounts: BankAccount[];
  vouchers: AccountingVoucher[];
  vehicles: DeliveryVehicle[];
  employees: Employee[];
  auditLogs: AuditLog[];
  settings: SystemSettings;

  // Notifications
  notifications: SystemNotification[];

  // Mutators & Business Operations
  addSalesInvoice: (invoice: Omit<SalesInvoice, 'id' | 'createdAt' | 'createdBy'>) => { success: boolean; error?: string; invoice?: SalesInvoice };
  cancelSalesInvoice: (invoiceId: string, reason: string) => boolean;
  addGoodsReceivingNote: (grn: Omit<GoodsReceivingNote, 'id' | 'status' | 'verifiedBy'>) => GoodsReceivingNote;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => PurchaseOrder;
  addCustomerRecovery: (recovery: Omit<CustomerRecovery, 'id' | 'createdAt' | 'createdBy'>) => CustomerRecovery;
  addCompanyPayment: (payment: Omit<CompanyPayment, 'id' | 'createdBy'>) => CompanyPayment;
  addCompanyClaim: (claim: Omit<CompanyClaim, 'id'>) => CompanyClaim;
  updateClaimStatus: (claimId: string, status: CompanyClaim['status'], settledAmount?: number) => void;
  addSalesReturn: (ret: Omit<SalesReturn, 'id'>) => SalesReturn;
  addStockAdjustment: (batchId: string, quantityDelta: number, reason: string) => void;
  addNewBatch: (batch: Omit<StockBatch, 'id'>) => StockBatch;

  // CRUD
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  addCompany: (company: Omit<PharmaCompany, 'id'>) => PharmaCompany;
  updateCompany: (id: string, company: Partial<PharmaCompany>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  addScheme: (scheme: Omit<PromotionalScheme, 'id'>) => PromotionalScheme;
  addVoucher: (voucher: Omit<AccountingVoucher, 'id' | 'createdBy'>) => AccountingVoucher;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;

  // Smart Helpers
  getFEFOBatchesForProduct: (productId: string, requestedQty: number) => {
    allocatedBatches: { batch: StockBatch; allocateQty: number }[];
    totalAvailable: number;
    sufficientStock: boolean;
  };
  getCalculatedSchemeBonus: (productId: string, quantity: number) => { bonusQty: number; discountPercent: number; schemeName?: string };

  // Utilities
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const PDMSContext = createContext<PDMSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pharma_pdms_data_v1';

export const PDMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Active User & RBAC
  const [currentUser, setCurrentUser] = useState<UserSession>({
    id: 'usr-admin-01',
    name: 'Muhammad Tariq Chaudhry',
    email: 'tariq.chaudhry@shaheenpharmadist.com.pk',
    role: 'Distribution Owner',
    territory: 'Lahore Division (Central)',
    avatarUrl: ''
  });

  const setCurrentRole = (role: UserRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role,
      name:
        role === 'Accountant'
          ? 'Khalid Hussain (Lead Accountant)'
          : role === 'Sales Representative'
          ? 'Muhammad Usman Tariq (Field Sales Rep)'
          : role === 'Warehouse Manager'
          ? 'Muhammad Arshad (Warehouse Head)'
          : role === 'Sales Manager'
          ? 'Kamran Ashraf (Regional Sales Head)'
          : 'Muhammad Tariq Chaudhry'
    }));
  };

  // Global Company Filter
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');

  // Load from local storage or fallback to initial dataset
  const [companies, setCompanies] = useState<PharmaCompany[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [batches, setBatches] = useState<StockBatch[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_batches');
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_warehouses');
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [salesReps, setSalesReps] = useState<SalesRep[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_salesReps');
    return saved ? JSON.parse(saved) : initialSalesReps;
  });

  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_salesInvoices');
    return saved ? JSON.parse(saved) : initialSalesInvoices;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_purchaseOrders');
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [grns, setGrns] = useState<GoodsReceivingNote[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_grns');
    return saved ? JSON.parse(saved) : initialGRNs;
  });

  const [recoveries, setRecoveries] = useState<CustomerRecovery[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_recoveries');
    return saved ? JSON.parse(saved) : initialRecoveries;
  });

  const [companyPayments, setCompanyPayments] = useState<CompanyPayment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_companyPayments');
    return saved ? JSON.parse(saved) : initialCompanyPayments;
  });

  const [claims, setClaims] = useState<CompanyClaim[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_claims');
    return saved ? JSON.parse(saved) : initialClaims;
  });

  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_salesReturns');
    return saved ? JSON.parse(saved) : initialSalesReturns;
  });

  const [schemes, setSchemes] = useState<PromotionalScheme[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_schemes');
    return saved ? JSON.parse(saved) : initialSchemes;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_bankAccounts');
    return saved ? JSON.parse(saved) : initialBankAccounts;
  });

  const [vouchers, setVouchers] = useState<AccountingVoucher[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_vouchers');
    return saved ? JSON.parse(saved) : initialVouchers;
  });

  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_vehicles');
    return saved ? JSON.parse(saved) : initialVehicles;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_auditLogs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_companies', JSON.stringify(companies));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_products', JSON.stringify(products));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_batches', JSON.stringify(batches));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_warehouses', JSON.stringify(warehouses));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_customers', JSON.stringify(customers));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_salesReps', JSON.stringify(salesReps));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_salesInvoices', JSON.stringify(salesInvoices));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_purchaseOrders', JSON.stringify(purchaseOrders));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_grns', JSON.stringify(grns));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_recoveries', JSON.stringify(recoveries));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_companyPayments', JSON.stringify(companyPayments));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_claims', JSON.stringify(claims));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_salesReturns', JSON.stringify(salesReturns));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_schemes', JSON.stringify(schemes));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_bankAccounts', JSON.stringify(bankAccounts));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_vouchers', JSON.stringify(vouchers));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_vehicles', JSON.stringify(vehicles));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_employees', JSON.stringify(employees));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_auditLogs', JSON.stringify(auditLogs));
    localStorage.setItem(LOCAL_STORAGE_KEY + '_settings', JSON.stringify(settings));
  }, [
    companies,
    products,
    batches,
    warehouses,
    customers,
    salesReps,
    salesInvoices,
    purchaseOrders,
    grns,
    recoveries,
    companyPayments,
    claims,
    salesReturns,
    schemes,
    bankAccounts,
    vouchers,
    vehicles,
    employees,
    auditLogs,
    settings
  ]);

  // Append audit helper
  const logAudit = (module: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      module,
      action,
      details,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper: FEFO calculation
  const getFEFOBatchesForProduct = (productId: string, requestedQty: number) => {
    // Filter active batches for this product with available qty > 0, sorted by expiryDate ascending (FEFO)
    const validBatches = batches
      .filter(b => b.productId === productId && b.availableQuantity > 0 && b.status !== 'Expired' && b.status !== 'Quarantined')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    let remainingNeeded = requestedQty;
    const allocatedBatches: { batch: StockBatch; allocateQty: number }[] = [];
    let totalAvailable = 0;

    for (const b of validBatches) {
      totalAvailable += b.availableQuantity;
      if (remainingNeeded > 0) {
        const take = Math.min(remainingNeeded, b.availableQuantity);
        allocatedBatches.push({ batch: b, allocateQty: take });
        remainingNeeded -= take;
      }
    }

    return {
      allocatedBatches,
      totalAvailable,
      sufficientStock: remainingNeeded <= 0
    };
  };

  // Helper: Scheme bonus calculation
  const getCalculatedSchemeBonus = (productId: string, quantity: number) => {
    const activeScheme = schemes.find(s => s.productId === productId && s.isActive);
    if (!activeScheme) {
      return { bonusQty: 0, discountPercent: 0 };
    }

    if (activeScheme.schemeType === 'Buy X Get Y Free' && activeScheme.buyQuantity > 0) {
      const sets = Math.floor(quantity / activeScheme.buyQuantity);
      const bonusQty = sets * activeScheme.freeQuantity;
      return { bonusQty, discountPercent: 0, schemeName: activeScheme.schemeName };
    }

    if (activeScheme.schemeType === 'Percentage Slab' && quantity >= activeScheme.buyQuantity) {
      return { bonusQty: 0, discountPercent: activeScheme.discountPercent || 0, schemeName: activeScheme.schemeName };
    }

    return { bonusQty: 0, discountPercent: 0 };
  };

  // Core Operation: Add Sales Invoice
  const addSalesInvoice = (invoiceData: Omit<SalesInvoice, 'id' | 'createdAt' | 'createdBy'>) => {
    const targetCustomer = customers.find(c => c.id === invoiceData.customerId);
    if (!targetCustomer) {
      return { success: false, error: 'Customer not found' };
    }

    // Check credit limit if payment method is Credit
    if (invoiceData.paymentMethod === 'Credit') {
      const projectedBalance = targetCustomer.currentBalance + invoiceData.balanceDue;
      if (projectedBalance > targetCustomer.creditLimit && settings.requireCreditLimitOverrideApproval) {
        // If owner or manager, allow with logged override, else reject
        if (currentUser.role !== 'Distribution Owner' && currentUser.role !== 'Super Administrator' && currentUser.role !== 'Distribution Manager') {
          return {
            success: false,
            error: `Credit limit exceeded! Store limit: Rs. ${targetCustomer.creditLimit.toLocaleString()}, Current Balance: Rs. ${targetCustomer.currentBalance.toLocaleString()}. Requires Owner or Distribution Manager override approval.`
          };
        }
      }
    }

    // Check batch quantities availability and reduce stock atomically
    const batchUpdates: { [batchId: string]: number } = {};
    for (const item of invoiceData.items) {
      const totalUnits = item.quantity + (item.bonusQuantity || 0);
      batchUpdates[item.batchId] = (batchUpdates[item.batchId] || 0) + totalUnits;
    }

    for (const [bId, deduction] of Object.entries(batchUpdates)) {
      const batchObj = batches.find(b => b.id === bId);
      if (!batchObj || batchObj.availableQuantity < deduction) {
        return {
          success: false,
          error: `Insufficient stock for Batch ${batchObj ? batchObj.batchNumber : bId}. Available: ${batchObj ? batchObj.availableQuantity : 0}, Requested: ${deduction}`
        };
      }
    }

    // Deduct batches
    setBatches(prev =>
      prev.map(b => {
        if (batchUpdates[b.id]) {
          const newQty = b.availableQuantity - batchUpdates[b.id];
          return {
            ...b,
            availableQuantity: newQty,
            status: newQty === 0 ? b.status : b.status
          };
        }
        return b;
      })
    );

    // Update Customer Balance
    const newCustomerBalance = targetCustomer.currentBalance + invoiceData.balanceDue;
    setCustomers(prev =>
      prev.map(c => (c.id === targetCustomer.id ? { ...c, currentBalance: newCustomerBalance } : c))
    );

    // Update Sales Rep sales volume
    if (invoiceData.salesRepId) {
      setSalesReps(prev =>
        prev.map(r =>
          r.id === invoiceData.salesRepId
            ? { ...r, currentMonthSales: r.currentMonthSales + invoiceData.netPayable }
            : r
        )
      );
    }

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };

    setSalesInvoices(prev => [newInvoice, ...prev]);

    // If paid upfront in cash, create Cash Receipt Voucher (CRV)
    if (invoiceData.paidAmount > 0) {
      const newVoucher: AccountingVoucher = {
        id: `vch-${Date.now()}`,
        voucherNumber: `CRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        voucherType: 'CRV',
        date: invoiceData.date,
        accountHead: `Sales Collection - ${targetCustomer.storeName}`,
        category: 'Revenue',
        description: `Upfront payment on Invoice ${newInvoice.invoiceNumber}`,
        debit: invoiceData.paidAmount,
        credit: 0,
        referenceDoc: newInvoice.invoiceNumber,
        createdBy: currentUser.name
      };
      setVouchers(prev => [newVoucher, ...prev]);
    }

    logAudit(
      'Sales Invoicing',
      'INVOICE_GENERATED',
      `Invoice #${newInvoice.invoiceNumber} created for ${targetCustomer.storeName}. Net: Rs. ${newInvoice.netPayable.toLocaleString()}, Items: ${newInvoice.items.length}`
    );

    return { success: true, invoice: newInvoice };
  };

  // Cancel Sales Invoice
  const cancelSalesInvoice = (invoiceId: string, reason: string) => {
    const inv = salesInvoices.find(i => i.id === invoiceId);
    if (!inv || inv.status === 'Cancelled') return false;

    // Restore batch stock
    setBatches(prev =>
      prev.map(b => {
        const itemMatches = inv.items.filter(item => item.batchId === b.id);
        if (itemMatches.length > 0) {
          const restoreTotal = itemMatches.reduce((acc, curr) => acc + curr.quantity + (curr.bonusQuantity || 0), 0);
          return { ...b, availableQuantity: b.availableQuantity + restoreTotal };
        }
        return b;
      })
    );

    // Revert customer balance
    setCustomers(prev =>
      prev.map(c =>
        c.id === inv.customerId
          ? { ...c, currentBalance: Math.max(0, c.currentBalance - inv.balanceDue) }
          : c
      )
    );

    setSalesInvoices(prev =>
      prev.map(i => (i.id === invoiceId ? { ...i, status: 'Cancelled', remarks: `Cancelled: ${reason}` } : i))
    );

    logAudit('Sales Invoicing', 'INVOICE_CANCELLED', `Invoice #${inv.invoiceNumber} cancelled. Reason: ${reason}`);
    return true;
  };

  // Add GRN (Stock Receiving & Automatic Batch Update)
  const addGoodsReceivingNote = (grnData: Omit<GoodsReceivingNote, 'id' | 'status' | 'verifiedBy'>) => {
    const newGrn: GoodsReceivingNote = {
      ...grnData,
      id: `grn-${Date.now()}`,
      status: 'Stock Verified',
      verifiedBy: currentUser.name
    };

    // Update or add batches
    const updatedBatches = [...batches];
    for (const item of newGrn.items) {
      const existingBatchIndex = updatedBatches.findIndex(
        b => b.productId === item.productId && b.batchNumber.toLowerCase() === item.batchNumber.toLowerCase()
      );

      const isNearExpiry = new Date(item.expiryDate).getTime() - new Date().getTime() <= 90 * 24 * 60 * 60 * 1000;
      const initialStatus = isNearExpiry ? 'Near Expiry' : 'Active';

      if (existingBatchIndex >= 0) {
        updatedBatches[existingBatchIndex] = {
          ...updatedBatches[existingBatchIndex],
          availableQuantity:
            updatedBatches[existingBatchIndex].availableQuantity + item.receivedQuantity + item.bonusQuantity,
          initialQuantity:
            updatedBatches[existingBatchIndex].initialQuantity + item.receivedQuantity + item.bonusQuantity,
          damagedQuantity:
            updatedBatches[existingBatchIndex].damagedQuantity + item.damagedQuantity
        };
      } else {
        const newBatch: StockBatch = {
          id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          batchNumber: item.batchNumber,
          productId: item.productId,
          companyId: newGrn.companyId,
          warehouseId: newGrn.warehouseId,
          rackShelf: 'RACK-GEN-01',
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
          purchaseRate: item.purchaseRate,
          sellingRate: item.tradePrice,
          initialQuantity: item.receivedQuantity + item.bonusQuantity,
          availableQuantity: item.receivedQuantity + item.bonusQuantity,
          reservedQuantity: 0,
          damagedQuantity: item.damagedQuantity,
          status: initialStatus
        };
        updatedBatches.push(newBatch);
      }
    }

    setBatches(updatedBatches);
    setGrns(prev => [newGrn, ...prev]);

    // Create purchase bill voucher
    const newVoucher: AccountingVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber: `PV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      voucherType: 'JV',
      date: newGrn.receivingDate,
      accountHead: `Company Payable (${newGrn.companyName})`,
      category: 'Liability',
      description: `Stock received via GRN ${newGrn.grnNumber} against Supplier Inv ${newGrn.supplierInvoiceNumber}`,
      debit: 0,
      credit: newGrn.netTotal,
      referenceDoc: newGrn.grnNumber,
      createdBy: currentUser.name
    };
    setVouchers(prev => [newVoucher, ...prev]);

    logAudit(
      'Goods Receiving (GRN)',
      'GRN_VERIFIED',
      `GRN #${newGrn.grnNumber} verified for ${newGrn.companyName}. Stock credited: Rs. ${newGrn.netTotal.toLocaleString()}`
    );

    return newGrn;
  };

  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id'>) => {
    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`
    };
    setPurchaseOrders(prev => [newPo, ...prev]);
    logAudit('Purchase Management', 'PO_CREATED', `Purchase Order #${newPo.poNumber} placed with ${newPo.companyName}`);
    return newPo;
  };

  // Add Customer Recovery (Payment collection)
  const addCustomerRecovery = (recData: Omit<CustomerRecovery, 'id' | 'createdAt' | 'createdBy'>) => {
    const newRec: CustomerRecovery = {
      ...recData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };

    // Deduct customer current balance
    setCustomers(prev =>
      prev.map(c => (c.id === newRec.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - newRec.amount) } : c))
    );

    // If allocated against invoices, adjust invoice paidAmount & status
    if (newRec.allocatedInvoices && newRec.allocatedInvoices.length > 0) {
      setSalesInvoices(prev =>
        prev.map(inv => {
          const allocation = newRec.allocatedInvoices.find(a => a.invoiceId === inv.id);
          if (allocation) {
            const updatedPaid = inv.paidAmount + allocation.amountAllocated;
            const updatedBalance = Math.max(0, inv.netPayable - updatedPaid);
            const updatedStatus = updatedBalance <= 0 ? 'Paid' : 'Partially Paid';
            return {
              ...inv,
              paidAmount: updatedPaid,
              balanceDue: updatedBalance,
              status: updatedStatus
            };
          }
          return inv;
        })
      );
    }

    // Update sales rep recovery
    if (newRec.salesRepId) {
      setSalesReps(prev =>
        prev.map(r =>
          r.id === newRec.salesRepId ? { ...r, currentMonthRecovery: r.currentMonthRecovery + newRec.amount } : r
        )
      );
    }

    // Post to accounting voucher
    const vchType = newRec.paymentMethod === 'Cash' ? 'CRV' : 'BRV';
    const newVoucher: AccountingVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber: `${vchType}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      voucherType: vchType,
      date: newRec.paymentDate,
      accountHead: `Customer Collection (${newRec.customerName})`,
      category: 'Asset',
      description: `Recovery collection via ${newRec.paymentMethod}${newRec.chequeNumber ? ' Chq #' + newRec.chequeNumber : ''}`,
      debit: newRec.amount,
      credit: 0,
      referenceDoc: newRec.receiptNumber,
      createdBy: currentUser.name
    };
    setVouchers(prev => [newVoucher, ...prev]);

    setRecoveries(prev => [newRec, ...prev]);
    logAudit(
      'Recovery & Receivables',
      'PAYMENT_COLLECTED',
      `Receipt #${newRec.receiptNumber} of Rs. ${newRec.amount.toLocaleString()} received from ${newRec.customerName} via ${newRec.paymentMethod}`
    );
    return newRec;
  };

  // Add Company Payment
  const addCompanyPayment = (payData: Omit<CompanyPayment, 'id' | 'createdBy'>) => {
    const newPay: CompanyPayment = {
      ...payData,
      id: `cpay-${Date.now()}`,
      createdBy: currentUser.name
    };

    // Deduct bank account
    setBankAccounts(prev =>
      prev.map(b => (b.id === newPay.bankAccountId ? { ...b, currentBalance: b.currentBalance - newPay.amount } : b))
    );

    // Create BPV voucher
    const newVoucher: AccountingVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber: newPay.voucherNumber,
      voucherType: 'BPV',
      date: newPay.paymentDate,
      accountHead: `Company Settlement (${newPay.companyName})`,
      category: 'Liability',
      description: `Payment to ${newPay.companyName} via ${newPay.paymentMethod} Ref: ${newPay.transactionReference}`,
      debit: newPay.amount,
      credit: 0,
      referenceDoc: newPay.voucherNumber,
      createdBy: currentUser.name
    };
    setVouchers(prev => [newVoucher, ...prev]);

    setCompanyPayments(prev => [newPay, ...prev]);
    logAudit(
      'Company Payables',
      'PAYMENT_DISBURSED',
      `Disbursed Rs. ${newPay.amount.toLocaleString()} to ${newPay.companyName} via ${newPay.paymentMethod}`
    );
    return newPay;
  };

  // Add Company Claim
  const addCompanyClaim = (claimData: Omit<CompanyClaim, 'id'>) => {
    const newClaim: CompanyClaim = {
      ...claimData,
      id: `clm-${Date.now()}`
    };
    setClaims(prev => [newClaim, ...prev]);
    logAudit(
      'Company Claims',
      'CLAIM_FILED',
      `Claim #${newClaim.claimNumber} (${newClaim.claimType}) submitted to ${newClaim.companyName} for Rs. ${newClaim.claimAmount.toLocaleString()}`
    );
    return newClaim;
  };

  // Update Claim Status
  const updateClaimStatus = (claimId: string, status: CompanyClaim['status'], settledAmount?: number) => {
    setClaims(prev =>
      prev.map(c => {
        if (c.id === claimId) {
          return {
            ...c,
            status,
            settledAmount: settledAmount !== undefined ? settledAmount : c.settledAmount,
            settlementDate: status === 'Settled' || status === 'Approved' ? new Date().toISOString().split('T')[0] : c.settlementDate
          };
        }
        return c;
      })
    );
    logAudit('Company Claims', 'CLAIM_STATUS_UPDATED', `Claim ID ${claimId} marked as ${status}`);
  };

  // Add Sales Return
  const addSalesReturn = (returnData: Omit<SalesReturn, 'id'>) => {
    const newReturn: SalesReturn = {
      ...returnData,
      id: `ret-${Date.now()}`
    };

    // If condition is saleable, restore to batch stock
    setBatches(prev =>
      prev.map(b => {
        const itemMatches = newReturn.items.filter(
          item => item.batchNumber.toLowerCase() === b.batchNumber.toLowerCase() && item.condition === 'Saleable'
        );
        if (itemMatches.length > 0) {
          const addQty = itemMatches.reduce((acc, curr) => acc + curr.quantity, 0);
          return { ...b, availableQuantity: b.availableQuantity + addQty };
        }
        return b;
      })
    );

    // Adjust customer balance
    setCustomers(prev =>
      prev.map(c =>
        c.id === newReturn.customerId
          ? { ...c, currentBalance: Math.max(0, c.currentBalance - newReturn.totalAmount) }
          : c
      )
    );

    // Create Credit Note Voucher
    const newVoucher: AccountingVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber: newReturn.creditNoteNumber,
      voucherType: 'JV',
      date: newReturn.returnDate,
      accountHead: `Sales Return Credit (${newReturn.customerName})`,
      category: 'Revenue',
      description: `Sales Return Credit Note ${newReturn.creditNoteNumber} against ${newReturn.invoiceNumber || 'Manual Return'}`,
      debit: 0,
      credit: newReturn.totalAmount,
      referenceDoc: newReturn.creditNoteNumber,
      createdBy: currentUser.name
    };
    setVouchers(prev => [newVoucher, ...prev]);

    setSalesReturns(prev => [newReturn, ...prev]);
    logAudit(
      'Sales Returns',
      'RETURN_PROCESSED',
      `Sales Return #${newReturn.returnNumber} from ${newReturn.customerName} processed. Credit Note: ${newReturn.creditNoteNumber}`
    );
    return newReturn;
  };

  // Stock Adjustment
  const addStockAdjustment = (batchId: string, quantityDelta: number, reason: string) => {
    setBatches(prev =>
      prev.map(b => {
        if (b.id === batchId) {
          const updated = Math.max(0, b.availableQuantity + quantityDelta);
          return { ...b, availableQuantity: updated };
        }
        return b;
      })
    );
    const targetBatch = batches.find(b => b.id === batchId);
    logAudit(
      'Inventory Management',
      'STOCK_ADJUSTMENT',
      `Adjusted batch ${targetBatch?.batchNumber || batchId} by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}. Reason: ${reason}`
    );
  };

  // Add new batch manually
  const addNewBatch = (batchData: Omit<StockBatch, 'id'>) => {
    const newBatch: StockBatch = {
      ...batchData,
      id: `batch-${Date.now()}`
    };
    setBatches(prev => [newBatch, ...prev]);
    logAudit('Inventory Management', 'BATCH_CREATED', `New batch ${newBatch.batchNumber} added with Qty: ${newBatch.initialQuantity}`);
    return newBatch;
  };

  // CRUD handlers
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProd: Product = { ...p, id: `prod-${Date.now()}` };
    setProducts(prev => [...prev, newProd]);
    logAudit('Product Master', 'PRODUCT_ADDED', `Product ${newProd.name} (${newProd.code}) added`);
    return newProd;
  };

  const updateProduct = (id: string, p: Partial<Product>) => {
    setProducts(prev => prev.map(item => (item.id === id ? { ...item, ...p } : item)));
    logAudit('Product Master', 'PRODUCT_UPDATED', `Product ID ${id} modified`);
  };

  const addCompany = (c: Omit<PharmaCompany, 'id'>) => {
    const newComp: PharmaCompany = { ...c, id: `comp-${Date.now()}` };
    setCompanies(prev => [...prev, newComp]);
    logAudit('Company Management', 'COMPANY_ADDED', `Company ${newComp.name} added`);
    return newComp;
  };

  const updateCompany = (id: string, c: Partial<PharmaCompany>) => {
    setCompanies(prev => prev.map(item => (item.id === id ? { ...item, ...c } : item)));
    logAudit('Company Management', 'COMPANY_UPDATED', `Company ID ${id} modified`);
  };

  const addCustomer = (cust: Omit<Customer, 'id'>) => {
    const newCust: Customer = { ...cust, id: `cust-${Date.now()}` };
    setCustomers(prev => [...prev, newCust]);
    logAudit('Customer Management', 'CUSTOMER_ADDED', `Customer ${newCust.storeName} (${newCust.code}) added`);
    return newCust;
  };

  const updateCustomer = (id: string, cust: Partial<Customer>) => {
    setCustomers(prev => prev.map(item => (item.id === id ? { ...item, ...cust } : item)));
    logAudit('Customer Management', 'CUSTOMER_UPDATED', `Customer ID ${id} modified`);
  };

  const addScheme = (s: Omit<PromotionalScheme, 'id'>) => {
    const newScheme: PromotionalScheme = { ...s, id: `sch-${Date.now()}` };
    setSchemes(prev => [...prev, newScheme]);
    logAudit('Schemes & Bonuses', 'SCHEME_CREATED', `Scheme ${newScheme.schemeName} initiated`);
    return newScheme;
  };

  const addVoucher = (v: Omit<AccountingVoucher, 'id' | 'createdBy'>) => {
    const newVch: AccountingVoucher = { ...v, id: `vch-${Date.now()}`, createdBy: currentUser.name };
    setVouchers(prev => [newVch, ...prev]);
    logAudit('Financial Accounting', 'VOUCHER_POSTED', `Voucher #${newVch.voucherNumber} (${newVch.voucherType}) posted`);
    return newVch;
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logAudit('System Settings', 'SETTINGS_UPDATED', 'Distribution system configuration updated');
  };

  // Reset demo data
  const resetToDemoData = () => {
    localStorage.clear();
    setCompanies(initialCompanies);
    setProducts(initialProducts);
    setBatches(initialBatches);
    setWarehouses(initialWarehouses);
    setCustomers(initialCustomers);
    setSalesReps(initialSalesReps);
    setSalesInvoices(initialSalesInvoices);
    setPurchaseOrders(initialPurchaseOrders);
    setGrns(initialGRNs);
    setRecoveries(initialRecoveries);
    setCompanyPayments(initialCompanyPayments);
    setClaims(initialClaims);
    setSalesReturns(initialSalesReturns);
    setSchemes(initialSchemes);
    setBankAccounts(initialBankAccounts);
    setVouchers(initialVouchers);
    setVehicles(initialVehicles);
    setEmployees(initialEmployees);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    logAudit('Backup & Restore', 'SYSTEM_RESET', 'All modules restored to initial Pakistani Pharma distribution baseline');
  };

  const exportDatabaseJSON = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      distributionName: settings.distributionName,
      companies,
      products,
      batches,
      warehouses,
      customers,
      salesReps,
      salesInvoices,
      purchaseOrders,
      grns,
      recoveries,
      companyPayments,
      claims,
      salesReturns,
      schemes,
      bankAccounts,
      vouchers,
      vehicles,
      employees,
      auditLogs,
      settings
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.companies || !data.products || !data.batches) {
        throw new Error('Invalid PDMS backup structure');
      }
      setCompanies(data.companies);
      setProducts(data.products);
      setBatches(data.batches);
      if (data.warehouses) setWarehouses(data.warehouses);
      if (data.customers) setCustomers(data.customers);
      if (data.salesReps) setSalesReps(data.salesReps);
      if (data.salesInvoices) setSalesInvoices(data.salesInvoices);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.grns) setGrns(data.grns);
      if (data.recoveries) setRecoveries(data.recoveries);
      if (data.companyPayments) setCompanyPayments(data.companyPayments);
      if (data.claims) setClaims(data.claims);
      if (data.salesReturns) setSalesReturns(data.salesReturns);
      if (data.schemes) setSchemes(data.schemes);
      if (data.bankAccounts) setBankAccounts(data.bankAccounts);
      if (data.vouchers) setVouchers(data.vouchers);
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.employees) setEmployees(data.employees);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.settings) setSettings(data.settings);

      logAudit('Backup & Restore', 'BACKUP_RESTORED', 'Full database restored from JSON backup archive');
      return true;
    } catch {
      return false;
    }
  };

  // Real-time computed notifications
  const notifications = useMemo(() => {
    const list: SystemNotification[] = [];
    const now = new Date().getTime();

    // 1. Expiry alerts
    for (const b of batches) {
      if (b.availableQuantity > 0) {
        const expTime = new Date(b.expiryDate).getTime();
        const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        const prod = products.find(p => p.id === b.productId);
        const comp = companies.find(c => c.id === b.companyId);

        if (diffDays <= 0) {
          list.push({
            id: `notif-exp-${b.id}`,
            type: 'expiry',
            severity: 'critical',
            title: `Batch Expired: ${b.batchNumber}`,
            message: `${prod?.name || 'Product'} (${comp?.shortCode || ''}) expired on ${b.expiryDate}. ${b.availableQuantity} units require quarantine/claim.`,
            timestamp: new Date().toISOString(),
            linkModule: 'claims'
          });
        } else if (diffDays <= settings.nearExpiryThresholdDays) {
          list.push({
            id: `notif-near-${b.id}`,
            type: 'expiry',
            severity: diffDays <= settings.criticalExpiryDays ? 'high' : 'medium',
            title: `Near Expiry (${diffDays} days): ${b.batchNumber}`,
            message: `${prod?.name || 'Product'} expires in ${diffDays} days (${b.expiryDate}). Prioritize dispatch via FEFO.`,
            timestamp: new Date().toISOString(),
            linkModule: 'inventory'
          });
        }
      }
    }

    // 2. Customer credit limit alerts
    for (const c of customers) {
      if (c.currentBalance > c.creditLimit) {
        list.push({
          id: `notif-credit-${c.id}`,
          type: 'credit',
          severity: 'high',
          title: `Credit Limit Exceeded: ${c.storeName}`,
          message: `Current Balance: Rs. ${c.currentBalance.toLocaleString()} exceeds authorized credit limit of Rs. ${c.creditLimit.toLocaleString()}.`,
          timestamp: new Date().toISOString(),
          linkModule: 'customers'
        });
      }
    }

    // 3. Low stock alerts
    for (const p of products) {
      const totalStock = batches
        .filter(b => b.productId === p.id && b.status !== 'Expired')
        .reduce((acc, curr) => acc + curr.availableQuantity, 0);

      if (totalStock <= p.reorderLevel) {
        list.push({
          id: `notif-stock-${p.id}`,
          type: 'stock',
          severity: totalStock === 0 ? 'critical' : 'medium',
          title: totalStock === 0 ? `Stockout Alert: ${p.name}` : `Reorder Level Reached: ${p.name}`,
          message: `Current available: ${totalStock} ${p.unitOfMeasure}s (Reorder Level: ${p.reorderLevel}). Generate PO to prevent shortage.`,
          timestamp: new Date().toISOString(),
          linkModule: 'purchases'
        });
      }
    }

    // 4. Pending Claims
    const underReviewClaims = claims.filter(c => c.status === 'Under Review' || c.status === 'Submitted');
    if (underReviewClaims.length > 0) {
      list.push({
        id: 'notif-claims-pending',
        type: 'claim',
        severity: 'low',
        title: `${underReviewClaims.length} Claims Awaiting Settlement`,
        message: `Totaling Rs. ${underReviewClaims.reduce((a, b) => a + b.claimAmount, 0).toLocaleString()} submitted to pharmaceutical principals.`,
        timestamp: new Date().toISOString(),
        linkModule: 'claims'
      });
    }

    return list;
  }, [batches, products, companies, customers, claims, settings]);

  return (
    <PDMSContext.Provider
      value={{
        currentUser,
        setCurrentRole,
        selectedCompanyFilter,
        setSelectedCompanyFilter,
        isDarkMode,
        toggleDarkMode,
        companies,
        products,
        batches,
        warehouses,
        customers,
        salesReps,
        salesInvoices,
        purchaseOrders,
        grns,
        recoveries,
        companyPayments,
        claims,
        salesReturns,
        schemes,
        bankAccounts,
        vouchers,
        vehicles,
        employees,
        auditLogs,
        settings,
        notifications,
        addSalesInvoice,
        cancelSalesInvoice,
        addGoodsReceivingNote,
        addPurchaseOrder,
        addCustomerRecovery,
        addCompanyPayment,
        addCompanyClaim,
        updateClaimStatus,
        addSalesReturn,
        addStockAdjustment,
        addNewBatch,
        addProduct,
        updateProduct,
        addCompany,
        updateCompany,
        addCustomer,
        updateCustomer,
        addScheme,
        addVoucher,
        updateSettings,
        getFEFOBatchesForProduct,
        getCalculatedSchemeBonus,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON
      }}
    >
      {children}
    </PDMSContext.Provider>
  );
};

export const usePDMS = () => {
  const context = useContext(PDMSContext);
  if (!context) {
    throw new Error('usePDMS must be used within a PDMSProvider');
  }
  return context;
};
