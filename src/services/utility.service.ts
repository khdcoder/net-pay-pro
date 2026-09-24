import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  notifications = signal<Notification[]>([]);

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const newNotification = { message, type, id: Date.now() };
    this.notifications.update(current => [...current, newNotification]);
    setTimeout(() => this.removeNotification(newNotification.id), 5000);
  }

  removeNotification(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
  
  exportToCsv<T extends object>(data: T[], filename: string) {
    if (!data || data.length === 0) {
      this.showNotification('No data to export.', 'info');
      return;
    }
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify((row as any)[fieldName])).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showNotification('CSV exported successfully!', 'success');
  }

  exportToPdf(title: string, head: string[][], body: any[][], filename: string): boolean {
     if (!body || body.length === 0) {
      this.showNotification('No data for PDF report.', 'info');
      return false;
    }

    const jspdfLib = (window as any).jspdf;
    if (!jspdfLib || !jspdfLib.jsPDF) {
      this.showNotification('PDF library not loaded. Please refresh or check connection.', 'error');
      console.error('jsPDF library not found on window object.');
      return false;
    }

    const { jsPDF } = jspdfLib;
    const doc = new jsPDF();
    
    if (typeof (doc as any).autoTable !== 'function') {
      this.showNotification('PDF table plugin not loaded. Please refresh or check connection.', 'error');
      console.error('jsPDF autoTable plugin not found.');
      return false;
    }
    
    doc.text(title, 14, 16);
    (doc as any).autoTable({
        head: head,
        body: body,
        startY: 20
    });
    doc.save(`${filename}.pdf`);
    this.showNotification('PDF generated successfully!', 'success');
    return true;
  }
}