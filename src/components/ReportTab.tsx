import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Database,
  Cpu,
  GitCompare,
  BarChart3,
  Sparkles,
  CheckCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ScenarioDataset, UserAnalysisResult } from '../types';
import { SECOND_CLASSES, BENCHMARK_MODEL } from '../data/scenarios';
import { calculateSceneStatistics, generateAcademicEnvironmentalInsights } from '../utils/geoAnalysis';
import { generateModelEvaluationPdf, generateTemporalChangePdf } from '../utils/pdfGenerator';

interface ReportTabProps {
  currentScenario: ScenarioDataset;
  unit: 'ha' | 'km2';
  userResult?: UserAnalysisResult | null;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  currentScenario,
  unit,
  userResult,
}) => {
  const [reportType, setReportType] = useState<'scene' | 'model' | 'user'>(
    userResult ? 'user' : 'scene'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const stats = calculateSceneStatistics(currentScenario);
  const observations = generateAcademicEnvironmentalInsights(currentScenario);
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      if (reportType === 'model') {
        await generateModelEvaluationPdf();
        setPdfSuccessMessage('GeoEcoAI_Model_Evaluation_Report.pdf generated successfully.');
      } else if (reportType === 'user' && userResult) {
        await generateTemporalChangePdf({
          title: 'User Temporal Analysis',
          isUserUpload: true,
          t1DateOrDesc: userResult.t1Image.name,
          t2DateOrDesc: userResult.t2Image.name,
          resolution: '512×512 Grid (1.0 m GSD)',
          totalPixels: userResult.totalPixels,
          unchangedPct: userResult.unchangedPercentage,
          changedPct: userResult.changedPercentage,
          classWiseRows: userResult.classWiseStats.map((s) => ({
            className: s.className,
            t1Val: `${s.t1Percentage.toFixed(1)}% (${s.t1Pixels.toLocaleString()} px)`,
            t2Val: `${s.t2Percentage.toFixed(1)}% (${s.t2Pixels.toLocaleString()} px)`,
            diffVal: `${s.diffPercentage > 0 ? '+' : ''}${s.diffPercentage.toFixed(1)}%`,
            pctShift: `${s.diffPixels > 0 ? '+' : ''}${s.diffPixels.toLocaleString()} px`,
          })),
          transitions: userResult.transitions.map((t) => ({
            fromName: t.fromName,
            toName: t.toName,
            metric: `${t.pixelCount.toLocaleString()} px`,
            pct: `${t.percentageOfChange.toFixed(1)}%`,
          })),
          observations: userResult.observations.map((o) => ({
            title: o.title,
            metric: o.metric,
            observation: o.observation,
            academicImplication: o.academicImplication,
          })),
          t1ImageBase64: userResult.t1Image.dataUrl,
          t2ImageBase64: userResult.t2Image.dataUrl,
          t1PredBase64: userResult.t1PredDataUrl,
          t2PredBase64: userResult.t2PredDataUrl,
          changeMapBase64: userResult.changeMapDataUrl,
        });
        setPdfSuccessMessage('GeoEcoAI_User_Temporal_Analysis_Report.pdf generated successfully.');
      } else {
        // Benchmark Scenario Report
        await generateTemporalChangePdf({
          title: currentScenario.title,
          sceneCode: currentScenario.sceneCode,
          isUserUpload: false,
          t1DateOrDesc: currentScenario.temporalBaseline,
          t2DateOrDesc: currentScenario.temporalTarget,
          resolution: currentScenario.gsd,
          totalPixels: currentScenario.totalPixels,
          totalAreaHa: stats.totalAreaHa,
          unit,
          unchangedPct: stats.stabilityIndexPct,
          changedPct: (stats.totalChangedAreaHa / stats.totalAreaHa) * 100,
          classWiseRows: stats.rows.map((r) => ({
            className: r.className,
            t1Val: `${r.t1AreaHa.toFixed(2)} ${unit}`,
            t2Val: `${r.t2AreaHa.toFixed(2)} ${unit}`,
            diffVal: `${r.diffHa > 0 ? `+${r.diffHa.toFixed(2)}` : r.diffHa.toFixed(2)} ${unit}`,
            pctShift: `${r.pctChange > 0 ? `+${r.pctChange.toFixed(1)}` : r.pctChange.toFixed(1)}%`,
          })),
          transitions: (currentScenario.transitions || []).map((t) => {
            const f = SECOND_CLASSES.find((c) => c.id === t.fromId);
            const to = SECOND_CLASSES.find((c) => c.id === t.toId);
            return {
              fromName: f?.displayName || 'Class',
              toName: to?.displayName || 'Class',
              metric: `${t.areaHa.toFixed(2)} ${unit}`,
              pct: `${t.percentage.toFixed(1)}%`,
            };
          }),
          observations: observations.map((o) => ({
            title: o.title,
            metric: o.metric,
            observation: o.observation,
            academicImplication: o.academicImplication,
          })),
        });
        setPdfSuccessMessage(`GeoEcoAI_Temporal_Analysis_${currentScenario.sceneCode}.pdf generated successfully.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to compile PDF report.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# GeoEcoAI: Deep Learning-Based Multi-Temporal Remote Sensing Analysis
**Final-Year Academic Engineering Project Dossier**
**Date:** ${reportDate}
**Scene:** ${currentScenario.sceneCode} (${currentScenario.title})
**Temporal Baseline (T1):** ${currentScenario.temporalBaseline}
**Temporal Target (T2):** ${currentScenario.temporalTarget}

---

## 1. Project Objective
To design and evaluate a multi-temporal remote sensing pipeline utilizing deep learning semantic segmentation (ResNet-50 + U-Net) and Post-Classification Comparison (PCC) for high-resolution land-cover classification and quantitative change detection.

## 2. Dataset Specifications
- **Dataset:** Semantic Change Detection Dataset (SECOND) - Yang et al. (IEEE TGRS 2021)
- **Image Dimensions:** 512 × 512 pixels (262,144 pixels total)
- **Spatial Resolution (GSD):** ${currentScenario.gsd}
- **Sensor:** ${currentScenario.sensor}
- **Number of Classes:** 7 Official Classes (Unchanged, Water, Bare Ground, Low Vegetation, Tree Canopy, Built-Up, Playground)

## 3. Preprocessing & Methodology
- Image resizing to standardized 512 × 512 × 3 tensor.
- Channel-wise normalization using ImageNet statistics (Mean: [0.485, 0.456, 0.406], Std: [0.229, 0.224, 0.225]).
- Batch formatting for GPU accelerated neural inference.

## 4. Model Architecture & Benchmark Performance
- **Architecture:** U-Net with ResNet-50 Feature Extractor
- **Backbone:** ResNet-50 (Pretrained on ImageNet)
- **Decoder:** 5-Stage U-Net with Skip Connections and Bilinear Upsampling
- **Loss Function:** Composite Categorical Cross-Entropy + Dice Loss
- **Validation mIoU:** ${BENCHMARK_MODEL.mIoU}%
- **F1 / Dice Score:** ${BENCHMARK_MODEL.f1Score}%
- **Pixel Accuracy:** ${BENCHMARK_MODEL.accuracy}%

## 5. Post-Classification Comparison (PCC) Change Detection
- **Methodology:** Direct pixel-by-pixel matrix comparison of classified maps M_T1(x, y) and M_T2(x, y).
- **Total Surveyed Area:** ${stats.totalAreaHa.toFixed(2)} ${unit}
- **Total Converted Area:** ${stats.totalChangedAreaHa.toFixed(2)} ${unit} (${((stats.totalChangedAreaHa / stats.totalAreaHa) * 100).toFixed(1)}% of total scene)
- **Landscape Stability Index:** ${stats.stabilityIndexPct.toFixed(1)}% Invariant

## 6. Quantitative Land-Cover Accounting Table
| Semantic Class | T1 Area (${unit}) | T2 Area (${unit}) | Net Change (${unit}) | Relative Shift (%) |
|---|---|---|---|---|
${stats.rows.map((r) => `| ${r.className} | ${r.t1AreaHa.toFixed(2)} | ${r.t2AreaHa.toFixed(2)} | ${r.diffHa > 0 ? `+${r.diffHa.toFixed(2)}` : r.diffHa.toFixed(2)} | ${r.pctChange > 0 ? `+${r.pctChange.toFixed(1)}%` : `${r.pctChange.toFixed(1)}%`} |`).join('\n')}

## 7. Calculated Land-Cover Transitions
${currentScenario.transitions && currentScenario.transitions.length > 0 ? currentScenario.transitions.map((t) => {
  const f = SECOND_CLASSES.find((c) => c.id === t.fromId);
  const to = SECOND_CLASSES.find((c) => c.id === t.toId);
  return `- **${f?.displayName} ➔ ${to?.displayName}:** ${t.areaHa.toFixed(2)} ${unit} (${t.percentage.toFixed(1)}% of changed area)`;
}).join('\n') : '- No transitions detected.'}

## 8. Environmental Observations
${observations.map((o) => `### ${o.title} (${o.metric})
- **Observation:** ${o.observation}
- **Academic Implication:** ${o.academicImplication}
`).join('\n')}

## 9. Conclusion
The deep learning-based multi-temporal framework successfully identified and quantified spatial land-cover transitions between the two observation intervals. The combination of a ResNet-50 feature extractor and U-Net decoder with Post-Classification Comparison provides a verifiable, explainable methodology for remote sensing change detection.
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeoEcoAI_Academic_Dossier_${currentScenario.sceneCode}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="report-tab-content" className="space-y-5">
      {/* 1. Report Selector & Export Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Academic Project Report & Viva Dossier</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compile and download full vector PDF reports with actual embedded maps, matrices, and observations
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="download-markdown-btn"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .MD Dossier</span>
            </button>

            <button
              id="generate-pdf-btn"
              disabled={isGeneratingPdf}
              onClick={handleGeneratePdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Generate & Download PDF</span>
                </>
              )}
            </button>

            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Report Dossier Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium mr-1">Report Target:</span>
          <button
            onClick={() => setReportType('scene')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              reportType === 'scene'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Scene {currentScenario.sceneCode} Change Report
          </button>
          <button
            onClick={() => setReportType('model')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              reportType === 'model'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ResNet-50 + U-Net Evaluation Report
          </button>
          {userResult && (
            <button
              onClick={() => setReportType('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                reportType === 'user'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-amber-300 hover:text-white border border-amber-900/60'
              }`}
            >
              User Temporal Analysis Report
            </button>
          )}
        </div>

        {pdfSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✓ {pdfSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Structured Academic Paper Layout */}
      <div
        id="printable-academic-dossier"
        className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 text-slate-200 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none"
      >
        {/* Header Document Metadata */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cyan-400 print:text-blue-700">
            <span>GeoEcoAI &middot; Academic Research Dossier</span>
            <span>Date of Generation: {reportDate}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white print:text-black mt-2">
            Deep Learning-Based Multi-Temporal Remote Sensing Analysis & Post-Classification Change Detection
          </h1>
          <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
            <strong>Study Target:</strong> {reportType === 'user' && userResult ? `User Image Inference (${userResult.t1Image.name} vs ${userResult.t2Image.name})` : `${currentScenario.sceneCode} (${currentScenario.title})`} &middot; <strong>Interval:</strong> {currentScenario.temporalBaseline} to {currentScenario.temporalTarget}
          </p>
        </div>

        {/* Section 1: Objective */}
        <section className="space-y-2 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            1. Project Objective
          </h2>
          <p className="text-slate-300 print:text-gray-800">
            This project investigates the application of deep convolutional neural networks for semantic segmentation and post-classification change detection on high-resolution multi-temporal aerial and satellite imagery. The goal is to establish a rigorous, explainable pipeline that inputs bi-temporal optical images, generates accurate 7-class semantic segmentation maps, and derives pixel-level quantitative land-cover transition statistics.
          </p>
        </section>

        {/* Section 2: Dataset Specifications */}
        <section className="space-y-2 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            2. Dataset & Input Specifications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] bg-slate-950/70 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300">
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Dataset / Mode:</span>
              <strong className="text-slate-200 print:text-black">
                {reportType === 'user' ? 'User Image Inference' : 'SECOND Dataset (Yang et al., 2021)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Grid Dimensions:</span>
              <strong className="text-slate-200 print:text-black">512 × 512 px (262,144 px)</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Spatial Resolution:</span>
              <strong className="text-slate-200 print:text-black">{currentScenario.gsd}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Semantic Classes:</span>
              <strong className="text-slate-200 print:text-black">7 Categories</strong>
            </div>
          </div>
        </section>

        {/* Section 3: Methodology & Model Architecture */}
        <section className="space-y-2 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            3. Methodology & Model Architecture
          </h2>
          <p className="text-slate-300 print:text-gray-800">
            The semantic segmentation module employs a <strong>ResNet-50 + U-Net</strong> architecture. A pretrained ResNet-50 backbone extracts hierarchical multi-scale feature maps from 512 × 512 × 3 optical inputs. A 5-stage U-Net decoder with skip connections reconstructs high-resolution spatial feature representations to generate pixel-level classification maps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] bg-slate-950/70 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300">
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Mean IoU (mIoU):</span>
              <strong className="text-emerald-400 print:text-green-700">{BENCHMARK_MODEL.mIoU}%</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block">F1 / Dice Score:</span>
              <strong className="text-emerald-400 print:text-green-700">{BENCHMARK_MODEL.f1Score}%</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block">Overall Pixel Accuracy:</span>
              <strong className="text-emerald-400 print:text-green-700">{BENCHMARK_MODEL.accuracy}%</strong>
            </div>
          </div>
        </section>

        {/* Section 4: Quantitative Change Detection (PCC) */}
        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            4. Post-Classification Comparison (PCC) Results
          </h2>
          <p className="text-slate-300 print:text-gray-800">
            Post-Classification Comparison was performed by comparing discrete class indices between M_T1(x, y) and M_T2(x, y). Total surveyed scene area is <strong>{stats.totalAreaHa.toFixed(2)} {unit}</strong>, of which <strong>{stats.totalChangedAreaHa.toFixed(2)} {unit}</strong> underwent transition, yielding a landscape stability index of <strong>{stats.stabilityIndexPct.toFixed(1)}%</strong> invariant baseline.
          </p>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-800 print:border-gray-300">
              <thead className="bg-slate-950 print:bg-gray-200">
                <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700">
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3 text-right">T1 Area ({unit})</th>
                  <th className="py-2 px-3 text-right">T2 Area ({unit})</th>
                  <th className="py-2 px-3 text-right">Net Change ({unit})</th>
                  <th className="py-2 px-3 text-right">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200 font-mono text-[11px]">
                {stats.rows.map((row) => (
                  <tr key={row.classId} className="print:text-black">
                    <td className="py-2 px-3 font-sans font-medium text-slate-200 print:text-black">
                      {row.className}
                    </td>
                    <td className="py-2 px-3 text-right">{row.t1AreaHa.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">{row.t2AreaHa.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold">
                      {row.diffHa > 0 ? `+${row.diffHa.toFixed(2)}` : row.diffHa.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.pctChange > 0 ? `+${row.pctChange.toFixed(1)}%` : `${row.pctChange.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Environmental Observations */}
        <section className="space-y-3 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            5. Evidence-Based Environmental Observations & Insights
          </h2>
          <div className="space-y-2">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="p-3 bg-slate-950/70 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 space-y-1"
              >
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200 print:text-black">{obs.title}</span>
                  <span className="font-mono text-cyan-400 print:text-blue-700">{obs.metric}</span>
                </div>
                <p className="text-slate-300 print:text-gray-700">
                  <strong>Observation:</strong> {obs.observation}
                </p>
                <p className="text-slate-400 print:text-gray-600 text-[11px] italic">
                  <strong>Academic Implication:</strong> {obs.academicImplication}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Conclusion */}
        <section className="space-y-2 text-xs leading-relaxed border-t border-slate-800 pt-4">
          <h2 className="text-sm font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wide">
            6. Conclusion & Discussion
          </h2>
          <p className="text-slate-300 print:text-gray-800">
            The experimental evaluation verifies that the ResNet-50 + U-Net deep learning model provides consistent semantic land-cover segmentation on the SECOND benchmark dataset. Post-Classification Comparison allows transparent pixel-level accounting of both spatial extent and trajectory directions of land-cover conversions.
          </p>
        </section>
      </div>
    </div>
  );
};
