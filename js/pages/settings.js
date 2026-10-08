import { store } from '../store.js';
import { Toast } from '../ui/toast.js';

export function render() {
  return `
    <div class="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-[var(--color-primary)]/10 rounded-xl">
          <i data-lucide="settings" class="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]"></i>
        </div>
        <h2 class="text-page-title">Settings</h2>
      </div>
      
      <div class="clay-card p-6 shadow-[var(--clay-raised)] mb-6">
        <h3 class="text-card-title mb-4 border-b border-[rgba(15,23,42,0.05)] pb-2">Appearance & Accessibility</h3>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold text-primary text-sm">Theme</div>
              <div class="text-xs text-secondary">DrainWatch currently uses a dynamic theme.</div>
            </div>
            <select class="clay-input w-auto text-sm py-1.5" disabled>
              <option>System Default</option>
            </select>
          </div>
          
          <div class="flex justify-between items-center pt-2">
            <div>
              <div class="font-bold text-primary text-sm">Reduced Motion</div>
              <div class="text-xs text-secondary">Disable non-essential animations</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" id="toggle-motion" onchange="window.toggleSetting(this)">
              <div class="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div class="clay-card p-6 shadow-[var(--clay-raised)]">
        <h3 class="text-card-title mb-4 border-b border-[rgba(15,23,42,0.05)] pb-2">Notifications</h3>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold text-primary text-sm">Push Notifications</div>
              <div class="text-xs text-secondary">Alerts for critical drains and replies</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked onchange="window.toggleSetting(this)">
              <div class="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>
          <div class="flex justify-between items-center pt-2">
            <div>
              <div class="font-bold text-primary text-sm">Offline Mode</div>
              <div class="text-xs text-secondary">Save map data for offline use</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" checked onchange="window.toggleSetting(this)">
              <div class="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end pt-4">
        <button class="clay-btn px-8" onclick="window.saveSettings()">Save Changes</button>
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();
}

window.toggleSetting = function(el) {
  // Mock logic
}

window.saveSettings = function() {
  Toast.show('Settings saved successfully.', 'success');
}
