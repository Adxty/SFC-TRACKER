
import { Truck, Driver, Expense, BankTransaction, MaintenanceRecord, Revenue, Trip } from './types';

export const MOCK_TRUCKS: Truck[] = [
  { id: 'T1', regNumber: 'MH-12-PQ-4567', model: 'Tata Prima 4028.S', driverId: 'D1', status: 'Active', totalKm: 48500, avgMonthlyKm: 5000, lastServiceKm: 42000, insuranceExpiry: '2024-12-15', permitExpiry: '2024-11-20', pucExpiry: '2024-09-10', fitnessExpiry: '2025-01-10' },
  { id: 'T2', regNumber: 'KA-01-RS-9876', model: 'Ashok Leyland 3520', driverId: 'D2', status: 'Active', totalKm: 32000, avgMonthlyKm: 4200, lastServiceKm: 30000, insuranceExpiry: '2024-10-05', permitExpiry: '2024-11-20', pucExpiry: '2024-05-30', fitnessExpiry: '2024-12-30' },
  { id: 'T3', regNumber: 'DL-04-XY-1234', model: 'BharatBenz 2823R', driverId: 'D3', status: 'Maintenance', totalKm: 12000, avgMonthlyKm: 2500, lastServiceKm: 11500, insuranceExpiry: '2024-07-22', permitExpiry: '2024-09-01', pucExpiry: '2024-07-15', fitnessExpiry: '2025-03-05' },
];

export const MOCK_TRIPS: Trip[] = [
  { id: 'TRIP1', truckId: 'T1', driverId: 'D1', origin: 'Mumbai', destination: 'Delhi', startDate: '2024-05-10', status: 'On Road', revenue: 95000, estimatedFuelCost: 35000, distanceKm: 1400 },
  { id: 'TRIP2', truckId: 'T2', driverId: 'D2', origin: 'Bangalore', destination: 'Chennai', startDate: '2024-05-14', endDate: '2024-05-15', status: 'Delivered', revenue: 25000, estimatedFuelCost: 8000, distanceKm: 350 },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'D1', name: 'Rajesh Kumar', phone: '9876543210', licenseNumber: 'MH1220200045', rating: 4.8, tripsCompleted: 142, avgTripDuration: '14.5 hrs', onTimePercentage: 96, fuelEfficiencyRating: 8.5 },
  { id: 'D2', name: 'Suresh Patil', phone: '8765432109', licenseNumber: 'KA0120190088', rating: 4.5, tripsCompleted: 98, avgTripDuration: '16.2 hrs', onTimePercentage: 92, fuelEfficiencyRating: 7.8 },
  { id: 'D3', name: 'Amit Singh', phone: '7654321098', licenseNumber: 'DL0420210022', rating: 4.2, tripsCompleted: 56, avgTripDuration: '18.1 hrs', onTimePercentage: 88, fuelEfficiencyRating: 6.9 },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'E1', date: '2024-05-15', amount: 15000, category: 'Fuel', subCategory: 'Diesel', truckId: 'T1', description: 'Diesel refill', gstPaid: 0, isBankTransaction: true, paymentMethod: 'Bank Transfer', vendor: 'HPCL Station', hasInvoiceCopy: true, gstRate: 18, liters: 162, tripId: 'TRIP1' },
  { id: 'E2', date: '2024-05-16', amount: 1200, category: 'Toll', subCategory: 'Fastag', truckId: 'T1', description: 'Mumbai-Pune Toll', gstPaid: 0, isBankTransaction: true, paymentMethod: 'Fastag', vendor: 'NHAI', hasInvoiceCopy: true, gstRate: 0, tripId: 'TRIP1' },
  { id: 'E3', date: '2024-05-14', amount: 8000, category: 'Maintenance', subCategory: 'Brake Service', truckId: 'T2', description: 'Brake pads', gstPaid: 1440, isBankTransaction: false, paymentMethod: 'Cash', vendor: 'Local Mechanic', hasInvoiceCopy: true, gstRate: 18 },
  { id: 'E4', date: '2024-05-05', amount: 12000, category: 'Fuel', subCategory: 'Diesel', truckId: 'T2', description: 'Refill', gstPaid: 2160, isBankTransaction: true, paymentMethod: 'UPI', vendor: 'Shell', hasInvoiceCopy: true, gstRate: 18, liters: 130 },
];

export const MOCK_REVENUES: Revenue[] = [
  { id: 'R1', date: '2024-05-10', amount: 85000, customer: 'Reliance Logistics', truckId: 'T1', gstCollected: 4250, gstRate: 5, invoiceNumber: 'INV/24/001', tripId: 'TRIP1' },
  { id: 'R2', date: '2024-05-15', amount: 62000, customer: 'Adani Ports', truckId: 'T2', gstCollected: 3100, gstRate: 5, invoiceNumber: 'INV/24/002', tripId: 'TRIP2' },
];

export const MOCK_BANK_TXNS: BankTransaction[] = [
  { id: 'BT1', date: '2024-05-17', amount: 5000, description: 'HPCL FUEL STRIPES', status: 'Pending' },
  { id: 'BT2', date: '2024-05-18', amount: 450, description: 'FASTAG RECHARGE - ICICI', status: 'Pending' },
  { id: 'BT3', date: '2024-05-19', amount: 8000, description: 'NEFT: LOCAL MECH', status: 'Pending', potentialMatchId: 'E3' },
];

export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  { id: 'M1', truckId: 'T1', scheduledDate: '2024-05-20', type: 'Oil Change', cost: 4500, status: 'Completed', description: 'Regular engine oil change' },
];

export interface CategoryDefinition {
  name: string;
  icon: string;
  subCategories: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  { name: 'Fuel', icon: '⛽', subCategories: ['Diesel', 'AdBlue', 'CNG', 'Other'] },
  { name: 'Toll', icon: '🛣️', subCategories: ['Fastag', 'Cash Toll', 'Parking', 'Other'] },
  { name: 'Maintenance', icon: '🔧', subCategories: ['Engine Repair', 'Tire Replacement', 'Oil Change', 'Brake Service', 'Body Work', 'Electrical', 'Regular Service', 'Other'] },
  { name: 'Driver Salary', icon: '👤', subCategories: ['Monthly', 'Bonus', 'Advance', 'Allowance (Batta)', 'Other'] },
  { name: 'Insurance', icon: '📄', subCategories: ['Renewal', 'Third Party', 'Comprehensive', 'Claim Payment', 'Other'] },
  { name: 'Taxes/GST', icon: '🏦', subCategories: ['RTO Tax', 'Professional Tax', 'Filing Fees', 'Other'] },
  { name: 'Permit', icon: '📋', subCategories: ['National Permit', 'State Permit', 'Fitness', 'Pollution (PUC)', 'Other'] },
  { name: 'Other', icon: '⚙️', subCategories: ['Misc', 'Emergency', 'Loan EMI', 'Other'] },
];

export const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Fastag', 'Credit Card', 'UPI'];
export const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'];
