import React, { useEffect, useRef, useState } from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  const colorMap = {
    primary:  { bg: 'bg-blue-50',  icon: 'text-primary',         border: 'border-blue-100' },
    ok:       { bg: 'bg-green-50', icon: 'text-status-ok',       border: 'border-green-100' },
    warn:     { bg: 'bg-orange-50',icon: 'text-status-warn',     border: 'border-orange-100' },
    critical: { bg: 'bg-red-50',   icon: 'text-status-critical', border: 'border-red-100' },
    offline:  { bg: 'bg-slate-50', icon: 'text-status-offline',  border: 'border-slate-100' },
  };

  const c = colorMap[color] || colorMap.primary;

  useEffect(() => {
    const start = prevValue.current;
    const end = Number(value) || 0;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevValue.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className={`bg-white rounded-card border ${c.border} p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`${c.bg} rounded-control p-3 flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide truncate">{title}</p>
        <p className="font-display text-3xl font-bold text-text-primary mt-0.5 tabular-nums">{displayValue}</p>
        {subtitle && <p className="text-text-secondary text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
