import React from 'react';
import { Gauge } from 'lucide-react';

const MODEL_ACCURACY = 79.8; // ≈ 79.84% test accuracy
const MODEL_AUC = 87.6;      // ≈ 0.8763 AUC
const MODEL_ERROR_RATE = 100 - MODEL_ACCURACY;
const BASELINE_RATE = 64.0;  // EFInA survey baseline

export default function ModelPerformanceBadge() {
  return (
    <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 py-2 rounded-xl bg-white/90 border border-border-light shadow-sm text-[11px] sm:text-xs text-text-secondary">
      <div className="flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5 text-accent-primary" />
        <span className="font-semibold text-text-primary">Model performance</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        <span>
          <span className="font-semibold text-text-primary">{MODEL_ACCURACY.toFixed(1)}%</span> accuracy
        </span>
        <span>
          <span className="font-semibold text-text-primary">{MODEL_AUC.toFixed(1)}%</span> AUC
        </span>
        <span>
          <span className="font-semibold text-text-primary">{MODEL_ERROR_RATE.toFixed(1)}%</span> error rate
        </span>
        <span>
          Baseline inclusion <span className="font-semibold text-text-primary">{BASELINE_RATE.toFixed(1)}%</span>
        </span>
      </div>
    </div>
  );
}
