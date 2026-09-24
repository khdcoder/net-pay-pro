export type BillStatus = 'Paid' | 'Not Paid' | 'Half Paid';

export interface BillEntry {
  id: string;
  userId: string;
  year: number;
  month: number; 
  billAmount: number;
  paidAmount: number;
  status: BillStatus;
  paymentDate: string | null;
  userName?: string; // For display purposes
  userAddress?: string; // For display purposes
}
