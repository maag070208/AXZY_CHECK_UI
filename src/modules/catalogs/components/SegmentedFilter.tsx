interface SegmentedOption<T extends string> {
    label: string;
    value: T;
}

interface SegmentedFilterProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    className?: string;
}

function SegmentedFilter<T extends string>({ value, onChange, options, className = '' }: SegmentedFilterProps<T>) {
    return (
        <div className={`inline-flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1 ${className}`}>
            {options.map(opt => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`h-[34px] px-3 text-xs font-bold rounded-lg transition-all ${isActive
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedFilter;
