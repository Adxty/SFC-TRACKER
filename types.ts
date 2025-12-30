
export type ExpenseCategory = 'Fuel' | 'Toll' | 'Maintenance' | 'Driver Salary' | 'Insurance' | 'Taxes/GST' | 'Permit' | 'Other';

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed';

export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'Fastag' | 'Credit Card' | 'UPI';

export interface Truck {
  id: string;
  regNumber: string;
  model: string;
  driverId: string;
  status: 'Active' | 'Maintenance' | 'Idle';
  totalKm: number;
  avgMonthlyKm: number;
  lastServiceKm: number;
  fuelCapacity?: number;
  insuranceExpiry: string;
  permitExpiry: string;
  pucExpiry: string;
  fitnessExpiry: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  rating?: number;
  tripsCompleted?: number;
  avgTripDuration?: string;
  onTimePercentage?: number;
  fuelEfficiencyRating?: number;
}

export interface Trip {
  id: string;
  truckId: string;
  driverId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate?: string;
  status: 'Loading' | 'On Road' | 'Delivered' | 'Cancelled';
  revenue: number;
  estimatedFuelCost: number;
  actualFuelCost?: number;
  tollCost?: number;
  distanceKm: number;
}

export interface Revenue {
  id: string;
  date: string;
  amount: number;
  customer: string;
  truckId: string;
  gstCollected: number;
  gstRate: number;
  invoiceNumber: string;
  tripId?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  subCategory: string;
  truckId: string;
  description: string;
  gstPaid: number;
  gstRate?: number;
  invoiceNumber?: string;
  hasInvoiceCopy: boolean;
  isBankTransaction: boolean;
  linkedBankTxnIds?: string[];
  paymentMethod: PaymentMethod;
  vendor?: string;
  tags?: string[];
  tripId?: string;
  liters?: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Linked' | 'Excluded';
  potentialMatchId?: string;
}

export interface MaintenanceRecord {
  id: string;
  truckId: string;
  scheduledDate: string;
  type: string;
  cost: number;
  status: MaintenanceStatus;
  description: string;
}

export interface TripLog {
  id: string;
  truckId: string;
  date: string;
  startKm: number;
  endKm: number;
  route: string;
  synced: boolean;
}

export interface IssueLog {
  id: string;
  truckId: string;
  date: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  synced: boolean;
}

export interface AppState {
  isPrivacyMode: boolean;
  language: string;
}
