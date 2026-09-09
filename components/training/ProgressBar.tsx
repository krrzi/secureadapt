'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  correctas?: number;
}

export function ProgressBar({ current, total, correctas }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const precisionPct = current > 0 && correctas !== undefined ? (correctas / current) * 100 : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-surface-600">
          Pregunta {Math.min(current + 1, total)} de {total}
        </span>
        {precisionPct !== null && current > 0 && (
          <span
            className={`font-semibold ${
              precisionPct >= 70
                ? 'text-success-600'
                : precisionPct >= 50
                ? 'text-warning-600'
                : 'text-danger-600'
            }`}
          >
            {precisionPct.toFixed(0)}% aciertos
          </span>
        )}
      </div>
      <div className="w-full bg-surface-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Dots indicator */}
      <div className="flex gap-1.5 mt-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i < current ? 'bg-brand-500' : 'bg-surface-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
