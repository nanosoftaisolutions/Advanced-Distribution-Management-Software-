export type UserRole =
  | 'Super Administrator'
  | 'Distribution Owner'
  | 'Distribution Manager'
  | 'Accountant'
  | 'Sales Manager'
  | 'Sales Representative'
  | 'Recovery Officer'
  | 'Warehouse Manager'
  | 'Storekeeper'
  | 'Purchase Officer'
  | 'Auditor';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  territory?: string;
  avatarUrl?: string;
}

export interface PharmaCompany {
  id: string;
  name: string;
  shortCode: string;
  logoText: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  salesManager: string;
  regionalManager: string;
  ntn: string;
  gstNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  paymentTermsDays: number;
  creditLimit: number;
  commissionPercentage: number;
  discountPolicy: string;
  expiryReturnPolicy: string;
  damageReturnPolicy: string;
  salesTargetMonthly: number;
  remarks: string;
  isActive: boolean;
}

export type DosageCategory =
  | 'Tablets'
  | 'Capsules'
  | 'Syrups'
  | 'Suspensions'
  | 'Injections'
  | 'Infusions'
  | 'Creams'
  | 'Ointments'
  | 'Drops'
  | 'Eye Drops'
  | 'Sachets'
  | 'Nutraceuticals'
  | 'Medical Devices';

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  genericName: string;
  companyId: string;
  category: DosageCategory;
  dosageForm: string;
  strength: string;
  packSize: string;
  unitOfMeasure: string;
  mrp: number; // Maximum Retail Price
  tradePrice: number; // TP
  purchasePrice: number; // Cost from manufacturer
  wholesalePrice: number;
  gstPercent: number; // 0, 1, 18% etc.
  isRefrigerated: boolean; // Cold chain 2-8 C
  isControlled: boolean; // Schedule G / Narcotic
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  rackLocation: string;
  isActive: boolean;
  totalAvailableStock?: number;
}

export interface StockBatch {
  id: string;
  batchNumber: string;
  productId: string;
  companyId: string;
  warehouseId: string;
  rackShelf: string;
  mfgDate: string;
  expiryDate: string;
  purchaseRate: number;
  sellingRate: number; // TP
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  status: 'Active' | 'Near Expiry' | 'Expired' | 'Quarantined';
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  managerName: string;
  contactNumber: string;
  hasColdStorage: boolean;
  totalRacks: number;
  isActive: boolean;
}

export type CustomerCategory =
  | 'Retail Pharmacy'
  | 'Medical Store'
  | 'Hospital Pharmacy'
  | 'Clinic'
  | 'Wholesale Dealer'
  | 'Institutional';

export interface Customer {
  id: string;
  code: string;
  name: string;
  storeName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  territory: string;
  category: CustomerCategory;
  salesRepId: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  drugSaleLicenseNumber: string;
  licenseExpiryDate: string;
  creditLimit: number;
  creditDays: number;
  currentBalance: number; // Positive = Receivable
  openingBalance: number;
  isActive: boolean;
}

export interface SalesRep {
  id: string;
  name: string;
  employeeCode: string;
  phone: string;
  cnic: string;
  assignedTerritories: string[];
  assignedCompanyIds: string[];
  monthlySalesTarget: number;
  commissionRate: number; // %
  monthlySalary: number;
  joiningDate: string;
  currentMonthSales: number;
  currentMonthRecovery: number;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  genericName: string;
  companyId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  packSize: string;
  quantity: number;
  bonusQuantity: number;
  mrp: number;
  tradePrice: number;
  discountPercentage: number;
  discountAmount: number;
  gstPercentage: number;
  gstAmount: number;
  netAmount: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerStoreName: string;
  customerLicense: string;
  customerNtn?: string;
  companyId: string; // Specific company or multi-company
  salesRepId: string;
  salesRepName: string;
  territory: string;
  warehouseId: string;
  items: SalesInvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  totalGst: number;
  netPayable: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: 'Cash' | 'Credit' | 'Bank Transfer' | 'Cheque';
  dueDate: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
  remarks?: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  bonusExpected: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  companyId: string;
  companyName: string;
  date: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Completed' | 'Cancelled';
  remarks?: string;
}

export interface GoodsReceivingNoteItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  receivedQuantity: number;
  bonusQuantity: number;
  damagedQuantity: number;
  purchaseRate: number;
  tradePrice: number;
  netAmount: number;
}

export interface GoodsReceivingNote {
  id: string;
  grnNumber: string;
  poNumber?: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  companyId: string;
  companyName: string;
  warehouseId: string;
  receivingDate: string;
  items: GoodsReceivingNoteItem[];
  subTotal: number;
  freightCharges: number;
  taxAmount: number;
  netTotal: number;
  status: 'Pending Verification' | 'Stock Verified' | 'Billed' | 'Rejected';
  verifiedBy: string;
  remarks?: string;
}

export interface CustomerRecovery {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Cash' | 'Cheque' | 'Bank Transfer' | 'Online Deposit';
  bankAccountId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  chequeStatus?: 'Cleared' | 'Pending' | 'Bounced';
  salesRepId: string;
  allocatedInvoices: {
    invoiceId: string;
    invoiceNumber: string;
    amountAllocated: number;
  }[];
  unallocatedAmount: number;
  remarks?: string;
  createdAt: string;
  createdBy: string;
}

export interface CompanyPayment {
  id: string;
  voucherNumber: string;
  companyId: string;
  companyName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Pay Order';
  bankAccountId: string;
  transactionReference: string;
  remarks?: string;
  createdBy: string;
}

export interface CompanyClaim {
  id: string;
  claimNumber: string;
  companyId: string;
  companyName: string;
  claimType: 'Expiry Return' | 'Damaged Goods' | 'Breakage' | 'Promotional / Scheme' | 'Short Supply' | 'Price Difference';
  submissionDate: string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  quantity?: number;
  claimAmount: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Partially Settled' | 'Settled' | 'Rejected';
  settledAmount: number;
  settlementDate?: string;
  supportingDocRef?: string;
  remarks?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  companyId: string;
  returnDate: string;
  items: {
    productId: string;
    productName: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    tradePrice: number;
    amount: number;
    condition: 'Saleable' | 'Damaged' | 'Expired';
  }[];
  totalAmount: number;
  creditNoteNumber: string;
  status: 'Inspected & Approved' | 'Pending Inspection' | 'Rejected';
  remarks?: string;
}

export interface PromotionalScheme {
  id: string;
  schemeName: string;
  companyId: string;
  companyName: string;
  schemeType: 'Buy X Get Y Free' | 'Percentage Slab' | 'Cash Rebate';
  productId: string;
  productName: string;
  buyQuantity: number;
  freeQuantity: number;
  discountPercent?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchName: string;
  currentBalance: number;
}

export interface AccountingVoucher {
  id: string;
  voucherNumber: string;
  voucherType: 'CPV' | 'CRV' | 'BPV' | 'BRV' | 'JV' | 'CONTRA'; // Cash Payment, Cash Receipt, Bank Payment, Bank Receipt, Journal, Contra
  date: string;
  accountHead: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
  debit: number;
  credit: number;
  referenceDoc?: string;
  createdBy: string;
}

export interface DeliveryVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string; // Suzuki Ravi, Shehzore, Hilux, Van
  driverName: string;
  driverPhone: string;
  routeAssigned: string;
  fuelBalancePKR: number;
  status: 'Available' | 'On Delivery' | 'Under Maintenance';
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  date: string;
  vehicleId: string;
  driverName: string;
  route: string;
  invoices: {
    invoiceNumber: string;
    customerStore: string;
    cartons: number;
    amount: number;
  }[];
  status: 'Dispatched' | 'Delivered' | 'Partially Delivered';
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  cnic: string;
  joiningDate: string;
  basicSalary: number;
  allowances: number;
  status: 'Active' | 'Resigned' | 'Terminated';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface SystemSettings {
  distributionName: string;
  distributorDrugLicense: string;
  distributionAddress: string;
  distributionCity: string;
  phone: string;
  email: string;
  ntn: string;
  strn: string;
  currency: string;
  currencySymbol: string;
  defaultGstRate: number;
  defaultWithholdingTaxRate: number;
  fbrIntegrationEnabled: boolean;
  nearExpiryThresholdDays: number;
  criticalExpiryDays: number;
  allowSalePastExpiry: boolean;
  strictFefoEnforced: boolean;
  requireCreditLimitOverrideApproval: boolean;
}
