export const Skeletons = {
  Card: () => `<div class="clay-card h-32 flex flex-col gap-2 border-none">
                 <div class="h-6 clay-skeleton w-1/3"></div>
                 <div class="h-4 clay-skeleton w-1/2 mt-auto"></div>
               </div>`,
  Metric: () => `<div class="clay-card flex items-center gap-4 border-none">
                   <div class="w-12 h-12 rounded-full clay-skeleton"></div>
                   <div class="flex-1 space-y-2">
                     <div class="h-4 clay-skeleton w-1/2"></div>
                     <div class="h-6 clay-skeleton w-1/4"></div>
                   </div>
                 </div>`,
  List: (count=3) => `<div class="space-y-3 w-full">
                       ${Array(count).fill(`<div class="clay-card h-16 clay-skeleton w-full border-none"></div>`).join('')}
                     </div>`,
  Table: () => `<div class="clay-card p-0 overflow-hidden border-none">
                  <div class="h-12 clay-skeleton w-full border-b border-[rgba(15,23,42,0.05)] rounded-none"></div>
                  ${Array(5).fill(`<div class="h-16 w-full border-b border-[rgba(15,23,42,0.05)] flex items-center"><div class="h-4 mx-4 clay-skeleton w-3/4"></div></div>`).join('')}
                </div>`,
  Chart: () => `<div class="clay-card h-64 flex items-end gap-2 p-6 border-none">
                  ${Array(7).fill('').map(()=>`<div class="w-full clay-skeleton rounded-b-none" style="height: ${20+Math.random()*80}%"></div>`).join('')}
                </div>`,
  Map: () => `<div class="clay-card h-[400px] w-full clay-skeleton flex items-center justify-center border-none">
                <i data-lucide="map" class="w-12 h-12 text-secondary opacity-30"></i>
              </div>`
};

export const EmptyState = (icon, title, message, actionHtml = '') => `
  <div class="flex flex-col items-center justify-center p-8 text-center text-secondary h-full min-h-[200px]">
    <div class="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
      <i data-lucide="${icon}" class="w-8 h-8 opacity-50"></i>
    </div>
    <h3 class="text-card-title text-primary mb-1">${title}</h3>
    <p class="text-body mb-6 max-w-sm">${message}</p>
    ${actionHtml}
  </div>
`;

export const ErrorState = (message, retryCallbackName) => `
  <div class="clay-card p-6 border-l-4 border-[var(--color-critical)] flex flex-col items-center justify-center text-center w-full my-4">
    <i data-lucide="alert-triangle" class="w-12 h-12 text-[var(--color-critical)] mb-4"></i>
    <h3 class="text-card-title text-primary mb-2">Something went wrong</h3>
    <p class="text-body mb-6">${message}</p>
    <button class="clay-btn clay-btn-ghost" onclick="${retryCallbackName}()">
      <i data-lucide="refresh-cw" class="w-4 h-4"></i> Try Again
    </button>
  </div>
`;
