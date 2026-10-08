const EMPTY_STATE = {
  user: null,
  role: null,
  authChecked: false,
  drains: [],
  reports: [],
  workOrders: [],
  notifications: []
};

class Store {
  constructor() {
    this.state = this.loadState() || { ...EMPTY_STATE };
    // Auth is server-side truth (see js/api/api.js `me()`), re-checked on every boot.
    this.state.authChecked = false;
    this.saveState();
    this.listeners = [];
  }

  setUser(user) {
    this.update({ user, role: user.role, authChecked: true });
  }

  clearUser() {
    this.update({ user: null, role: null, authChecked: true });
  }

  loadState() {
    try {
      const data = localStorage.getItem('drainwatch_state');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveState() {
    localStorage.setItem('drainwatch_state', JSON.stringify(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  update(newState) {
    this.state = { ...this.state, ...newState };
    this.saveState();
    this.notify();
  }

  updateEntity(entityType, newItems) {
    this.state[entityType] = newItems;
    this.saveState();
    this.notify();
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const store = new Store();
