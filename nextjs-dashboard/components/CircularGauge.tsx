"use client";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  color: string;
  bgColor: string;
  size?: number;
}

export default function CircularGauge({
  value,
  max,
  label,
  sublabel,
  color,
  bgColor,
  size = 180,
}: CircularGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-circle"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-800">
            {value}
          </span>
          {sublabel && (
            <span className="text-xs font-medium text-slate-400 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span
        className="mt-2 text-sm font-bold tracking-wide"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
