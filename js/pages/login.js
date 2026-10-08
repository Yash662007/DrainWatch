import { store } from '../store.js';

export function render() {
  return `
    <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/10 backdrop-blur-sm">
      <div class="clay-panel w-full max-w-md p-8 flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 mb-6">
          <i data-lucide="waves" class="w-8 h-8 text-white"></i>
        </div>
        <h2 class="text-2xl font-bold text-primary mb-2 text-center">Welcome to DrainWatch</h2>
        <p class="text-body text-center mb-8">Sign in to manage and monitor civic infrastructure.</p>
        
        <form id="login-form" class="w-full space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Username / ID</label>
            <input type="text" class="clay-input" placeholder="Enter your ID" required value="demo_user">
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Password</label>
            <input type="password" class="clay-input" placeholder="••••••••" required value="password">
          </div>
          
          <button type="submit" class="clay-btn w-full mt-4 py-3 text-lg font-semibold shadow-lg">
            Sign In
          </button>
        </form>
        
        <div class="mt-6 text-sm text-secondary text-center">
          <p>Demo Mode: Click Sign In to continue</p>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();
  
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      store.update({ isAuthenticated: true });
      window.location.hash = '/dashboard';
    });
  }
}
