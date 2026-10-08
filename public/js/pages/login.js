import { store } from '../store.js';
import { api } from '../api/api.js';
import { Toast } from '../ui/toast.js';

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
            <label class="block text-sm font-medium text-secondary mb-1">Email</label>
            <input id="login-email" type="email" class="clay-input w-full" placeholder="you@example.com" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Password</label>
            <input id="login-password" type="password" class="clay-input w-full" placeholder="••••••••" required>
          </div>

          <p id="login-error" class="text-sm text-[var(--color-critical)] hidden"></p>

          <button id="login-submit" type="submit" class="clay-btn w-full mt-4 py-3 text-lg font-semibold shadow-lg">
            Sign In
          </button>
        </form>

        <div class="mt-6 text-sm text-secondary text-center space-y-2">
          <p>Don't have an account? <a href="#/signup" class="text-[var(--color-primary)] font-semibold">Sign up</a></p>
          <p class="text-xs opacity-75">Demo accounts (password: <code>password123</code>):<br>
            citizen@drainwatch.demo · worker@drainwatch.demo · officer@drainwatch.demo · admin@drainwatch.demo</p>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const user = await api.login({ email, password });
        store.setUser(user);
        Toast.show(`Welcome back, ${user.name}`, 'success');
        window.location.hash = '/dashboard';
        window.location.reload();
      } catch (err) {
        errorEl.textContent = err.message || 'Could not sign in.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
}
