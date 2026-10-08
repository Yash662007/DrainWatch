import { Skeletons } from '../ui/components.js';

export function render() {
  return `
    <div class="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-[var(--color-primary)]/10 rounded-xl">
          <i data-lucide="bar-chart-2" class="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]"></i>
        </div>
        <h2 class="text-page-title">Analytics</h2>
      </div>
      
      <!-- AI Insights -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="clay-card p-4 border-l-4 border-[var(--color-primary)] flex gap-4 items-start relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-primary)]/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
          <i data-lucide="sparkles" class="w-6 h-6 text-[var(--color-primary)] shrink-0"></i>
          <div class="relative z-10">
            <h4 class="font-bold text-primary mb-1">AI Insight</h4>
            <p class="text-sm text-secondary">Ward 12 blockage reports have increased by +34% in the last 7 days. Preventive maintenance recommended.</p>
          </div>
        </div>
        <div class="clay-card p-4 border-l-4 border-[var(--color-critical)] flex gap-4 items-start relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-critical)]/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
          <i data-lucide="alert-triangle" class="w-6 h-6 text-[var(--color-critical)] shrink-0"></i>
          <div class="relative z-10">
            <h4 class="font-bold text-primary mb-1">Predictive Alert</h4>
            <p class="text-sm text-secondary">8 drains in Sector 4 are predicted to reach critical overflow levels within 24h based on weather forecast.</p>
          </div>
        </div>
      </div>
      
      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Drain Health Distribution</h3>
          <div class="h-64 relative" id="chart-health">${Skeletons.Chart()}</div>
        </div>
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Blockage Trend (30 Days)</h3>
          <div class="h-64 relative" id="chart-trend">${Skeletons.Chart()}</div>
        </div>
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Reports by Ward</h3>
          <div class="h-64 relative" id="chart-ward">${Skeletons.Chart()}</div>
        </div>
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Resolution SLA</h3>
          <div class="h-64 relative" id="chart-sla">${Skeletons.Chart()}</div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();
  
  // Lazy load Chart.js
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = renderCharts;
    document.head.appendChild(script);
  } else {
    renderCharts();
  }
}

function renderCharts() {
  Chart.defaults.color = '#64748b';
  Chart.defaults.font.family = 'Inter';
  
  const ctxHealth = document.getElementById('chart-health');
  if (ctxHealth) {
    ctxHealth.innerHTML = '<canvas></canvas>';
    new Chart(ctxHealth.querySelector('canvas'), {
      type: 'doughnut',
      data: {
        labels: ['Healthy', 'Warning', 'High Risk', 'Critical'],
        datasets: [{
          data: [65, 15, 12, 8],
          backgroundColor: ['#4b9b69', '#d99c41', '#c46835', '#ba4a4a'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right' } } }
    });
  }

  const ctxTrend = document.getElementById('chart-trend');
  if (ctxTrend) {
    ctxTrend.innerHTML = '<canvas></canvas>';
    new Chart(ctxTrend.querySelector('canvas'), {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Blockage Incidents',
          data: [12, 19, 15, 25],
          borderColor: '#1f6b65',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(31, 107, 101, 0.1)'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
    });
  }

  const ctxWard = document.getElementById('chart-ward');
  if (ctxWard) {
    ctxWard.innerHTML = '<canvas></canvas>';
    new Chart(ctxWard.querySelector('canvas'), {
      type: 'bar',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
        datasets: [{
          label: 'Total Reports',
          data: [45, 82, 30, 95, 20, 60],
          backgroundColor: '#1f6b65',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
    });
  }

  const ctxSla = document.getElementById('chart-sla');
  if (ctxSla) {
    ctxSla.innerHTML = '<canvas></canvas>';
    new Chart(ctxSla.querySelector('canvas'), {
      type: 'pie',
      data: {
        labels: ['Within SLA', 'Breached'],
        datasets: [{
          data: [88, 12],
          backgroundColor: ['#4b9b69', '#ba4a4a'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}
