import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilityService } from '../../services/utility.service';

@Component({
  selector: 'app-notification',
  template: `
    <div class="fixed top-5 right-5 z-[200] space-y-3">
      @for (notification of utilityService.notifications(); track notification.id) {
        <div 
          [class.bg-green-500]="notification.type === 'success'"
          [class.bg-red-500]="notification.type === 'error'"
          [class.bg-blue-500]="notification.type === 'info'"
          class="text-white p-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in-right">
          <span>{{ notification.message }}</span>
          <button (click)="utilityService.removeNotification(notification.id)" class="ml-4 text-white hover:text-gray-200">
             <i class="fas fa-times"></i>
          </button>
        </div>
      }
    </div>
    <style>
      .animate-fade-in-right {
        animation: fadeInRight 0.5s ease-in-out;
      }
      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    </style>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  utilityService = inject(UtilityService);
}
