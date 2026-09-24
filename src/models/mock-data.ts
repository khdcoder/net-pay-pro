import { User } from './user.model';
import { BillEntry } from './bill-entry.model';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    name: 'Muhammad Ali Khan',
    phone: '923001234501',
    address: 'House 14, Street 2, Near Jamia Masjid',
    village: 'Model Town',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'usr_002',
    name: 'Tariq Mahmood',
    phone: '923011234502',
    address: 'Shop 5, Main Bazar',
    village: 'Chak 45/SB',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-01-12T11:30:00.000Z'
  },
  {
    id: 'usr_003',
    name: 'Usman Tariq Gujjar',
    phone: '923211234503',
    address: 'House 88, Block C, Canal Road',
    village: 'Gulshan-e-Iqbal',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-02-01T09:15:00.000Z'
  },
  {
    id: 'usr_004',
    name: 'Bilal Ahmed Sheikh',
    phone: '923331234504',
    address: 'Street 4, Near Water Filter Plant',
    village: 'Farooqabad',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-02-05T14:20:00.000Z'
  },
  {
    id: 'usr_005',
    name: 'Hamza Rasheed',
    phone: '923451234505',
    address: 'Katchery Road, Opp Govt High School',
    village: 'Dhok Kala Khan',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-02-10T16:00:00.000Z'
  },
  {
    id: 'usr_006',
    name: 'Farhan Qureshi',
    phone: '923021234506',
    address: 'House 23, Madina Colony',
    village: 'Basti Malook',
    category: 'Internet',
    monthlyBill: 1800,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-03-01T08:00:00.000Z'
  },
  {
    id: 'usr_007',
    name: 'Imran Ashraf',
    phone: '923121234507',
    address: 'Plot 45, Sector B-2, St 9',
    village: 'Satellite Town',
    category: 'Internet',
    monthlyBill: 3000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-03-05T12:45:00.000Z'
  },
  {
    id: 'usr_008',
    name: 'Zeeshan Malik',
    phone: '923031234508',
    address: 'Main Chowk, Near Post Office',
    village: 'Kot Radha Kishan',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-03-10T15:10:00.000Z'
  },
  {
    id: 'usr_009',
    name: 'Kashif Mehmood',
    phone: '923221234509',
    address: 'House 77, Street 1, Gali No 4',
    village: 'Chak 122/JB',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-03-15T10:30:00.000Z'
  },
  {
    id: 'usr_010',
    name: 'Asif Raza Gillani',
    phone: '923341234510',
    address: 'Gulzar House, Old Bus Stand',
    village: 'Chak 89/NB',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-03-20T11:00:00.000Z'
  },
  {
    id: 'usr_011',
    name: 'Babar Azam Siddiqui',
    phone: '923051234511',
    address: 'VIP Street, Block A, Green View',
    village: 'Model Town',
    category: 'Internet',
    monthlyBill: 3000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-04-01T09:00:00.000Z'
  },
  {
    id: 'usr_012',
    name: 'Mohammad Rizwan',
    phone: '923151234512',
    address: 'House 9, St 3, Near Eidgah',
    village: 'Farooqabad',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-04-05T13:20:00.000Z'
  },
  {
    id: 'usr_013',
    name: 'Shaheen Shah Afridi',
    phone: '923241234513',
    address: 'Highway View, Plot 102',
    village: 'Gulshan-e-Iqbal',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-04-10T14:40:00.000Z'
  },
  {
    id: 'usr_014',
    name: 'Naseem Shah',
    phone: '923351234514',
    address: 'Near Girls Degree College',
    village: 'Dhok Kala Khan',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-04-15T15:00:00.000Z'
  },
  {
    id: 'usr_015',
    name: 'Haris Rauf',
    phone: '923461234515',
    address: 'Speed Line Road, Shop 3',
    village: 'Satellite Town',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-04-20T17:15:00.000Z'
  },
  {
    id: 'usr_016',
    name: 'Shadab Khan',
    phone: '923061234516',
    address: 'House 34, Street 8, Circular Road',
    village: 'Chak 45/SB',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-05-01T10:10:00.000Z'
  },
  {
    id: 'usr_017',
    name: 'Fakhar Zaman',
    phone: '923161234517',
    address: 'Navy Road, House 56',
    village: 'Basti Malook',
    category: 'Internet',
    monthlyBill: 1800,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-05-05T11:45:00.000Z'
  },
  {
    id: 'usr_018',
    name: 'Abdullah Shafique',
    phone: '923251234518',
    address: 'Grace Villa, Street 1',
    village: 'Model Town',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-05-10T12:00:00.000Z'
  },
  {
    id: 'usr_019',
    name: 'Saud Shakeel',
    phone: '923361234519',
    address: 'Defence View, Flat 4B',
    village: 'Gulshan-e-Iqbal',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-05-15T09:30:00.000Z'
  },
  {
    id: 'usr_020',
    name: 'Agha Salman Ali',
    phone: '923471234520',
    address: 'Al-Rehman Arcade, Floor 2',
    village: 'Kot Radha Kishan',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-05-20T16:20:00.000Z'
  },
  {
    id: 'usr_021',
    name: 'Iftikhar Ahmed Chacha',
    phone: '923071234521',
    address: 'Power House Road, Shop 12',
    village: 'Chak 122/JB',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-06-01T08:50:00.000Z'
  },
  {
    id: 'usr_022',
    name: 'Mohammad Amir',
    phone: '923171234522',
    address: 'Bowler Street, House 3',
    village: 'Dhok Kala Khan',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-06-05T13:40:00.000Z'
  },
  {
    id: 'usr_023',
    name: 'Imad Wasim',
    phone: '923261234523',
    address: 'Spin Corner, St 7',
    village: 'Satellite Town',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-06-10T15:15:00.000Z'
  },
  {
    id: 'usr_024',
    name: 'Shoaib Akhtar Rawalpindi',
    phone: '923371234524',
    address: 'Express Highway, Farm 1',
    village: 'Dhok Kala Khan',
    category: 'Internet',
    monthlyBill: 3000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-06-15T11:00:00.000Z'
  },
  {
    id: 'usr_025',
    name: 'Shahid Khan Afridi',
    phone: '923481234525',
    address: 'Boom Boom House, Main Road',
    village: 'Model Town',
    category: 'Internet',
    monthlyBill: 3000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-06-20T14:30:00.000Z'
  },
  {
    id: 'usr_026',
    name: 'Younis Khan',
    phone: '923081234526',
    address: 'Mardan Street, House 100',
    village: 'Chak 45/SB',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-07-01T10:00:00.000Z'
  },
  {
    id: 'usr_027',
    name: 'Misbah-ul-Haq Niazi',
    phone: '923181234527',
    address: 'Captain House, Street 5',
    village: 'Farooqabad',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-07-05T12:00:00.000Z'
  },
  {
    id: 'usr_028',
    name: 'Saeed Anwar',
    phone: '923271234528',
    address: 'Opening Colony, House 194',
    village: 'Gulshan-e-Iqbal',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-07-10T16:00:00.000Z'
  },
  {
    id: 'usr_029',
    name: 'Inzamam-ul-Haq',
    phone: '923381234529',
    address: 'Multan Road, Al-Rehman Estate',
    village: 'Basti Malook',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-07-15T09:40:00.000Z'
  },
  {
    id: 'usr_030',
    name: 'Abdul Razzaq Allrounder',
    phone: '923491234530',
    address: 'Railway Colony, House 42',
    village: 'Kot Radha Kishan',
    category: 'Internet',
    monthlyBill: 1800,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-07-20T15:10:00.000Z'
  },
  {
    id: 'usr_031',
    name: 'Azhar Ali',
    phone: '923091234531',
    address: 'Test Match Road, Plot 302',
    village: 'Chak 122/JB',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-08-01T10:20:00.000Z'
  },
  {
    id: 'usr_032',
    name: 'Umar Gul Yorkerman',
    phone: '923191234532',
    address: 'Peshawar Road, Street 6',
    village: 'Chak 89/NB',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-08-05T11:15:00.000Z'
  },
  {
    id: 'usr_033',
    name: 'Mohammad Asif Magician',
    phone: '923281234533',
    address: 'Swing Line, House 17',
    village: 'Dhok Kala Khan',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-08-10T14:50:00.000Z'
  },
  {
    id: 'usr_034',
    name: 'Kamran Akmal',
    phone: '923391234534',
    address: 'Keeper Plaza, Shop 8',
    village: 'Satellite Town',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-08-15T16:30:00.000Z'
  },
  {
    id: 'usr_035',
    name: 'Wahab Riaz Spell',
    phone: '923401234535',
    address: 'Sports Complex Road, House 71',
    village: 'Model Town',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-08-20T17:00:00.000Z'
  },
  {
    id: 'usr_036',
    name: 'Junaid Khan Leftarm',
    phone: '923001234536',
    address: 'Swabi Colony, Street 3',
    village: 'Farooqabad',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-09-01T09:10:00.000Z'
  },
  {
    id: 'usr_037',
    name: 'Yasir Shah Leggy',
    phone: '923111234537',
    address: 'Spinners Avenue, House 21',
    village: 'Gulshan-e-Iqbal',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-09-05T11:25:00.000Z'
  },
  {
    id: 'usr_038',
    name: 'Hasan Ali Generator',
    phone: '923201234538',
    address: 'Champions Trophy Villa, St 9',
    village: 'Basti Malook',
    category: 'Internet',
    monthlyBill: 1800,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-09-10T13:40:00.000Z'
  },
  {
    id: 'usr_039',
    name: 'Faheem Ashraf',
    phone: '923301234539',
    address: 'Kasur Road, Near Toll Plaza',
    village: 'Kot Radha Kishan',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-09-15T15:00:00.000Z'
  },
  {
    id: 'usr_040',
    name: 'Sajid Khan',
    phone: '923411234540',
    address: 'Khyber Market, Shop 19',
    village: 'Chak 45/SB',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-09-20T16:45:00.000Z'
  },
  {
    id: 'usr_041',
    name: 'Noman Ali Veteran',
    phone: '923011234541',
    address: 'Sanghar House, Street 11',
    village: 'Chak 122/JB',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-10-01T08:30:00.000Z'
  },
  {
    id: 'usr_042',
    name: 'Shan Masood Skipper',
    phone: '923121234542',
    address: 'Kuwait Colony, House 10',
    village: 'Satellite Town',
    category: 'Internet',
    monthlyBill: 3000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-10-05T10:15:00.000Z'
  },
  {
    id: 'usr_043',
    name: 'Mir Hamza Seamer',
    phone: '923211234543',
    address: 'Airport Road, House 84',
    village: 'Model Town',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-10-10T14:10:00.000Z'
  },
  {
    id: 'usr_044',
    name: 'Mohammad Haris Keeper',
    phone: '923311234544',
    address: 'Youngistan Street, Flat 3',
    village: 'Dhok Kala Khan',
    category: 'Internet',
    monthlyBill: 1500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-10-15T16:00:00.000Z'
  },
  {
    id: 'usr_045',
    name: 'Saim Ayub NoLook',
    phone: '923421234545',
    address: 'Flick Shot Lane, House 99',
    village: 'Gulshan-e-Iqbal',
    category: 'Internet',
    monthlyBill: 2500,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-10-20T17:20:00.000Z'
  },
  {
    id: 'usr_046',
    name: 'Aamer Jamal Fighter',
    phone: '923021234546',
    address: 'Allrounder Street, House 61',
    village: 'Farooqabad',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-11-01T09:00:00.000Z'
  },
  {
    id: 'usr_047',
    name: 'Haseebullah Khan',
    phone: '923131234547',
    address: 'Pishin Bazar, Shop 22',
    village: 'Chak 89/NB',
    category: 'Cable',
    monthlyBill: 1000,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-11-05T12:00:00.000Z'
  },
  {
    id: 'usr_048',
    name: 'Sahibzada Farhan',
    phone: '923221234548',
    address: 'Charsadda Road, House 15',
    village: 'Basti Malook',
    category: 'Internet',
    monthlyBill: 1800,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-11-10T14:45:00.000Z'
  },
  {
    id: 'usr_049',
    name: 'Zaman Khan Slinger',
    phone: '923321234549',
    address: 'Yorker Street, House 7',
    village: 'Kot Radha Kishan',
    category: 'Cable',
    monthlyBill: 1200,
    isActive: true,
    dropoutDate: null,
    createdAt: '2025-11-15T15:30:00.000Z'
  },
  {
    id: 'usr_050',
    name: 'Shahnawaz Dahani',
    phone: '923431234550',
    address: 'Larkana Express, House 33',
    village: 'Chak 45/SB',
    category: 'Internet',
    monthlyBill: 2000,
    isActive: false, // Inactive / Dropout demonstration
    dropoutDate: '2026-06-01T00:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z'
  }
];

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
