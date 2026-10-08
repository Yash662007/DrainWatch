import { schemas } from '../validation/schemas.js';
import { store } from '../store.js';
import { api } from '../api/api.js';
import { Toast } from '../ui/toast.js';
import { OfflineManager } from '../ui/offline.js';

let state = {
  step: 1,
  data: { issue: '', location: '', coords: null, photo: null, photoFile: null, description: '' },
  errors: {}
};

const issues = [
  'Blocked Drain', 'Overflow', 'Garbage Accumulation', 
  'Plastic Waste', 'Sewage', 'Water Stagnation', 
  'Damaged Drain', 'Other'
];

export function render() {
  return `
    <div class="max-w-md mx-auto space-y-6 pb-20 md:pb-8 animate-fade-in" id="report-container">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-section-title">New Report</h2>
        <div class="text-xs font-bold text-secondary bg-black/5 px-3 py-1 rounded-full">STEP <span id="step-indicator">1</span>/5</div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-black/5 h-2 rounded-full mb-8 overflow-hidden shadow-[var(--clay-pressed)]">
        <div id="progress-bar" class="h-full bg-[var(--color-primary)] transition-all duration-300 w-1/5"></div>
      </div>
      
      <div id="wizard-content" class="relative min-h-[350px]">
        <!-- Content injected here -->
      </div>
      
      <div class="flex justify-between mt-8 pt-6 border-t border-[rgba(15,23,42,0.05)]" id="wizard-controls">
        <button id="btn-back" class="clay-btn clay-btn-ghost hidden px-6">Back</button>
        <button id="btn-next" class="clay-btn ml-auto px-8 w-full md:w-auto">Next</button>
      </div>
    </div>
  `;
}

export function init() {
  state = { step: 1, data: { issue: '', location: '', coords: null, photo: null, photoFile: null, description: '' }, errors: {} };
  renderStep();
  
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (state.step > 1) {
      state.step--;
      renderStep();
    }
  });
  
  document.getElementById('btn-next')?.addEventListener('click', handleNext);
}

function renderStep() {
  const content = document.getElementById('wizard-content');
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  document.getElementById('step-indicator').textContent = state.step;
  document.getElementById('progress-bar').style.width = `${state.step * 20}%`;
  
  btnBack.classList.toggle('hidden', state.step === 1);
  btnNext.innerHTML = state.step === 5 ? 'Submit Report' : 'Next';
  btnNext.classList.toggle('w-full', state.step === 1);
  
  const stepViews = {
    1: () => `
      <h3 class="font-bold mb-4">What's the issue?</h3>
      <div class="grid grid-cols-2 gap-3">
        ${issues.map(i => `
          <button class="issue-btn clay-card p-4 text-left transition-all ${state.data.issue === i ? '!bg-[var(--color-primary)] text-white shadow-[var(--clay-pressed)]' : 'hover:scale-[1.02]'}" data-issue="${i}">
            <div class="font-medium text-sm md:text-base leading-tight">${i}</div>
          </button>
        `).join('')}
      </div>
      ${state.errors.issue ? `<p class="text-[var(--color-critical)] text-sm mt-3 font-medium">${state.errors.issue}</p>` : ''}
    `,
    2: () => `
      <h3 class="font-bold mb-4">Where is it located?</h3>
      <div class="space-y-4">
        <button id="btn-location" class="clay-btn w-full py-4 text-base flex flex-col items-center justify-center gap-2 h-32">
          <i data-lucide="map-pin" class="w-8 h-8"></i>
          <span>Use Current Location</span>
        </button>
        
        <div class="text-center text-sm font-bold text-secondary my-2">OR</div>
        
        <div class="relative">
          <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary"></i>
          <input type="text" class="clay-input pl-10 py-3" placeholder="Search area or landmark" value="${state.data.location}" onchange="updateData('location', this.value)">
        </div>
        
        ${state.data.location ? `
          <div class="clay-card p-4 bg-[var(--color-healthy)]/10 border border-[var(--color-healthy)] flex items-center gap-3">
            <i data-lucide="check-circle" class="w-5 h-5 text-[var(--color-healthy)]"></i>
            <div>
              <div class="text-xs text-secondary">Selected Location</div>
              <div class="font-bold text-sm">${state.data.location}</div>
            </div>
          </div>
        ` : ''}
        ${state.errors.location ? `<p class="text-[var(--color-critical)] text-sm font-medium">${state.errors.location}</p>` : ''}
      </div>
    `,
    3: () => `
      <h3 class="font-bold mb-4">Add a photo</h3>
      <p class="text-sm text-secondary mb-4">Clear photos help our AI assess the severity accurately.</p>
      
      ${state.data.photo ? `
        <div class="relative rounded-xl overflow-hidden shadow-[var(--clay-raised)] border-[4px] border-[var(--surface)]">
          <img src="${state.data.photo}" class="w-full h-48 object-cover">
          <button class="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full backdrop-blur hover:bg-[var(--color-critical)] transition-colors" onclick="updateData('photo', null); updateData('photoFile', null)">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      ` : `
        <label class="clay-card p-8 border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-black/5 transition-colors h-48">
          <div class="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
            <i data-lucide="camera" class="w-6 h-6"></i>
          </div>
          <div class="text-center">
            <span class="font-semibold text-primary">Take Photo</span> or Browse
            <div class="text-xs text-secondary mt-1">JPEG/PNG max 5MB</div>
          </div>
          <input type="file" class="hidden" accept="image/*" capture="environment" id="photo-upload">
        </label>
      `}
      ${state.errors.photo ? `<p class="text-[var(--color-critical)] text-sm mt-3 font-medium">${state.errors.photo}</p>` : ''}
    `,
    4: () => `
      <h3 class="font-bold mb-4">Additional Details <span class="text-secondary font-normal text-sm">(Optional)</span></h3>
      <textarea class="clay-input min-h-[120px] resize-none" placeholder="Add any details that might help the team... (e.g. strong odor, recent construction)" onchange="updateData('description', this.value)">${state.data.description}</textarea>
    `,
    5: () => `
      <h3 class="font-bold mb-4">Review Report</h3>
      <div class="clay-card p-0 overflow-hidden divide-y divide-[rgba(15,23,42,0.05)]">
        
        <div class="p-4 flex gap-4">
          ${state.data.photo ? `<img src="${state.data.photo}" class="w-20 h-20 object-cover rounded-lg shadow-sm border border-black/5">` : ''}
          <div>
            <div class="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Issue</div>
            <div class="font-semibold text-primary">${state.data.issue}</div>
          </div>
        </div>
        
        <div class="p-4 flex gap-3 items-start">
          <i data-lucide="map-pin" class="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5"></i>
          <div>
            <div class="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Location</div>
            <div class="font-semibold text-primary text-sm">${state.data.location}</div>
          </div>
        </div>
        
        ${state.data.description ? `
          <div class="p-4">
            <div class="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Description</div>
            <div class="text-sm text-primary italic">"${state.data.description}"</div>
          </div>
        ` : ''}
        
      </div>
    `
  };
  
  content.innerHTML = stepViews[state.step]();
  
  if (window.lucide) window.lucide.createIcons();
  
  // Attach specific listeners
  if (state.step === 1) {
    document.querySelectorAll('.issue-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        updateData('issue', e.currentTarget.dataset.issue);
        state.errors.issue = null;
        renderStep();
        setTimeout(handleNext, 150); // auto-advance
      });
    });
  }
  
  if (state.step === 2) {
    const locBtn = document.getElementById('btn-location');
    if (locBtn) {
      locBtn.addEventListener('click', () => {
        locBtn.innerHTML = `<i data-lucide="loader" class="w-8 h-8 animate-spin"></i><span>Locating...</span>`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          updateData('location', 'Ward 12 · Mumbai');
          updateData('coords', [19.0760, 72.8777]);
          state.errors.location = null;
          renderStep();
        }, 800);
      });
    }
  }
  
  if (state.step === 3) {
    const upload = document.getElementById('photo-upload');
    if (upload) {
      upload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          updateData('photoFile', file);
          const reader = new FileReader();
          reader.onload = (e) => {
            updateData('photo', e.target.result);
            state.errors.photo = null;
            renderStep();
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
}

window.updateData = function(key, val) {
  state.data[key] = val;
};

async function handleNext() {
  // Validate current step
  const fieldKeys = { 1: 'issue', 2: 'location', 3: 'photo', 4: 'description' };
  const currentKey = fieldKeys[state.step];
  
  if (currentKey && schemas.report[currentKey]) {
    const error = schemas.report[currentKey](state.data[currentKey]);
    if (error) {
      state.errors[currentKey] = error;
      renderStep();
      return;
    }
  }
  
  if (state.step < 5) {
    state.step++;
    renderStep();
  } else {
    submitReport();
  }
}

async function submitReport() {
  const container = document.getElementById('report-container');
  const btnNext = document.getElementById('btn-next');
  btnNext.disabled = true;
  btnNext.innerHTML = `<i data-lucide="loader" class="w-5 h-5 animate-spin mr-2"></i> Processing...`;
  if (window.lucide) window.lucide.createIcons();
  
  if (!navigator.onLine) {
    OfflineManager.queueAction({ type: 'REPORT_SUBMIT', data: state.data });
    window.location.hash = '/dashboard';
    return;
  }
  
  // Show AI Processing Overlay
  container.innerHTML = `
    <div class="clay-card p-8 text-center h-[400px] flex flex-col justify-center items-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
        <i data-lucide="cpu" class="w-10 h-10 text-[var(--color-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
      </div>
      <h3 class="text-section-title mb-2">AI Assessment in Progress</h3>
      <div id="ai-status" class="text-sm font-medium text-secondary">Validating images...</div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  
  const statusEl = document.getElementById('ai-status');
  const steps = [
    { text: 'Checking for duplicates...', delay: 800 },
    { text: 'Analyzing severity...', delay: 1000 },
    { text: 'Finalizing verification...', delay: 800 }
  ];
  
  const formData = new FormData();
  formData.append('issue', state.data.issue);
  formData.append('location', state.data.location);
  formData.append('description', state.data.description || '');
  if (state.data.coords) {
    formData.append('lat', String(state.data.coords[0]));
    formData.append('lng', String(state.data.coords[1]));
  }
  formData.append('photo', state.data.photoFile);

  let result;
  try {
    const [, res] = await Promise.all([
      (async () => {
        for (const s of steps) {
          await new Promise(r => setTimeout(r, s.delay));
          if (statusEl) statusEl.textContent = s.text;
        }
      })(),
      api.submitReport(formData)
    ]);
    result = res;
  } catch (err) {
    showOutcome('Submission Failed', err.message || 'Could not submit your report. Please try again.', 'critical', 0);
    return;
  }

  const OUTCOME_UI = {
    verified: { title: 'Report Verified!', message: 'Thank you for your civic contribution.', type: 'healthy' },
    needs_review: { title: 'Pending Review', message: 'Your report needs officer review before it can be verified.', type: 'warning' },
    duplicate: { title: 'Duplicate Report', message: 'A similar issue was recently reported nearby. You have been added as a follower.', type: 'warning' },
    invalid: { title: 'Unable to Verify', message: 'The provided photo did not clearly show an issue. Please try again with a clearer photo.', type: 'critical' }
  };
  const ui = OUTCOME_UI[result.outcome] || OUTCOME_UI.needs_review;

  // Refresh user (credits/level) and prepend the new report to the local cache.
  const user = await api.me().catch(() => null);
  if (user) store.setUser(user);
  const reports = [result.report, ...(store.state.reports || [])];
  store.updateEntity('reports', reports);

  showOutcome(ui.title, ui.message, ui.type, result.creditsAwarded > 0 ? result.creditsAwarded : 0);
}

function showOutcome(title, message, type, credits) {
  const container = document.getElementById('report-container');
  if (!container) return;
  
  const typeClasses = {
    healthy: 'text-[var(--color-healthy)] bg-[var(--color-healthy)]/10',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
    critical: 'text-[var(--color-critical)] bg-[var(--color-critical)]/10'
  };
  
  container.innerHTML = `
    <div class="clay-card p-8 text-center mt-12 flex flex-col items-center animate-fade-in border-t-4" style="border-top-color: var(--color-${type})">
      <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-[var(--clay-pressed)] ${typeClasses[type]}">
        <i data-lucide="${type === 'healthy' ? 'check-circle' : 'alert-circle'}" class="w-10 h-10"></i>
      </div>
      <h2 class="text-section-title mb-2">${title}</h2>
      <p class="text-body mb-8 max-w-sm">${message}</p>
      
      ${credits > 0 ? `
        <div class="mb-8 p-4 rounded-xl shadow-[var(--clay-pressed)] bg-black/5 flex items-center gap-3">
          <i data-lucide="award" class="w-6 h-6 text-[var(--color-primary)]"></i>
          <span class="font-bold">Earned ${credits} Civic Credits</span>
        </div>
      ` : ''}
      
      <button class="clay-btn w-full max-w-[200px]" onclick="window.location.hash='/dashboard'">Back to Dashboard</button>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}
