"use client";

import { Reading } from "@/lib/api";

interface AlertListProps {
  readings: Reading[];
}

export default function AlertList({ readings }: AlertListProps) {
  const withAlerts = readings
    .filter((r) => r.alerts && r.alerts !== "RAS")
    .slice(-20)
    .reverse();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Notifications
        </h3>
        {withAlerts.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {withAlerts.length}
          </span>
        )}
      </div>

      {withAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400">Aucune alerte</p>
          <p className="text-xs text-slate-300 mt-1">Tout est normal</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
          {withAlerts.map((r, i) => {
            const isCritique = r.alerts.includes("critique");
            const isEleve = r.alerts.includes("eleve") || r.alerts.includes("elevee");
            const bgColor = isCritique ? "bg-red-50" : isEleve ? "bg-orange-50" : "bg-amber-50";
            const borderColor = isCritique ? "border-red-200" : isEleve ? "border-orange-200" : "border-amber-200";
            const dotColor = isCritique ? "bg-red-500" : isEleve ? "bg-orange-500" : "bg-amber-500";
            const textColor = isCritique ? "text-red-700" : isEleve ? "text-orange-700" : "text-amber-700";

            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 ${bgColor} border ${borderColor} rounded-xl ${i === 0 ? "alert-pulse" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${textColor} truncate`}>
                    {r.alerts}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{r.deviceId}</span>
                    <span className="text-xs text-slate-300">
                      {new Date(r.timestamp).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
