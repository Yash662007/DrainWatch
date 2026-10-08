import { store } from '../store.js';
import { api } from '../api/api.js';
import { Toast } from '../ui/toast.js';

export function render() {
  return `
    <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/10 backdrop-blur-sm">
      <div class="clay-panel w-full max-w-md p-8 flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 mb-6">
          <i data-lucide="user-plus" class="w-8 h-8 text-white"></i>
        </div>
        <h2 class="text-2xl font-bold text-primary mb-2 text-center">Create your account</h2>
        <p class="text-body text-center mb-8">Join DrainWatch to report, track, and resolve civic drain issues.</p>

        <form id="signup-form" class="w-full space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Full name</label>
            <input id="signup-name" type="text" class="clay-input w-full" placeholder="Jane Doe" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Email</label>
            <input id="signup-email" type="email" class="clay-input w-full" placeholder="you@example.com" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Password</label>
            <input id="signup-password" type="password" class="clay-input w-full" placeholder="At least 6 characters" minlength="6" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Role</label>
            <select id="signup-role" class="clay-input w-full">
              <option value="citizen">Citizen</option>
              <option value="worker">Field Worker</option>
              <option value="officer">Municipal Officer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <p id="signup-error" class="text-sm text-[var(--color-critical)] hidden"></p>

          <button id="signup-submit" type="submit" class="clay-btn w-full mt-4 py-3 text-lg font-semibold shadow-lg">
            Create account
          </button>
        </form>

        <div class="mt-6 text-sm text-secondary text-center">
          <p>Already have an account? <a href="#/login" class="text-[var(--color-primary)] font-semibold">Sign in</a></p>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();

  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('signup-error');
  const submitBtn = document.getElementById('signup-submit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const role = document.getElementById('signup-role').value;

      try {
        const user = await api.signup({ name, email, password, role });
        store.setUser(user);
        Toast.show(`Welcome to DrainWatch, ${user.name}`, 'success');
        window.location.hash = '/dashboard';
        window.location.reload();
      } catch (err) {
        errorEl.textContent = err.message || 'Could not create account.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create account';
      }
    });
  }
}
