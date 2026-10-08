import { store } from '../store.js';
import { Toast } from '../ui/toast.js';

let uploadedPhoto = null;
let currentResult = null;

export function render() {
  return `
    <div class="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in" id="inspections-container">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-section-title md:text-page-title flex items-center gap-3">
          <div class="p-2 bg-[var(--color-primary)]/10 rounded-xl">
            <i data-lucide="cpu" class="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]"></i>
          </div>
          AI Inspection
        </h2>
      </div>
      <p class="text-body mb-8">Upload an image of a drain to receive an automated severity assessment, risk score, and recommended actions.</p>
      
      <div id="inspection-content" class="w-full">
        ${renderUploadState()}
      </div>
    </div>
  `;
}

function renderUploadState() {
  return `
    <label class="clay-card p-8 md:p-12 border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-black/5 transition-colors h-[300px] mx-auto w-full max-w-2xl">
      <div class="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-[var(--clay-pressed)]">
        <i data-lucide="upload-cloud" class="w-8 h-8"></i>
      </div>
      <div class="text-center">
        <div class="font-bold text-lg text-primary mb-1">Select an Image to Analyze</div>
        <div class="text-sm text-secondary">Drag and drop or click to browse</div>
      </div>
      <input type="file" class="hidden" accept="image/*" id="ai-photo-upload">
    </label>
  `;
}

export function init() {
  attachUploadListener();
  if (window.lucide) window.lucide.createIcons();
}

function attachUploadListener() {
  const upload = document.getElementById('ai-photo-upload');
  if (upload) {
    upload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadedPhoto = ev.target.result;
          startProcessing();
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }
}

async function startProcessing() {
  const container = document.getElementById('inspection-content');
  if (!container) return;
  
  // Staged processing screen
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div class="clay-card p-2 h-[300px] overflow-hidden flex items-center justify-center bg-black/5">
        <img src="${uploadedPhoto}" class="w-full h-full object-cover rounded-lg opacity-50 sepia-[.2] hue-rotate-180 mix-blend-luminosity">
        <div class="absolute inset-0 bg-[var(--color-primary)]/10 flex items-center justify-center">
          <div class="w-full h-1 bg-[var(--color-primary)]/30 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
      
      <div class="clay-card p-6 flex flex-col justify-center">
        <h3 class="text-card-title mb-6 flex items-center gap-2">
          <i data-lucide="loader" class="w-5 h-5 animate-spin text-[var(--color-primary)]"></i> AI Analysis Running
        </h3>
        <div class="space-y-4" id="processing-checklist">
          <!-- Steps injected via JS -->
        </div>
      </div>
    </div>
    
    <style>
      @keyframes scan {
        0%, 100% { top: 0%; }
        50% { top: 100%; }
      }
    </style>
  `;
  if (window.lucide) window.lucide.createIcons();
  
  const checklist = document.getElementById('processing-checklist');
  const steps = [
    { text: 'Detecting drain infrastructure', time: 600 },
    { text: 'Detecting blockage', time: 800 },
    { text: 'Detecting debris composition', time: 1000 },
    { text: 'Assessing water level', time: 700 },
    { text: 'Calculating risk score', time: 900 }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    // Render current pending
    checklist.innerHTML = steps.map((s, index) => {
      if (index < i) {
        return `<div class="flex items-center gap-3 text-sm font-medium text-primary"><i data-lucide="check-circle" class="w-4 h-4 text-[var(--color-healthy)]"></i> ${s.text}</div>`;
      } else if (index === i) {
        return `<div class="flex items-center gap-3 text-sm font-medium text-[var(--color-primary)]"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${s.text}...</div>`;
      } else {
        return `<div class="flex items-center gap-3 text-sm text-secondary opacity-50"><i data-lucide="circle" class="w-4 h-4"></i> ${s.text}</div>`;
      }
    }).join('');
    if (window.lucide) window.lucide.createIcons();
    
    await new Promise(r => setTimeout(r, steps[i].time));
  }
  
  // Show result
  showResult();
}

function showResult() {
  const container = document.getElementById('inspection-content');
  if (!container) return;
  
  // Deterministic mock analysis
  currentResult = {
    blockage: '87%',
    waterLevel: 'HIGH',
    debris: 'DETECTED',
    vegetation: 'MODERATE',
    score: 91,
    severity: 'CRITICAL',
    confidence: '94%'
  };
  
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      
      <div class="lg:col-span-1 space-y-6">
        <div class="clay-card p-2">
          <img src="${uploadedPhoto}" class="w-full h-48 object-cover rounded-lg">
        </div>
        
        <div class="clay-card p-6 bg-gradient-to-br from-[var(--surface)] to-black/5">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-bold text-secondary uppercase tracking-wider">AI Confidence</span>
            <span class="clay-badge severity-healthy bg-white">${currentResult.confidence}</span>
          </div>
          <button class="clay-btn clay-btn-ghost w-full py-2 text-sm" onclick="window.location.reload()">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Analyze Another
          </button>
        </div>
      </div>
      
      <div class="lg:col-span-2 space-y-6">
        <div class="clay-card p-6 border-t-4" style="border-top-color: var(--color-critical)">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-section-title mb-1 text-primary">Inspection Result</h3>
              <p class="text-sm text-secondary flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4"></i> Location derived from EXIF (Ward 12)
              </p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold text-[var(--color-critical)]">${currentResult.score}<span class="text-lg text-secondary">/100</span></div>
              <div class="text-xs font-bold text-secondary uppercase tracking-wider mt-1">Risk Score</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="p-3 bg-black/5 shadow-[var(--clay-pressed)] rounded-xl text-center">
              <div class="text-[10px] uppercase font-bold text-secondary mb-1">Severity</div>
              <div class="font-bold text-[var(--color-critical)]">${currentResult.severity}</div>
            </div>
            <div class="p-3 bg-black/5 shadow-[var(--clay-pressed)] rounded-xl text-center">
              <div class="text-[10px] uppercase font-bold text-secondary mb-1">Blockage</div>
              <div class="font-bold text-primary">${currentResult.blockage}</div>
            </div>
            <div class="p-3 bg-black/5 shadow-[var(--clay-pressed)] rounded-xl text-center">
              <div class="text-[10px] uppercase font-bold text-secondary mb-1">Water Level</div>
              <div class="font-bold text-primary">${currentResult.waterLevel}</div>
            </div>
            <div class="p-3 bg-black/5 shadow-[var(--clay-pressed)] rounded-xl text-center">
              <div class="text-[10px] uppercase font-bold text-secondary mb-1">Debris</div>
              <div class="font-bold text-primary">${currentResult.debris}</div>
            </div>
          </div>
          
          <div class="space-y-6">
            <div class="p-4 bg-[var(--surface-elevated)] rounded-xl shadow-[var(--clay-raised)]">
              <h4 class="font-bold text-sm mb-3 flex items-center gap-2">
                <i data-lucide="help-circle" class="w-4 h-4 text-[var(--color-primary)]"></i> Why this result?
              </h4>
              <ul class="text-sm text-secondary space-y-2">
                <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 rounded-full bg-black/20 mt-1.5 shrink-0"></div> Heavy solid debris detected obstructing flow</li>
                <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 rounded-full bg-black/20 mt-1.5 shrink-0"></div> Water level elevated near critical overflow margin</li>
                <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 rounded-full bg-black/20 mt-1.5 shrink-0"></div> Similar issue reported twice recently in this ward</li>
              </ul>
            </div>
            
            <div class="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)] rounded-xl">
              <h4 class="font-bold text-sm text-[var(--color-warning)] mb-1">Recommendation</h4>
              <p class="text-sm font-medium text-primary">Immediate mechanical cleaning recommended to prevent flooding during next rainfall.</p>
            </div>
          </div>
          
          <div class="mt-8 flex justify-end">
            <button class="clay-btn px-8" id="btn-create-wo">Create Work Order</button>
          </div>
        </div>
      </div>
      
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  
  document.getElementById('btn-create-wo').addEventListener('click', createWorkOrder);
}

function createWorkOrder() {
  const btn = document.getElementById('btn-create-wo');
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Creating...`;
  if (window.lucide) window.lucide.createIcons();
  
  const wo = {
    id: 'WO-' + Math.floor(Math.random() * 9000 + 1000),
    drainId: 'DR-' + Math.floor(Math.random() * 50 + 1040),
    status: 'Assigned',
    team: null,
    severity: 'critical',
    date: Date.now(),
    description: 'AI Generated: Mechanical cleaning required due to heavy debris.'
  };
  
  const wos = [wo, ...(store.state.workOrders || [])];
  store.updateEntity('workOrders', wos);
  
  setTimeout(() => {
    Toast.show(`Work Order ${wo.id} created successfully`, 'success');
    window.location.hash = '/work-orders';
  }, 800);
}
