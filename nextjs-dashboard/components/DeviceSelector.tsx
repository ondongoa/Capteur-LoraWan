"use client";

interface DeviceSelectorProps {
  devices: string[];
  selected: string;
  onSelect: (deviceId: string) => void;
}

export default function DeviceSelector({ devices, selected, onSelect }: DeviceSelectorProps) {
  if (devices.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1">
      {devices.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
            selected === d
              ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20"
              : "bg-white text-slate-500 shadow-sm hover:shadow-md"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
