import { store } from '../store.js';

let failureMode = false;
const LATENCY = 800;

export const api = {
  setFailureMode(val) {
    failureMode = val;
  },
  
  async delay() {
    return new Promise(resolve => setTimeout(resolve, LATENCY));
  },
  
  async getDrains() {
    await this.delay();
    if (failureMode) throw new Error("Failed to fetch drains.");
    return store.state.drains || [];
  },
  
  async getReports() {
    await this.delay();
    if (failureMode) throw new Error("Failed to fetch reports.");
    return store.state.reports || [];
  },

  async getWorkOrders() {
    await this.delay();
    if (failureMode) throw new Error("Failed to fetch work orders.");
    return store.state.workOrders || [];
  }
};
