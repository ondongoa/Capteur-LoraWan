// API client - appelle les routes locales Next.js (qui recoivent les donnees de TTN via MQTT)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface Reading {
  deviceId: string;
  timestamp: string;
  temperature: number;
  temperatureAdc: string;
  no2: number;
  ethanol: number;
  voc: number;
  co: number;
  airQuality: string; // "faible" | "modere" | "eleve" | "critique"
  warmup: string;
  ledText: string;
  rssi: string;
  snr: string;
  alerts: string;
}

export interface Stats {
  totalMessages: number;
  totalAlerts: number;
  activeDevices: number;
  devices: string[];
}

export async function fetchLatest(): Promise<Reading[]> {
  const res = await fetch(`${API_BASE}/api/latest`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur fetch latest");
  return res.json();
}

export async function fetchHistory(deviceId: string, hours = 24): Promise<Reading[]> {
  const res = await fetch(
    `${API_BASE}/api/history/${deviceId}?hours=${hours}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Erreur fetch history");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur fetch stats");
  return res.json();
}
