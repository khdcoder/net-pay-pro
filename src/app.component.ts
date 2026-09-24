import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { LicenseService } from './services/license.service';
import { StorageService } from './services/storage.service';
import { SyncService } from './services/sync.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
})
export class AppComponent implements OnInit {
  licenseService = inject(LicenseService);
  storageService = inject(StorageService);
  syncService = inject(SyncService);
  router = inject(Router);

  isSidebarOpen = signal(true);
  isMobileDrawerOpen = signal(false);
  isDarkMode = signal(false);
  currentRouteTitle = signal('Dashboard');

  // Count pending bills for current month to show badge on Billing tab
  pendingBillsCount = computed(() => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const activeUsers = this.storageService.users().filter(u => u.isActive);
    const monthlyBills = this.storageService.billEntries().filter(b => b.year === curYear && b.month === curMonth);
    
    // Count users who haven't paid in full
    let pending = 0;
    for (const u of activeUsers) {
      const entry = monthlyBills.find(b => b.userId === u.id);
      if (!entry || entry.status !== 'Paid') {
        pending++;
      }
    }
    return pending;
  });

  constructor() {
    // Watch for route changes to update header title & close mobile drawer automatically
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isMobileDrawerOpen.set(false);
      const url = event.urlAfterRedirects || event.url;
      if (url.includes('/users')) {
        this.currentRouteTitle.set('Users Directory');
      } else if (url.includes('/billing')) {
        this.currentRouteTitle.set('Bill Collection');
      } else if (url.includes('/statements')) {
        this.currentRouteTitle.set('User Statements');
      } else if (url.includes('/settings')) {
        this.currentRouteTitle.set('Settings & Sync');
      } else {
        this.currentRouteTitle.set('Dashboard');
      }
    });

    // Theme effect
    effect(() => {
      const dark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('netpay_theme', dark ? 'dark' : 'light');
      }
    });
  }

  ngOnInit() {
    // Initial theme check
    const savedTheme = localStorage.getItem('netpay_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode.set(true);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  toggleMobileDrawer() {
    this.isMobileDrawerOpen.update(v => !v);
  }

  closeMobileDrawer() {
    this.isMobileDrawerOpen.set(false);
  }

  toggleDarkMode() {
    this.isDarkMode.update(v => !v);
  }
}

