import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, Battery, Clock } from 'lucide-react';
import DripRateChart from './DripRateChart';

const statusBorder = {
  normal:   'border-l-status-ok',
  warning:  'border-l-status-warn',
  critical: 'border-l-status-critical',
  offline:  'border-l-status-offline',
};

const statusBadge = {
  normal:   'bg-green-50 text-status-ok',
  warning:  'bg-orange-50 text-status-warn',
  critical: 'bg-red-50 text-status-critical',
  offline:  'bg-slate-50 text-status-offline',
};

export default function PatientDripCard({ patient }) {
  const [expanded, setExpanded] = useState(false);
  const status = patient.status || 'offline';

  return (
    <div className={`bg-white rounded-card border border-border border-l-4 ${statusBorder[status]} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-display font-600 text-text-primary text-sm">{patient.name}</h4>
            <p className="text-xs text-text-secondary mt-0.5">Bed {patient.bedNumber} · {patient.ward}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge[status]}`}>
            {status}
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Droplets className="w-3 h-3 text-primary" />
              <span className="text-xs text-text-secondary">Rate</span>
            </div>
            <p className="font-display font-bold text-lg text-text-primary tabular-nums">
              {patient.latestReading?.dropsPerMin ?? '--'}
            </p>
            <p className="text-xs text-text-secondary">drops/min</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-accent" />
              <span className="text-xs text-text-secondary">Volume</span>
            </div>
            <p className="font-display font-bold text-lg text-text-primary tabular-nums">
              {patient.latestReading?.volumeMl ?? '--'}
            </p>
            <p className="text-xs text-text-secondary">ml left</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Battery className="w-3 h-3 text-text-secondary" />
              <span className="text-xs text-text-secondary">Battery</span>
            </div>
            <p className="font-display font-bold text-lg text-text-primary tabular-nums">
              {patient.latestReading?.batteryPct ?? '--'}
            </p>
            <p className="text-xs text-text-secondary">%</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors py-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide chart' : 'Show 30-min chart'}
        </button>

        {/* Chart */}
        {expanded && <DripRateChart data={patient.chartData || []} />}
      </div>
    </div>
  );
}
