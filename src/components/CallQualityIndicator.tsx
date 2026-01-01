export type CallQuality = 'excellent' | 'good' | 'poor' | null;

interface CallQualityIndicatorProps {
  quality: CallQuality;
}

export function CallQualityIndicator({ quality }: CallQualityIndicatorProps) {
  if (!quality) return null;

  const config = {
    excellent: {
      bars: 3,
      color: 'bg-emerald-500',
      label: 'Excellent',
    },
    good: {
      bars: 2,
      color: 'bg-amber-500',
      label: 'Good',
    },
    poor: {
      bars: 1,
      color: 'bg-red-500',
      label: 'Poor',
    },
  };

  const { bars, color, label } = config[quality];

  return (
    <div className="flex items-center gap-1.5" title={`Call quality: ${label}`}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`w-1 rounded-sm transition-all duration-200
              ${level === 1 ? 'h-1.5' : level === 2 ? 'h-2.5' : 'h-4'}
              ${level <= bars ? color : 'bg-slate-200'}
            `}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 hidden sm:inline">{label}</span>
    </div>
  );
}
