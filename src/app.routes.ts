import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'users', 
    loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent) 
  },
  { 
    path: 'billing', 
    loadComponent: () => import('./components/billing/billing.component').then(m => m.BillingComponent) 
  },
  { 
    path: 'billing/:userId', 
    loadComponent: () => import('./components/billing/billing.component').then(m => m.BillingComponent) 
  },
  { 
    path: 'statements', 
    loadComponent: () => import('./components/statements/statements.component').then(m => m.StatementsComponent) 
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent) 
  },
  { path: '**', redirectTo: 'dashboard' } 
];