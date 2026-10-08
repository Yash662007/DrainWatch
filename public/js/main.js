import { store } from './store.js';
import { Router } from './router.js';
import { Toast } from './ui/toast.js';
import { OfflineManager } from './ui/offline.js';
import { api } from './api/api.js';

// Define navigation configuration
const navConfig = [
  { path: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['citizen', 'worker', 'officer', 'admin'] },
  { path: '/map', label: 'Live Map', icon: 'map', roles: ['citizen', 'worker', 'officer', 'admin'] },
  { path: '/report', label: 'New Report', icon: 'plus-square', roles: ['citizen', 'worker', 'officer', 'admin'] },
  { path: '/work-orders', label: 'Work Orders', icon: 'clipboard-list', roles: ['officer', 'admin'] },
  { path: '/field', label: 'Field Tasks', icon: 'hard-hat', roles: ['worker'] },
  { path: '/inspections', label: 'AI Inspections', icon: 'cpu', roles: ['officer', 'admin'] },
  { path: '/rewards', label: 'Rewards', icon: 'award', roles: ['citizen'] },
  { path: '/rewards/leaderboard', label: 'Leaderboard', icon: 'trophy', roles: ['citizen', 'admin'] },
  { path: '/analytics', label: 'Analytics', icon: 'bar-chart-2', roles: ['officer', 'admin'] },
  { path: '/notifications', label: 'Notifications', icon: 'bell', roles: ['citizen', 'worker', 'officer', 'admin'] },
  { path: '/profile', label: 'Profile', icon: 'user', roles: ['citizen', 'worker', 'officer', 'admin'] },
  { path: '/settings', label: 'Settings', icon: 'settings', roles: ['citizen', 'worker', 'officer', 'admin'] },
];

const ROLE_LABELS = {
  citizen: 'Citizen',
  worker: 'Field Worker',
  officer: 'Municipal Officer',
  admin: 'Administrator',
};

// Initialize Sidebar
function renderSidebar() {
  const userRole = store.state.role;
  const navEl = document.getElementById('sidebar-nav');
  if (!navEl) return;

  navEl.innerHTML = '';

  navConfig.forEach(item => {
    if (item.roles.includes(userRole)) {
      const a = document.createElement('a');
      a.href = '#' + item.path;
      a.className = 'nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-secondary hover:bg-black/5 font-medium';
      a.innerHTML = `<i data-lucide="${item.icon}" class="w-5 h-5"></i> <span class="nav-label">${item.label}</span>`;
      navEl.appendChild(a);
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

function renderSidebarUser() {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const user = store.state.user;
  if (nameEl) nameEl.textContent = user ? user.name : 'Not signed in';
  if (roleEl) roleEl.textContent = user ? (ROLE_LABELS[user.role] || user.role) : '';
}

// Sidebar toggle logic
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');
let sidebarCollapsed = false;

if (toggleBtn && sidebar) {
  toggleBtn.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    if (sidebarCollapsed) {
      sidebar.classList.add('w-[80px]');
      sidebar.classList.remove('w-[280px]');
      document.querySelectorAll('.nav-label, .logo-text span').forEach(el => el.classList.add('hidden'));
    } else {
      sidebar.classList.remove('w-[80px]');
      sidebar.classList.add('w-[280px]');
      document.querySelectorAll('.nav-label, .logo-text span').forEach(el => el.classList.remove('hidden'));
    }
  });
}

// Sign out
const logoutBtn = document.getElementById('sidebar-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await api.logout().catch(() => {});
    store.clearUser();
    window.location.hash = '/login';
    window.location.reload();
  });
}

// Initialize Router
const routes = [
  { path: '/login', title: 'Login', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/login.js') },
  { path: '/signup', title: 'Sign Up', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/signup.js') },
  { path: '/dashboard', title: 'Dashboard', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/dashboard.js') },
  { path: '/map', title: 'Live Map', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/map.js') },
  { path: '/report', title: 'Report Issue', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/report.js') },
  { path: '/work-orders', title: 'Work Orders', roles: ['officer', 'admin'], component: () => import('./pages/work-orders.js') },
  { path: '/field', title: 'Field Tasks', roles: ['worker'], component: () => import('./pages/field.js') },
  { path: '/inspections', title: 'AI Inspections', roles: ['officer', 'admin'], component: () => import('./pages/inspections.js') },
  { path: '/rewards', title: 'Civic Rewards', roles: ['citizen'], component: () => import('./pages/rewards.js') },
  { path: '/rewards/leaderboard', title: 'Leaderboard', roles: ['citizen', 'admin'], component: () => import('./pages/leaderboard.js') },
  { path: '/analytics', title: 'Analytics', roles: ['officer', 'admin'], component: () => import('./pages/analytics.js') },
  { path: '/notifications', title: 'Notifications', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/notifications.js') },
  { path: '/profile', title: 'Profile', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/profile.js') },
  { path: '/settings', title: 'Settings', roles: ['citizen', 'worker', 'officer', 'admin'], component: () => import('./pages/settings.js') },
];

// Start application
document.addEventListener('DOMContentLoaded', async () => {
  Toast.init();
  OfflineManager.init();

  const user = await api.me().catch(() => null);
  if (user) {
    store.setUser(user);
  } else {
    store.clearUser();
  }

  renderSidebar();
  renderSidebarUser();

  const router = new Router(routes, 'app-content');
  router.handleRoute();

  // Update header credits initially
  const creditsEl = document.getElementById('header-credits');
  if (creditsEl) creditsEl.textContent = store.state.user ? store.state.user.credits : 0;
  store.subscribe(state => {
    if (creditsEl) creditsEl.textContent = state.user ? state.user.credits : 0;
    renderSidebarUser();
  });
});
