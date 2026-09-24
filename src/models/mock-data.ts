import { User } from './user.model';
import { BillEntry } from './bill-entry.model';

export const MOCK_USERS: User[] = Array.from({ length: 50 }, (_, i) => {
  const index = i + 1;
  const id = `usr_${String(index).padStart(3, '0')}`;
  const pad = String(index).padStart(2, '0');
  
  const villages = [
    'Demo Village Alpha',
    'Demo Village Beta',
    'Demo Village Gamma',
    'Demo Sector North',
    'Demo Sector South'
  ];
  const village = villages[i % villages.length];
  
  const isCable = i % 3 === 1;
  const category = isCable ? 'Cable' : 'Internet';
  
  const billRates = [1000, 1200, 1500, 1800, 2000, 2500, 3000];
  const monthlyBill = billRates[i % billRates.length];
  
  // 50th user as inactive / dropout demonstration
  const isActive = index !== 50;
  const dropoutDate = isActive ? null : '2026-06-01T00:00:00.000Z';

  return {
    id,
    name: `Demo User ${pad}`,
    phone: '00000000000',
    address: `House #${index}, Demo Street ${((index - 1) % 10) + 1}`,
    village,
    category,
    monthlyBill,
    isActive,
    dropoutDate,
    createdAt: '2025-01-01T10:00:00.000Z'
  };
});

export function generateMockBillEntries(users: User[], targetYear = 2026): BillEntry[] {
  const entries: BillEntry[] = [];
  const currentMonth = 9; // September

  // Generate records for months 1 to 9 of targetYear
  for (let month = 1; month <= currentMonth; month++) {
    const monthStr = String(month).padStart(2, '0');

    users.forEach((user, index) => {
      // If user dropped out before this month, skip
      if (!user.isActive && user.dropoutDate) {
        const dropMonth = new Date(user.dropoutDate).getMonth() + 1;
        if (month >= dropMonth) return;
      }

      const id = `${user.id}-${targetYear}-${month}`;
      const billAmount = user.monthlyBill;

      // Realistic payment distribution pattern:
      // For earlier months (1..8): mostly Paid (~85%), some Half Paid (~10%), few Not Paid (~5%)
      // For current month (9): realistic active billing desk (~60% Paid, 15% Half Paid, 25% Pending)
      let paidAmount = 0;
      let status: 'Paid' | 'Not Paid' | 'Half Paid' = 'Not Paid';
      let paymentDate: string | null = null;

      const randomFactor = (index * 7 + month * 13) % 100;

      if (month < currentMonth) {
        if (randomFactor < 85) {
          paidAmount = billAmount;
          status = 'Paid';
          const day = String(Math.min(28, (randomFactor % 20) + 1)).padStart(2, '0');
          paymentDate = `${targetYear}-${monthStr}-${day}T10:30:00.000Z`;
        } else if (randomFactor < 95) {
          paidAmount = Math.floor(billAmount / 2);
          status = 'Half Paid';
          const day = String(Math.min(28, (randomFactor % 15) + 5)).padStart(2, '0');
          paymentDate = `${targetYear}-${monthStr}-${day}T14:20:00.000Z`;
        } else {
          paidAmount = 0;
          status = 'Not Paid';
          paymentDate = null;
        }
      } else {
        // Current month (September 2026)
        if (randomFactor < 58) {
          paidAmount = billAmount;
          status = 'Paid';
          const day = String(Math.min(23, (randomFactor % 20) + 1)).padStart(2, '0');
          paymentDate = `${targetYear}-${monthStr}-${day}T11:15:00.000Z`;
        } else if (randomFactor < 75) {
          paidAmount = Math.floor(billAmount / 2);
          status = 'Half Paid';
          const day = String(Math.min(23, (randomFactor % 15) + 3)).padStart(2, '0');
          paymentDate = `${targetYear}-${monthStr}-${day}T15:45:00.000Z`;
        } else {
          paidAmount = 0;
          status = 'Not Paid';
          paymentDate = null;
        }
      }

      entries.push({
        id,
        userId: user.id,
        year: targetYear,
        month,
        billAmount,
        paidAmount,
        status,
        paymentDate,
        userName: user.name,
        userAddress: user.address
      });
    });
  }

  return entries;
}
