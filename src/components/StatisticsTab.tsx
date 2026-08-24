import React from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ScenarioDataset, TabType } from '../types';
import { calculateSceneStatistics, generateAcademicEnvironmentalInsights } from '../utils/geoAnalysis';

interface StatisticsTabProps {
  currentScenario: ScenarioDataset;
  unit: 'ha' | 'km2';
  onNavigateTab: (tab: TabType) => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  currentScenario,
  unit,
  onNavigateTab,
}) => {
  const stats = calculateSceneStatistics(currentScenario);
  const observations = generateAcademicEnvironmentalInsights(currentScenario);

  // Maximum value for bar scaling
  const maxArea = Math.max(...stats.rows.map((r) => Math.max(r.t1AreaHa, r.t2AreaHa)), 1);

  return (
    <div id="statistics-tab-content" className="space-y-5">
      {/* 1. Header Metrics Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              Quantitative Remote Sensing Statistics
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Land-Cover Distribution & Net Change Accounting
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Scene {currentScenario.sceneCode} &middot; Comparison of {currentScenario.temporalBaseline} vs {currentScenario.temporalTarget}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
              <span className="text-slate-400">Total Pixels: </span>
              <strong className="text-slate-100">{stats.totalPixels.toLocaleString()}</strong>
            </div>
            <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs font-mono text-emerald-400">
              <span>Stability: </span>
              <strong>{stats.stabilityIndexPct}% Invariant</strong>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">Total Surveyed Footprint</span>
            <p className="text-base font-mono font-bold text-slate-100 mt-1">
              {stats.totalAreaHa.toFixed(2)} {unit === 'ha' ? 'ha' : 'km²'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">512 × 512 pixel grid (1.0m GSD)</p>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">Total Converted Area</span>
            <p className="text-base font-mono font-bold text-rose-400 mt-1">
              {stats.totalChangedAreaHa.toFixed(2)} {unit === 'ha' ? 'ha' : 'km²'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {((stats.totalChangedAreaHa / stats.totalAreaHa) * 100).toFixed(1)}% of total scene shifted
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">Dominant Transition Trajectory</span>
            <p className="text-sm font-semibold text-cyan-300 mt-1 truncate">
              {stats.primaryTransition
                ? `${stats.primaryTransition.fromName} ➔ ${stats.primaryTransition.toName}`
                : 'No major single shift'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats.primaryTransition
                ? `${stats.primaryTransition.areaHa.toFixed(2)} ha (${stats.primaryTransition.percentage.toFixed(1)}% of changed area)`
                : 'Balanced distribution'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quantitative Accounting Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Class-Wise Land-Cover Accounting Table</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Semantic Class</th>
                <th className="py-2.5 px-3 font-semibold text-right">T1 Baseline ({unit})</th>
                <th className="py-2.5 px-3 font-semibold text-right">T2 Target ({unit})</th>
                <th className="py-2.5 px-3 font-semibold text-right">Net Change ({unit})</th>
                <th className="py-2.5 px-3 font-semibold text-right">Relative Shift (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats.rows.map((row) => {
                const isIncreased = row.diffHa > 0.05;
                const isDecreased = row.diffHa < -0.05;
                const areaT1 = unit === 'ha' ? row.t1AreaHa : Number((row.t1AreaHa / 100).toFixed(4));
                const areaT2 = unit === 'ha' ? row.t2AreaHa : Number((row.t2AreaHa / 100).toFixed(4));
                const diffArea = unit === 'ha' ? row.diffHa : Number((row.diffHa / 100).toFixed(4));

                return (
                  <tr key={row.classId} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded shrink-0 shadow-sm"
                          style={{ backgroundColor: row.colorHex }}
                        />
                        <span className="text-slate-200 font-medium">{row.className}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {areaT1.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {areaT2.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-semibold ${
                          isIncreased
                            ? 'text-emerald-400'
                            : isDecreased
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isIncreased ? `+${diffArea.toFixed(2)}` : diffArea.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-semibold">
                        {isIncreased ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isDecreased ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span
                          className={
                            isIncreased
                              ? 'text-emerald-400'
                              : isDecreased
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {row.pctChange > 0 ? `+${row.pctChange.toFixed(1)}%` : `${row.pctChange.toFixed(1)}%`}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Simple Academic Comparative Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Comparative Land-Cover Distribution (T1 Baseline vs T2 Target)</span>
        </h3>

        <div className="space-y-4 pt-2">
          {stats.rows.filter((r) => r.classId !== 0).map((row) => {
            const t1Pct = (row.t1AreaHa / maxArea) * 100;
            const t2Pct = (row.t2AreaHa / maxArea) * 100;

            return (
              <div key={row.classId} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: row.colorHex }} />
                    <span>{row.className}</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    T1: <strong className="text-cyan-300">{row.t1AreaHa.toFixed(2)}</strong> {unit} | T2: <strong className="text-emerald-300">{row.t2AreaHa.toFixed(2)}</strong> {unit}
                  </span>
                </div>

                {/* Dual bar */}
                <div className="space-y-1 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-[10px] text-slate-500 font-mono">T1</span>
                    <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-cyan-500"
                        style={{ width: `${Math.min(100, Math.max(3, t1Pct))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-[10px] text-slate-500 font-mono">T2</span>
                    <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                        style={{ width: `${Math.min(100, Math.max(3, t2Pct))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Simple Environmental Observations & Insights */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Research-Oriented Environmental Observations</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cautious academic observations generated directly from computed pixel transitions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {observations.map((obs) => (
            <div
              key={obs.id}
              className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{obs.title}</span>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">{obs.metric}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Observation:</strong> {obs.observation}
              </p>
              <p className="text-[11px] text-slate-400 italic">
                <strong>Implication:</strong> {obs.academicImplication}
              </p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Academic Disclaimer:</strong> Observations represent descriptive measurements of land-cover shifts between the two observation timestamps, derived from ResNet-50 + U-Net semantic segmentation and Post-Classification Comparison (PCC). They do not infer unverified socio-economic or regulatory causes.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-400">Generate full academic project documentation:</span>
          <button
            onClick={() => onNavigateTab('report')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Research Dossier & Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
