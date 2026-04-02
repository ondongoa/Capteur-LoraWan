"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

export default function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm card-transition hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-slate-800">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
