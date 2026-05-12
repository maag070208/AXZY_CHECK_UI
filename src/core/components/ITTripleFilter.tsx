import React from "react";

interface Option<T> {
  label: string;
  value: T;
}

interface Props<T> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}

/**
 * @description Generic triple/segmented filter component following AXZY Emerald/Slate theme.
 */
export const ITTripleFilter = <T extends string | boolean>({
  value,
  onChange,
  options,
  className = "",
}: Props<T>) => {
  return (
    <div className={`flex bg-slate-100 p-1 rounded-xl gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
            value === option.value
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
