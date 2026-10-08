import { api } from '../api/api.js';
import { Skeletons } from '../ui/components.js';

let analyticsData = null;

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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="analytics-insights">
        <div class="clay-card p-4 text-sm text-secondary">Loading insights...</div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Drain Health Distribution</h3>
          <div class="h-64 relative" id="chart-health">${Skeletons.Chart()}</div>
        </div>
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 text-primary">Reports Over Time (28 Days)</h3>
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

export async function init() {
  if (window.lucide) window.lucide.createIcons();

  try {
    analyticsData = await api.getAnalytics();
  } catch (e) {
    document.getElementById('analytics-insights').innerHTML = `<div class="clay-card p-4 text-sm text-[var(--color-critical)]">Failed to load analytics data.</div>`;
    return;
  }

  renderInsights();

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

function renderInsights() {
  const container = document.getElementById('analytics-insights');
  if (!container) return;

  const icons = ['sparkles', 'alert-triangle'];
  const colors = ['var(--color-primary)', 'var(--color-critical)'];

  container.innerHTML = analyticsData.insights.map((text, i) => `
    <div class="clay-card p-4 border-l-4 flex gap-4 items-start relative overflow-hidden group" style="border-color: ${colors[i % 2]}">
      <i data-lucide="${icons[i % 2]}" class="w-6 h-6 shrink-0" style="color: ${colors[i % 2]}"></i>
      <div class="relative z-10">
        <h4 class="font-bold text-primary mb-1">${i === 0 ? 'AI Insight' : 'Predictive Alert'}</h4>
        <p class="text-sm text-secondary">${text}</p>
      </div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

function renderCharts() {
  Chart.defaults.color = '#64748b';
  Chart.defaults.font.family = 'Inter';

  const d = analyticsData;

  const ctxHealth = document.getElementById('chart-health');
  if (ctxHealth) {
    ctxHealth.innerHTML = '<canvas></canvas>';
    new Chart(ctxHealth.querySelector('canvas'), {
      type: 'doughnut',
      data: {
        labels: ['Healthy', 'Warning', 'High Risk', 'Critical'],
        datasets: [{
          data: [d.healthDistribution.healthy, d.healthDistribution.warning, d.healthDistribution['high-risk'], d.healthDistribution.critical],
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
        labels: d.blockageTrend.length ? d.blockageTrend.map(t => t.week) : ['No data'],
        datasets: [{
          label: 'Reports Submitted',
          data: d.blockageTrend.length ? d.blockageTrend.map(t => t.count) : [0],
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
        labels: d.reportsByWard.length ? d.reportsByWard.map(w => w.ward) : ['No data'],
        datasets: [{
          label: 'Total Reports',
          data: d.reportsByWard.length ? d.reportsByWard.map(w => w.count) : [0],
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
          data: [d.slaPerformance.withinSla, d.slaPerformance.breached],
          backgroundColor: ['#4b9b69', '#ba4a4a'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}
