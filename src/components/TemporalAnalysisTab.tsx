import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarRange,
  Binary,
  Layers,
  Sparkles,
  Crosshair,
  ArrowRight,
  Info,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { ScenarioDataset, LandCoverClass, TabType } from '../types';
import { SECOND_CLASSES, SCENARIOS } from '../data/scenarios';

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
  const [activeViewMode, setActiveViewMode] = useState<'t1' | 't2' | 'both'>('both');
  const [isInferencing, setIsInferencing] = useState<boolean>(false);
  const [hasRunInference, setHasRunInference] = useState<boolean>(true);

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

  const getPixelClass = (u: number, v: number, time: 't1' | 't2'): number => {
    const seed = currentScenario.id === 'second-scene-0189' ? 42 : currentScenario.id === 'second-scene-0754' ? 108 : 99;
    const nx = Math.sin(u * 10.0 + seed) * Math.cos(v * 10.0 + seed);
    const ny = Math.cos(u * 8.0 - seed) * Math.sin(v * 8.0 + seed);
    const dist = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2);

    let classId = 3;

    if (currentScenario.id === 'second-scene-0412') {
      if (Math.abs(u - 0.2 + Math.sin(v * 4) * 0.05) < 0.06) {
        classId = 1; // Water
      } else if (u > 0.45 && v > 0.4) {
        classId = time === 't1' ? (nx > 0 ? 4 : 3) : 5; // Agri/Forest -> Urban
      } else if (dist < 0.2) {
        classId = 5; // Built-up
      } else if (nx > 0.25) {
        classId = 4; // Tree
      } else if (ny < -0.25) {
        classId = 2; // Bare ground
      } else {
        classId = 3; // Low veg
      }
    } else if (currentScenario.id === 'second-scene-0189') {
      const road = Math.abs(u - 0.5 + Math.sin(v * 3) * 0.04);
      if (road < 0.03) {
        classId = 2;
      } else if (road < 0.2 && time === 't2') {
        classId = nx > 0.1 ? 2 : 3;
      } else if (nx < -0.3 && ny < -0.2) {
        classId = 1;
      } else {
        classId = time === 't1' ? 4 : nx > 0 ? 3 : 4;
      }
    } else {
      // 0754
      if (u < 0.35 + Math.sin(v * 3) * 0.08) {
        classId = 1;
      } else if (u < 0.55) {
        classId = time === 't1' ? 2 : 3;
      } else if (nx > 0.1) {
        classId = 4;
      } else {
        classId = 3;
      }
    }

    return classId;
  };

  useEffect(() => {
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

          const classId = getPixelClass(u, v, time);
          const cls = SECOND_CLASSES.find((c) => c.id === classId) || SECOND_CLASSES[3];
          const grain = ((Math.sin(u * 120) * Math.cos(v * 120) + 1) * 0.5) * 18;

          // Input Optical Simulation
          imgIn.data[index] = Math.min(255, Math.max(0, cls.colorRgb[0] * 0.75 + 40 + grain));
          imgIn.data[index + 1] = Math.min(255, Math.max(0, cls.colorRgb[1] * 0.75 + 45 + grain));
          imgIn.data[index + 2] = Math.min(255, Math.max(0, cls.colorRgb[2] * 0.75 + 50 + grain));
          imgIn.data[index + 3] = 255;

          // Ground Truth Mask
          imgGt.data[index] = cls.colorRgb[0];
          imgGt.data[index + 1] = cls.colorRgb[1];
          imgGt.data[index + 2] = cls.colorRgb[2];
          imgGt.data[index + 3] = 255;

          // Prediction Mask with realistic minor boundary noise
          const isBoundaryNoise = Math.sin(u * 150) * Math.cos(v * 150) > 0.94;
          const predClass = isBoundaryNoise ? SECOND_CLASSES[(classId + 1) % 7] : cls;

          imgPred.data[index] = predClass.colorRgb[0];
          imgPred.data[index + 1] = predClass.colorRgb[1];
          imgPred.data[index + 2] = predClass.colorRgb[2];
          imgPred.data[index + 3] = 255;
        }
      }

      ctxIn.putImageData(imgIn, 0, 0);
      ctxGt.putImageData(imgGt, 0, 0);
      ctxPred.putImageData(imgPred, 0, 0);
    };

    renderTriplet('t1', canvasT1InRef.current, canvasT1GtRef.current, canvasT1PredRef.current);
    renderTriplet('t2', canvasT2InRef.current, canvasT2GtRef.current, canvasT2PredRef.current);
  }, [currentScenario]);

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
    const classId = getPixelClass(u, v, time);
    const gtCls = SECOND_CLASSES.find((c) => c.id === classId) || SECOND_CLASSES[3];
    const isBoundaryNoise = Math.sin(u * 150) * Math.cos(v * 150) > 0.94;
    const predCls = isBoundaryNoise ? SECOND_CLASSES[(classId + 1) % 7] : gtCls;

    setHoverPixel({
      x,
      y,
      targetTime: time === 't1' ? 'T1' : 'T2',
      gtClass: gtCls,
      predClass: predCls,
      confidence: isBoundaryNoise ? 74.8 : 96.2,
    });
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

          {/* Test Sample Selector */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">Test Pair:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {SCENARIOS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onSelectScenario(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentScenario.id === s.id
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pair #{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Temporal Explanation & Pipeline Flow */}
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
                Optical input image X_T1 (512×512×3 RGB) is fed into the deep learning model to produce baseline land-cover segmentation map M_T1.
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
              <span className="text-[11px] text-slate-400 mt-2 font-mono">True 7-Class Ground Truth</span>
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
              <span className="text-[11px] text-slate-400 mt-2 font-mono">True 7-Class Ground Truth</span>
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

      {/* 3. Interactive Pixel Inspector & Legend */}
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
