import React from 'react';
import {
  Layers,
  Cpu,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  Database,
  CalendarRange,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
  PieChart,
  Network,
  Binary,
  UploadCloud,
} from 'lucide-react';
import { TabType, ScenarioDataset } from '../types';
import { BENCHMARK_MODEL } from '../data/scenarios';
import { calculateSceneStatistics } from '../utils/geoAnalysis';

interface DashboardTabProps {
  currentScenario: ScenarioDataset;
  onNavigateTab: (tab: TabType) => void;
  onRunAnalysis: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentScenario,
  onNavigateTab,
  onRunAnalysis,
}) => {
  const stats = calculateSceneStatistics(currentScenario);

  const pipelineSteps = [
    {
      step: 1,
      title: 'Dataset Pair Selection',
      desc: 'Load calibrated 512×512 bi-temporal optical image pair (T1 earlier and T2 later).',
      tab: 'dataset' as TabType,
    },
    {
      step: 2,
      title: 'Image Preprocessing',
      desc: 'Normalize input pixel intensities using standard ImageNet mean and variance.',
      tab: 'dataset' as TabType,
    },
    {
      step: 3,
      title: 'Feature Extraction',
      desc: 'Deep multi-scale visual features extracted via pre-trained ResNet-50 encoder.',
      tab: 'model-evaluation' as TabType,
    },
    {
      step: 4,
      title: 'Semantic Segmentation',
      desc: '5-Stage U-Net decoder reconstructs spatial resolution with skip connections.',
      tab: 'model-evaluation' as TabType,
    },
    {
      step: 5,
      title: 'Multi-Temporal Classification',
      desc: 'Generates discrete 7-class land-cover classification maps for both T1 and T2.',
      tab: 'temporal-analysis' as TabType,
    },
    {
      step: 6,
      title: 'Post-Classification Comparison (PCC)',
      desc: 'Pixel-wise comparison identifies invariant locations vs converted land categories.',
      tab: 'change-detection' as TabType,
    },
    {
      step: 7,
      title: 'Binary & Trajectory Change Mapping',
      desc: 'Synthesizes high-resolution binary change mask and transition trajectory maps.',
      tab: 'change-detection' as TabType,
    },
    {
      step: 8,
      title: 'Quantitative Spatial Accounting',
      desc: 'Calculates net area shifts (ha/km²), class distributions, and confusion matrices.',
      tab: 'statistics' as TabType,
    },
  ];

  return (
    <div id="dashboard-tab-content" className="space-y-5">
      {/* 1. Project Objective & Viva Executive Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                Final-Year Engineering Project
              </span>
              <span className="text-xs text-slate-400 font-mono">
                B.Tech / B.E. Capstone Defense
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Deep Learning-Based Multi-Temporal Remote Sensing Analysis
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              This academic project demonstrates an end-to-end deep learning pipeline for automated semantic land-cover classification and multi-temporal change detection using bi-temporal optical aerial imagery from the benchmark SECOND dataset or optional user-uploaded image pairs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="dashboard-start-analysis-btn"
              onClick={() => onNavigateTab('temporal-analysis')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition active:scale-95 cursor-pointer"
            >
              <CalendarRange className="w-4 h-4 text-cyan-200" />
              <span>Benchmark Temporal Analysis</span>
            </button>

            <button
              id="dashboard-user-upload-btn"
              onClick={() => onNavigateTab('user-analysis')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>User Temporal Analysis</span>
            </button>
          </div>
        </div>

        {/* Academic Comparison: Model Evaluation vs User Temporal Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card A: Model Evaluation */}
          <div
            onClick={() => onNavigateTab('model-evaluation')}
            className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                MODEL EVALUATION
              </span>
              <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                View Evaluation &rarr;
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Dataset:</span>
                <strong className="text-white">SECOND Benchmark (Yang et al., 2021)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Data Split:</span>
                <strong className="text-emerald-400">Held-out Test Set (15% Unseen)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Ground Truth:</span>
                <strong className="text-emerald-400">Available (7 Classes)</strong>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Reported Metrics:</span>
                <strong className="text-cyan-300">Accuracy (94.2%), mIoU (82.4%), F1, Confusion Matrix</strong>
              </div>
            </div>
          </div>

          {/* Card B: User Temporal Analysis */}
          <div
            onClick={() => onNavigateTab('user-analysis')}
            className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4" />
                USER TEMPORAL ANALYSIS
              </span>
              <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                Upload Images &rarr;
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Data Source:</span>
                <strong className="text-white">User-Provided T1 (Earlier) + T2 (Later)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Ground Truth:</span>
                <strong className="text-slate-400 italic">Normally Unavailable (Predictions Only)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1">
                <span className="text-slate-400">Model Mode:</span>
                <strong className="text-amber-300">Inference Only (No Retraining)</strong>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Analysis Outputs:</span>
                <strong className="text-cyan-300">T1/T2 Predictions, PCC Change Map, Transitions, Observations</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Current Analysis Summary Box */}
        <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Active Benchmark Configuration Summary</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Ready for Viva Demonstration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Dataset:</span>
              <strong className="text-slate-100 mt-0.5 block">SECOND Benchmark</strong>
              <span className="text-[10px] text-slate-400">Yang et al. (IEEE TGRS)</span>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Data Split:</span>
              <strong className="text-emerald-400 mt-0.5 block">Test Set (15% Unseen)</strong>
              <span className="text-[10px] text-slate-400">Generalization Evaluation</span>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Temporal Pair:</span>
              <strong className="text-amber-400 mt-0.5 block">{currentScenario.temporalBaseline} &rarr; {currentScenario.temporalTarget}</strong>
              <span className="text-[10px] text-slate-400">T1 (Earlier) vs T2 (Later)</span>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Classification Model:</span>
              <strong className="text-slate-100 mt-0.5 block">ResNet-50 + U-Net</strong>
              <span className="text-[10px] text-cyan-400">mIoU: 82.4% &middot; Acc: 94.2%</span>
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Change Detection:</span>
              <strong className="text-slate-100 mt-0.5 block">Post-Classification (PCC)</strong>
              <span className="text-[10px] text-slate-400">Pixel-by-Pixel Comparison</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. How This Analysis Works (8-Step Academic Pipeline) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>How This Analysis Works (8-Step Methodological Pipeline)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The standardized engineering workflow from raw aerial imagery to pixel-wise change matrix
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineSteps.map((step) => (
            <div
              key={step.step}
              onClick={() => onNavigateTab(step.tab)}
              className="p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    {step.step}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition" />
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <span className="text-[10px] text-cyan-500 font-mono mt-3 block">
                Inspect in &rarr; {step.tab}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Direct Links to All 7 Academic Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <button
          onClick={() => onNavigateTab('dataset')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <Database className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">1. Dataset</span>
          <span className="text-[10px] text-slate-400 mt-0.5">SECOND Pairs</span>
        </button>

        <button
          onClick={() => onNavigateTab('model-evaluation')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">2. Evaluation</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Acc: 94.2%</span>
        </button>

        <button
          onClick={() => onNavigateTab('temporal-analysis')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <CalendarRange className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">3. Temporal</span>
          <span className="text-[10px] text-slate-400 mt-0.5">T1 vs T2</span>
        </button>

        <button
          onClick={() => onNavigateTab('user-analysis')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <UploadCloud className="w-5 h-5 text-cyan-300 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">4. User Upload</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Inference Only</span>
        </button>

        <button
          onClick={() => onNavigateTab('change-detection')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <GitCompare className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">5. Change</span>
          <span className="text-[10px] text-slate-400 mt-0.5">PCC Matrices</span>
        </button>

        <button
          onClick={() => onNavigateTab('statistics')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <BarChart3 className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">6. Statistics</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Area Shifts</span>
        </button>

        <button
          onClick={() => onNavigateTab('report')}
          className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col items-center text-center transition cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold text-slate-200">7. Report</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Viva PDF Dossier</span>
        </button>
      </div>
    </div>
  );
};
