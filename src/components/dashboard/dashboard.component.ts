import { Component, ChangeDetectionStrategy, inject, computed, signal, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { SyncService } from '../../services/sync.service';
import { UtilityService } from '../../services/utility.service';
import { BillEntry } from '../../models/bill-entry.model';
import { User } from '../../models/user.model';
import { NotificationComponent } from '../shared/notification.component';

declare const d3: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NotificationComponent]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  storageService = inject(StorageService);
  syncService = inject(SyncService);
  utilityService = inject(UtilityService);
  router = inject(Router);
  
  @ViewChild('chart') private chartContainer!: ElementRef;
  private resizeObserver: ResizeObserver | null = null;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  
  // Filters: selectedMonth = 0 means Full Year (Pure Year)
  selectedMonth = signal<number>(this.currentMonth);
  selectedYear = signal<number>(this.currentYear);
  selectedStatus = signal<'All' | 'Paid' | 'Not Paid' | 'Half Paid'>('All');
  searchTerm = signal('');
  selectedDate = signal<string | null>(null);
  
  // WhatsApp Modal
  isWhatsAppModalOpen = signal(false);
  whatsAppNumber = signal('');

  // Dismissible Recovery Banner State (persisted so it only shows once or until user dismisses)
  isRecoveryBannerDismissed = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('netpay_recovery_banner_dismissed') === 'true' : false
  );

  dismissRecoveryBanner() {
    this.isRecoveryBannerDismissed.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('netpay_recovery_banner_dismissed', 'true');
    }
  }

  months = Array.from({length: 12}, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' })}));
  years = Array.from({length: 5}, (_, i) => this.currentYear - i);

  selectedPeriodLabel = computed(() => {
    const m = this.selectedMonth();
    const y = this.selectedYear();
    if (m === 0) {
      return `Full Year ${y}`;
    }
    const monthObj = this.months.find(item => item.value === m);
    return `${monthObj?.name || 'Month ' + m} ${y}`;
  });

  // Computed data
  users = this.storageService.users;
  billEntries = this.storageService.billEntries;

  // Comprehensive entries for selected period before status/search filters
  monthlyAllEntries = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();

    if (month === 0) {
      // FULL YEAR (Pure Year) Mode: Aggregate all months 1..12 of the selected year
      const results: (BillEntry & { userName: string; userAddress: string; userPhone?: string; userCategory?: string; monthName: string })[] = [];
      const allYearBillEntries = this.billEntries().filter(e => e.year === year);
      const billEntriesMap = new Map<string, BillEntry>(
        allYearBillEntries.map(e => [`${e.userId}-${e.month}`, e])
      );

      for (let m = 1; m <= 12; m++) {
        const periodStart = new Date(year, m - 1, 1);
        const monthObj = this.months.find(item => item.value === m);
        const mName = monthObj?.name || `Month ${m}`;

        const activeUsersForMonth = this.users().filter(user => {
          const userCreatedDate = new Date(user.createdAt);
          if (userCreatedDate.getFullYear() > year || (userCreatedDate.getFullYear() === year && userCreatedDate.getMonth() + 1 > m)) {
            return false;
          }
          if (user.isActive) return true;
          if (user.dropoutDate) {
            const dropoutDate = new Date(user.dropoutDate);
            return dropoutDate >= periodStart;
          }
          return false;
        });

        activeUsersForMonth.forEach(user => {
          const key = `${user.id}-${m}`;
          const existingEntry = billEntriesMap.get(key);
          if (existingEntry) {
            results.push({
              ...existingEntry,
              monthName: mName,
              userName: user.name,
              userAddress: user.address,
              userPhone: user.phone,
              userCategory: user.category
            });
          } else {
            results.push({
              id: `${user.id}-${year}-${m}`,
              userId: user.id,
              year: year,
              month: m,
              monthName: mName,
              billAmount: user.monthlyBill,
              paidAmount: 0,
              status: 'Not Paid' as const,
              paymentDate: null,
              userName: user.name,
              userAddress: user.address,
              userPhone: user.phone,
              userCategory: user.category
            });
          }
        });
      }
      return results;
    }

    // SINGLE MONTH Mode
    const selectedPeriodStart = new Date(year, month - 1, 1);
    const monthObj = this.months.find(item => item.value === month);
    const mName = monthObj?.name || `Month ${month}`;

    const activeUsersForPeriod = this.users().filter(user => {
      const userCreatedDate = new Date(user.createdAt);
      if (userCreatedDate > selectedPeriodStart && userCreatedDate.getMonth() + 1 > month && userCreatedDate.getFullYear() > year) {
          return false;
      }
      if (user.isActive) return true;
      if (user.dropoutDate) {
        const dropoutDate = new Date(user.dropoutDate);
        return dropoutDate >= selectedPeriodStart;
      }
      return false;
    });

    const billEntriesMap = new Map<string, BillEntry>(
      this.billEntries()
        .filter(entry => entry.year === year && entry.month === month)
        .map(entry => [entry.userId, entry])
    );

    return activeUsersForPeriod.map(user => {
      const existingEntry = billEntriesMap.get(user.id);
      if (existingEntry) {
        return {
          ...existingEntry,
          monthName: mName,
          userName: user.name,
          userAddress: user.address,
          userPhone: user.phone,
          userCategory: user.category
        };
      } else {
        return {
          id: `${user.id}-${year}-${month}`,
          userId: user.id,
          year: year,
          month: month,
          monthName: mName,
          billAmount: user.monthlyBill,
          paidAmount: 0,
          status: 'Not Paid' as const,
          paymentDate: null,
          userName: user.name,
          userAddress: user.address,
          userPhone: user.phone,
          userCategory: user.category
        };
      }
    });
  });

  statusCounts = computed(() => {
    const all = this.monthlyAllEntries();
    let paid = 0;
    let notPaid = 0;
    let halfPaid = 0;
    for (const e of all) {
      if (e.status === 'Paid') paid++;
      else if (e.status === 'Not Paid') notPaid++;
      else if (e.status === 'Half Paid') halfPaid++;
    }
    return { all: all.length, paid, notPaid, halfPaid };
  });

  filteredBillEntries = computed(() => {
    const entries = this.monthlyAllEntries();
    const statusFilter = this.selectedStatus();
    const term = this.searchTerm().toLowerCase();
    const dateFilter = this.selectedDate();

    const getLocalDateString = (dateVal: string | null | undefined): string => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return entries.filter(entry => {
      const entryLocalDate = entry.paymentDate ? getLocalDateString(entry.paymentDate) : '';
      const entryIsoDate = entry.paymentDate ? entry.paymentDate.split('T')[0] : '';
      const dateMatch = !dateFilter || entryLocalDate === dateFilter || entryIsoDate === dateFilter;
      const statusMatch = statusFilter === 'All' || entry.status === statusFilter;
      const termMatch = term === '' ||
        entry.userName.toLowerCase().includes(term) ||
        entry.userAddress.toLowerCase().includes(term);

      return dateMatch && statusMatch && termMatch;
    });
  });
  
  stats = computed(() => {
    const monthlyEntries = this.monthlyAllEntries();
    const totalBilled = monthlyEntries.reduce((acc, entry) => acc + entry.billAmount, 0);
    const totalCollected = monthlyEntries.reduce((acc, entry) => acc + entry.paidAmount, 0);
    const collectionPercentage = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    return {
      totalUsers: this.users().length,
      activeUsers: this.users().filter(u => u.isActive).length,
      totalBilled,
      totalCollected,
      totalDue: totalBilled - totalCollected,
      collectionPercentage
    };
  });

  ngAfterViewInit() {
    this.createChart();
    if (typeof ResizeObserver !== 'undefined' && this.chartContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.createChart();
      });
      this.resizeObserver.observe(this.chartContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  clearDateFilter() {
    this.selectedDate.set(null);
  }

  openDatePicker(input: HTMLInputElement) {
    try {
      if (input && typeof input.showPicker === 'function') {
        input.showPicker();
      } else if (input) {
        input.focus();
      }
    } catch {
      // Safe fallback if picker is already open or browser blocks it
    }
  }

  clearSearch() {
    this.searchTerm.set('');
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'Not Paid': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'Half Paid': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  }

  quickCollect(entry: any) {
    this.router.navigate(['/billing', entry.userId]);
  }

  sendSingleWhatsAppReminder(entry: any) {
    const due = entry.billAmount - entry.paidAmount;
    const period = entry.monthName ? `${entry.monthName} ${entry.year}` : this.selectedPeriodLabel();
    const msg = `*Payment Reminder - NetPay Pro*\n\n` +
      `Dear *${entry.userName}*,\n` +
      `This is a reminder for your bill (${period}).\n` +
      `• Total Bill: Rs. ${entry.billAmount}\n` +
      `• Paid: Rs. ${entry.paidAmount}\n` +
      `• Remaining Due: *Rs. ${due}*\n\n` +
      `Thank you,\nNetPay Pro - Khalid Software House`;
    window.open(`https://wa.me/${entry.userPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  generateReport(): boolean {
    const data = this.filteredBillEntries();
    const isFullYear = this.selectedMonth() === 0;
    const head = isFullYear 
      ? [['#', 'Month', 'Date', 'Name', 'Address', 'Bill', 'Paid', 'Status']]
      : [['#', 'Date', 'Name', 'Address', 'Bill', 'Paid', 'Status']];

    const body = data.map((d, index) => {
      const pDate = d.paymentDate ? new Date(d.paymentDate).toLocaleDateString() : 'N/A';
      return isFullYear
        ? [index + 1, d.monthName, pDate, d.userName, d.userAddress, d.billAmount, d.paidAmount, d.status]
        : [index + 1, pDate, d.userName, d.userAddress, d.billAmount, d.paidAmount, d.status];
    });

    const period = this.selectedPeriodLabel();
    return this.utilityService.exportToPdf(`Bill Report - ${period}`, head, body, `report_${this.selectedYear()}_${this.selectedMonth() === 0 ? 'Full_Year' : this.selectedMonth()}`);
  }

  exportCsv() {
    const isFullYear = this.selectedMonth() === 0;
    const data = this.filteredBillEntries().map((d, index) => ({
        'sr_no': index + 1,
        ...(isFullYear ? { month: d.monthName } : {}),
        name: d.userName,
        address: d.userAddress,
        bill_amount: d.billAmount,
        paid_amount: d.paidAmount,
        status: d.status,
        payment_date: d.paymentDate ? new Date(d.paymentDate).toLocaleDateString() : '',
    }));
    this.utilityService.exportToCsv(data, `report_${this.selectedYear()}_${this.selectedMonth() === 0 ? 'Full_Year' : this.selectedMonth()}`);
  }

  sendWhatsAppReport() {
    this.whatsAppNumber.set('');
    this.isWhatsAppModalOpen.set(true);
  }

  closeWhatsAppModal() {
    this.isWhatsAppModalOpen.set(false);
  }

  confirmAndSendWhatsApp() {
    const number = this.whatsAppNumber();
    if (!number || number.trim() === '') {
        this.utilityService.showNotification('Please enter a valid phone number.', 'error');
        return;
    }
    const period = this.selectedPeriodLabel();
    const stats = this.stats();
    const message = encodeURIComponent(
      `*NetPay Pro - Billing Summary*\n` +
      `Period: *${period}*\n` +
      `Total Users: ${stats.totalUsers}\n` +
      `Total Billed: Rs. ${stats.totalBilled}\n` +
      `Total Collected: Rs. ${stats.totalCollected}\n` +
      `Total Due: Rs. ${stats.totalDue}\n` +
      `Collection Rate: ${stats.collectionPercentage}%\n\n` +
      `Generated via NetPay Pro | Khalid Software House`
    );
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
    this.closeWhatsAppModal();
  }

  createChart() {
    if (!this.chartContainer?.nativeElement) return;
    const data = this.getChartData();
    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const margin = { top: 20, right: 15, bottom: 35, left: 45 };
    const width = Math.max(element.clientWidth - margin.left - margin.right, 240);
    const height = 240 - margin.top - margin.bottom;

    const svg = d3.select(element).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('class', 'overflow-visible')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().range([0, width]).padding(0.25);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain(data.map((d: any) => d.month));
    const maxVal = d3.max(data, (d: any) => Math.max(d.billed, d.collected)) || 100;
    y.domain([0, maxVal * 1.1]);

    // Gridlines
    svg.append('g')
      .attr('class', 'grid text-slate-200 dark:text-slate-800 opacity-40')
      .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(''));

    // Billed bars
    svg.selectAll('.bar-billed')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar-billed')
      .attr('rx', 3)
      .attr('x', (d: any) => x(d.month))
      .attr('width', x.bandwidth() / 2)
      .attr('y', (d: any) => y(d.billed))
      .attr('height', (d: any) => Math.max(0, height - y(d.billed)))
      .attr('fill', '#6366f1');

    // Collected bars
    svg.selectAll('.bar-collected')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar-collected')
      .attr('rx', 3)
      .attr('x', (d: any) => x(d.month) + x.bandwidth() / 2)
      .attr('width', x.bandwidth() / 2)
      .attr('y', (d: any) => y(d.collected))
      .attr('height', (d: any) => Math.max(0, height - y(d.collected)))
      .attr('fill', '#10b981');

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-xs text-slate-500')
      .call(d3.axisBottom(x));

    // Y Axis
    svg.append('g')
      .attr('class', 'text-xs text-slate-500')
      .call(d3.axisLeft(y).ticks(4));
  }
  
  getChartData() {
    const year = this.selectedYear();
    const month = this.selectedMonth();

    if (month === 0) {
      // Full year: show all 12 months for selectedYear
      return this.months.map(m => {
        const entriesForMonth = this.billEntries().filter(e => e.year === year && e.month === m.value);
        const billed = entriesForMonth.reduce((acc, e) => acc + e.billAmount, 0);
        const collected = entriesForMonth.reduce((acc, e) => acc + e.paidAmount, 0);
        return {
          month: m.name.substring(0, 3),
          billed,
          collected
        };
      });
    }

    const data: { [key: string]: { billed: number, collected: number } } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    this.billEntries().forEach(entry => {
        const entryDate = new Date(entry.year, entry.month - 1);
        if (entryDate >= sixMonthsAgo) {
            const key = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
            if (!data[key]) {
                data[key] = { billed: 0, collected: 0 };
            }
            data[key].billed += entry.billAmount;
            data[key].collected += entry.paidAmount;
        }
    });

    const keys = Object.keys(data).sort();
    if (keys.length === 0) {
      // If no data, return current period
      return [{
        month: new Date().toLocaleString('default', { month: 'short' }),
        billed: this.stats().totalBilled,
        collected: this.stats().totalCollected
      }];
    }

    return keys.map(key => ({
        month: new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1).toLocaleString('default', { month: 'short' }),
        billed: data[key].billed,
        collected: data[key].collected
    }));
  }

  quickRestoreFromCloud() {
    const email = this.storageService.settings().userEmail;
    if (!email) {
      this.utilityService.showNotification('Please configure your backup email in Settings first.', 'info');
      return;
    }
    this.syncService.restoreData(email);
  }

  triggerQuickImport() {
    const input = document.getElementById('dashboard-quick-import') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  handleQuickImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data && (data.users || data.billEntries)) {
          this.storageService.loadCompleteData(data);
          this.utilityService.showNotification('Data restored successfully from backup file!', 'success');
          input.value = '';
        } else {
          this.utilityService.showNotification('Invalid backup file format.', 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.utilityService.showNotification('Failed to read backup file.', 'error');
      }
    };

    reader.readAsText(file);
  }
}
