// Store en memoire pour les donnees TTN
// Utilise un global pour survivre aux hot reloads en dev

import { Reading } from "./api";

interface StoreData {
  devices: Record<string, Reading>;
  history: Record<string, Reading[]>;
  totalMessages: number;
  totalAlerts: number;
}

const HISTORY_MAX = 2000;

function createStore(): StoreData {
  return {
    devices: {},
    history: {},
    totalMessages: 0,
    totalAlerts: 0,
  };
}

// Global singleton pour survivre aux hot reloads Next.js
const globalForStore = globalThis as unknown as { __ttnStore?: StoreData };
if (!globalForStore.__ttnStore) {
  globalForStore.__ttnStore = createStore();
}

export const store = globalForStore.__ttnStore;

export function pushReading(reading: Reading) {
  const { deviceId } = reading;

  // Derniere valeur par device
  store.devices[deviceId] = reading;

  // Historique
  if (!store.history[deviceId]) {
    store.history[deviceId] = [];
  }
  store.history[deviceId].push(reading);
  if (store.history[deviceId].length > HISTORY_MAX) {
    store.history[deviceId] = store.history[deviceId].slice(-HISTORY_MAX);
  }

  // Stats
  store.totalMessages++;
  if (reading.alerts && reading.alerts !== "RAS") {
    store.totalAlerts++;
  }
}

export function getLatest(): Reading[] {
  return Object.values(store.devices);
}

export function getHistory(deviceId: string, hours = 24): Reading[] {
  const data = store.history[deviceId] || [];
  const cutoff = Date.now() - hours * 3600 * 1000;
  return data.filter((r) => new Date(r.timestamp).getTime() > cutoff);
}

export function getStats() {
  const deviceIds = Object.keys(store.devices);
  return {
    totalMessages: store.totalMessages,
    totalAlerts: store.totalAlerts,
    activeDevices: deviceIds.length,
    devices: deviceIds,
  };
}
