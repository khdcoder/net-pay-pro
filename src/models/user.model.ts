export interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  village?: string;
  category: 'Internet' | 'Cable';
  monthlyBill: number;
  isActive: boolean;
  dropoutDate: string | null;
  createdAt: string;
}
