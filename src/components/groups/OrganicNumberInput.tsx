import React from "react";
import { Users } from "lucide-react";

interface OrganicNumberInputProps {
  label: string;
  value: string; // Stored as string so it can be truly empty "" without zero popping in
  onChange: (val: string) => void;
  placeholder?: string;
  presetValues?: number[];
  unit?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

export const OrganicNumberInput: React.FC<OrganicNumberInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Например: 15",
  presetValues = [10, 12, 15, 18, 20],
  unit = "чел.",
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty string or digits only (prevent negative, NaN, etc.)
    if (raw === "") {
      onChange("");
      return;
    }
    // Filter only digits
    const cleaned = raw.replace(/\D/g, "");
    onChange(cleaned);
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-red-600" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <span className="text-[10px] font-mono text-gray-500 font-bold">
            {value} {unit}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 text-xs px-1"
            title="Очистить"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Pills for instant selection */}
      {presetValues && presetValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[9px] text-gray-400 font-medium mr-0.5">Быстро:</span>
          {presetValues.map((num) => {
            const isSelected = value === String(num);
            return (
              <button
                type="button"
                key={num}
                onClick={() => onChange(String(num))}
                className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {num} {unit}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
