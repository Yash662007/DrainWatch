import { api } from '../api/api.js';
import { Toast } from '../ui/toast.js';
import { ErrorState, EmptyState } from '../ui/components.js';

let task = null;
let state = {
  view: 'list', // list, detail, inspect
  step: 0, // 0: start, 1: before, 2: work, 3: after, 4: verify
  photos: { before: null, after: null }
};
let verificationResult = null;

export function render() {
  return `
    <div class="max-w-md mx-auto h-full flex flex-col pb-20 animate-fade-in" id="field-container">
      <!-- Injected by init() -->
    </div>
  `;
}

export async function init() {
  try {
    const tasks = await api.getFieldTasks();
    task = tasks[0] || null;

    if (!task) {
      document.getElementById('field-container').innerHTML = EmptyState('check-circle', 'All Caught Up', 'You have no assigned tasks right now.');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    state = { view: 'list', step: 0, photos: { before: null, after: null } };
    renderView();
  } catch (e) {
    document.getElementById('field-container').innerHTML = ErrorState('Failed to load field tasks', 'window.location.reload');
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderView() {
  const container = document.getElementById('field-container');
  if (!container) return;

  if (state.view === 'list') {
    container.innerHTML = `
      <h2 class="text-section-title mb-6 flex items-center gap-2">
        <i data-lucide="hard-hat" class="w-6 h-6 text-[var(--color-primary)]"></i> My Tasks
      </h2>
      <div class="clay-card p-4 shadow-[var(--clay-pressed)] border-l-4 border-[var(--color-critical)] cursor-pointer hover:bg-black/5 transition-colors" onclick="window.fieldSetView('detail')">
        <div class="flex justify-between items-start mb-2">
          <div class="font-bold text-lg">${task.id}</div>
          <span class="clay-badge severity-${task.severity}">${task.severity}</span>
        </div>
        <div class="text-sm text-secondary mb-3"><i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${task.location}</div>
        <div class="flex justify-between items-center pt-3 border-t border-[rgba(15,23,42,0.05)]">
          <span class="text-xs font-bold text-secondary uppercase">${task.status}</span>
          <span class="text-xs font-bold text-[var(--color-critical)]"><i data-lucide="clock" class="w-3 h-3 inline"></i> ${task.sla}</span>
        </div>
      </div>
    `;
  }
  else if (state.view === 'detail') {
    container.innerHTML = `
      <div class="flex items-center gap-4 mb-6">
        <button class="p-2 bg-black/5 rounded-full hover:bg-black/10" onclick="window.fieldSetView('list')"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
        <h2 class="text-section-title">${task.id}</h2>
      </div>

      <div class="clay-card p-6 space-y-6">
        <div>
          <div class="text-xs font-bold text-secondary uppercase mb-1">Location</div>
          <div class="font-bold text-primary flex items-center gap-2"><i data-lucide="map-pin" class="w-5 h-5 text-[var(--color-primary)]"></i> ${task.location}</div>
        </div>

        <div class="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)] rounded-xl">
          <div class="text-xs font-bold text-[var(--color-warning)] uppercase mb-1">Issue</div>
          <div class="font-medium text-primary">${task.description || 'No additional description provided.'}</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <a href="#/map" class="clay-btn clay-btn-ghost py-3 flex flex-col items-center justify-center gap-2 h-24">
            <i data-lucide="navigation" class="w-6 h-6"></i>
            <span class="text-xs font-bold">Navigate</span>
          </a>
          <button class="clay-btn py-3 flex flex-col items-center justify-center gap-2 h-24" onclick="window.fieldSetView('inspect')">
            <i data-lucide="play-circle" class="w-6 h-6"></i>
            <span class="text-xs font-bold">Start Work</span>
          </button>
        </div>
      </div>
    `;
  }
  else if (state.view === 'inspect') {
    const captureCard = (type, colorClass) => `
      <label class="clay-card p-12 border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-4 h-64 text-center cursor-pointer hover:bg-black/5 block">
        <div class="w-16 h-16 rounded-full ${colorClass} flex items-center justify-center">
          <i data-lucide="camera" class="w-8 h-8"></i>
        </div>
        <div class="font-bold text-primary">Tap to open Camera</div>
        <div class="text-xs text-secondary">Document ${type === 'before' ? 'initial' : 'cleared'} state</div>
        <input type="file" class="hidden" accept="image/*" capture="environment" id="capture-${type}-input">
      </label>
    `;

    const steps = [
      { title: 'Capture Before Photo', content: captureCard('before', 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]') },
      {
        title: 'Work In Progress',
        content: `
          <div class="clay-card p-8 text-center border border-[var(--color-primary)]">
            <i data-lucide="hard-hat" class="w-16 h-16 text-[var(--color-primary)] mx-auto mb-4 animate-bounce"></i>
            <h3 class="font-bold text-lg mb-2">Work in Progress</h3>
            <p class="text-sm text-secondary mb-6">Perform the necessary clearing and cleaning safely.</p>
            <button class="clay-btn w-full py-4 text-lg" onclick="window.fieldNext()">Work Completed</button>
          </div>
        `
      },
      { title: 'Capture After Photo', content: captureCard('after', 'bg-[var(--color-healthy)]/10 text-[var(--color-healthy)]') },
      {
        title: 'AI Verification',
        content: `
          <div class="clay-card p-6" id="ai-verify-container">
            <div class="flex flex-col items-center justify-center py-8">
              <i data-lucide="loader" class="w-10 h-10 animate-spin text-[var(--color-primary)] mb-4"></i>
              <div class="font-bold">Verifying Resolution...</div>
            </div>
          </div>
        `
      }
    ];

    container.innerHTML = `
      <div class="flex items-center gap-4 mb-6">
        <button class="p-2 bg-black/5 rounded-full hover:bg-black/10" onclick="window.fieldSetView('detail')"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
        <h2 class="text-section-title text-primary">${steps[state.step].title}</h2>
      </div>
      ${steps[state.step].content}
    `;

    if (state.step === 0 || state.step === 2) {
      const type = state.step === 0 ? 'before' : 'after';
      const input = document.getElementById(`capture-${type}-input`);
      if (input) {
        input.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            state.photos[type] = e.target.files[0];
            window.fieldNext();
          }
        });
      }
    }

    if (state.step === 3) {
      setTimeout(runAiVerification, 500);
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

window.fieldSetView = function(view) {
  state.view = view;
  if (view === 'inspect') state.step = 0;
  renderView();
}

window.fieldNext = function() {
  state.step++;
  renderView();
}

async function runAiVerification() {
  const container = document.getElementById('ai-verify-container');
  if (!container) return;

  const checklist = [
    'Drain identified',
    'Debris reduction detected',
    'Water flow improved',
    'Final verification'
  ];

  let html = '<div class="space-y-4 mb-8">';
  const checklistAnim = (async () => {
    for (let i = 0; i < checklist.length; i++) {
      html += `<div class="flex items-center gap-3 text-sm font-medium"><i data-lucide="check-circle" class="w-5 h-5 text-[var(--color-healthy)]"></i> ${checklist[i]}</div>`;
      container.innerHTML = html + '</div>';
      if (window.lucide) window.lucide.createIcons();
      await new Promise(r => setTimeout(r, 800));
    }
  })();

  const formData = new FormData();
  formData.append('beforePhoto', state.photos.before);
  formData.append('afterPhoto', state.photos.after);

  let result;
  try {
    const [, res] = await Promise.all([checklistAnim, api.resolveWorkOrder(task.id, formData)]);
    result = res;
  } catch (err) {
    container.innerHTML = `
      <div class="text-center">
        <i data-lucide="alert-triangle" class="w-10 h-10 text-[var(--color-critical)] mx-auto mb-4"></i>
        <h3 class="font-bold mb-2">Verification failed</h3>
        <p class="text-sm text-secondary mb-6">${err.message || 'Could not verify resolution.'}</p>
        <button class="clay-btn w-full" onclick="window.fieldSetView('detail')">Back</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  verificationResult = result;

  container.innerHTML = `
    <div class="text-center">
      <div class="w-20 h-20 bg-[var(--color-healthy)]/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[var(--clay-pressed)]">
        <i data-lucide="check-circle" class="w-10 h-10 text-[var(--color-healthy)]"></i>
      </div>
      <h3 class="text-xl font-bold text-primary mb-2 uppercase tracking-wide">Resolution Verified</h3>

      <div class="grid grid-cols-2 gap-4 my-6">
        <div class="bg-black/5 p-3 rounded-xl shadow-[var(--clay-pressed)]">
          <div class="text-[10px] uppercase font-bold text-secondary mb-1">Before</div>
          <div class="font-bold text-[var(--color-critical)]">${result.before.blockage}% Blocked</div>
        </div>
        <div class="bg-black/5 p-3 rounded-xl shadow-[var(--clay-pressed)]">
          <div class="text-[10px] uppercase font-bold text-secondary mb-1">After</div>
          <div class="font-bold text-[var(--color-healthy)]">${result.after.blockage}% Blocked</div>
        </div>
      </div>

      <div class="bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold py-2 rounded-lg mb-8">
        Improvement ${result.improvementPct}%
      </div>

      <button class="clay-btn w-full py-4 text-lg shadow-[var(--clay-raised-hover)]" onclick="window.fieldCloseWO()">Close Work Order</button>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

window.fieldCloseWO = async function() {
  try {
    await api.closeWorkOrder(task.id);
    Toast.show('Work Order Closed Successfully', 'success');
  } catch (err) {
    Toast.show(err.message || 'Failed to close work order', 'error');
  }
  state.view = 'list';
  init(); // Reload
}
