import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { UtilityService } from '../../services/utility.service';
import { User } from '../../models/user.model';
import { BillStatus } from '../../models/bill-entry.model';
import { NotificationComponent } from '../shared/notification.component';

// Define the structure for a row in the statement table
type StatementRow = {
  month: number;
  monthName: string;
  billAmount: number;
  paidAmount: number;
  due: number;
  status: BillStatus | 'N/A';
  paymentDate: string | null;
};

// Define the structure for the statement summary
type StatementSummary = {
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
};

@Component({
  selector: 'app-statements',
  templateUrl: './statements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NotificationComponent],
})
export class StatementsComponent {
  storageService = inject(StorageService);
  utilityService = inject(UtilityService);

  // Filters and UI state
  searchQuery = signal('');
  selectedUser = signal<User | null>(null);
  selectedYear = signal(new Date().getFullYear());
  reportScope = signal<'fullYear' | 'tillCurrentMonth'>('fullYear');
  currentRealMonth = new Date().getMonth() + 1;
  currentRealYear = new Date().getFullYear();

  // Data for display
  statementData = signal<StatementRow[]>([]);
  statementSummary = signal<StatementSummary | null>(null);

  // Data sources
  private allUsers = this.storageService.users;
  private allBillEntries = this.storageService.billEntries;

  // Available years for the dropdown
  years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  // Month names for mapping
  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

  // Computed property for user search results
  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return [];
    return this.allUsers()
      .filter(u => u.name.toLowerCase().includes(query) || u.address.toLowerCase().includes(query))
      .slice(0, 10);
  });
  
  constructor() {
    // Effect to regenerate the statement whenever the selected user, year or reportScope changes
    effect(() => {
      // Trigger effect dependencies
      this.selectedUser();
      this.selectedYear();
      this.reportScope();
      this.generateStatement();
    });
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.searchQuery.set(user.name);
  }

  clearSelection() {
    this.selectedUser.set(null);
    this.searchQuery.set('');
    this.statementData.set([]);
    this.statementSummary.set(null);
  }

  generateStatement() {
    const user = this.selectedUser();
    const year = this.selectedYear();
    const scope = this.reportScope();

    if (!user) {
      this.statementData.set([]);
      this.statementSummary.set(null);
      return;
    }

    const userCreatedDate = new Date(user.createdAt);
    const userDropoutDate = user.dropoutDate ? new Date(user.dropoutDate) : null;

    const userBillEntriesForYear = this.allBillEntries().filter(
      b => b.userId === user.id && b.year === year
    );

    const maxMonth = (scope === 'tillCurrentMonth' && year === this.currentRealYear)
      ? this.currentRealMonth 
      : 12;

    const newStatementData: StatementRow[] = [];
    let totalBilled = 0;
    let totalPaid = 0;

    for (let month = 1; month <= maxMonth; month++) {
      const monthDate = new Date(year, month - 1, 1);
      
      const isBeforeCreation = monthDate.getFullYear() < userCreatedDate.getFullYear() || (monthDate.getFullYear() === userCreatedDate.getFullYear() && monthDate.getMonth() < userCreatedDate.getMonth());
      const isAfterDropout = userDropoutDate && (monthDate.getFullYear() > userDropoutDate.getFullYear() || (monthDate.getFullYear() === userDropoutDate.getFullYear() && monthDate.getMonth() > userDropoutDate.getMonth()));

      // If user was not active in this month, show N/A
      if (isBeforeCreation || isAfterDropout) {
        newStatementData.push({
          month: month,
          monthName: this.months.find(m => m.value === month)!.name,
          billAmount: 0, paidAmount: 0, due: 0, status: 'N/A', paymentDate: null
        });
        continue;
      }

      const entry = userBillEntriesForYear.find(b => b.month === month);

      if (entry) {
        newStatementData.push({
          month, monthName: this.months.find(m => m.value === month)!.name,
          billAmount: entry.billAmount, paidAmount: entry.paidAmount,
          due: entry.billAmount - entry.paidAmount, status: entry.status,
          paymentDate: entry.paymentDate
        });
        totalBilled += entry.billAmount;
        totalPaid += entry.paidAmount;
      } else {
        // If user was active but no bill entry exists, it means the bill is not paid
        newStatementData.push({
          month, monthName: this.months.find(m => m.value === month)!.name,
          billAmount: user.monthlyBill, paidAmount: 0,
          due: user.monthlyBill, status: 'Not Paid', paymentDate: null
        });
        totalBilled += user.monthlyBill;
      }
    }

    this.statementData.set(newStatementData);
    this.statementSummary.set({
        totalBilled, totalPaid, totalDue: totalBilled - totalPaid
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Not Paid': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Half Paid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  generatePdf() {
    const user = this.selectedUser();
    const year = this.selectedYear();
    const data = this.statementData();
    const summary = this.statementSummary();
    const scope = this.reportScope();

    if (!user || !data.length || !summary) {
        this.utilityService.showNotification('No data to generate PDF.', 'error');
        return;
    }

    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Statement for ${user.name}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const scopeLabel = (scope === 'tillCurrentMonth' && year === this.currentRealYear)
      ? `Year: ${year} (Jan - ${this.months[this.currentRealMonth - 1].name})`
      : `Year: ${year} (Full Year)`;

    doc.text(`Report Period: ${scopeLabel}`, 14, 32);
    doc.text(`Address: ${user.address}`, 14, 38);
    doc.text(`Phone: ${user.phone}`, 14, 44);

    const head = [['#', 'Month', 'Bill Amt.', 'Paid Amt.', 'Due', 'Status', 'Payment Date']];
    const body = data.map((d, index) => [
      index + 1,
      d.monthName,
      d.billAmount.toFixed(2),
      d.paidAmount.toFixed(2),
      d.due.toFixed(2),
      d.status,
      d.paymentDate ? new Date(d.paymentDate).toLocaleDateString() : '-'
    ]);

    (doc as any).autoTable({
        head: head, body: body, startY: 52,
        theme: 'grid', headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text('Statement Summary', 14, finalY + 12);
    doc.setFontSize(10);
    doc.text(`Total Billed: ${summary.totalBilled.toFixed(2)}`, 14, finalY + 18);
    doc.text(`Total Paid: ${summary.totalPaid.toFixed(2)}`, 14, finalY + 24);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Due: ${summary.totalDue.toFixed(2)}`, 14, finalY + 30);
    
    const fileNameSuffix = (scope === 'tillCurrentMonth' && year === this.currentRealYear) ? `_Till_${this.months[this.currentRealMonth - 1].name}` : '';
    doc.save(`Statement_${user.name.replace(/\s/g, '_')}_${year}${fileNameSuffix}.pdf`);
    this.utilityService.showNotification('PDF generated successfully!', 'success');
  }

  exportCsv() {
    const user = this.selectedUser();
    const year = this.selectedYear();
    const data = this.statementData();
    const scope = this.reportScope();

    if (!user || !data.length) {
        this.utilityService.showNotification('No data to export.', 'error');
        return;
    }

    const csvData = data.map((d, index) => ({
        'sr_no': index + 1,
        month: d.monthName,
        bill_amount: d.billAmount,
        paid_amount: d.paidAmount,
        due_amount: d.due,
        status: d.status,
        payment_date: d.paymentDate ? new Date(d.paymentDate).toISOString().split('T')[0] : ''
    }));

    const fileNameSuffix = (scope === 'tillCurrentMonth' && year === this.currentRealYear) ? `_Till_${this.months[this.currentRealMonth - 1].name}` : '';
    this.utilityService.exportToCsv(csvData, `Statement_${user.name.replace(/\s/g, '_')}_${year}${fileNameSuffix}`);
  }
}