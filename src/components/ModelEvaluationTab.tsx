import React, { useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  BarChart2,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight,
  Info,
  TrendingUp,
  FlaskConical,
  GraduationCap,
  Sparkles,
  Zap,
  Activity,
  Maximize2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TabType, ScenarioDataset } from '../types';
import { SECOND_CLASSES } from '../data/scenarios';
import {
  BASELINE_MODEL,
  IMPROVED_MODEL,
  MODEL_COMPARISON_METRICS,
  EXPERIMENT_LOGS,
  TRAINING_HISTORY,
  MODEL_LAYER_SUMMARY,
  IMPROVED_CONFUSION_MATRIX,
  IMPROVED_CLASS_METRICS,
  VIVA_TECHNICAL_QA,
  CAPCC_TEST_BENCHMARK,
} from '../data/modelExperiments';

interface ModelEvaluationTabProps {
  currentScenario: ScenarioDataset;
  onNavigateTab: (tab: TabType) => void;
}

export const ModelEvaluationTab: React.FC<ModelEvaluationTabProps> = ({
  currentScenario,
  onNavigateTab,
}) => {
  const [activeTabSubSection, setActiveTabSubSection] = useState<
    'performance' | 'ca-pcc' | 'architecture' | 'comparison' | 'experiments' | 'training-curves' | 'viva-qa'
  >('performance');

  const [showLayerSummary, setShowLayerSummary] = useState<boolean>(false);
  const [activeMetricDetail, setActiveMetricDetail] = useState<string | null>(null);
  const [activeVivaIndex, setActiveVivaIndex] = useState<number | null>(0);
  const [curveMetric, setCurveMetric] = useState<'loss' | 'accuracy' | 'iou'>('iou');

  const primaryMetrics = [
    {
      id: 'acc',
      label: 'Pixel Accuracy',
      value: `${IMPROVED_MODEL.accuracy.toFixed(1)}%`,
      baselineVal: `${BASELINE_MODEL.accuracy.toFixed(1)}%`,
      delta: '+3.2%',
      desc: 'Held-out test set accuracy across 262,144 pixels per scene',
      formula: 'Accuracy = (Total Correct Pixels) / (Total Evaluated Pixels)',
      vivaExplanation:
        'Accuracy measures the overall fraction of correctly predicted pixels. On the 15% held-out test split, the improved model achieved 97.4% test accuracy.',
    },
    {
      id: 'miou',
      label: 'Mean IoU (mIoU)',
      value: `${IMPROVED_MODEL.mIoU.toFixed(1)}%`,
      baselineVal: `${BASELINE_MODEL.mIoU.toFixed(1)}%`,
      delta: '+5.7%',
      desc: 'Arithmetic mean of Intersection-over-Union across all 7 semantic classes',
      formula: 'IoU_c = TP_c / (TP_c + FP_c + FN_c) ; mIoU = (1/7) * Σ IoU_c',
      vivaExplanation:
        'Mean IoU is the benchmark metric for remote sensing semantic segmentation because it penalizes false positives and false negatives without bias toward high-frequency background classes.',
    },
    {
      id: 'f1',
      label: 'Macro F1-Score (Dice)',
      value: `${IMPROVED_MODEL.f1Score.toFixed(1)}%`,
      baselineVal: `${BASELINE_MODEL.f1Score.toFixed(1)}%`,
      delta: '+4.7%',
      desc: 'Harmonic mean of precision and recall across all classes',
      formula: 'F1 = 2 × (Precision × Recall) / (Precision + Recall)',
      vivaExplanation:
        'Macro F1 provides an unweighted balance across rare classes (such as sports playgrounds or water channels) and abundant classes (vegetation and soil).',
    },
    {
      id: 'precision',
      label: 'Macro Precision',
      value: `${IMPROVED_MODEL.precision.toFixed(1)}%`,
      baselineVal: `${BASELINE_MODEL.precision.toFixed(1)}%`,
      delta: '+4.7%',
      desc: 'Confidence level: low false-alarm rate across complex urban/rural boundaries',
      formula: 'Precision = TP / (TP + FP)',
      vivaExplanation:
        'When the network predicts a pixel is Building or Water, high precision ensures it is truly that class rather than an artifact.',
    },
    {
      id: 'recall',
      label: 'Macro Recall',
      value: `${IMPROVED_MODEL.recall.toFixed(1)}%`,
      baselineVal: `${BASELINE_MODEL.recall.toFixed(1)}%`,
      delta: '+4.7%',
      desc: 'Sensitivity: high boundary completeness and true feature retrieval',
      formula: 'Recall = TP / (TP + FN)',
      vivaExplanation:
        'High recall guarantees that narrow roads, building perimeters, and tree clusters are not omitted or misclassified as bare ground.',
    },
  ];

  return (
    <div id="model-evaluation-tab-content" className="space-y-5">
      {/* 1. Header: Model Evaluation on Unseen Test Data */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Held-Out Test Set (15% Unseen)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Architecture: U-Net with ResNet-50 Encoder
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Model Performance, Architecture & Optimization Benchmark
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Rigorous evaluation of the hybrid <strong>U-Net with ResNet-50 Encoder</strong> on the 444 held-out test image pairs of the SECOND dataset. Demonstrates validation selection, training convergence, per-class IoU, confusion matrix, and viva defense concepts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="model-view-training-curves-btn"
              onClick={() => setActiveTabSubSection('training-curves')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTabSubSection === 'training-curves'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-300" />
              <span>Training Curves</span>
            </button>

            <button
              id="model-view-experiments-btn"
              onClick={() => setActiveTabSubSection('experiments')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTabSubSection === 'experiments'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-amber-300" />
              <span>5 Experiments Log</span>
            </button>

            <button
              id="model-view-capcc-btn"
              onClick={() => setActiveTabSubSection('ca-pcc')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTabSubSection === 'ca-pcc'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-950 border border-rose-500/40 text-rose-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-300" />
              <span>CA-PCC Research Evaluation</span>
            </button>

            <button
              id="model-view-viva-qa-btn"
              onClick={() => setActiveTabSubSection('viva-qa')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTabSubSection === 'viva-qa'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-950 border border-emerald-500/40 text-emerald-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>Viva Q&A Guide</span>
            </button>
          </div>
        </div>

        {/* Sub-Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTabSubSection('performance')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'performance'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Test Performance & Confusion Matrix
          </button>
          <button
            onClick={() => setActiveTabSubSection('ca-pcc')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTabSubSection === 'ca-pcc'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>2. CA-PCC Reliability Evaluation (Research Question)</span>
          </button>
          <button
            onClick={() => setActiveTabSubSection('architecture')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'architecture'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Architecture & Parameters (32.56M)
          </button>
          <button
            onClick={() => setActiveTabSubSection('comparison')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'comparison'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Baseline vs Improved Model (+5.7% mIoU)
          </button>
          <button
            onClick={() => setActiveTabSubSection('training-curves')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'training-curves'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Training & Validation Curves (50 Epochs)
          </button>
          <button
            onClick={() => setActiveTabSubSection('experiments')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'experiments'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Research Experiments Log (A &rarr; E)
          </button>
          <button
            onClick={() => setActiveTabSubSection('viva-qa')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabSubSection === 'viva-qa'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            6. Viva Defense Technical Q&A
          </button>
        </div>

        {/* Primary 5 Metrics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {primaryMetrics.map((m) => (
            <div
              key={m.id}
              onClick={() => setActiveMetricDetail(activeMetricDetail === m.id ? null : m.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                activeMetricDetail === m.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">{m.label}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-xl font-bold font-mono text-emerald-400">
                    {m.value}
                  </p>
                  <span className="text-[11px] font-mono text-emerald-500 font-semibold">
                    {m.delta}
                  </span>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-2 line-clamp-2">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Metric Explanation Detail Card */}
        {activeMetricDetail && (
          <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 text-sm">
                Viva Defense Explanation: {primaryMetrics.find((m) => m.id === activeMetricDetail)?.label}
              </span>
              <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                Formula: {primaryMetrics.find((m) => m.id === activeMetricDetail)?.formula}
              </span>
            </div>
            <p className="leading-relaxed">
              {primaryMetrics.find((m) => m.id === activeMetricDetail)?.vivaExplanation}
            </p>
          </div>
        )}
      </div>

      {/* SUB-SECTION 1: Test Performance & Confusion Matrix */}
      {activeTabSubSection === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: 7x7 Improved Confusion Matrix (Span 7) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>7×7 Normalized Test Confusion Matrix (%)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated on 444 unseen pairs (Held-out Test Split) &middot; Rows = Ground Truth, Cols = Predicted
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono">
                Optimized Model
              </span>
            </div>

            {/* Matrix Visual Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="text-left py-2 px-2 text-slate-300 font-sans">Actual \ Pred</th>
                    {SECOND_CLASSES.map((cls) => (
                      <th key={cls.id} className="py-2 px-1 text-center font-bold" title={cls.displayName}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cls.colorHex }} />
                        C{cls.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IMPROVED_CONFUSION_MATRIX.map((row) => (
                    <tr key={row.actualClassId} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="text-left py-2 px-2 text-slate-200 font-sans font-medium text-xs flex items-center gap-1.5 whitespace-nowrap">
                        <span
                          className="w-2.5 h-2.5 rounded shrink-0"
                          style={{ backgroundColor: SECOND_CLASSES[row.actualClassId].colorHex }}
                        />
                        <span>C{row.actualClassId}: {SECOND_CLASSES[row.actualClassId].displayName.split('/')[0]}</span>
                      </td>
                      {row.predictions.map((val, pIdx) => {
                        const isDiagonal = row.actualClassId === pIdx;
                        let bgClass = 'bg-slate-950/40 text-slate-400';
                        if (isDiagonal) {
                          bgClass = val > 93 ? 'bg-emerald-950/70 text-emerald-300 font-bold' : 'bg-emerald-950/40 text-emerald-400 font-semibold';
                        } else if (val > 2) {
                          bgClass = 'bg-amber-950/40 text-amber-300 font-medium';
                        }

                        return (
                          <td key={pIdx} className={`py-2 px-1 text-xs border border-slate-800/40 ${bgClass}`}>
                            {val.toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Technical Interpretation of Confusion Matrix:</span>
              </div>
              <p>
                &bull; <strong>Diagonal cells (green):</strong> True Positive Rates (e.g. <strong>96.8%</strong> for Water Bodies and <strong>95.4%</strong> for Tree Canopy).
              </p>
              <p>
                &bull; <strong>Off-diagonal cells:</strong> Low spectral confusion due to the composite Weighted Cross-Entropy + Multi-Class Dice Loss and two-stage fine-tuning.
              </p>
            </div>
          </div>

          {/* Right: Per-Class Breakdown (Span 5) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Per-Class IoU & F1 Scores</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mean IoU across 7 classes: <strong className="text-emerald-400 font-mono">88.1%</strong> (+5.7% over baseline)
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {IMPROVED_CLASS_METRICS.map((cls) => (
                <div key={cls.id} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-200">
                      <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: cls.hex }} />
                      <span>Class {cls.id}: {cls.name}</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-cyan-300 font-bold">{cls.iou}% IoU</span>
                      <span className="text-slate-400 text-[10px]">({cls.f1}% F1)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cls.iou}%`, backgroundColor: cls.hex }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Next: Inspect multi-temporal T1 vs T2 images</span>
              <button
                onClick={() => onNavigateTab('temporal-analysis')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Temporal Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: Architecture & Parameter Breakdown */}
      {activeTabSubSection === 'architecture' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>Hybrid Network Architecture: U-Net with ResNet-50 Encoder</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Combining ResNet-50 hierarchical feature extraction with U-Net 5-stage spatial reconstruction and skip connections
              </p>
            </div>

            <button
              onClick={() => setShowLayerSummary(!showLayerSummary)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-cyan-300 hover:text-white transition cursor-pointer shrink-0"
            >
              <span>{showLayerSummary ? 'Hide Layer Summary' : 'View Full Model Summary (Keras/PyTorch)'}</span>
              {showLayerSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Architecture 3-Pillar Visual Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: ResNet-50 Encoder */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  1. ResNet-50 Encoder
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  Feature Extractor
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Extracts multi-scale hierarchical feature maps from 512×512×3 RGB aerial inputs. Residual connections prevent vanishing gradients during deep feature abstraction.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                <div>• Conv1 (C1): 256×256 × 64 (Edges/Textures)</div>
                <div>• Layer1 (C2): 128×128 × 256 (Local Shapes)</div>
                <div>• Layer2 (C3): 64×64 × 512 (Object Semantics)</div>
                <div>• Layer3 (C4): 32×32 × 1024 (Contextual Features)</div>
                <div>• Layer4 (C5): 16×16 × 2048 (Bottleneck Latent)</div>
              </div>
            </div>

            {/* Pillar 2: Skip Connections */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  2. Lateral Skip Connections
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  Boundary Preservation
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transfers high-resolution spatial feature maps directly from encoder stages to the corresponding decoder stages to recover fine structural boundaries.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                <div>• C4 &rarr; D5: 32×32 resolution spatial linkage</div>
                <div>• C3 &rarr; D4: 64×64 structural detail restoration</div>
                <div>• C2 &rarr; D3: 128×128 building perimeter recovery</div>
                <div>• C1 &rarr; D2: 256×256 fine edge/road alignment</div>
                <div>• Eliminates spatial blur in semantic borders</div>
              </div>
            </div>

            {/* Pillar 3: U-Net Decoder */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4" />
                  3. U-Net Decoder
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Spatial Reconstruction
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                5-Stage bilinear upsampling and convolution refinement blocks progressively expand the latent feature representation back to full 512×512 resolution.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                <div>• D5: 16×16 &rarr; 32×32 (512 filters)</div>
                <div>• D4: 32×32 &rarr; 64×64 (256 filters)</div>
                <div>• D3: 64×64 &rarr; 128×128 (128 filters)</div>
                <div>• D2: 128×128 &rarr; 256×256 (64 filters)</div>
                <div>• D1: 256×256 &rarr; 512×512 (7-Class Softmax)</div>
              </div>
            </div>
          </div>

          {/* Parameter Count Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Network Parameter Allocation (32.56 Million Total Parameters)
              </span>
              <span className="text-xs font-mono text-cyan-400">
                PyTorch / Keras Equivalent
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Total Parameters:</span>
                <strong className="text-white font-mono text-base block mt-0.5">
                  {IMPROVED_MODEL.totalParameters.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">32.56 Million Parameters</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-emerald-900/50">
                <span className="text-slate-400 text-[11px] block">Trainable Parameters (Stage 2):</span>
                <strong className="text-emerald-400 font-mono text-base block mt-0.5">
                  {IMPROVED_MODEL.trainableParameters.toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-400/80 font-mono">14.82 Million (Decoder + Conv4/Conv5)</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Non-Trainable / Frozen Parameters:</span>
                <strong className="text-slate-300 font-mono text-base block mt-0.5">
                  {IMPROVED_MODEL.nonTrainableParameters.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">17.74 Million (Frozen Pretrained Base)</span>
              </div>
            </div>
          </div>

          {/* Expandable Layer Summary Table */}
          {showLayerSummary && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">
                  Detailed Layer-by-Layer Output Shapes & Parameter Counts
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Input: 512 × 512 × 3 &rarr; Output: 512 × 512 × 7
                </span>
              </div>

              <div className="overflow-x-auto max-h-80 scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/80">
                      <th className="py-2 px-3">Layer / Block Name</th>
                      <th className="py-2 px-3">Stage Function</th>
                      <th className="py-2 px-3">Output Shape</th>
                      <th className="py-2 px-3 text-right">Param #</th>
                      <th className="py-2 px-3 text-center">Trainable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {MODEL_LAYER_SUMMARY.map((layer, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-1.5 px-3 font-semibold text-slate-200">{layer.layerName}</td>
                        <td className="py-1.5 px-3 text-slate-400 font-sans">{layer.stage}</td>
                        <td className="py-1.5 px-3 text-cyan-300">{layer.outputShape}</td>
                        <td className="py-1.5 px-3 text-right text-slate-300">{layer.paramCount.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-center">
                          {layer.trainable ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              Frozen
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 3: Baseline vs Improved Model Comparison */}
      {activeTabSubSection === 'comparison' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Scientific Comparison: Baseline Model vs Improved Model</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comparing standard baseline initialization against the optimized pipeline with composite loss, remote sensing data augmentations, and two-stage fine-tuning.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] font-semibold">
                  <th className="py-3 px-4">Evaluation Metric</th>
                  <th className="py-3 px-4 text-center">Baseline Model (Frozen Backbone)</th>
                  <th className="py-3 px-4 text-center">Improved Model (Optimized Pipeline)</th>
                  <th className="py-3 px-4 text-center">Observed Delta</th>
                  <th className="py-3 px-4">Engineering Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {MODEL_COMPARISON_METRICS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-bold text-slate-100">{row.metric}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">{row.baseline}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 text-sm">
                      {row.improved}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">
                        {row.delta}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technical Explanations of Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                1. Composite Dice + CE Loss
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Prevents the network from ignoring sparse categories (playgrounds, narrow canals) by directly maximizing spatial Intersection-over-Union alongside per-pixel classification entropy.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                2. Remote Sensing Data Augmentations
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Rotational invariance (90°, 180°, 270°), horizontal/vertical flips, and scale jitter applied strictly to the training split made the encoder robust to varying aerial sensor angles.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                3. Two-Stage Fine-Tuning
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Stage 1 trained decoder weights stably. Stage 2 unfroze high-level ResNet layers (Layer 3 & 4) with Cosine Annealing (LR=1e-5), adapting ImageNet features specifically to remote sensing textures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: Training & Validation Curves */}
      {activeTabSubSection === 'training-curves' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Training & Validation Convergence Curves (50 Epochs)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Displaying smooth convergence with Stage 2 Fine-Tuning transition at Epoch 20. Shows healthy generalization without overfitting.
              </p>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setCurveMetric('iou')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  curveMetric === 'iou' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mean IoU (%)
              </button>
              <button
                onClick={() => setCurveMetric('accuracy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  curveMetric === 'accuracy' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pixel Accuracy (%)
              </button>
              <button
                onClick={() => setCurveMetric('loss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  curveMetric === 'loss' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Loss (Composite)
              </button>
            </div>
          </div>

          {/* Interactive Recharts Graph */}
          <div className="h-72 w-full bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TRAINING_HISTORY} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="epoch"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Epochs (1 to 50)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={curveMetric === 'loss' ? [0, 2] : [60, 100]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                {curveMetric === 'iou' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="trainIoU"
                      name="Training mIoU (%)"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valIoU"
                      name="Validation mIoU (%)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </>
                )}

                {curveMetric === 'accuracy' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="trainAcc"
                      name="Training Accuracy (%)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valAcc"
                      name="Validation Accuracy (%)"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </>
                )}

                {curveMetric === 'loss' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="trainLoss"
                      name="Training Loss (CE + Dice)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valLoss"
                      name="Validation Loss"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-300">Phase 1: Decoder-Only Training (Epochs 1–20)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Initial training focused on stabilizing the 5-stage U-Net decoder weights with fixed ImageNet features. Training mIoU reached 85.4% and validation mIoU reached 85.6%.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-emerald-900/50 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">Phase 2: Fine-Tuning ResNet Conv4/Conv5 (Epochs 21–50)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Unfreezing Layer 3 & Layer 4 with Cosine Learning Rate Decay refined remote sensing spectral representations, boosting validation mIoU to <strong>87.8%</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: Research Experiments Log (A through E) */}
      {activeTabSubSection === 'experiments' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              <span>Research Experiment Log & Hyperparameter Validation Protocol</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              5 systematic experiments conducted on the training/validation splits. Exp E was selected as the optimal model checkpoint and evaluated ONCE on the held-out test split.
            </p>
          </div>

          <div className="space-y-3">
            {EXPERIMENT_LOGS.map((exp) => (
              <div
                key={exp.id}
                className={`p-4 rounded-xl border transition ${
                  exp.isSelectedBest
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{exp.name}</span>
                    {exp.isSelectedBest && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider">
                        Selected Best Model (Evaluated on Test Set)
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{exp.timestamp}</span>
                </div>

                <p className="text-xs text-slate-300 mt-2">{exp.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-3 text-[11px] font-mono">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Learning Rate:</span>
                    <span className="text-slate-200">{exp.learningRate}</span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Optimizer:</span>
                    <span className="text-slate-200">{exp.optimizer}</span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Loss Function:</span>
                    <span className="text-slate-200 truncate block">{exp.lossFunction}</span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Validation Accuracy:</span>
                    <span className="text-cyan-300 font-bold">{exp.valAccuracy}%</span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Validation mIoU:</span>
                    <span className="text-emerald-400 font-bold">{exp.valIoU}%</span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Validation F1:</span>
                    <span className="text-amber-300 font-bold">{exp.valF1}%</span>
                  </div>
                </div>

                {exp.isSelectedBest && (
                  <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Held-Out Test Set Results (Unseen Data):
                    </span>
                    <div className="flex items-center gap-4 font-mono font-bold text-white">
                      <span>Test Acc: <strong className="text-emerald-300">97.4%</strong></span>
                      <span>Test mIoU: <strong className="text-cyan-300">88.1%</strong></span>
                      <span>Test F1: <strong className="text-amber-300">93.6%</strong></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 6: Viva Defense Technical Q&A Accordion */}
      {activeTabSubSection === 'viva-qa' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span>Viva & Mentor Technical Defense Q&A</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct, academically grounded answers for questions on model design, training splits, and change detection.
            </p>
          </div>

          <div className="space-y-2.5">
            {VIVA_TECHNICAL_QA.map((item, idx) => {
              const isOpen = activeVivaIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => setActiveVivaIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:text-cyan-300 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item.question}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/40">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
