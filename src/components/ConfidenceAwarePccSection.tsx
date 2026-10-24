import React, { useState } from 'react';
import {
  ShieldCheck,
  Sliders,
  Layers,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Table,
  ArrowRight,
  Info,
  Maximize2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ConfidenceAwarePccStats,
  ConfidencePccEvaluationComparison,
  TransitionConfidenceItem,
} from '../types';
import { CA_PCC_COLORS, DEFAULT_CONFIDENCE_THRESHOLD } from '../utils/confidenceAwarePcc';

interface ConfidenceAwarePccSectionProps {
  id?: string;
  stats?: ConfidenceAwarePccStats;
  currentThreshold: number;
  onThresholdChange: (newThreshold: number) => void;
  // Maps data URLs
  t1DataUrl?: string;
  t2DataUrl?: string;
  t1PredDataUrl?: string;
  t2PredDataUrl?: string;
  changeMapDataUrl?: string;
  t1ConfidenceDataUrl?: string;
  t2ConfidenceDataUrl?: string;
  highConfChangeDataUrl?: string;
  uncertainMapDataUrl?: string;
  caPccMapDataUrl?: string;
  isUserAnalysis?: boolean;
  sampleSubtitle?: string;
  evaluationComparison?: ConfidencePccEvaluationComparison;
}

type MapDisplayView =
  | 'ca-pcc'
  | 'high-conf'
  | 'uncertain'
  | 'original-pcc'
  | 'conf-t1'
  | 'conf-t2';

export const ConfidenceAwarePccSection: React.FC<ConfidenceAwarePccSectionProps> = ({
  id = 'confidence-aware-pcc-section',
  stats,
  currentThreshold,
  onThresholdChange,
  t1DataUrl,
  t2DataUrl,
  t1PredDataUrl,
  t2PredDataUrl,
  changeMapDataUrl,
  t1ConfidenceDataUrl,
  t2ConfidenceDataUrl,
  highConfChangeDataUrl,
  uncertainMapDataUrl,
  caPccMapDataUrl,
  isUserAnalysis = false,
  sampleSubtitle,
  evaluationComparison,
}) => {
  const [activeMapView, setActiveMapView] = useState<MapDisplayView>('ca-pcc');
  const [showSensitivityModal, setShowSensitivityModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // If stats is not yet computed, provide safe fallbacks
  const totalValidPixels = stats?.totalValidPixels || 262144;
  const highConfChangedPixels = stats?.highConfChangedPixels || 0;
  const highConfChangedPct = stats?.highConfChangedPct || 0;
  const uncertainChangedPixels = stats?.uncertainChangedPixels || 0;
  const uncertainChangedPct = stats?.uncertainChangedPct || 0;
  const highConfUnchangedPixels = stats?.highConfUnchangedPixels || 0;
  const highConfUnchangedPct = stats?.highConfUnchangedPct || 0;
  const uncertainUnchangedPixels = stats?.uncertainUnchangedPixels || 0;
  const uncertainUnchangedPct = stats?.uncertainUnchangedPct || 0;
  const totalUncertainPixels = stats?.totalUncertainPixels || 0;
  const totalUncertainPct = stats?.totalUncertainPct || 0;
  const coveragePixels = stats?.coveragePixels || 0;
  const coveragePct = stats?.coveragePct || 0;
  const transitions = stats?.transitions || [];

  const evalComp = evaluationComparison || stats?.evaluationComparison;

  // Active Map Image resolver
  const getActiveMapSrc = () => {
    switch (activeMapView) {
      case 'ca-pcc':
        return caPccMapDataUrl || changeMapDataUrl;
      case 'high-conf':
        return highConfChangeDataUrl || changeMapDataUrl;
      case 'uncertain':
        return uncertainMapDataUrl;
      case 'original-pcc':
        return changeMapDataUrl;
      case 'conf-t1':
        return t1ConfidenceDataUrl;
      case 'conf-t2':
        return t2ConfidenceDataUrl;
      default:
        return caPccMapDataUrl || changeMapDataUrl;
    }
  };

  const getActiveMapTitle = () => {
    switch (activeMapView) {
      case 'ca-pcc':
        return `Confidence-Aware PCC Map (τ = ${(currentThreshold * 100).toFixed(0)}%)`;
      case 'high-conf':
        return `High-Confidence Transitions Only (Filtered at τ ≥ ${(currentThreshold * 100).toFixed(0)}%)`;
      case 'uncertain':
        return `Uncertain Predictions Map (Joint Confidence < ${(currentThreshold * 100).toFixed(0)}%)`;
      case 'original-pcc':
        return 'Original Standard PCC Change Map (Baseline Unfiltered)';
      case 'conf-t1':
        return 'T1 Pixel-Level Prediction Confidence Heatmap';
      case 'conf-t2':
        return 'T2 Pixel-Level Prediction Confidence Heatmap';
      default:
        return 'Confidence-Aware Change Map';
    }
  };

  return (
    <section
      id={id}
      className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-6"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Confidence-Aware Post-Classification Comparison (CA-PCC)
              </h3>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Research Contribution
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quantifies prediction probability distributions to distinguish verified high-confidence transitions from unreliable boundary noise.
              {sampleSubtitle && <span className="text-slate-300 ml-1">({sampleSubtitle})</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHowItWorks ? 'Hide Explanation' : 'Research Objective'}</span>
        </button>
      </div>

      {/* Collapsible Research Objective */}
      {showHowItWorks && (
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <h4 className="font-semibold text-cyan-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Why Standard PCC Requires Confidence Screening
          </h4>
          <p>
            Standard Post-Classification Comparison (PCC) treats every difference between T1 and T2 predicted classes as a verified land-cover transition. However, remote sensing segmentation networks encounter optical mixed pixels, shadows, and subtle boundary misclassifications where prediction confidence is marginal.
          </p>
          <p>
            <strong>CA-PCC Decision Layer:</strong> For each pixel, CA-PCC extracts maximum class probabilities at both epochs (<code className="text-cyan-300">T1_conf</code> and <code className="text-cyan-300">T2_conf</code>) and applies a joint threshold <code className="text-cyan-300">τ = min(T1_conf, T2_conf) ≥ threshold</code>. Pixels are classified into four mutually exclusive states without silently forcing uncertain pixels into unchanged:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <li className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-red-500/30">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span><strong>High-Confidence Change:</strong> T1 ≠ T2 & min(conf) ≥ τ</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-emerald-500/30">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span><strong>High-Confidence Unchanged:</strong> T1 = T2 & min(conf) ≥ τ</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-orange-500/30">
              <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
              <span><strong>Uncertain Change:</strong> T1 ≠ T2 & min(conf) &lt; τ</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-amber-500/30">
              <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
              <span><strong>Uncertain Unchanged:</strong> T1 = T2 & min(conf) &lt; τ</span>
            </li>
          </ul>
        </div>
      )}

      {/* 2. Interactive Threshold Slider Control */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Confidence Threshold (τ):</span>
              <span className="text-cyan-400 font-mono font-bold text-sm">
                {(currentThreshold * 100).toFixed(0)}% ({currentThreshold.toFixed(2)})
              </span>
            </label>
            <div className="flex items-center gap-1">
              {[0.6, 0.7, 0.8, 0.9, 0.95].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onThresholdChange(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                    Math.abs(currentThreshold - preset) < 0.005
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {(preset * 100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-mono">0.50</span>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={currentThreshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] text-slate-400 font-mono">0.99</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Higher thresholds reject marginal decisions as uncertain, increasing precision and eliminating false change alarms while lowering coverage.
          </p>
        </div>

        <div className="sm:border-l sm:border-slate-800 sm:pl-4 flex flex-col justify-center min-w-[170px]">
          <div className="text-[11px] text-slate-400">Decision Coverage</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {coveragePct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            {coveragePixels.toLocaleString()} of {totalValidPixels.toLocaleString()} valid px
          </div>
        </div>
      </div>

      {/* 3. Four Mutually Exclusive Categories Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Mutually Exclusive Classification Summary (Denominator: {totalValidPixels.toLocaleString()} Valid Pixels)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Sum: {(highConfChangedPct + uncertainChangedPct + highConfUnchangedPct + uncertainUnchangedPct).toFixed(1)}% (100.0%)
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: High-Confidence Change */}
          <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">High-Confidence Change</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-red-400">
                {highConfChangedPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {highConfChangedPixels.toLocaleString()} pixels
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
              T1 ≠ T2 & min(conf) ≥ {(currentThreshold * 100).toFixed(0)}%
            </div>
          </div>

          {/* Card 2: High-Confidence Unchanged */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">High-Confidence Invariant</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {highConfUnchangedPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {highConfUnchangedPixels.toLocaleString()} pixels
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
              T1 = T2 & min(conf) ≥ {(currentThreshold * 100).toFixed(0)}%
            </div>
          </div>

          {/* Card 3: Uncertain Change */}
          <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Uncertain Change</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-orange-400">
                {uncertainChangedPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {uncertainChangedPixels.toLocaleString()} pixels
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
              Apparent transition with conf &lt; {(currentThreshold * 100).toFixed(0)}%
            </div>
          </div>

          {/* Card 4: Uncertain Unchanged */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Uncertain Invariant</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-amber-400">
                {uncertainUnchangedPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {uncertainUnchangedPixels.toLocaleString()} pixels
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
              Matching class with conf &lt; {(currentThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Aggregate Uncertainty Rate Banner */}
        <div className="mt-2.5 bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Total Rejected as Uncertain:</strong>{' '}
              <span className="text-amber-400 font-mono font-bold">{totalUncertainPct.toFixed(1)}%</span>{' '}
              ({totalUncertainPixels.toLocaleString()} pixels)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Uncertainty Rate = Uncertain Change ({uncertainChangedPct.toFixed(1)}%) + Uncertain Invariant ({uncertainUnchangedPct.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* 4. Visual Output Maps & Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Display Map */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{getActiveMapTitle()}</span>
            </h4>

            {/* View Mode Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveMapView('ca-pcc')}
                className={`text-[11px] px-2.5 py-1 rounded font-medium transition-colors ${
                  activeMapView === 'ca-pcc'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CA-PCC Map
              </button>
              <button
                onClick={() => setActiveMapView('high-conf')}
                className={`text-[11px] px-2.5 py-1 rounded font-medium transition-colors ${
                  activeMapView === 'high-conf'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                High-Conf Only
              </button>
              <button
                onClick={() => setActiveMapView('uncertain')}
                className={`text-[11px] px-2.5 py-1 rounded font-medium transition-colors ${
                  activeMapView === 'uncertain'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Uncertain Map
              </button>
              <button
                onClick={() => setActiveMapView('original-pcc')}
                className={`text-[11px] px-2.5 py-1 rounded font-medium transition-colors ${
                  activeMapView === 'original-pcc'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Baseline PCC
              </button>
            </div>
          </div>

          {/* Large Image Box */}
          <div className="relative aspect-square max-h-[460px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
            {getActiveMapSrc() ? (
              <img
                src={getActiveMapSrc()}
                alt="Active CA-PCC Map"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-slate-400">Map rendering in progress...</div>
            )}

            {/* Dynamic Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 border border-slate-800/90 rounded-lg p-2.5 backdrop-blur-md">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {activeMapView === 'conf-t1' || activeMapView === 'conf-t2' ? 'Confidence Gradient' : 'Legend'}
              </div>
              {activeMapView === 'conf-t1' || activeMapView === 'conf-t2' ? (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded bg-gradient-to-r from-indigo-900 via-sky-500 via-emerald-500 to-amber-400" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>≤ 50% Low</span>
                    <span>70% Moderate</span>
                    <span>85% Confident</span>
                    <span>≥ 95% High</span>
                  </div>
                </div>
              ) : activeMapView === 'high-conf' ? (
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-slate-200">High-Confidence Change ({highConfChangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-700" />
                    <span className="text-slate-400">Filtered Out (Invariant / Uncertain)</span>
                  </div>
                </div>
              ) : activeMapView === 'uncertain' ? (
                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-500" />
                    <span className="text-slate-200">Uncertain Change ({uncertainChangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-400" />
                    <span className="text-slate-200">Uncertain Invariant ({uncertainUnchangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-700" />
                    <span className="text-slate-400">Confident Decisions</span>
                  </div>
                </div>
              ) : activeMapView === 'original-pcc' ? (
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-slate-200">Apparent Change ({(highConfChangedPct + uncertainChangedPct).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-800" />
                    <span className="text-slate-400">Invariant Baseline ({(highConfUnchangedPct + uncertainUnchangedPct).toFixed(1)}%)</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500 flex-shrink-0" />
                    <span className="text-slate-200 truncate">High-Conf Change ({highConfChangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
                    <span className="text-slate-200 truncate">High-Conf Invariant ({highConfUnchangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 flex-shrink-0" />
                    <span className="text-slate-200 truncate">Uncertain Change ({uncertainChangedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                    <span className="text-slate-200 truncate">Uncertain Invariant ({uncertainUnchangedPct.toFixed(1)}%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Cards Column */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Temporal Confidence Heatmaps
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* T1 Confidence Card */}
            <div
              onClick={() => setActiveMapView('conf-t1')}
              className={`p-2 rounded-xl bg-slate-950 border cursor-pointer transition-all ${
                activeMapView === 'conf-t1'
                  ? 'border-cyan-400 ring-2 ring-cyan-400/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                {t1ConfidenceDataUrl && (
                  <img src={t1ConfidenceDataUrl} alt="T1 Confidence" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-200">Confidence T1</div>
              <div className="text-[10px] text-slate-400">Earlier state certainty</div>
            </div>

            {/* T2 Confidence Card */}
            <div
              onClick={() => setActiveMapView('conf-t2')}
              className={`p-2 rounded-xl bg-slate-950 border cursor-pointer transition-all ${
                activeMapView === 'conf-t2'
                  ? 'border-cyan-400 ring-2 ring-cyan-400/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                {t2ConfidenceDataUrl && (
                  <img src={t2ConfidenceDataUrl} alt="T2 Confidence" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-200">Confidence T2</div>
              <div className="text-[10px] text-slate-400">Later state certainty</div>
            </div>
          </div>

          {/* Quick Context / Observation Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2 mt-auto">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Reliability vs Coverage Balance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              At <strong className="text-slate-200">τ = {(currentThreshold * 100).toFixed(0)}%</strong>, {coveragePct.toFixed(1)}% of pixels receive a high-confidence decision.
              {' '}The remaining {totalUncertainPct.toFixed(1)}% are retained as <strong className="text-amber-400">Uncertain</strong>, rather than being forced into arbitrary change or no-change categories.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Class-Wise Transition Confidence Breakdown Table */}
      {transitions.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>Class Transition Confidence Breakdown</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Number and proportion of high-confidence transitions for each observed land-cover trajectory.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {transitions.length} Observed Transitions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Land-Cover Transition (T1 → T2)</th>
                  <th className="py-2.5 px-3 text-right">Apparent Pixels</th>
                  <th className="py-2.5 px-3 text-right">High-Confidence Pixels</th>
                  <th className="py-2.5 px-3 text-right">High-Conf Ratio</th>
                  <th className="py-2.5 px-3 text-right">Uncertain Pixels</th>
                  <th className="py-2.5 px-3 text-right">% of All Confident Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {transitions.slice(0, 8).map((t, i) => (
                  <tr key={`${t.fromId}_${t.toId}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.fromColorHex }} />
                      <span>{t.fromName.split('/')[0]}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.toColorHex }} />
                      <span>{t.toName.split('/')[0]}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {t.totalPixels.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                      {t.highConfPixels.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-300">
                      {t.highConfPctOfTransition.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-orange-400">
                      {t.uncertainPixels.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {t.pctOfAllHighConfChange.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Ground-Truth Evaluation: Does Confidence-Aware PCC Improve Reliability? */}
      {evalComp && (
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Research Validation: Does CA-PCC Improve Transition Reliability?</span>
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Ground-Truth Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparative evaluation between Standard PCC baseline (100% full coverage) and Confidence-Aware PCC (selective @ τ = {(currentThreshold * 100).toFixed(0)}%) on the same held-out test data.
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Evaluation Metric</th>
                  <th className="py-2.5 px-3 text-right">Standard PCC Baseline (100% Coverage)</th>
                  <th className="py-2.5 px-3 text-right text-cyan-300">CA-PCC (Selective @ τ = {(currentThreshold * 100).toFixed(0)}%)</th>
                  <th className="py-2.5 px-3 text-right">Reliability Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Coverage (%) / Valid Pixels Evaluated
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    100.0% ({evalComp.standardBaseline.counts.total.toLocaleString()} px)
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {evalComp.confidenceAware.coveragePct.toFixed(1)}% ({evalComp.confidenceAware.counts.total.toLocaleString()} px)
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400">
                    -{(100 - evalComp.confidenceAware.coveragePct).toFixed(1)}% (rejected as uncertain)
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Transition Precision (%)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {evalComp.standardBaseline.precision.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                    {evalComp.confidenceAware.precision.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {evalComp.confidenceAware.precision >= evalComp.standardBaseline.precision ? '+' : ''}
                    {(evalComp.confidenceAware.precision - evalComp.standardBaseline.precision).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Transition Recall (%)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {evalComp.standardBaseline.recall.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                    {evalComp.confidenceAware.recall.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {(evalComp.confidenceAware.recall - evalComp.standardBaseline.recall).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Transition F1-Score (%)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {evalComp.standardBaseline.f1Score.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                    {evalComp.confidenceAware.f1Score.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {evalComp.confidenceAware.f1Score >= evalComp.standardBaseline.f1Score ? '+' : ''}
                    {(evalComp.confidenceAware.f1Score - evalComp.standardBaseline.f1Score).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Transition IoU (%)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {evalComp.standardBaseline.iou.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                    {evalComp.confidenceAware.iou.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {evalComp.confidenceAware.iou >= evalComp.standardBaseline.iou ? '+' : ''}
                    {(evalComp.confidenceAware.iou - evalComp.standardBaseline.iou).toFixed(1)}%
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    Overall Accuracy (%)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {evalComp.standardBaseline.accuracy.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                    {evalComp.confidenceAware.accuracy.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {evalComp.confidenceAware.accuracy >= evalComp.standardBaseline.accuracy ? '+' : ''}
                    {(evalComp.confidenceAware.accuracy - evalComp.standardBaseline.accuracy).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scientific Discussion Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            <div className="font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scientific Conclusion: Trade-Off Analysis</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {evalComp.scientificDiscussion}
            </p>
          </div>

          {/* Multi-Threshold Sensitivity Table */}
          {evalComp.thresholdSensitivity && evalComp.thresholdSensitivity.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Multi-Threshold Sensitivity Analysis (Held-Out Test Set)
                </span>
                <span className="text-[10px] text-slate-400">
                  Click any row to test threshold
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2">Threshold (τ)</th>
                      <th className="py-1.5 px-2 text-right">Coverage (%)</th>
                      <th className="py-1.5 px-2 text-right">Rejected (%)</th>
                      <th className="py-1.5 px-2 text-right">Accuracy (%)</th>
                      <th className="py-1.5 px-2 text-right">Precision (%)</th>
                      <th className="py-1.5 px-2 text-right">Recall (%)</th>
                      <th className="py-1.5 px-2 text-right">F1-Score (%)</th>
                      <th className="py-1.5 px-2 text-right">IoU (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {evalComp.thresholdSensitivity.map((row) => {
                      const isCurrent = Math.abs(currentThreshold - row.threshold) < 0.005;
                      return (
                        <tr
                          key={row.threshold}
                          onClick={() => onThresholdChange(row.threshold)}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 px-2 flex items-center gap-1.5">
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                            <span>{(row.threshold * 100).toFixed(0)}%</span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-emerald-400">
                            {row.coveragePct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2 text-right text-amber-400">
                            {row.rejectedPct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2 text-right">{row.accuracy.toFixed(1)}%</td>
                          <td className="py-1.5 px-2 text-right font-bold text-cyan-300">
                            {row.precision.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2 text-right">{row.recall.toFixed(1)}%</td>
                          <td className="py-1.5 px-2 text-right">{row.f1Score.toFixed(1)}%</td>
                          <td className="py-1.5 px-2 text-right">{row.iou.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
