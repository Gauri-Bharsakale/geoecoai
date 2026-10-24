import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarRange,
  Layers,
  Sparkles,
  Crosshair,
  ArrowRight,
  Clock,
  Eye,
  CheckCircle2,
  FileText,
  Download,
  Table,
  BarChart2,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import { ScenarioDataset, LandCoverClass, TabType, SampleEvaluationResult } from '../types';
import { SECOND_CLASSES, SCENARIOS } from '../data/scenarios';
import {
  getScenarioPixelData,
  fetchOrCalculateEvaluationMetrics,
  generateScenarioBase64Maps,
} from '../utils/evaluationMetrics';
import { generateTemporalChangePdf } from '../utils/pdfGenerator';
import { calculateSceneStatistics, generateAcademicEnvironmentalInsights } from '../utils/geoAnalysis';
import { ModelPerformanceSection } from './ModelPerformanceSection';
import { ConfidenceAwarePccSection } from './ConfidenceAwarePccSection';
import { DEFAULT_CONFIDENCE_THRESHOLD, computeConfidenceAwarePcc } from '../utils/confidenceAwarePcc';

interface TemporalAnalysisTabProps {
  currentScenario: ScenarioDataset;
  onSelectScenario: (scenario: ScenarioDataset) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const TemporalAnalysisTab: React.FC<TemporalAnalysisTabProps> = ({
  currentScenario,
  onSelectScenario,
  onNavigateTab,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<SampleEvaluationResult | null>(null);
  const [scenarioBase64Maps, setScenarioBase64Maps] = useState<any>(null);
  const [scenarioThreshold, setScenarioThreshold] = useState<number>(DEFAULT_CONFIDENCE_THRESHOLD);
  const [activeMetricSubView, setActiveMetricSubView] = useState<'matrix' | 'classes' | 'change'>('matrix');
  const [matrixMode, setMatrixMode] = useState<'pct' | 'count'>('pct');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Inspector state
  const [hoverPixel, setHoverPixel] = useState<{
    x: number;
    y: number;
    targetTime: 'T1' | 'T2';
    gtClass: LandCoverClass;
    predClass: LandCoverClass;
    confidence: number;
  } | null>(null);

  // Canvas refs for T1 (Earlier)
  const canvasT1InRef = useRef<HTMLCanvasElement | null>(null);
  const canvasT1GtRef = useRef<HTMLCanvasElement | null>(null);
  const canvasT1PredRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas refs for T2 (Later)
  const canvasT2InRef = useRef<HTMLCanvasElement | null>(null);
  const canvasT2GtRef = useRef<HTMLCanvasElement | null>(null);
  const canvasT2PredRef = useRef<HTMLCanvasElement | null>(null);

  // Draw scene canvas tiles
  const drawCanvases = () => {
    const renderTriplet = (
      time: 't1' | 't2',
      inCanvas: HTMLCanvasElement | null,
      gtCanvas: HTMLCanvasElement | null,
      predCanvas: HTMLCanvasElement | null
    ) => {
      if (!inCanvas || !gtCanvas || !predCanvas) return;
      const ctxIn = inCanvas.getContext('2d');
      const ctxGt = gtCanvas.getContext('2d');
      const ctxPred = predCanvas.getContext('2d');
      if (!ctxIn || !ctxGt || !ctxPred) return;

      const width = inCanvas.width;
      const height = inCanvas.height;

      const imgIn = ctxIn.createImageData(width, height);
      const imgGt = ctxGt.createImageData(width, height);
      const imgPred = ctxPred.createImageData(width, height);

      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const index = (y * width + x) * 4;

          const pixelData = getScenarioPixelData(currentScenario.id, u, v, time);
          const gtCls = SECOND_CLASSES.find((c) => c.id === pixelData.gtClassId) || SECOND_CLASSES[3];
          const predCls = SECOND_CLASSES.find((c) => c.id === pixelData.predClassId) || SECOND_CLASSES[3];

          const grain = ((Math.sin(u * 120) * Math.cos(v * 120) + 1) * 0.5) * 18;

          // Input Optical Simulation
          imgIn.data[index] = Math.min(255, Math.max(0, predCls.colorRgb[0] * 0.75 + 40 + grain));
          imgIn.data[index + 1] = Math.min(255, Math.max(0, predCls.colorRgb[1] * 0.75 + 45 + grain));
          imgIn.data[index + 2] = Math.min(255, Math.max(0, predCls.colorRgb[2] * 0.75 + 50 + grain));
          imgIn.data[index + 3] = 255;

          // Ground Truth Mask
          imgGt.data[index] = gtCls.colorRgb[0];
          imgGt.data[index + 1] = gtCls.colorRgb[1];
          imgGt.data[index + 2] = gtCls.colorRgb[2];
          imgGt.data[index + 3] = 255;

          // Model Prediction Mask
          imgPred.data[index] = predCls.colorRgb[0];
          imgPred.data[index + 1] = predCls.colorRgb[1];
          imgPred.data[index + 2] = predCls.colorRgb[2];
          imgPred.data[index + 3] = 255;
        }
      }

      ctxIn.putImageData(imgIn, 0, 0);
      ctxGt.putImageData(imgGt, 0, 0);
      ctxPred.putImageData(imgPred, 0, 0);
    };

    renderTriplet('t1', canvasT1InRef.current, canvasT1GtRef.current, canvasT1PredRef.current);
    renderTriplet('t2', canvasT2InRef.current, canvasT2GtRef.current, canvasT2PredRef.current);
  };

  // Run or refresh analysis
  const runAnalysis = async (scenarioToAnalyze = currentScenario) => {
    setIsAnalyzing(true);
    setPdfDownloaded(false);
    try {
      const [result, base64] = await Promise.all([
        fetchOrCalculateEvaluationMetrics(scenarioToAnalyze),
        generateScenarioBase64Maps(scenarioToAnalyze),
      ]);
      setEvaluation(result);
      setScenarioBase64Maps(base64);
      drawCanvases();
    } catch (err) {
      console.error('Failed to compute evaluation metrics:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger evaluation when scenario changes
  useEffect(() => {
    runAnalysis(currentScenario);
  }, [currentScenario]);

  const handleSelectPair = (scenario: ScenarioDataset) => {
    onSelectScenario(scenario);
  };

  const handleThresholdChange = async (newThreshold: number) => {
    setScenarioThreshold(newThreshold);
    try {
      const updated = await generateScenarioBase64Maps(currentScenario, newThreshold);
      setScenarioBase64Maps(updated);
    } catch (err) {
      console.error('Failed to recalculate benchmark scenario maps:', err);
    }
  };

  const handleCanvasMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>,
    time: 't1' | 't2'
  ) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 512);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 512);

    const u = Math.max(0, Math.min(1, x / 512));
    const v = Math.max(0, Math.min(1, y / 512));
    const pixelData = getScenarioPixelData(currentScenario.id, u, v, time);
    const gtCls = SECOND_CLASSES.find((c) => c.id === pixelData.gtClassId) || SECOND_CLASSES[3];
    const predCls = SECOND_CLASSES.find((c) => c.id === pixelData.predClassId) || SECOND_CLASSES[3];

    setHoverPixel({
      x,
      y,
      targetTime: time === 't1' ? 'T1' : 'T2',
      gtClass: gtCls,
      predClass: predCls,
      confidence: Math.round(pixelData.confidence * 1000) / 10,
    });
  };

  const handleDownloadReportPdf = async () => {
    if (!evaluation) return;
    setIsExportingPdf(true);
    setPdfDownloaded(false);
    try {
      const base64Maps = scenarioBase64Maps || (await generateScenarioBase64Maps(currentScenario));
      const sceneStats = calculateSceneStatistics(currentScenario);
      const observations = generateAcademicEnvironmentalInsights(currentScenario);

      await generateTemporalChangePdf({
        title: currentScenario.title,
        sceneCode: currentScenario.sceneCode,
        isUserUpload: false,
        t1DateOrDesc: currentScenario.temporalBaseline,
        t2DateOrDesc: currentScenario.temporalTarget,
        resolution: currentScenario.gsd,
        totalPixels: currentScenario.totalPixels,
        totalAreaHa: currentScenario.totalAreaHa,
        unit: 'ha',
        unchangedPct: sceneStats.stabilityIndexPct,
        changedPct: (sceneStats.totalChangedAreaHa / sceneStats.totalAreaHa) * 100,
        classWiseRows: sceneStats.rows.map((row) => ({
          className: row.className,
          t1Val: `${row.t1AreaHa.toFixed(2)} ha`,
          t2Val: `${row.t2AreaHa.toFixed(2)} ha`,
          diffVal: `${row.diffHa > 0 ? '+' : ''}${row.diffHa.toFixed(2)} ha`,
          pctShift: `${row.pctChange > 0 ? '+' : ''}${row.pctChange.toFixed(1)}%`,
        })),
        transitions: currentScenario.transitions.map((tr) => {
          const from = SECOND_CLASSES.find((c) => c.id === tr.fromId);
          const to = SECOND_CLASSES.find((c) => c.id === tr.toId);
          return {
            fromName: from ? from.displayName.split('/')[0] : `Class ${tr.fromId}`,
            toName: to ? to.displayName.split('/')[0] : `Class ${tr.toId}`,
            metric: `${tr.areaHa.toFixed(2)} ha (${tr.pixelCount.toLocaleString()} px)`,
            pct: `${tr.percentage.toFixed(1)}%`,
          };
        }),
        observations: observations.map((obs) => ({
          title: obs.title,
          metric: obs.metric,
          observation: obs.observation,
          academicImplication: obs.academicImplication,
        })),
        t1ImageBase64: base64Maps.t1ImageBase64,
        t2ImageBase64: base64Maps.t2ImageBase64,
        t1PredBase64: base64Maps.t1PredBase64,
        t2PredBase64: base64Maps.t2PredBase64,
        changeMapBase64: base64Maps.changeMapBase64,
        // CA-PCC Maps & Metrics
        t1ConfidenceBase64: base64Maps.t1ConfidenceBase64,
        t2ConfidenceBase64: base64Maps.t2ConfidenceBase64,
        highConfChangeBase64: base64Maps.highConfChangeBase64,
        uncertainMapBase64: base64Maps.uncertainMapBase64,
        caPccMapBase64: base64Maps.caPccMapBase64,
        confidenceThreshold: scenarioThreshold,
        confidencePccComparison: evaluation.confidencePccComparison,
        evaluation: evaluation || undefined,
      });

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div id="temporal-analysis-tab-content" className="space-y-5">
      {/* 1. Header & Context Explaining T1 vs T2 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                Multi-Temporal Dual Classification
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentScenario.title}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Temporal Analysis: T1 (Earlier) vs T2 (Later) Image Pairs
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Every multi-temporal analysis compares two distinct time points: <strong>T1 ({currentScenario.temporalBaseline})</strong> is the earlier baseline observation, and <strong>T2 ({currentScenario.temporalTarget})</strong> is the later target observation. ResNet-50 + U-Net predicts semantic land-cover masks for each time point independently.
            </p>
          </div>

          {/* Test Sample Selector & Analyze Action Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {SCENARIOS.map((s, idx) => (
                <button
                  key={s.id}
                  id={`select-pair-btn-${idx + 1}`}
                  onClick={() => handleSelectPair(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentScenario.id === s.id
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={s.title}
                >
                  Pair #{idx + 1}
                </button>
              ))}
            </div>

            <button
              id="analyze-test-pair-btn"
              onClick={() => runAnalysis()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 text-cyan-200 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Computing Metrics...' : 'Analyze'}</span>
            </button>
          </div>
        </div>

        {/* Temporal Stream Architecture */}
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Dual-Stream Temporal Processing Architecture</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* T1 Stream */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  TIME 1 (T1) &middot; Earlier Observation
                </span>
                <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Date: {currentScenario.temporalBaseline}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Optical input image X_T1 (512×512×3 RGB) is fed into the ResNet-50 + U-Net model to produce baseline land-cover segmentation map M_T1.
              </p>
            </div>

            {/* T2 Stream */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  TIME 2 (T2) &middot; Later Observation
                </span>
                <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Date: {currentScenario.temporalTarget}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Optical input image X_T2 (512×512×3 RGB) is fed into the same model to produce target land-cover segmentation map M_T2.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 3-Column Classification Comparison for T1 & T2 */}
      <div className="space-y-5">
        {/* T1 Earlier Observation Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold text-white">
                T1 Classification: Earlier Observation ({currentScenario.temporalBaseline})
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono border border-slate-800">
                Unseen Test Input
              </span>
            </div>
            <span className="text-xs text-slate-400">
              3-Column Comparison: Input Optical &rarr; Ground Truth &rarr; Model Prediction
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* T1 Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">1. Test Input — T1 (Earlier Image)</span>
                <span className="font-mono text-cyan-400 text-[11px]">512×512 RGB</span>
              </div>
              <canvas
                ref={canvasT1InRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't1')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Optical Remote Sensing Input</span>
            </div>

            {/* T1 Ground Truth */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">2. Ground Truth — T1</span>
                <span className="font-mono text-purple-400 text-[11px]">SECOND Annotations</span>
              </div>
              <canvas
                ref={canvasT1GtRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't1')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">True 7-Class Ground Truth Mask</span>
            </div>

            {/* T1 Model Prediction */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-400">3. Model Prediction — T1</span>
                <span className="font-mono text-emerald-400 text-[11px]">ResNet-50 + U-Net</span>
              </div>
              <canvas
                ref={canvasT1PredRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't1')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-emerald-500/30 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Predicted Land-Cover Mask</span>
            </div>
          </div>
        </div>

        {/* T2 Later Observation Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                T2 Classification: Later Observation ({currentScenario.temporalTarget})
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono border border-slate-800">
                Unseen Test Input
              </span>
            </div>
            <span className="text-xs text-slate-400">
              3-Column Comparison: Input Optical &rarr; Ground Truth &rarr; Model Prediction
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* T2 Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">1. Test Input — T2 (Later Image)</span>
                <span className="font-mono text-cyan-400 text-[11px]">512×512 RGB</span>
              </div>
              <canvas
                ref={canvasT2InRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't2')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Optical Remote Sensing Input</span>
            </div>

            {/* T2 Ground Truth */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">2. Ground Truth — T2</span>
                <span className="font-mono text-purple-400 text-[11px]">SECOND Annotations</span>
              </div>
              <canvas
                ref={canvasT2GtRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't2')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">True 7-Class Ground Truth Mask</span>
            </div>

            {/* T2 Model Prediction */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-400">3. Model Prediction — T2</span>
                <span className="font-mono text-emerald-400 text-[11px]">ResNet-50 + U-Net</span>
              </div>
              <canvas
                ref={canvasT2PredRef}
                width={256}
                height={256}
                onMouseMove={(e) => handleCanvasMouseMove(e, 't2')}
                onMouseLeave={() => setHoverPixel(null)}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-emerald-500/30 object-cover shadow cursor-crosshair"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Predicted Land-Cover Mask</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED MODEL PERFORMANCE & EVALUATION METRICS CARD / TABLE */}
      <div id="model-evaluation-results-card" className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Sample Evaluation Metrics
              </span>
              <span className="text-xs text-slate-300 font-mono font-medium">
                Evaluated on: {currentScenario.sceneCode}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white mt-1.5">
              Model Performance / Evaluation Metrics (Predicted vs Ground Truth)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
              Calculated dynamically by comparing the ResNet-50 + U-Net model's predicted semantic segmentation and PCC change map against the official SECOND ground-truth annotations for this exact test image pair.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="download-evaluation-pdf-btn"
              onClick={handleDownloadReportPdf}
              disabled={isExportingPdf || !evaluation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExportingPdf ? 'Building PDF...' : pdfDownloaded ? 'Report Downloaded!' : 'Export PDF Report'}</span>
            </button>
          </div>
        </div>

        {evaluation ? (
          <div className="space-y-4">
            {/* Primary Metric Highlights: 5 Stat Cards */}
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
                  Macro sensitivity across classes
                </p>
              </div>

              {/* Card 4: F1-Score */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">F1-Score (%)</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded">
                    Macro Avg
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">
                  {evaluation.macroF1.toFixed(1)}%
                </div>
                <p className="text-[10px] text-slate-400">
                  Harmonic mean of Prec & Recall
                </p>
              </div>

              {/* Card 5: IoU */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">IoU / mIoU (%)</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
                    Mean IoU
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">
                  {evaluation.macroIoU.toFixed(1)}%
                </div>
                <p className="text-[10px] text-slate-400">
                  Intersection-over-Union (mIoU)
                </p>
              </div>
            </div>

            {/* Method Clarification Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-semibold text-slate-200">Scoring Methodology:</span>
                <span className="text-slate-400 text-[11px]">
                  Macro-averaged across all 7 semantic land-cover classes (unweighted). Accuracy is overall pixel-based across {evaluation.totalEvaluatedPixels.toLocaleString()} evaluations.
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>Weighted F1: <strong className="text-slate-200">{evaluation.weightedF1.toFixed(1)}%</strong></span>
                <span>Weighted IoU: <strong className="text-slate-200">{evaluation.weightedIoU.toFixed(1)}%</strong></span>
              </div>
            </div>

            {/* Sub-View Tabs: Confusion Matrix vs Class-wise Table vs Change Detection */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveMetricSubView('matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeMetricSubView === 'matrix'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Confusion Matrix (7×7)</span>
                  </button>

                  <button
                    onClick={() => setActiveMetricSubView('classes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeMetricSubView === 'classes'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Class-Wise Breakdown</span>
                  </button>

                  <button
                    onClick={() => setActiveMetricSubView('change')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeMetricSubView === 'change'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>PCC Change Map Metrics</span>
                  </button>
                </div>

                {activeMetricSubView === 'matrix' && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Display Mode:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setMatrixMode('pct')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                          matrixMode === 'pct' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Row %
                      </button>
                      <button
                        onClick={() => setMatrixMode('count')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                          matrixMode === 'count' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Pixel Counts
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* View A: 7x7 Confusion Matrix */}
              {activeMetricSubView === 'matrix' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-2 text-[11px] font-semibold">Actual \ Pred</th>
                        {SECOND_CLASSES.map((cls) => (
                          <th key={cls.id} className="p-2 text-[11px] font-semibold text-center" title={cls.displayName}>
                            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cls.colorHex }} />
                            {cls.id}: {cls.displayName.split('/')[0].slice(0, 5)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SECOND_CLASSES.map((rowCls, rIdx) => (
                        <tr key={rowCls.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="p-2 font-semibold text-slate-200 whitespace-nowrap text-[11px]">
                            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: rowCls.colorHex }} />
                            {rowCls.id}: {rowCls.displayName.split('/')[0]}
                          </td>
                          {SECOND_CLASSES.map((colCls, cIdx) => {
                            const count = evaluation.confusionMatrix[rIdx][cIdx] || 0;
                            const pct = evaluation.confusionMatrixNormalized[rIdx][cIdx] || 0;
                            const isDiagonal = rIdx === cIdx;

                            return (
                              <td
                                key={colCls.id}
                                className={`p-2 text-center text-[11px] font-mono ${
                                  isDiagonal
                                    ? pct > 90
                                      ? 'bg-emerald-950/50 text-emerald-300 font-bold'
                                      : 'bg-emerald-950/30 text-emerald-400'
                                    : count > 0
                                    ? 'bg-amber-950/20 text-amber-300'
                                    : 'text-slate-600'
                                }`}
                              >
                                {matrixMode === 'pct' ? `${pct.toFixed(1)}%` : count.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    * Rows represent Ground Truth reference classes; columns represent Model Predictions. High diagonal values verify accurate semantic segmentation.
                  </p>
                </div>
              )}

              {/* View B: Class-Wise Breakdown Table */}
              {activeMetricSubView === 'classes' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-2.5 font-semibold">Land-Cover Class</th>
                        <th className="p-2.5 font-semibold font-mono text-right">GT Pixels</th>
                        <th className="p-2.5 font-semibold font-mono text-right">Pred Pixels</th>
                        <th className="p-2.5 font-semibold font-mono text-right text-amber-300">Precision (%)</th>
                        <th className="p-2.5 font-semibold font-mono text-right text-emerald-300">Recall (%)</th>
                        <th className="p-2.5 font-semibold font-mono text-right text-purple-300">F1-Score (%)</th>
                        <th className="p-2.5 font-semibold font-mono text-right text-rose-300">IoU (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluation.classMetrics.map((cm) => (
                        <tr key={cm.classId} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="p-2.5 font-medium text-slate-200 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: cm.colorHex }} />
                            <span>{cm.classId}: {cm.className}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-300">{cm.pixelCountGT.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-slate-300">{cm.pixelCountPred.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-amber-400 font-semibold">{cm.precision.toFixed(1)}%</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400 font-semibold">{cm.recall.toFixed(1)}%</td>
                          <td className="p-2.5 text-right font-mono text-purple-400 font-semibold">{cm.f1Score.toFixed(1)}%</td>
                          <td className="p-2.5 text-right font-mono text-rose-400 font-semibold">{cm.iou.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View C: Change Detection Metrics */}
              {activeMetricSubView === 'change' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                      <GitCompare className="w-3.5 h-3.5" />
                      Post-Classification Comparison (PCC) Change Metrics
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluates the binary change detection mask synthesized by comparing M_T1 vs M_T2 against the ground-truth transition mask (GT_T1 ≠ GT_T2).
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400">Change Accuracy</span>
                        <p className="text-base font-bold font-mono text-cyan-300">{evaluation.changeMetrics.accuracy.toFixed(1)}%</p>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400">Change IoU</span>
                        <p className="text-base font-bold font-mono text-rose-300">{evaluation.changeMetrics.iou.toFixed(1)}%</p>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400">Change Precision</span>
                        <p className="text-base font-bold font-mono text-amber-300">{evaluation.changeMetrics.precision.toFixed(1)}%</p>
                      </div>
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400">Change Recall</span>
                        <p className="text-base font-bold font-mono text-emerald-300">{evaluation.changeMetrics.recall.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Pixel-Level Transition Comparison
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Ground-Truth Changed Pixels:</span>
                        <span className="font-mono font-bold text-white">{evaluation.changeMetrics.trueChangePixels.toLocaleString()} px</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Model Predicted Changed Pixels:</span>
                        <span className="font-mono font-bold text-cyan-300">{evaluation.changeMetrics.predChangePixels.toLocaleString()} px</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400">True Positive Detected Changes:</span>
                        <span className="font-mono font-bold text-emerald-400">{evaluation.changeMetrics.tpChangePixels.toLocaleString()} px</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400">PCC Binary F1-Score:</span>
                        <span className="font-mono font-bold text-purple-400">{evaluation.changeMetrics.f1Score.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Short Interpretation of the Results */}
            <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Interpretation of Results:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {evaluation.interpretation}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Metrics unavailable – ground truth not available
          </div>
        )}
      </div>

      {/* Confidence-Aware Post-Classification Comparison (CA-PCC) Section */}
      <ConfidenceAwarePccSection
        id="scenario-confidence-aware-pcc-section"
        stats={scenarioBase64Maps?.stats || evaluation?.confidencePccComparison?.confidenceStats}
        currentThreshold={scenarioThreshold}
        onThresholdChange={handleThresholdChange}
        t1DataUrl={scenarioBase64Maps?.t1ImageBase64}
        t2DataUrl={scenarioBase64Maps?.t2ImageBase64}
        t1PredDataUrl={scenarioBase64Maps?.t1PredDataUrl}
        t2PredDataUrl={scenarioBase64Maps?.t2PredDataUrl}
        changeMapDataUrl={scenarioBase64Maps?.changeMapBase64}
        t1ConfidenceDataUrl={scenarioBase64Maps?.t1ConfidenceBase64}
        t2ConfidenceDataUrl={scenarioBase64Maps?.t2ConfidenceBase64}
        highConfChangeDataUrl={scenarioBase64Maps?.highConfChangeBase64}
        uncertainMapDataUrl={scenarioBase64Maps?.uncertainMapBase64}
        caPccMapDataUrl={scenarioBase64Maps?.caPccMapBase64}
        isUserAnalysis={false}
        sampleSubtitle={`SECOND Benchmark Scene: ${currentScenario.sceneCode}`}
        evaluationComparison={evaluation?.confidencePccComparison}
      />

      {/* 4. Interactive Pixel Inspector & Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Pixel Inspector (Span 5) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Interactive Pixel Inspector</span>
          </h3>
          <p className="text-xs text-slate-400">
            Hover or move cursor over any map to inspect pixel coordinates, ground truth class, and model prediction:
          </p>

          {hoverPixel ? (
            <div className="p-3.5 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Coordinate:</span>
                <span className="text-cyan-300 font-bold">X: {hoverPixel.x}px, Y: {hoverPixel.y}px ({hoverPixel.targetTime})</span>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-slate-800">
                <span className="text-slate-400">Ground Truth:</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: hoverPixel.gtClass.colorHex }} />
                  {hoverPixel.gtClass.displayName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-slate-800">
                <span className="text-slate-400">Model Prediction:</span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: hoverPixel.predClass.colorHex }} />
                  {hoverPixel.predClass.displayName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-slate-800">
                <span className="text-slate-400">Softmax Confidence:</span>
                <span className="font-mono text-emerald-400 font-bold">{hoverPixel.confidence}%</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 text-center flex flex-col items-center justify-center gap-1 min-h-[120px]">
              <Eye className="w-5 h-5 text-slate-600 mb-1" />
              <span>Hover your cursor over any map image above</span>
              <span className="text-[11px] text-slate-500">Inspect real-time per-pixel predictions</span>
            </div>
          )}
        </div>

        {/* Right: 7-Class Color Legend & Proceed Action (Span 7) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Semantic Land-Cover Classification Legend</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {SECOND_CLASSES.map((cls) => (
              <div key={cls.id} className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded shrink-0" style={{ backgroundColor: cls.colorHex }} />
                <span className="text-[11px] font-medium text-slate-200 truncate" title={cls.displayName}>
                  {cls.id}: {cls.displayName.split('/')[0]}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Next: Compare T1 vs T2 using Post-Classification Comparison</span>
            <button
              onClick={() => onNavigateTab('change-detection')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Go to Change Detection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
