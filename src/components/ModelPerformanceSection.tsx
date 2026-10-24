import React from 'react';
import {
  CheckCircle2,
  Download,
  AlertCircle,
  HelpCircle,
  Table as TableIcon,
} from 'lucide-react';
import { SampleEvaluationResult } from '../types';
import { SECOND_CLASSES } from '../data/scenarios';

interface ModelPerformanceSectionProps {
  evaluation: SampleEvaluationResult;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  pdfDownloaded?: boolean;
  sampleSubtitle?: string;
  id?: string;
}

export const ModelPerformanceSection: React.FC<ModelPerformanceSectionProps> = ({
  evaluation,
  onExportPdf,
  isExportingPdf = false,
  pdfDownloaded = false,
  sampleSubtitle,
  id = 'model-performance-section',
}) => {
  const isFallback = evaluation.isSampleReferenceFallback;

  return (
    <div
      id={id}
      className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-5"
    >
      {/* 1. Header & Source Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                isFallback
                  ? 'text-amber-400 bg-amber-950/70 border border-amber-800/60'
                  : 'text-cyan-400 bg-cyan-950/70 border border-cyan-800/60'
              }`}
            >
              {isFallback ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              {evaluation.sourceLabel || (isFallback ? 'Sample/Reference Evaluation Values' : 'Ground-Truth Verified')}
            </span>
            <span className="text-xs text-slate-300 font-mono font-medium">
              {evaluation.sceneCode || sampleSubtitle || 'SECOND Test Dataset'}
            </span>
          </div>

          <h3 className="text-base md:text-lg font-bold text-white mt-1.5">
            Model Performance & Evaluation Metrics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
            {isFallback
              ? 'Trained ResNet-50 + U-Net benchmark performance on held-out test split (444 unseen pairs) of the SECOND dataset. Used as verified reference values for model evaluation.'
              : `Calculated dynamically by comparing the ResNet-50 + U-Net model's predicted semantic segmentation and PCC change map against the corresponding ground-truth reference mask for ${evaluation.sceneCode || 'this test sample'}.`}
          </p>
        </div>

        {onExportPdf && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="export-model-performance-pdf-btn"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExportingPdf ? 'Building PDF...' : pdfDownloaded ? 'Report Downloaded!' : 'Export PDF Report'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Structured Model Performance Table: Metric | Value */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Evaluation Metrics Summary
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {evaluation.totalEvaluatedPixels.toLocaleString()} Pixels Evaluated
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Metric</th>
                <th className="py-2.5 px-4 font-mono">Value</th>
                <th className="py-2.5 px-4 text-slate-400">Calculation Method / Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Accuracy
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-cyan-400 text-sm">
                  {evaluation.pixelAccuracy.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  Overall pixel-based correct rate across surveyed grid
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Precision
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-400 text-sm">
                  {evaluation.macroPrecision.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  Macro-averaged precision across all 7 semantic land-cover classes
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Recall
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                  {evaluation.macroRecall.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  Macro-averaged true positive recall across semantic classes
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  F1-Score
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-purple-400 text-sm">
                  {evaluation.macroF1.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  Harmonic mean of Precision and Recall across classes
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  IoU
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-rose-400 text-sm">
                  {evaluation.macroIoU.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  Mean Intersection over Union (mIoU) across all active classes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Metric Stat Cards Display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Accuracy */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Accuracy (%)</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
              Overall
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {evaluation.pixelAccuracy.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            Overall pixel-based correct rate
          </p>
        </div>

        {/* Card 2: Precision */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Precision (%)</span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
              Macro Avg
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {evaluation.macroPrecision.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            Macro average across classes
          </p>
        </div>

        {/* Card 3: Recall */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Recall (%)</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              Macro Avg
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {evaluation.macroRecall.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            Macro average detection sensitivity
          </p>
        </div>

        {/* Card 4: F1-Score */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">F1-Score (%)</span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded">
              Harmonic
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {evaluation.macroF1.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            Balanced precision-recall score
          </p>
        </div>

        {/* Card 5: IoU */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">IoU (%)</span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
              Mean IoU
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {evaluation.macroIoU.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            Mean Intersection-over-Union (mIoU)
          </p>
        </div>
      </div>

      {/* 4. CONFUSION MATRIX (Ground Truth Rows vs Predicted Columns) */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Confusion Matrix (Ground Truth Rows vs Predicted Columns)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Values show Normalized % (Pixel Count)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
          <div className="min-w-[620px]">
            {/* Header Row: Predicted Classes */}
            <div className="grid grid-cols-8 gap-1 text-[11px] font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
              <div className="py-1 px-1.5 text-slate-400 text-[10px] font-mono">
                GT \ Pred
              </div>
              {SECOND_CLASSES.map((cls) => (
                <div
                  key={cls.id}
                  className="py-1 px-1 text-center font-mono truncate"
                  title={`Predicted ${cls.displayName}`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: cls.colorHex }}
                  ></span>
                  C{cls.id}: {cls.displayName.split('/')[0].slice(0, 5)}
                </div>
              ))}
            </div>

            {/* Matrix Data Rows */}
            {SECOND_CLASSES.map((rowClass, rIdx) => {
              return (
                <div
                  key={rowClass.id}
                  className="grid grid-cols-8 gap-1 py-1 border-b border-slate-900/80 items-center text-xs"
                >
                  {/* Row Label (Ground Truth Class) */}
                  <div
                    className="py-1 px-1.5 text-slate-300 font-medium truncate text-[11px]"
                    title={`Ground Truth: ${rowClass.displayName}`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: rowClass.colorHex }}
                    ></span>
                    C{rowClass.id}: {rowClass.displayName.split('/')[0].slice(0, 10)}
                  </div>

                  {/* Columns (Predicted Classes) */}
                  {SECOND_CLASSES.map((colClass, cIdx) => {
                    const count = evaluation.confusionMatrix[rIdx]?.[cIdx] || 0;
                    const pct = evaluation.confusionMatrixNormalized[rIdx]?.[cIdx] || 0;
                    const isDiagonal = rIdx === cIdx;

                    return (
                      <div
                        key={colClass.id}
                        className={`py-1.5 px-1 rounded text-center font-mono text-[10px] transition ${
                          isDiagonal
                            ? 'bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-bold'
                            : count > 0
                            ? 'bg-slate-900/60 text-amber-300/80'
                            : 'text-slate-600'
                        }`}
                        title={`Actual: ${rowClass.displayName} | Pred: ${colClass.displayName} | Count: ${count.toLocaleString()} px (${pct.toFixed(1)}%)`}
                      >
                        <div className="font-semibold">{pct.toFixed(0)}%</div>
                        <div className="text-[9px] opacity-70">
                          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-400 px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-950/80 border border-emerald-600/50"></span>
            <span>Diagonal: Correct Semantic Classifications</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-700"></span>
            <span>Off-Diagonal: Inter-Class Boundary / Spectral Confusions</span>
          </div>
        </div>
      </div>

      {/* 5. Class-Wise Metrics Table */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Per-Class Segmentation Performance Breakdown
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Land-Cover Class</th>
                <th className="py-2.5 px-3 font-mono">GT Pixels</th>
                <th className="py-2.5 px-3 font-mono">Pred Pixels</th>
                <th className="py-2.5 px-3 font-mono">Precision (%)</th>
                <th className="py-2.5 px-3 font-mono">Recall (%)</th>
                <th className="py-2.5 px-3 font-mono">F1-Score (%)</th>
                <th className="py-2.5 px-3 font-mono">IoU (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {evaluation.classMetrics.map((cm) => (
                <tr key={cm.classId} className="hover:bg-slate-900/40 transition">
                  <td className="py-2 px-3 font-medium text-slate-200 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cm.colorHex }}
                    ></span>
                    <span>C{cm.classId}: {cm.className}</span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-300">
                    {cm.pixelCountGT.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-300">
                    {cm.pixelCountPred.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-amber-400 font-semibold">
                    {cm.precision.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-emerald-400 font-semibold">
                    {cm.recall.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-purple-400 font-semibold">
                    {cm.f1Score.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-rose-400 font-bold">
                    {cm.iou.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Binary Change Detection Metrics Strip */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="font-semibold text-slate-200">
            Post-Classification Comparison (PCC) Binary Change Detection:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="text-slate-300">
            Accuracy: <strong className="text-white">{evaluation.changeMetrics.accuracy.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            Precision: <strong className="text-amber-400">{evaluation.changeMetrics.precision.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            Recall: <strong className="text-emerald-400">{evaluation.changeMetrics.recall.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            F1: <strong className="text-purple-400">{evaluation.changeMetrics.f1Score.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            IoU: <strong className="text-rose-400">{evaluation.changeMetrics.iou.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* 7. Interpretation & Guidance */}
      <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-300 mr-1.5">Evaluation Interpretation:</span>
          {evaluation.interpretation}
        </div>
      </div>
    </div>
  );
};
