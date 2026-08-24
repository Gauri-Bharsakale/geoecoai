import React, { useState, useRef, useEffect } from 'react';
import {
  GitCompare,
  Layers,
  Sparkles,
  ArrowRight,
  Table as TableIcon,
  HelpCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ScenarioDataset, LandCoverClass, TabType } from '../types';
import { SECOND_CLASSES } from '../data/scenarios';
import { calculateSceneStatistics } from '../utils/geoAnalysis';

interface ChangeDetectionTabProps {
  currentScenario: ScenarioDataset;
  unit: 'ha' | 'km2';
  onNavigateTab: (tab: TabType) => void;
}

type ChangeViewMode = 'side-by-side' | 'split-wipe';

export const ChangeDetectionTab: React.FC<ChangeDetectionTabProps> = ({
  currentScenario,
  unit,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<ChangeViewMode>('side-by-side');
  const [wipePosition, setWipePosition] = useState<number>(50);
  const [isDraggingWipe, setIsDraggingWipe] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const canvasT1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvasT2Ref = useRef<HTMLCanvasElement | null>(null);
  const canvasChangeRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWipeRef = useRef<HTMLCanvasElement | null>(null);

  const stats = calculateSceneStatistics(currentScenario);

  const getPixelClass = (u: number, v: number, time: 't1' | 't2'): LandCoverClass => {
    const seed = currentScenario.id === 'second-scene-0189' ? 42 : currentScenario.id === 'second-scene-0754' ? 108 : 99;
    const nx = Math.sin(u * 10.0 + seed) * Math.cos(v * 10.0 + seed);
    const ny = Math.cos(u * 8.0 - seed) * Math.sin(v * 8.0 + seed);
    const dist = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2);

    let classId = 3;

    if (currentScenario.id === 'second-scene-0412') {
      if (Math.abs(u - 0.2 + Math.sin(v * 4) * 0.05) < 0.06) {
        classId = 1; // Water
      } else if (u > 0.45 && v > 0.4) {
        classId = time === 't1' ? (nx > 0 ? 4 : 3) : 5; // Agri/Tree -> Built-Up
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

    return SECOND_CLASSES.find((c) => c.id === classId) || SECOND_CLASSES[3];
  };

  useEffect(() => {
    const drawMaps = () => {
      const c1 = canvasT1Ref.current;
      const c2 = canvasT2Ref.current;
      const cc = canvasChangeRef.current;
      const cw = canvasWipeRef.current;

      const renderCanvas = (
        canvas: HTMLCanvasElement | null,
        mode: 't1' | 't2' | 'change' | 'wipe'
      ) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const img = ctx.createImageData(w, h);
        const data = img.data;

        const wipeRatio = wipePosition / 100;

        for (let y = 0; y < h; y++) {
          const v = y / h;
          for (let x = 0; x < w; x++) {
            const u = x / w;
            const idx = (y * w + x) * 4;

            const p1 = getPixelClass(u, v, 't1');
            const p2 = getPixelClass(u, v, 't2');
            const isChanged = p1.id !== p2.id;

            let r = 0, g = 0, b = 0;

            if (mode === 't1') {
              r = p1.colorRgb[0];
              g = p1.colorRgb[1];
              b = p1.colorRgb[2];
            } else if (mode === 't2') {
              r = p2.colorRgb[0];
              g = p2.colorRgb[1];
              b = p2.colorRgb[2];
            } else if (mode === 'change') {
              if (isChanged) {
                r = 239; g = 68; b = 68; // Red for detected change
              } else {
                r = 30; g = 41; b = 59; // Slate-800 invariant
              }
            } else if (mode === 'wipe') {
              if (u < wipeRatio) {
                r = p1.colorRgb[0];
                g = p1.colorRgb[1];
                b = p1.colorRgb[2];
              } else {
                r = p2.colorRgb[0];
                g = p2.colorRgb[1];
                b = p2.colorRgb[2];
              }
            }

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(img, 0, 0);

        if (mode === 'wipe') {
          const wipeX = w * wipeRatio;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wipeX, 0);
          ctx.lineTo(wipeX, h);
          ctx.stroke();

          ctx.fillStyle = '#0ea5e9';
          ctx.beginPath();
          ctx.arc(wipeX, h / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      renderCanvas(c1, 't1');
      renderCanvas(c2, 't2');
      renderCanvas(cc, 'change');
      renderCanvas(cw, 'wipe');
    };

    drawMaps();
  }, [currentScenario, wipePosition]);

  const handleRunChangeDetection = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 500);
  };

  const handleWipeMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingWipe) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPos = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setWipePosition(newPos);
  };

  return (
    <div id="change-detection-tab-content" className="space-y-5">
      {/* 1. PCC Method Header & Concept */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5" />
                Change Detection Methodology
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentScenario.title}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-2">
              Post-Classification Comparison (PCC) Change Detection
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Post-Classification Comparison compares the independently predicted semantic land-cover maps from Time 1 (M_T1) and Time 2 (M_T2). By evaluating where M_T1(x, y) ≠ M_T2(x, y), the algorithm generates an exact binary change mask and computes the full transition trajectory table.
            </p>
          </div>

          <button
            id="run-pcc-btn"
            onClick={handleRunChangeDetection}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isAnalyzing ? (
              <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
            ) : (
              <GitCompare className="w-4 h-4 text-cyan-200" />
            )}
            <span>{isAnalyzing ? 'Evaluating PCC Matrix...' : 'Re-run Change Comparison'}</span>
          </button>
        </div>

        {/* PCC Mathematical Formulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 text-xs">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">1. T1 Prediction Mask:</span>
            <p className="font-mono text-amber-400 font-bold mt-1">M_T1(x, y) ∈ &#123;0..6&#125;</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Earlier date: {currentScenario.temporalBaseline}</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">2. T2 Prediction Mask:</span>
            <p className="font-mono text-emerald-400 font-bold mt-1">M_T2(x, y) ∈ &#123;0..6&#125;</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Later date: {currentScenario.temporalTarget}</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400">3. PCC Binary Decision Logic:</span>
            <p className="font-mono text-rose-400 font-bold mt-1">C(x, y) = [ M_T1(x, y) ≠ M_T2(x, y) ]</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Outputs Invariant (0) vs Changed (1)</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Output Maps (T1 -> T2 -> Change Map) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Temporal Land-Cover & PCC Change Maps</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison flow: Predicted T1 &rarr; Predicted T2 &rarr; Generated Change Map
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'side-by-side' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side (3 Maps)
            </button>
            <button
              onClick={() => setViewMode('split-wipe')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'split-wipe' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Split-Wipe
            </button>
          </div>
        </div>

        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Map 1: T1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-amber-400">Predicted Land-Cover Map — T1</span>
                <span className="font-mono text-slate-400 text-[11px]">{currentScenario.temporalBaseline}</span>
              </div>
              <canvas
                ref={canvasT1Ref}
                width={256}
                height={256}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Earlier Observation Surface</span>
            </div>

            {/* Map 2: T2 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-400">Predicted Land-Cover Map — T2</span>
                <span className="font-mono text-slate-400 text-[11px]">{currentScenario.temporalTarget}</span>
              </div>
              <canvas
                ref={canvasT2Ref}
                width={256}
                height={256}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-slate-800 object-cover shadow"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">Later Observation Surface</span>
            </div>

            {/* Map 3: PCC Binary Change Map */}
            <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-3 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-rose-400">Change Map — T1 &rarr; T2</span>
                <span className="font-mono text-rose-300 text-[11px] font-bold">PCC Output</span>
              </div>
              <canvas
                ref={canvasChangeRef}
                width={256}
                height={256}
                className="w-full max-w-[260px] aspect-square rounded-lg border border-rose-500/30 object-cover shadow"
              />
              <div className="w-full flex justify-center gap-4 text-[11px] mt-2 font-medium">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Invariant ({stats.stabilityIndexPct}%)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Changed ({(100 - stats.stabilityIndexPct).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-amber-400">◀ T1 (Earlier): {currentScenario.temporalBaseline}</span>
              <span className="text-slate-400 font-medium">Drag slider to visually inspect temporal transition</span>
              <span className="font-mono text-emerald-400">T2 (Later): {currentScenario.temporalTarget} ▶</span>
            </div>
            <canvas
              ref={canvasWipeRef}
              width={512}
              height={384}
              onMouseDown={() => setIsDraggingWipe(true)}
              onMouseUp={() => setIsDraggingWipe(false)}
              onMouseLeave={() => setIsDraggingWipe(false)}
              onMouseMove={handleWipeMove}
              className="w-full max-w-[560px] aspect-[4/3] rounded-lg border border-slate-800 object-contain shadow-2xl cursor-ew-resize select-none"
            />
          </div>
        )}
      </div>

      {/* 3. Detected Transitions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-cyan-400" />
              <span>Detected Land-Cover Transition Trajectories</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact pixel-wise transitions from baseline class at T1 to target class at T2
            </p>
          </div>

          {/* Change Summary Badges */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Changed Pixels: </span>
              <strong className="text-rose-400">{stats.totalChangedPixels.toLocaleString()} px</strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300">
              <span>Total Area: </span>
              <strong>{stats.totalChangedAreaHa.toFixed(2)} {unit === 'ha' ? 'ha' : 'km²'}</strong>
            </div>
          </div>
        </div>

        {/* Transition Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">From Class (T1 Earlier)</th>
                <th className="py-2.5 px-3 font-semibold">To Class (T2 Later)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Pixel Count</th>
                <th className="py-2.5 px-3 font-semibold text-right">Area ({unit})</th>
                <th className="py-2.5 px-3 font-semibold text-right">% of Total Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {currentScenario.transitions && currentScenario.transitions.length > 0 ? (
                currentScenario.transitions.map((t, idx) => {
                  const fromCls = SECOND_CLASSES.find((c) => c.id === t.fromId);
                  const toCls = SECOND_CLASSES.find((c) => c.id === t.toId);
                  const areaVal = unit === 'ha' ? t.areaHa : Number((t.areaHa / 100).toFixed(4));

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded shrink-0 shadow-sm"
                            style={{ backgroundColor: fromCls?.colorHex || '#666' }}
                          />
                          <span className="text-slate-200">{fromCls?.displayName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded shrink-0 shadow-sm"
                            style={{ backgroundColor: toCls?.colorHex || '#666' }}
                          />
                          <span className="text-slate-200">{toCls?.displayName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {t.pixelCount ? t.pixelCount.toLocaleString() : Math.round(t.areaHa * 10000).toLocaleString()} px
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                        {areaVal.toFixed(2)} {unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                        {t.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400 font-sans">
                    No transition data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">View quantitative net change statistics & observations:</span>
          <button
            onClick={() => onNavigateTab('statistics')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Go to Statistics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
