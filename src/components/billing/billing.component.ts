import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { UtilityService } from '../../services/utility.service';
import { User } from '../../models/user.model';
import { BillEntry, BillStatus } from '../../models/bill-entry.model';
import { NotificationComponent } from '../shared/notification.component';

type BillEntryDisplay = BillEntry & { userName: string; userAddress: string; userVillage?: string; userPhone?: string; userCategory?: string; };

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NotificationComponent]
})
export class BillingComponent implements OnInit {
  storageService: StorageService = inject(StorageService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);

  private readonly VILLAGE_FILTER_KEY = 'netpay_billing_village_filter';

  activeUsers = computed(() => this.storageService.users().filter(u => u.isActive));
  
  // Available distinct villages from all users
  availableVillages = computed(() => {
    const vSet = new Set<string>();
    this.storageService.users().forEach(u => {
      if (u.village && u.village.trim()) {
        vSet.add(u.village.trim());
      }
    });
    return Array.from(vSet).sort((a, b) => a.localeCompare(b));
  });

  // Village Filter state with localStorage persistence
  selectedVillage = signal<string>(this.getSavedVillageFilter());

  // For new payment entry
  searchQuery = signal('');
  selectedUser = signal<User | null>(null);
  paidAmount = signal(0);
  
  // Tab toggle: 'unpaid' vs 'paid'
  activeTab = signal<'unpaid' | 'paid'>('unpaid');

  // For displaying existing entries
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  selectedMonth = signal(this.currentMonth);
  selectedYear = signal(this.currentYear);
  months = Array.from({length: 12}, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' })}));
  years = Array.from({length: 5}, (_, i) => this.currentYear - i);

  // For unpaid and paid bills
  displayedBillEntries = signal<BillEntryDisplay[]>([]);
  paidBillEntries = signal<BillEntryDisplay[]>([]);
  tableSearchTerm = signal('');

  // For edit/correction modal
  isEditModalOpen = signal(false);
  editingEntry = signal<BillEntryDisplay | null>(null);
  editAmount = signal<number>(0);
  editPaymentDate = signal<string>('');

  private getSavedVillageFilter(): string {
    try {
      return localStorage.getItem(this.VILLAGE_FILTER_KEY) || '';
    } catch {
      return '';
    }
  }

  setVillageFilter(village: string) {
    this.selectedVillage.set(village);
    try {
      if (village) {
        localStorage.setItem(this.VILLAGE_FILTER_KEY, village);
      } else {
        localStorage.removeItem(this.VILLAGE_FILTER_KEY);
      }
    } catch (e) {
      console.error('Error saving village filter', e);
    }
  }

  clearVillageFilter() {
    this.setVillageFilter('');
  }

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    const village = this.selectedVillage().trim().toLowerCase();

    return this.activeUsers()
      .filter(u => {
        const matchesVillage = !village || (u.village && u.village.trim().toLowerCase() === village);
        if (!matchesVillage) return false;
        return u.name.toLowerCase().includes(query) || u.address.toLowerCase().includes(query) || (u.phone && u.phone.includes(query));
      })
      .slice(0, 8);
  });

  currentBillEntry = computed(() => {
    const user = this.selectedUser();
    if (!user) return null;
    return this.storageService.billEntries().find(b => 
      b.userId === user.id && 
      b.year === this.selectedYear() && 
      b.month === this.selectedMonth()
    );
  });

  // Calculate past arrears (bakaya), current bill, and total due
  selectedUserArrearsInfo = computed(() => {
    const user = this.selectedUser();
    if (!user) return null;

    const selYear = this.selectedYear();
    const selMonth = this.selectedMonth();
    const allEntries = this.storageService.billEntries().filter(b => b.userId === user.id);

    // Sum of previous unpaid/half-paid arrears across all past months
    let previousArrears = 0;
    allEntries.forEach(b => {
      const isBefore = (b.year < selYear) || (b.year === selYear && b.month < selMonth);
      if (isBefore) {
        previousArrears += Math.max(0, b.billAmount - b.paidAmount);
      }
    });

    const currentEntry = allEntries.find(b => b.year === selYear && b.month === selMonth);
    const currentBill = user.monthlyBill;
    const currentPaid = currentEntry ? currentEntry.paidAmount : 0;
    const currentRemaining = Math.max(0, currentBill - currentPaid);
    const totalDue = previousArrears + currentRemaining;
    const isAlreadyPaid = currentEntry ? currentEntry.status === 'Paid' : false;

    return {
      previousArrears,
      currentBill,
      currentPaid,
      currentRemaining,
      totalDue,
      isAlreadyPaid,
      currentEntry
    };
  });
  
  filteredDisplayedBillEntries = computed(() => {
    const term = this.tableSearchTerm().toLowerCase().trim();
    const village = this.selectedVillage().trim().toLowerCase();

    return this.displayedBillEntries().filter(entry => {
      // Village filter
      const matchesVillage = !village || (entry.userVillage && entry.userVillage.trim().toLowerCase() === village);
      if (!matchesVillage) return false;

      // Search term
      if (!term) return true;
      return entry.userName.toLowerCase().includes(term) ||
        entry.userAddress.toLowerCase().includes(term) ||
        (entry.userPhone && entry.userPhone.includes(term));
    });
  });

  filteredPaidBillEntries = computed(() => {
    const term = this.tableSearchTerm().toLowerCase().trim();
    const village = this.selectedVillage().trim().toLowerCase();

    return this.paidBillEntries().filter(entry => {
      // Village filter
      const matchesVillage = !village || (entry.userVillage && entry.userVillage.trim().toLowerCase() === village);
      if (!matchesVillage) return false;

      // Search term
      if (!term) return true;
      return entry.userName.toLowerCase().includes(term) ||
        entry.userAddress.toLowerCase().includes(term) ||
        (entry.userPhone && entry.userPhone.includes(term));
    });
  });

  ngOnInit() {
    this.loadBillsForMonth(false);
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      const userToBill = this.storageService.users().find(u => u.id === userId);
      if (userToBill) {
        this.selectUser(userToBill);
      }
    }
  }

  onMonthOrYearChange() {
    this.loadBillsForMonth(false);
  }

  loadBillsForMonth(showNotification = true) {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const monthName = this.months.find(m => m.value === month)?.name;

    // Ensure bills exist for all active users
    this.storageService.generateMonthlyBills(year, month);

    const allEntriesForMonth = this.storageService.billEntries().filter(b => b.year === year && b.month === month);
    const unpaidEntries = allEntriesForMonth.filter(b => b.status !== 'Paid');
    const paidEntries = allEntriesForMonth.filter(b => b.status === 'Paid' || (b.status === 'Half Paid' && b.paidAmount > 0));

    const usersMap: Map<string, User> = new Map(this.storageService.users().map(u => [u.id, u]));
    
    const unpaidDisplayData: BillEntryDisplay[] = unpaidEntries.map(entry => {
      const user = usersMap.get(entry.userId);
      return {
        ...entry,
        userName: user?.name || 'Unknown User',
        userAddress: user?.address || 'N/A',
        userVillage: user?.village,
        userPhone: user?.phone,
        userCategory: user?.category
      };
    }).sort((a, b) => a.userName.localeCompare(b.userName));

    const paidDisplayData: BillEntryDisplay[] = paidEntries.map(entry => {
      const user = usersMap.get(entry.userId);
      return {
        ...entry,
        userName: user?.name || 'Unknown User',
        userAddress: user?.address || 'N/A',
        userVillage: user?.village,
        userPhone: user?.phone,
        userCategory: user?.category
      };
    }).sort((a, b) => {
      const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
      const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
      return dateB - dateA;
    });

    this.displayedBillEntries.set(unpaidDisplayData);
    this.paidBillEntries.set(paidDisplayData);

    if (showNotification) {
      this.utilityService.showNotification(`Loaded ${unpaidDisplayData.length} pending and ${paidDisplayData.length} collected bills for ${monthName} ${year}.`, 'success');
    }
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.searchQuery.set(user.name);

    // Default paidAmount: if arrears exist, default to total due or monthly bill
    const arrears = this.selectedUserArrearsInfo();
    if (arrears && arrears.totalDue > 0) {
      this.paidAmount.set(arrears.totalDue);
    } else {
      this.paidAmount.set(user.monthlyBill);
    }
  }

  setQuickAmount(amount: number) {
    this.paidAmount.set(amount);
  }

  collectPaymentFromTable(entry: BillEntryDisplay) {
    const user = this.storageService.users().find(u => u.id === entry.userId);
    if (user) {
      this.selectUser(user);
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.utilityService.showNotification('Could not find the selected user.', 'error');
    }
  }

  sendWhatsAppReminder(entry: BillEntryDisplay) {
    if (!entry.userPhone) {
      this.utilityService.showNotification('Customer phone number is missing.', 'error');
      return;
    }
    const due = Math.max(0, entry.billAmount - entry.paidAmount);
    const monthName = this.months.find(m => m.value === this.selectedMonth())?.name;
    const msg = `*Payment Reminder - NetPay Pro*\n\n` +
      `Dear *${entry.userName}*,\n` +
      `This is a reminder for your bill for the month of *${monthName} ${this.selectedYear()}*.\n\n` +
      `• Monthly Bill: Rs. ${entry.billAmount}\n` +
      `• Paid Amount: Rs. ${entry.paidAmount}\n` +
      `• Outstanding Due: *Rs. ${due}*\n\n` +
      `Please clear your pending dues at your earliest convenience.\n` +
      `Thank you!\n` +
      `_Khalid Software House_`;

    window.open(`https://wa.me/${entry.userPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  sendWhatsAppReceipt(userOrEntry: { name?: string; userName?: string; phone?: string; userPhone?: string }, amount: number, status: string, totalRemaining: number = 0) {
    const phone = userOrEntry.phone || userOrEntry.userPhone;
    const name = userOrEntry.name || userOrEntry.userName;
    if (!phone) {
      this.utilityService.showNotification('Customer phone number is missing.', 'error');
      return;
    }
    const monthName = this.months.find(m => m.value === this.selectedMonth())?.name;
    const msg = `*Payment Receipt - NetPay Pro*\n\n` +
      `Customer: *${name}*\n` +
      `Month: *${monthName} ${this.selectedYear()}*\n` +
      `Amount Paid: *Rs. ${amount}*\n` +
      `Status: *${status}*\n` +
      (totalRemaining > 0 ? `Total Remaining Balance: *Rs. ${totalRemaining}*\n` : `Balance: *Fully Cleared (Rs. 0)*\n`) +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      `Thank you for your prompt payment!\n` +
      `_Khalid Software House_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  recordPayment(sendReceiptAfter = false) {
    const user = this.selectedUser();
    if (!user) {
      this.utilityService.showNotification('Please select a customer first.', 'error');
      return;
    }

    const arrears = this.selectedUserArrearsInfo();
    const entry = this.currentBillEntry();

    // Check if duplicate / already paid
    if (arrears?.isAlreadyPaid) {
      const confirmOverride = confirm(`⚠️ Warning: Bill for ${user.name} is ALREADY PAID for ${this.months[this.selectedMonth()-1].name} ${this.selectedYear()} (Rs. ${arrears.currentPaid}).\n\nDo you want to overwrite or update this payment?`);
      if (!confirmOverride) {
        return;
      }
    }
    
    let targetEntry = entry;
    if (!targetEntry) {
      this.storageService.addBillEntry({
        userId: user.id,
        year: this.selectedYear(),
        month: this.selectedMonth(),
        billAmount: user.monthlyBill,
        paidAmount: 0,
        status: 'Not Paid',
        paymentDate: null
      });
      targetEntry = this.storageService.billEntries().find(b => b.userId === user.id && b.year === this.selectedYear() && b.month === this.selectedMonth())!;
    }
    
    const amount = Number(this.paidAmount());
    if (isNaN(amount) || amount < 0) {
      this.utilityService.showNotification('Please enter a valid amount.', 'error');
      return;
    }

    let status: BillStatus = 'Not Paid';
    if (amount >= user.monthlyBill) {
      status = 'Paid';
    } else if (amount > 0) {
      status = 'Half Paid';
    }

    const updatedEntry: BillEntry = {
      ...targetEntry,
      paidAmount: amount,
      status: status,
      paymentDate: new Date().toISOString()
    };
    
    this.storageService.updateBillEntry(updatedEntry);
    this.utilityService.showNotification(`Payment of Rs. ${amount} recorded successfully for ${user.name}.`, 'success');

    if (sendReceiptAfter && user.phone) {
      const remaining = Math.max(0, (arrears?.totalDue || user.monthlyBill) - amount);
      this.sendWhatsAppReceipt(user, amount, status, remaining);
    }

    this.loadBillsForMonth(false);
    this.resetForm();
  }

  // Edit / Correct Modal Handlers
  openEditModal(entry: BillEntryDisplay) {
    this.editingEntry.set(entry);
    this.editAmount.set(entry.paidAmount);
    this.editPaymentDate.set(entry.paymentDate ? new Date(entry.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingEntry.set(null);
  }

  saveEditedEntry() {
    const entry = this.editingEntry();
    if (!entry) return;

    const newAmount = Number(this.editAmount());
    if (isNaN(newAmount) || newAmount < 0) {
      this.utilityService.showNotification('Please enter a valid amount.', 'error');
      return;
    }

    let status: BillStatus = 'Not Paid';
    if (newAmount >= entry.billAmount) {
      status = 'Paid';
    } else if (newAmount > 0) {
      status = 'Half Paid';
    }

    const updated: BillEntry = {
      id: entry.id,
      userId: entry.userId,
      year: entry.year,
      month: entry.month,
      billAmount: entry.billAmount,
      paidAmount: newAmount,
      status: status,
      paymentDate: newAmount > 0 ? (this.editPaymentDate() ? new Date(this.editPaymentDate()).toISOString() : new Date().toISOString()) : null
    };

    this.storageService.updateBillEntry(updated);
    this.utilityService.showNotification(`Payment entry updated for ${entry.userName} (Rs. ${newAmount}).`, 'success');
    this.closeEditModal();
    this.loadBillsForMonth(false);
  }

  resetEntryToUnpaid(entry: BillEntryDisplay) {
    if (!confirm(`⚠️ Are you sure you want to VOID and RESET the payment for ${entry.userName} to Unpaid (Rs. 0)?`)) {
      return;
    }

    const updated: BillEntry = {
      id: entry.id,
      userId: entry.userId,
      year: entry.year,
      month: entry.month,
      billAmount: entry.billAmount,
      paidAmount: 0,
      status: 'Not Paid',
      paymentDate: null
    };

    this.storageService.updateBillEntry(updated);
    this.utilityService.showNotification(`Payment reset to Unpaid for ${entry.userName}.`, 'info');
    this.closeEditModal();
    this.loadBillsForMonth(false);
  }

  resetForm() {
    this.searchQuery.set('');
    this.selectedUser.set(null);
    this.paidAmount.set(0);
  }
}
