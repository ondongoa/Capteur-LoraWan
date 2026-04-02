"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import CircularGauge from "@/components/CircularGauge";
import MetricCard from "@/components/MetricCard";
import Chart from "@/components/Chart";
import AlertList from "@/components/AlertList";
import DeviceSelector from "@/components/DeviceSelector";
import { Reading, Stats } from "@/lib/api";
import { getAirQualityColor } from "@/lib/thresholds";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// SVG icons inline
const TempIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5" />
  </svg>
);

const GasIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

function getQualityConfig(quality: string) {
  switch (quality) {
    case "faible":
      return { color: "#00b894", bgColor: "#e6f9f3", label: "Tres bon", bgCard: "from-green-500 to-emerald-600" };
    case "modere":
      return { color: "#fdcb6e", bgColor: "#fef9e7", label: "Modere", bgCard: "from-yellow-400 to-amber-500" };
    case "eleve":
      return { color: "#e17055", bgColor: "#fdeae6", label: "Eleve", bgCard: "from-orange-500 to-red-500" };
    case "critique":
      return { color: "#d63031", bgColor: "#fde8e8", label: "Tres mauvais", bgCard: "from-red-600 to-red-700" };
    default:
      return { color: "#636e72", bgColor: "#f0f0f0", label: quality, bgCard: "from-slate-500 to-slate-600" };
  }
}

function timeAgo(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [tab, setTab] = useState<"accueil" | "charts" | "alertes" | "prefs">("accueil");
  const lastAlertRef = useRef<string>("");

  // Seuils d'alerte configurables (persistes en localStorage)
  const [thresholds, setThresholds] = useState({
    tempHigh: 35,
    tempLow: 5,
    gasModere: 1500,
    gasEleve: 5000,
    gasCritique: 15000,
  });

  useEffect(() => {
    const saved = localStorage.getItem("airwatch-thresholds");
    if (saved) setThresholds(JSON.parse(saved));
  }, []);

  const saveThresholds = (newThresholds: typeof thresholds) => {
    setThresholds(newThresholds);
    localStorage.setItem("airwatch-thresholds", JSON.stringify(newThresholds));
  };

  // Demander la permission de notification au montage
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Notification browser quand une alerte change
  const sendNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/icon.svg",
      });
    }
  }, []);

  const { data: latest, error: latestError } = useSWR<Reading[]>(
    `${API_BASE}/api/latest`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: stats } = useSWR<Stats>(
    `${API_BASE}/api/stats`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: history } = useSWR<Reading[]>(
    selectedDevice ? `${API_BASE}/api/history/${selectedDevice}?hours=24` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  useEffect(() => {
    if (latest && latest.length > 0 && !selectedDevice) {
      setSelectedDevice(latest[0].deviceId);
    }
  }, [latest, selectedDevice]);

  const current = latest?.find((r) => r.deviceId === selectedDevice);
  const devices = stats?.devices || [];

  // Detecter les nouvelles alertes et envoyer une notification
  useEffect(() => {
    if (!current) return;
    if (current.alerts && current.alerts !== "RAS" && current.alerts !== lastAlertRef.current) {
      lastAlertRef.current = current.alerts;
      sendNotification(
        `AirWatch - ${current.airQuality.toUpperCase()}`,
        `${current.deviceId}: ${current.alerts}`
      );
    }
  }, [current, sendNotification]);
  const qConfig = current ? getQualityConfig(current.airQuality) : null;
  const airIndex = current
    ? Math.max(current.no2, current.ethanol, current.voc, current.co)
    : 0;

  const alertCount = history
    ? history.filter((r) => r.alerts && r.alerts !== "RAS").length
    : 0;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Status bar header */}
      <header className="bg-white px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">AirWatch</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            LoRaWAN Monitor
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-500">
                {stats.activeDevices} capteur{stats.activeDevices > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
            </svg>
          </div>
        </div>
      </header>

      {/* Device selector */}
      <div className="px-5 py-2">
        <DeviceSelector devices={devices} selected={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24">
        {!current ? (
          <div className="flex flex-col items-center justify-center h-80">
            {latestError ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-semibold">Connexion impossible</p>
                <p className="text-slate-400 text-sm mt-1">Verifiez la connexion TTN</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">En attente des capteurs...</p>
                <p className="text-slate-300 text-xs mt-1">Les donnees arrivent via LoRaWAN</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* TAB: Accueil */}
            {tab === "accueil" && (
              <div className="space-y-4 mt-2">
                {/* Main quality card */}
                {qConfig && (
                  <div className={`bg-gradient-to-br ${qConfig.bgCard} rounded-3xl p-6 text-white shadow-lg relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <CircularGauge
                          value={airIndex}
                          max={30000}
                          label={qConfig.label}
                          sublabel="index"
                          color="#ffffff"
                          bgColor="rgba(255,255,255,0.2)"
                          size={160}
                        />
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-white/70 text-xs font-medium">Temperature</p>
                          <p className="text-2xl font-extrabold">
                            {current.temperature}<span className="text-sm font-normal text-white/70"> °C</span>
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-white/70 font-medium uppercase">Derniere mesure</p>
                          <p className="text-xs font-bold">{timeAgo(current.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/60">RSSI</span>
                          <span className="text-xs font-bold">{current.rssi}</span>
                        </div>
                      </div>
                    </div>
                    {/* Alert banner */}
                    {current.alerts && current.alerts !== "RAS" && (
                      <div className="mt-4 bg-white/20 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white alert-pulse" />
                        <p className="text-sm font-medium truncate">{current.alerts}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gas metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="NO2"
                    value={current.no2}
                    unit="raw"
                    icon={<GasIcon />}
                    color="#2563eb"
                  />
                  <MetricCard
                    title="C2H5OH"
                    value={current.ethanol}
                    unit="raw"
                    icon={<GasIcon />}
                    color="#9333ea"
                  />
                  <MetricCard
                    title="VOC"
                    value={current.voc}
                    unit="raw"
                    icon={<GasIcon />}
                    color="#0d9488"
                  />
                  <MetricCard
                    title="CO"
                    value={current.co}
                    unit="raw"
                    icon={<GasIcon />}
                    color="#dc2626"
                  />
                </div>

                {/* Info row */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Warmup</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {current.warmup === "termine" ? "Pret" : "En cours"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">SNR</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">{current.snr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Uplinks</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">{stats?.totalMessages || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                {history && history.length > 1 && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Statistiques du jour
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Meilleure mesure", value: Math.min(...history.map((r) => Math.max(r.no2, r.ethanol, r.voc, r.co))), color: "#00b894" },
                        { label: "Moyenne", value: Math.round(history.reduce((sum, r) => sum + Math.max(r.no2, r.ethanol, r.voc, r.co), 0) / history.length), color: "#636e72" },
                        { label: "Pire mesure", value: Math.max(...history.map((r) => Math.max(r.no2, r.ethanol, r.voc, r.co))), color: "#d63031" },
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">{stat.label}</span>
                          <span className="text-sm font-bold" style={{ color: stat.color }}>
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Charts */}
            {tab === "charts" && (
              <div className="space-y-4 mt-2">
                {history && history.length > 1 ? (
                  <>
                    <Chart data={history} dataKey="temperature" title="Temperature (°C)" color="#ea580c" unit="°C" />
                    <Chart data={history} dataKey="no2" title="NO2" color="#2563eb" />
                    <Chart data={history} dataKey="ethanol" title="C2H5OH" color="#9333ea" />
                    <Chart data={history} dataKey="voc" title="VOC" color="#0d9488" />
                    <Chart data={history} dataKey="co" title="CO" color="#dc2626" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                    <p className="text-sm">Pas assez de donnees pour les graphiques</p>
                    <p className="text-xs mt-1">Minimum 2 mesures requises</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Alertes */}
            {tab === "alertes" && (
              <div className="mt-2">
                {history ? (
                  <AlertList readings={history} />
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Chargement...
                  </div>
                )}
              </div>
            )}

            {/* TAB: Preferences */}
            {tab === "prefs" && (
              <div className="space-y-4 mt-2">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                    Seuils de temperature
                  </h3>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm text-slate-600">Alerte haute (°C)</span>
                      <input
                        type="number"
                        value={thresholds.tempHigh}
                        onChange={(e) => saveThresholds({ ...thresholds, tempHigh: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-0 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-600">Alerte basse (°C)</span>
                      <input
                        type="number"
                        value={thresholds.tempLow}
                        onChange={(e) => saveThresholds({ ...thresholds, tempLow: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:ring-0 outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                    Seuils qualite de l&apos;air (index gaz)
                  </h3>
                  <div className="space-y-4">
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Modere (jaune)</span>
                        <span className="text-xs font-mono text-slate-400">&ge; {thresholds.gasModere}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={thresholds.gasModere}
                        onChange={(e) => saveThresholds({ ...thresholds, gasModere: Number(e.target.value) })}
                        className="mt-2 w-full accent-yellow-500"
                      />
                    </label>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Eleve (orange)</span>
                        <span className="text-xs font-mono text-slate-400">&ge; {thresholds.gasEleve}</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="20000"
                        step="500"
                        value={thresholds.gasEleve}
                        onChange={(e) => saveThresholds({ ...thresholds, gasEleve: Number(e.target.value) })}
                        className="mt-2 w-full accent-orange-500"
                      />
                    </label>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Critique (rouge)</span>
                        <span className="text-xs font-mono text-slate-400">&ge; {thresholds.gasCritique}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="60000"
                        step="1000"
                        value={thresholds.gasCritique}
                        onChange={(e) => saveThresholds({ ...thresholds, gasCritique: Number(e.target.value) })}
                        className="mt-2 w-full accent-red-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Preview des seuils */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Apercu des niveaux
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Tres bon", range: `0 - ${thresholds.gasModere}`, color: "#00b894" },
                      { label: "Modere", range: `${thresholds.gasModere} - ${thresholds.gasEleve}`, color: "#fdcb6e" },
                      { label: "Eleve", range: `${thresholds.gasEleve} - ${thresholds.gasCritique}`, color: "#e17055" },
                      { label: "Critique", range: `> ${thresholds.gasCritique}`, color: "#d63031" },
                    ].map((level) => (
                      <div key={level.label} className="flex items-center gap-3 py-1.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                        <span className="text-sm font-medium text-slate-700 flex-1">{level.label}</span>
                        <span className="text-xs font-mono text-slate-400">{level.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temp alert preview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Alertes temperature
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600 font-medium">Froid &le; {thresholds.tempLow}°C</span>
                    <span className="text-slate-400">Normal</span>
                    <span className="text-red-600 font-medium">&ge; {thresholds.tempHigh}°C Chaud</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          {[
            {
              id: "accueil" as const,
              label: "Accueil",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ),
            },
            {
              id: "charts" as const,
              label: "Historique",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              id: "alertes" as const,
              label: "Alertes",
              icon: (
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                </div>
              ),
            },
            {
              id: "prefs" as const,
              label: "Seuils",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                tab === item.id
                  ? "text-slate-800"
                  : "text-slate-400"
              }`}
            >
              {item.icon}
              <span className={`text-[10px] font-semibold ${tab === item.id ? "text-slate-800" : "text-slate-400"}`}>
                {item.label}
              </span>
              {tab === item.id && (
                <div className="w-1 h-1 rounded-full bg-slate-800 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
