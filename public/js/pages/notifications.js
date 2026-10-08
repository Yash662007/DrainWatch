import { api } from '../api/api.js';
import { EmptyState, ErrorState } from '../ui/components.js';
import { Toast } from '../ui/toast.js';

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const TYPE_STYLE = {
  report_update: { icon: 'file-text', color: 'var(--color-primary)' },
  work_order: { icon: 'check-circle', color: 'var(--color-primary)' },
  critical_drain: { icon: 'alert-triangle', color: 'var(--color-critical)' },
  credit_earned: { icon: 'award', color: 'var(--color-healthy)' },
  badge_unlocked: { icon: 'star', color: 'var(--color-warning)' },
  ai_alert: { icon: 'cpu', color: 'var(--color-critical)' }
};

export function render() {
  return `
    <div class="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-page-title flex items-center gap-3">
          <i data-lucide="bell" class="w-8 h-8 text-[var(--color-primary)]"></i> Notifications
        </h2>
        <button class="clay-btn clay-btn-ghost text-xs" onclick="window.markAllRead()">Mark all as read</button>
      </div>

      <div class="clay-card p-0 overflow-hidden divide-y divide-[rgba(15,23,42,0.05)] shadow-[var(--clay-raised)]" id="notifications-list">
        <div class="p-6 text-sm text-secondary">Loading...</div>
      </div>
    </div>
  `;
}

export async function init() {
  if (window.lucide) window.lucide.createIcons();
  await loadNotifications();
}

async function loadNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  let items;
  try {
    items = await api.getNotifications();
  } catch (e) {
    container.innerHTML = ErrorState('Failed to load notifications.', 'window.location.reload');
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (items.length === 0) {
    container.innerHTML = EmptyState('bell-off', 'No Notifications', "You're all caught up. We'll let you know when something happens.");
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(n => {
    const style = TYPE_STYLE[n.type] || { icon: 'bell', color: 'var(--color-primary)' };
    return `
      <div class="p-4 flex gap-4 transition-colors hover:bg-black/[0.02] cursor-pointer ${n.unread ? 'bg-[var(--color-primary)]/5' : ''}" onclick="window.markRead(${n.id})">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[var(--clay-pressed)]" style="background: ${style.color}20">
          <i data-lucide="${style.icon}" class="w-5 h-5" style="color: ${style.color}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start mb-1">
            <div class="font-bold text-primary text-sm ${n.unread ? '' : 'opacity-80'}">${n.title}</div>
            <div class="text-[10px] text-secondary whitespace-nowrap ml-2">${relativeTime(n.time)}</div>
          </div>
          <p class="text-sm text-secondary leading-tight">${n.desc}</p>
        </div>
        ${n.unread ? `<div class="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0"></div>` : ''}
      </div>
    `;
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

window.markRead = async function(id) {
  try {
    await api.markNotificationRead(id);
    await loadNotifications();
  } catch (e) {
    // Non-critical; leave as-is on failure.
  }
}

window.markAllRead = async function() {
  try {
    await api.markAllNotificationsRead();
    Toast.show('All notifications marked as read', 'success');
    await loadNotifications();
  } catch (e) {
    Toast.show('Failed to update notifications', 'error');
  }
}
