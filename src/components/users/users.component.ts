import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { UtilityService } from '../../services/utility.service';
import { User } from '../../models/user.model';
import { NotificationComponent } from '../shared/notification.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NotificationComponent]
})
export class UsersComponent {
  // FIX: Add explicit types to injected services to prevent 'unknown' type errors.
  storageService: StorageService = inject(StorageService);
  utilityService: UtilityService = inject(UtilityService);
  fb: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);

  isModalOpen = signal(false);
  isEditing = signal(false);
  editingUserId = signal<string | null>(null);
  searchTerm = signal('');
  showInactive = signal(false);

  users = this.storageService.users;
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const showInactive = this.showInactive();

    return this.users().filter(user => {
      const statusMatch = showInactive || user.isActive;
      if (!statusMatch) return false;

      if (!term) return true;

      return user.name.toLowerCase().includes(term) ||
             user.address.toLowerCase().includes(term) ||
             user.phone.toLowerCase().includes(term);
    });
  });
  
  userForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    village: [''],
    category: ['Internet' as 'Internet' | 'Cable', Validators.required],
    monthlyBill: [0, [Validators.required, Validators.min(0)]]
  });

  openModal(user: User | null) {
    this.isEditing.set(!!user);
    this.userForm.reset({ category: 'Internet', village: '' });
    if (user) {
      this.editingUserId.set(user.id);
      this.userForm.setValue({
        name: user.name,
        phone: user.phone,
        address: user.address,
        village: user.village || '',
        category: user.category,
        monthlyBill: user.monthlyBill
      });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingUserId.set(null);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.utilityService.showNotification('Please fill all required fields.', 'error');
      return;
    }

    if (this.isEditing()) {
      const originalUser = this.users().find(u => u.id === this.editingUserId());
      if (!originalUser) {
        this.utilityService.showNotification('Error: Could not find user to update.', 'error');
        this.closeModal();
        return;
      }
      const updatedUser: User = {
        ...originalUser,
        ...this.userForm.value as any
      };
      this.storageService.updateUser(updatedUser);
      this.utilityService.showNotification('User updated successfully!', 'success');
    } else {
      this.storageService.addUser(this.userForm.value as any);
      this.utilityService.showNotification('User added successfully!', 'success');
    }
    this.closeModal();
  }

  toggleUserStatus(user: User) {
    const userToUpdate = this.storageService.users().find(u => u.id === user.id);
    if (!userToUpdate) {
      this.utilityService.showNotification('User not found.', 'error');
      return;
    }

    if (userToUpdate.isActive) {
      const updatedUser: User = { ...userToUpdate, isActive: false, dropoutDate: new Date().toISOString() };
      this.storageService.updateUser(updatedUser);
      this.utilityService.showNotification(`${userToUpdate.name} marked as dropout.`, 'info');
    } else {
      const updatedUser: User = { ...userToUpdate, isActive: true, dropoutDate: null };
      this.storageService.updateUser(updatedUser);
      this.utilityService.showNotification(`${userToUpdate.name} has been reactivated.`, 'info');
    }
  }

  collectBill(user: User) {
    this.router.navigate(['/billing', user.id]);
  }

  sendWhatsAppReminder(user: User) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const billEntry = this.storageService.billEntries().find(entry => 
        entry.userId === user.id &&
        entry.year === currentYear &&
        entry.month === currentMonth
    );

    let dueAmount = user.monthlyBill;
    if (billEntry) {
        dueAmount = billEntry.billAmount - billEntry.paidAmount;
    }
    
    if (dueAmount <= 0) {
        this.utilityService.showNotification(`${user.name} has no outstanding balance for this month.`, 'info');
        return;
    }

    const monthName = today.toLocaleString('default', { month: 'long' });

    const message = `Dear ${user.name},\n\nThis is a friendly reminder for your NetPay Pro bill payment for the month of ${monthName} ${currentYear}.\n\nYour outstanding amount is: ${dueAmount.toFixed(2)}\n\nThank you,\nKhalid Software House`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${user.phone}?text=${encodedMessage}`, '_blank');
  }
}