async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(path, {
    ...options,
    headers: isFormData ? (options.headers || {}) : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  async signup({ email, password, name, role }) {
    const { user } = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
    return user;
  },

  async login({ email, password }) {
    const { user } = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return user;
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST' });
  },

  async me() {
    const { user } = await request('/api/auth/me');
    return user;
  },

  async getDrains() {
    return request('/api/drains');
  },

  async getDrain(id) {
    return request(`/api/drains/${encodeURIComponent(id)}`);
  },

  async getTeams() {
    return request('/api/teams');
  },

  async getReports() {
    return request('/api/reports');
  },

  async getReport(id) {
    return request(`/api/reports/${encodeURIComponent(id)}`);
  },

  async getWorkOrders() {
    return request('/api/work-orders');
  },

  async getWorkOrder(id) {
    return request(`/api/work-orders/${encodeURIComponent(id)}`);
  },

  async submitReport(formData) {
    return request('/api/reports', { method: 'POST', body: formData });
  },

  async createInspection(formData) {
    return request('/api/inspections', { method: 'POST', body: formData });
  },

  async createWorkOrderFromInspection(inspectionId) {
    return request('/api/work-orders/from-inspection', {
      method: 'POST',
      body: JSON.stringify({ inspectionId }),
    });
  },

  async getFieldTasks() {
    return request('/api/field/tasks');
  },

  async assignWorkOrder(id, teamId) {
    return request(`/api/work-orders/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ teamId }),
    });
  },

  async resolveWorkOrder(id, formData) {
    return request(`/api/work-orders/${encodeURIComponent(id)}/resolve`, { method: 'PATCH', body: formData });
  },

  async closeWorkOrder(id) {
    return request(`/api/work-orders/${encodeURIComponent(id)}/close`, { method: 'PATCH', body: '{}' });
  },

  async getLedger() {
    return request('/api/rewards/ledger');
  },

  async getBadges() {
    return request('/api/rewards/badges');
  },

  async getLeaderboard(scope) {
    return request(`/api/leaderboard?scope=${encodeURIComponent(scope)}`);
  },

  async getAnalytics() {
    return request('/api/analytics');
  },

  async getNotifications() {
    return request('/api/notifications');
  },

  async markNotificationRead(id) {
    return request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', body: '{}' });
  },

  async markAllNotificationsRead() {
    return request('/api/notifications/read-all', { method: 'PATCH', body: '{}' });
  },

  async getProfile() {
    return request('/api/profile');
  },

  async updateSettings(data) {
    return request('/api/settings', { method: 'PATCH', body: JSON.stringify(data) });
  }
};
