import { generateMockData } from './data/mock-data.js';

class Store {
  constructor() {
    this.state = this.loadState();
    if (!this.state) {
      this.state = generateMockData();
    }
    if (this.state.isAuthenticated === undefined) {
      this.state.isAuthenticated = false;
    }
    this.saveState();
    this.listeners = [];
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
