import { Toast } from './toast.js';
import { api } from '../api/api.js';
import { store } from '../store.js';

export class OfflineManager {
  static init() {
    if (document.getElementById('offline-banner')) return;
    this.banner = document.createElement('div');
    this.banner.id = 'offline-banner';
    this.banner.className = 'fixed top-0 left-0 right-0 bg-[var(--color-warning)] text-white text-xs font-semibold py-1.5 px-4 text-center z-[100] transform -translate-y-full transition-transform duration-300 flex items-center justify-center gap-2 shadow-md';
    this.banner.innerHTML = '<i data-lucide="wifi-off" class="w-4 h-4"></i> You\'re offline. Actions will be queued and submitted when online.';
    document.body.appendChild(this.banner);
    if(window.lucide) lucide.createIcons({root: this.banner});
    
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    this.queue = JSON.parse(localStorage.getItem('drainwatch_queue') || '[]');
    
    if (!navigator.onLine) {
      this.handleOffline();
    }
  }
  
  static handleOffline() {
    this.banner.classList.remove('-translate-y-full');
    Toast.show('You are offline. Actions will be queued.', 'warning');
  }
  
  static handleOnline() {
    this.banner.classList.add('-translate-y-full');
    Toast.show('Back online!', 'success');
    this.processQueue();
  }
  
  static queueAction(action) {
    this.queue.push(action);
    localStorage.setItem('drainwatch_queue', JSON.stringify(this.queue));
    if (navigator.onLine) {
      this.processQueue();
    } else {
      Toast.show('Action queued for when you are back online.', 'info');
    }
  }
  
  static async processQueue() {
    if (this.queue.length === 0) return;

    Toast.show(`Processing ${this.queue.length} queued action(s)...`, 'info');

    const remaining = [];
    for (const action of this.queue) {
      try {
        await this.replay(action);
      } catch (e) {
        // Could not replay (e.g. the photo File was lost across a reload) — drop it
        // rather than retry forever, but surface that it failed.
        Toast.show(`Failed to submit a queued action: ${e.message}`, 'error');
        continue;
      }
    }
    this.queue = remaining;
    localStorage.setItem('drainwatch_queue', JSON.stringify(this.queue));

    if (remaining.length === 0) {
      Toast.show('All queued actions processed successfully!', 'success');
    }
  }

  static async replay(action) {
    if (action.type === 'REPORT_SUBMIT') {
      const { issue, location, description, coords, photoFile } = action.data;
      if (!(photoFile instanceof File)) {
        throw new Error('photo was lost (reload while offline is not supported for queued photos)');
      }
      const formData = new FormData();
      formData.append('issue', issue);
      formData.append('location', location);
      formData.append('description', description || '');
      if (coords) {
        formData.append('lat', String(coords[0]));
        formData.append('lng', String(coords[1]));
      }
      formData.append('photo', photoFile);

      const result = await api.submitReport(formData);
      const reports = [result.report, ...(store.state.reports || [])];
      store.updateEntity('reports', reports);
      const user = await api.me().catch(() => null);
      if (user) store.setUser(user);
      return result;
    }
    throw new Error(`Unknown queued action type: ${action.type}`);
  }
}
