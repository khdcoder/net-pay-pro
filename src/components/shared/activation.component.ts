import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicenseService } from '../../services/license.service';
import { UtilityService } from '../../services/utility.service';

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-indigo-100 dark:border-gray-700">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-key text-3xl text-indigo-600 dark:text-indigo-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Activate NetPay Pro</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Please enter your serial key to continue using the application.</p>
        </div>

        <div class="space-y-4">
          <div>
            <label for="serialKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Key</label>
            <input 
              id="serialKey" 
              type="text" 
              [(ngModel)]="serialKey"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              [disabled]="isLoading()"
            />
          </div>

          <button 
            (click)="activate()" 
            class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center space-x-2"
            [disabled]="isLoading() || !serialKey().trim()"
          >
            @if (isLoading()) {
              <i class="fas fa-spinner fa-spin"></i>
              <span>Activating...</span>
            } @else {
              <span>Activate Now</span>
            }
          </button>

          <div class="text-center mt-6">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Don't have a serial key? 
              <a 
                href="https://khalid-software-house.web.app" 
                target="_blank" 
                class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Buy One or Get One
              </a>
            </p>
          </div>
          
          <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <a 
              href="https://khalid-software-house.web.app" 
              target="_blank" 
              class="group inline-flex flex-col items-center"
            >
              <span class="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-indigo-500 transition-colors">Powered by</span>
              <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Khalid Software House</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivationComponent {
  private licenseService = inject(LicenseService);
  private utilityService = inject(UtilityService);

  serialKey = signal('');
  isLoading = signal(false);

  async activate() {
    const key = this.serialKey().trim();
    if (!key) return;

    this.isLoading.set(true);
    const result = await this.licenseService.activate(key);
    this.isLoading.set(false);

    if (result.success) {
      this.utilityService.showNotification(result.message, 'success');
    } else {
      this.utilityService.showNotification(result.message, 'error');
    }
  }
}
