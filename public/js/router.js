import { store } from './store.js';

export class Router {
  constructor(routes, containerId) {
    this.routes = routes;
    this.container = document.getElementById(containerId);
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  async handleRoute() {
    let hash = window.location.hash.slice(1) || (store.state.user ? '/dashboard' : '/login');

    // Auth guard
    const isAuthenticated = !!store.state.user;
    const isPublicRoute = hash === '/login' || hash === '/signup';
    if (!isAuthenticated && !isPublicRoute) {
      window.location.hash = '/login';
      return;
    }
    if (isAuthenticated && isPublicRoute) {
      window.location.hash = '/dashboard';
      return;
    }

    // Toggle app shell visibility
    const isLogin = isPublicRoute;
    const sidebar = document.getElementById('sidebar');
    const header = document.querySelector('.app-header');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (sidebar) sidebar.style.display = isLogin ? 'none' : '';
    if (header) header.style.display = isLogin ? 'none' : '';
    if (bottomNav) bottomNav.style.display = isLogin ? 'none' : '';

    let route = this.routes.find(r => r.path === hash);
    if (!route) {
      route = this.routes[0];
      window.location.hash = route.path;
      return;
    }

    this.currentRoute = route.path;
    this.updateActiveNavLinks();
    
    // Check role access (public routes like /login, /signup have no role gate)
    const userRole = store.state.role;
    if (!isPublicRoute && route.roles && !route.roles.includes(userRole)) {
      this.container.innerHTML = `
        <div class="clay-card flex flex-col items-center justify-center p-12 text-center h-[50vh] max-w-md mx-auto mt-12">
          <i data-lucide="lock" class="w-12 h-12 text-secondary mb-4"></i>
          <h2 class="text-section-title mb-2">Access Denied</h2>
          <p class="text-body mb-6">You do not have permission to view this page as a ${userRole}.</p>
          <button class="clay-btn" onclick="window.location.hash='/dashboard'">Go Home</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Show loading skeleton
    this.container.innerHTML = `
      <div class="space-y-6 max-w-4xl mx-auto w-full">
        <div class="h-8 clay-skeleton w-1/4"></div>
        <div class="h-64 clay-skeleton rounded-xl w-full"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="h-32 clay-skeleton rounded-xl w-full"></div>
          <div class="h-32 clay-skeleton rounded-xl w-full"></div>
          <div class="h-32 clay-skeleton rounded-xl w-full"></div>
        </div>
      </div>
    `;
    
    try {
      const pageModule = await route.component();
      this.container.innerHTML = typeof pageModule.render === 'function' ? pageModule.render() : pageModule.default.render();

      const initFn = typeof pageModule.init === 'function' ? pageModule.init : (pageModule.default && pageModule.default.init);
      if (initFn) {
        initFn();
      }
      
      // Update page title
      const titleEl = document.getElementById('page-title');
      if (titleEl) titleEl.textContent = route.title || 'DrainWatch';
      
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      console.error(e);
      this.container.innerHTML = `
        <div class="clay-card p-6 border-l-4 border-[var(--color-critical)] text-center h-[50vh] flex flex-col items-center justify-center max-w-md mx-auto mt-12">
          <i data-lucide="alert-triangle" class="w-12 h-12 text-[var(--color-critical)] mb-4"></i>
          <h3 class="text-card-title mb-2">Error Loading Page</h3>
          <p class="text-body text-sm mb-4">${e.message}</p>
          <button class="clay-btn clay-btn-ghost" onclick="window.location.reload()">Retry</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
  
  updateActiveNavLinks() {
    // Desktop Sidebar
    document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
      link.classList.remove('active', 'bg-[var(--surface-elevated)]', 'text-[var(--color-primary)]', 'shadow-sm', 'shadow-[var(--clay-pressed)]');
      link.classList.add('text-secondary', 'hover:bg-black/5');
      if (link.getAttribute('href') === '#' + this.currentRoute) {
        link.classList.add('active', 'bg-[var(--surface-elevated)]', 'text-[var(--color-primary)]', 'shadow-sm', 'shadow-[var(--clay-pressed)]');
        link.classList.remove('text-secondary', 'hover:bg-black/5');
      }
    });

    // Mobile Bottom Nav
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.classList.remove('text-[var(--color-primary)]');
      link.classList.add('text-secondary');
      if (link.getAttribute('href') === '#' + this.currentRoute) {
        link.classList.add('text-[var(--color-primary)]');
        link.classList.remove('text-secondary');
      }
    });
  }
}
