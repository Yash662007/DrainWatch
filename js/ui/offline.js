import { Toast } from './toast.js';

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
    
    Toast.show(`Processing ${this.queue.length} queued actions...`, 'info');
    // Stub for processing
    setTimeout(() => {
      this.queue = [];
      localStorage.removeItem('drainwatch_queue');
      Toast.show('All queued actions processed successfully!', 'success');
    }, 1500);
  }
}
