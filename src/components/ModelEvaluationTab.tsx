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
} from 'lucide-react';
import { TabType, ScenarioDataset } from '../types';
import { BENCHMARK_MODEL, CONFUSION_MATRIX, SECOND_CLASSES } from '../data/scenarios';

interface ModelEvaluationTabProps {
  currentScenario: ScenarioDataset;
  onNavigateTab: (tab: TabType) => void;
}

export const ModelEvaluationTab: React.FC<ModelEvaluationTabProps> = ({
  currentScenario,
  onNavigateTab,
}) => {
  const [showMetricDefinitions, setShowMetricDefinitions] = useState<boolean>(true);
  const [showArchDetails, setShowArchDetails] = useState<boolean>(false);
  const [activeMetricDetail, setActiveMetricDetail] = useState<string | null>(null);

  const metrics = [
    {
      id: 'acc',
      label: 'Pixel Accuracy',
      value: `${BENCHMARK_MODEL.accuracy.toFixed(1)}%`,
      desc: 'Overall percentage of correctly classified pixels across all classes',
      formula: '(TP + TN) / (TP + TN + FP + FN)',
      vivaExplanation:
        'Accuracy measures how many total pixels out of 262,144 were assigned to their true land-cover category. While high, accuracy can be misleading with background class imbalance, so mIoU and F1 are also evaluated.',
    },
    {
      id: 'miou',
      label: 'Mean IoU (mIoU)',
      value: `${BENCHMARK_MODEL.mIoU.toFixed(1)}%`,
      desc: 'Average Intersection over Union across the 7 semantic land-cover classes',
      formula: 'IoU = TP / (TP + FP + FN)',
      vivaExplanation:
        'Mean IoU measures the spatial overlap between predicted regions and ground truth labels. It penalizes false positives and false negatives heavily, making it the primary benchmark metric for semantic segmentation.',
    },
    {
      id: 'f1',
      label: 'F1 Score',
      value: `${BENCHMARK_MODEL.f1Score.toFixed(1)}%`,
      desc: 'Harmonic mean of precision and recall for balanced segmentation assessment',
      formula: '2 × (Precision × Recall) / (Precision + Recall)',
      vivaExplanation:
        'The F1 score provides a balanced measure of the model performance when dealing with class imbalance (such as small playground or water areas vs large background regions).',
    },
    {
      id: 'precision',
      label: 'Precision',
      value: `${BENCHMARK_MODEL.precision.toFixed(1)}%`,
      desc: 'Proportion of positive pixel identifications that were actually correct',
      formula: 'TP / (TP + FP)',
      vivaExplanation:
        'Precision answers: "When the model predicts a pixel is Forest Canopy, how often is it truly Forest Canopy?" High precision means low false-positive rate.',
    },
    {
      id: 'recall',
      label: 'Recall',
      value: `${BENCHMARK_MODEL.recall.toFixed(1)}%`,
      desc: 'Proportion of actual ground truth pixels that were correctly identified',
      formula: 'TP / (TP + FN)',
      vivaExplanation:
        'Recall answers: "Out of all actual Ground Truth Bare Soil pixels in the scene, what percentage did the model successfully find?" High recall means low false-negative rate.',
    },
  ];

  return (
    <div id="model-evaluation-tab-content" className="space-y-5">
      {/* 1. Header: Model Evaluation on Unseen Test Data */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Model Evaluation &middot; Unseen Test Set
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Pre-trained Inference Weights Loaded
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Deep Learning Model Performance & Benchmark Metrics
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Evaluating the <strong>ResNet-50 + U-Net</strong> architecture on the held-out test split (15% unseen imagery) of the SECOND dataset. Demonstrates classification accuracy, class confusion, and IoU prior to multi-temporal change detection.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowArchDetails(!showArchDetails)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{showArchDetails ? 'Hide Architecture' : 'Model Architecture'}</span>
              {showArchDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Core Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {metrics.map((m) => (
            <div
              key={m.id}
              onClick={() => setActiveMetricDetail(activeMetricDetail === m.id ? null : m.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                activeMetricDetail === m.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">{m.label}</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-100 mt-1">
                {m.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Metric Explanation Detail Card */}
        {activeMetricDetail && (
          <div className="mt-4 p-4 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 text-sm">
                Viva Defense Explanation: {metrics.find((m) => m.id === activeMetricDetail)?.label}
              </span>
              <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                Formula: {metrics.find((m) => m.id === activeMetricDetail)?.formula}
              </span>
            </div>
            <p className="leading-relaxed">
              {metrics.find((m) => m.id === activeMetricDetail)?.vivaExplanation}
            </p>
          </div>
        )}

        {/* Architecture Details Dropdown */}
        {showArchDetails && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-3">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Deep Learning Architecture Specifications</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Backbone Encoder:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{BENCHMARK_MODEL.backbone}</p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Decoder Pipeline:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{BENCHMARK_MODEL.decoder}</p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Loss Function:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{BENCHMARK_MODEL.lossFunction}</p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Parameter Count:</span>
                <p className="font-semibold font-mono text-cyan-400 mt-0.5">{BENCHMARK_MODEL.parametersMillion} Million Params</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Confusion Matrix & Per-Class IoU Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 7x7 Confusion Matrix (Span 7) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>7×7 Normalized Confusion Matrix (%)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rows = Actual Ground Truth Class &middot; Columns = Predicted Class
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono">
              Unseen Test Set
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
                {CONFUSION_MATRIX.map((row) => (
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
                        bgClass = val > 85 ? 'bg-emerald-950/70 text-emerald-300 font-bold' : 'bg-emerald-950/40 text-emerald-400 font-semibold';
                      } else if (val > 5) {
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
              <span>How to explain this Confusion Matrix in Viva:</span>
            </div>
            <p>
              &bull; <strong>Diagonal cells (green):</strong> True Positives (e.g. 86.3% of Tree pixels were correctly predicted as Tree).
            </p>
            <p>
              &bull; <strong>Off-diagonal cells:</strong> Model confusions (e.g. 6.4% of Tree canopy was confused with Low Vegetation due to spectral similarity in NDVI range).
            </p>
          </div>
        </div>

        {/* Right: Per-Class IoU Breakdown & Class Definitions (Span 5) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Per-Class Intersection over Union (IoU)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean IoU across all 7 classes: <strong className="text-cyan-400 font-mono">82.4%</strong>
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {SECOND_CLASSES.map((cls) => (
              <div key={cls.id} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-slate-200">
                    <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: cls.colorHex }} />
                    <span>Class {cls.id}: {cls.displayName}</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-300 text-xs">
                    {cls.iou}% IoU
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cls.iou}%`, backgroundColor: cls.colorHex }}
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

      {/* 3. Metric Definitions Expandable Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Academic Evaluation Metrics Glossary (Viva Defense Guide)</span>
          </h3>
          <button
            onClick={() => setShowMetricDefinitions(!showMetricDefinitions)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <span>{showMetricDefinitions ? 'Collapse' : 'Expand'}</span>
            {showMetricDefinitions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showMetricDefinitions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-200">1. Intersection over Union (IoU) / Jaccard Index</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Calculated as Area of Overlap / Area of Union between the ground truth and predicted mask for a given class. Unlike accuracy, IoU penalizes both missed pixels (false negatives) and over-predicted pixels (false positives).
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-200">2. Mean IoU (mIoU)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The arithmetic average of the IoU scores across all 7 classes. A mIoU of 82.4% indicates superior boundary alignment and semantic segment consistency across both abundant and sparse classes.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-200">3. Combined Cross-Entropy + Dice Loss</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The network was trained using a weighted loss combining Categorical Cross-Entropy (optimizing per-pixel classification probability) and Dice Loss (directly maximizing spatial mask overlap to combat class imbalance).
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-200">4. Separation of Classification & Change Detection</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The deep learning model strictly performs multi-class semantic segmentation on each temporal image independently ($T_1$ and $T_2$). Change detection is executed post-inference via Post-Classification Comparison (PCC).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
