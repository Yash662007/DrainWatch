export class Toast {
  static init() {
    if (document.getElementById('toast-container')) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(this.container);
  }
  
  static show(message, type = 'info') {
    if(!this.container) this.init();
    
    const toast = document.createElement('div');
    const colors = {
      success: 'var(--color-healthy)',
      error: 'var(--color-critical)',
      warning: 'var(--color-warning)',
      info: 'var(--color-primary)'
    };
    
    const icons = {
      success: 'check-circle',
      error: 'alert-triangle',
      warning: 'alert-octagon',
      info: 'info'
    };
    
    toast.className = `clay-card p-4 flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto shadow-lg min-w-[280px]`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}" class="w-5 h-5" style="color: ${colors[type]}"></i>
      <span class="text-sm font-medium text-primary">${message}</span>
    `;
    
    this.container.appendChild(toast);
    if(window.lucide) lucide.createIcons({root: toast});
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });
    
    // Auto remove
    setTimeout(() => {
      toast.classList.add('opacity-0', 'scale-95');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}
