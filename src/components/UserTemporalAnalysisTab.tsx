import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Download,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Info,
  Check,
  Split,
  Table,
  CheckCheck,
} from 'lucide-react';
import { UserImageFile, UserAnalysisResult, TabType } from '../types';
import {
  validateAndLoadUserImage,
  checkGeographicalCompatibility,
  runUserImageInference,
  createSampleUserPair,
  MODEL_INPUT_SIZE,
} from '../utils/userImageInference';
import { generateTemporalChangePdf } from '../utils/pdfGenerator';
import { SECOND_CLASSES } from '../data/scenarios';

interface UserTemporalAnalysisTabProps {
  onNavigateToTab?: (tab: TabType) => void;
  userResult: UserAnalysisResult | null;
  onSetUserResult: (res: UserAnalysisResult | null) => void;
}

export const UserTemporalAnalysisTab: React.FC<UserTemporalAnalysisTabProps> = ({
  onNavigateToTab,
  userResult,
  onSetUserResult,
}) => {
  const [t1File, setT1File] = useState<UserImageFile | null>(null);
  const [t2File, setT2File] = useState<UserImageFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showWhatHappens, setShowWhatHappens] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'split'>('grid');
  const [splitPosition, setSplitPosition] = useState(50);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const t1InputRef = useRef<HTMLInputElement>(null);
  const t2InputRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleT1Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalysisError(null);
    const validated = await validateAndLoadUserImage(file);
    setT1File(validated);
  };

  const handleT2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalysisError(null);
    const validated = await validateAndLoadUserImage(file);
    setT2File(validated);
  };

  // Sample Load Handlers (Urban, River, Vegetation)
  const handleLoadSample = async (type: 'urban' | 'river' | 'vegetation') => {
    setAnalysisError(null);
    const sample = createSampleUserPair(type);

    const t1Obj: UserImageFile = {
      name: `sample_${type}_t1_earlier.png`,
      size: 154000,
      width: MODEL_INPUT_SIZE,
      height: MODEL_INPUT_SIZE,
      channels: 3,
      dataUrl: sample.t1DataUrl,
      isValid: true,
      preprocessedReady: true,
    };

    const t2Obj: UserImageFile = {
      name: `sample_${type}_t2_later.png`,
      size: 158000,
      width: MODEL_INPUT_SIZE,
      height: MODEL_INPUT_SIZE,
      channels: 3,
      dataUrl: sample.t2DataUrl,
      isValid: true,
      preprocessedReady: true,
    };

    setT1File(t1Obj);
    setT2File(t2Obj);
  };

  // Run Inference Pipeline
  const handleAnalyze = async () => {
    if (!t1File || !t2File) {
      setAnalysisError('Please upload both T1 (Earlier) and T2 (Later) images to perform temporal change detection.');
      return;
    }

    if (!t1File.isValid || !t2File.isValid) {
      setAnalysisError(t1File.validationError || t2File.validationError || 'Invalid image file provided.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setPdfSuccess(false);

    try {
      // Simulate tensor forwarding delay for realistic demonstration
      await new Promise((resolve) => setTimeout(resolve, 800));
      const result = await runUserImageInference(t1File, t2File, 1.0);
      onSetUserResult(result);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message || 'Inference failed during tensor classification.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setT1File(null);
    setT2File(null);
    onSetUserResult(null);
    setAnalysisError(null);
    setPdfSuccess(false);
    if (t1InputRef.current) t1InputRef.current.value = '';
    if (t2InputRef.current) t2InputRef.current.value = '';
  };

  // Export Results
  const handleDownloadPng = (dataUrl: string | undefined, filename: string) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleDownloadCsv = () => {
    if (!userResult) return;
    const headers = ['Semantic Class', 'T1 Pixels', 'T1 %', 'T2 Pixels', 'T2 %', 'Net Pixel Shift', 'Net % Shift'];
    const rows = userResult.classWiseStats.map((s) => [
      s.className,
      s.t1Pixels,
      s.t1Percentage.toFixed(2),
      s.t2Pixels,
      s.t2Percentage.toFixed(2),
      s.diffPixels,
      s.diffPercentage.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeoEcoAI_User_Transitions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = async () => {
    if (!userResult) return;
    setPdfGenerating(true);
    setPdfSuccess(false);

    try {
      await generateTemporalChangePdf({
        title: 'User-Uploaded Temporal Analysis Pair',
        isUserUpload: true,
        t1DateOrDesc: userResult.t1Image.name,
        t2DateOrDesc: userResult.t2Image.name,
        resolution: 'Standardized 512×512 Grid',
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
      setPdfSuccess(true);
    } catch (err) {
      console.error(err);
      setAnalysisError('Failed to generate PDF document.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const geoCheck = t1File && t2File ? checkGeographicalCompatibility(t1File, t2File) : null;

  return (
    <div id="user-temporal-analysis-tab" className="space-y-6">
      {/* 1. Header & Context Banner */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                Inference Mode
              </span>
              <span className="text-xs text-slate-400">
                Model: <strong>ResNet-50 + U-Net</strong> (Frozen Weights &middot; No Retraining)
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              User Temporal Analysis & Multi-Temporal Inference
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Upload two images representing the same geographical area at different time periods. The deep learning model will classify both images independently into 7 semantic land-cover categories and compare their predicted maps using Post-Classification Comparison (PCC) to identify and quantify landscape changes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Images</span>
            </button>
          </div>
        </div>

        {/* Academic Distinction Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MODEL EVALUATION (Held-Out SECOND Test Set)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Uses the held-out test split of the official SECOND benchmark dataset with ground-truth labels to calculate validation metrics (Accuracy, mIoU, F1 Score, Confusion Matrix).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>USER TEMPORAL ANALYSIS (User-Provided Images)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Uses user-provided T1 + T2 images for semantic inference and temporal change detection. Ground truth is normally unavailable; outputs are model predictions and PCC change statistics. No model retraining occurs.
            </p>
          </div>
        </div>

        {/* Collapsible: "What happens after upload?" */}
        <div className="pt-1">
          <button
            onClick={() => setShowWhatHappens(!showWhatHappens)}
            className="flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 text-xs text-slate-300 transition cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold text-cyan-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>What happens after you upload T1 and T2 images?</span>
            </span>
            {showWhatHappens ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showWhatHappens && (
            <div className="mt-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 text-slate-300">
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                <li><strong className="text-white">Image Validation:</strong> The files are checked for valid raster image formatting (PNG/JPG/WEBP) and minimum resolution.</li>
                <li><strong className="text-white">Standard Preprocessing:</strong> Both images are resized to 512×512 pixels and normalized using ImageNet mean [0.485, 0.456, 0.406] and std [0.229, 0.224, 0.225] (identical to training).</li>
                <li><strong className="text-white">Neural Inference:</strong> The trained ResNet-50 + U-Net model performs semantic segmentation on T1.</li>
                <li><strong className="text-white">Prediction Map:</strong> A 7-class discrete semantic map (M_T1) is generated.</li>
                <li><strong className="text-white">T2 Semantic Segmentation:</strong> The identical inference pipeline is applied to generate M_T2.</li>
                <li><strong className="text-white">Post-Classification Comparison (PCC):</strong> M_T1(x, y) and M_T2(x, y) are evaluated pixel-by-pixel to identify transitions.</li>
                <li><strong className="text-white">Change Accounting:</strong> Invariant pixels, changed pixels, class shifts, and transition trajectories are computed.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* 2. Upload Controls & Quick Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Step 1: Upload Bi-Temporal Optical Images (T1 & T2)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or drag & drop two corresponding images, or click a quick sample pair below
            </p>
          </div>

          {/* Quick Presets for instant viva testing */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Quick Viva Presets:</span>
            <button
              onClick={() => handleLoadSample('urban')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 transition cursor-pointer"
            >
              Urban Expansion
            </button>
            <button
              onClick={() => handleLoadSample('river')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 transition cursor-pointer"
            >
              Riverbed Shift
            </button>
            <button
              onClick={() => handleLoadSample('vegetation')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 transition cursor-pointer"
            >
              Canopy Regrowth
            </button>
          </div>
        </div>

        {/* Dual Upload Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* T1 Earlier Image Box */}
          <div
            id="t1-upload-card"
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  T1 — Earlier Image (Baseline)
                </span>
                {t1File && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {t1File.width} × {t1File.height} px
                  </span>
                )}
              </div>

              {t1File ? (
                <div className="space-y-2">
                  <div className="relative aspect-square max-h-56 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                    <img
                      src={t1File.dataUrl}
                      alt="T1 Earlier Observation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Image loaded: {t1File.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Preprocessing ready (512×512 standardized RGB tensor)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => t1InputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-slate-900/40 hover:bg-slate-900/60"
                >
                  <UploadCloud className="w-8 h-8 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-200">
                    Upload T1 (Earlier) Image
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, or WEBP &middot; Optical Aerial/Satellite
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                ref={t1InputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleT1Upload}
                className="hidden"
              />
              <button
                onClick={() => t1InputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
              >
                {t1File ? 'Change T1 Image' : 'Select T1 File'}
              </button>
            </div>
          </div>

          {/* T2 Later Image Box */}
          <div
            id="t2-upload-card"
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  T2 — Later Image (Target)
                </span>
                {t2File && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {t2File.width} × {t2File.height} px
                  </span>
                )}
              </div>

              {t2File ? (
                <div className="space-y-2">
                  <div className="relative aspect-square max-h-56 mx-auto rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                    <img
                      src={t2File.dataUrl}
                      alt="T2 Later Observation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Image loaded: {t2File.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Preprocessing ready (512×512 standardized RGB tensor)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => t2InputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-slate-900/40 hover:bg-slate-900/60"
                >
                  <UploadCloud className="w-8 h-8 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-200">
                    Upload T2 (Later) Image
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, or WEBP &middot; Optical Aerial/Satellite
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                ref={t2InputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleT2Upload}
                className="hidden"
              />
              <button
                onClick={() => t2InputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
              >
                {t2File ? 'Change T2 Image' : 'Select T2 File'}
              </button>
            </div>
          </div>
        </div>

        {/* Validation & Compatibility Warnings */}
        {geoCheck?.warning && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>{geoCheck.warning}</p>
          </div>
        )}

        {analysisError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{analysisError}</p>
          </div>
        )}

        {/* Analyze Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {!t1File && !t2File && 'Upload both T1 and T2 images to enable temporal change analysis.'}
            {t1File && !t2File && 'Please upload the T2 (Later) image to complete the pair.'}
            {!t1File && t2File && 'Please upload the T1 (Earlier) image to complete the pair.'}
            {t1File && t2File && 'Both images loaded and preprocessed. Ready to execute ResNet-50 + U-Net inference.'}
          </div>

          <button
            id="analyze-temporal-change-btn"
            disabled={!t1File || !t2File || isAnalyzing}
            onClick={handleAnalyze}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer ${
              t1File && t2File && !isAnalyzing
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Executing ResNet-50 + U-Net Inference...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Analyze Temporal Change</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Inference Results Section (When userResult is available) */}
      {userResult && (
        <div id="user-analysis-results-section" className="space-y-6">
          {/* Section 6 of requirements: Clear visual layout */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Step 2: Semantic Segmentation & Post-Classification Comparison (PCC)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Multi-Temporal Land-Cover Predictions & Invariant / Change Mapping
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  Surveyed Grid: 262,144 px (512×512)
                </span>
              </div>
            </div>

            {/* Visual Grid: EARLIER (T1 Image & T1 Pred) vs LATER (T2 Image & T2 Pred) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: T1 Input */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">T1: Earlier Input</span>
                  <span className="text-[10px] text-slate-400 font-mono">Optical RGB</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={userResult.t1Image.dataUrl}
                    alt="T1 Input"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">Baseline Optical Observation</p>
              </div>

              {/* Card 2: T1 Prediction */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">T1: Model Prediction</span>
                  <span className="text-[10px] text-slate-400 font-mono">ResNet-50 + U-Net</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={userResult.t1PredDataUrl}
                    alt="T1 Prediction"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">T1 7-Class Classified Map (M_T1)</p>
              </div>

              {/* Card 3: T2 Input */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400">T2: Later Input</span>
                  <span className="text-[10px] text-slate-400 font-mono">Optical RGB</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={userResult.t2Image.dataUrl}
                    alt="T2 Input"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">Target Optical Observation</p>
              </div>

              {/* Card 4: T2 Prediction */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">T2: Model Prediction</span>
                  <span className="text-[10px] text-slate-400 font-mono">ResNet-50 + U-Net</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={userResult.t2PredDataUrl}
                    alt="T2 Prediction"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">T2 7-Class Classified Map (M_T2)</p>
              </div>
            </div>

            {/* Center Arrow & PCC Comparison Banner */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white">Post-Classification Comparison (PCC) Applied:</strong>
                  <span className="text-slate-300 ml-1">
                    Direct pixel evaluation where M_T1(x, y) ≠ M_T2(x, y) derives binary change mask.
                  </span>
                </div>
              </div>
            </div>

            {/* Change Map & Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-1 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400">PCC Binary Change Map</span>
                  <span className="text-[10px] text-slate-400 font-mono">512×512</span>
                </div>
                <div className="aspect-square max-h-64 mx-auto rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={userResult.changeMapDataUrl}
                    alt="PCC Change Map"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-around text-[11px] pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
                    <span className="text-slate-300">Invariant ({userResult.unchangedPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500"></span>
                    <span className="text-rose-300 font-semibold">Changed ({userResult.changedPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Key Quantitative Metrics */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Evaluated Grid</span>
                  <p className="text-lg font-mono font-bold text-white">
                    {userResult.totalPixels.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-slate-400">Pixels (512 × 512)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Landscape Stability</span>
                  <p className="text-lg font-mono font-bold text-emerald-400">
                    {userResult.unchangedPercentage.toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {userResult.unchangedPixels.toLocaleString()} Invariant Px
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Detected Change</span>
                  <p className="text-lg font-mono font-bold text-rose-400">
                    {userResult.changedPercentage.toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {userResult.changedPixels.toLocaleString()} Converted Px
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Tables: Class-Wise Comparison & Major Transitions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Table A: Class-Wise Comparison */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  <span>Class-Wise Comparison (7 Benchmark Categories)</span>
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3 text-right">T1 Earlier</th>
                      <th className="py-2.5 px-3 text-right">T2 Later</th>
                      <th className="py-2.5 px-3 text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {userResult.classWiseStats.map((cls) => (
                      <tr key={cls.classId} className="hover:bg-slate-950/40 transition">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: cls.colorHex }}
                          ></span>
                          <span>{cls.className}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {cls.t1Percentage.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {cls.t2Percentage.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={
                              cls.diffPercentage > 0.05
                                ? 'text-emerald-400'
                                : cls.diffPercentage < -0.05
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {cls.diffPercentage > 0 ? `+${cls.diffPercentage.toFixed(1)}%` : `${cls.diffPercentage.toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table B: Major Transitions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>Detected Transition Trajectories (Actual Occurrences)</span>
                </h4>
              </div>

              {userResult.transitions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="py-2.5 px-3">T1 Class</th>
                        <th className="py-2.5 px-3">T2 Class</th>
                        <th className="py-2.5 px-3 text-right">Pixel Count</th>
                        <th className="py-2.5 px-3 text-right">% of Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                      {userResult.transitions.slice(0, 6).map((trans, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/40 transition">
                          <td className="py-2 px-3 font-sans font-medium text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: trans.fromColorHex }}
                            ></span>
                            <span>{trans.fromName}</span>
                          </td>
                          <td className="py-2 px-3 font-sans font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: trans.toColorHex }}
                              ></span>
                              <span>{trans.toName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {trans.pixelCount.toLocaleString()} px
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-cyan-400">
                            {trans.percentageOfChange.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No inter-class transitions detected across the image pair.
                </p>
              )}
            </div>
          </div>

          {/* 5. Simple Evidence-Based Environmental Observations */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Evidence-Based Environmental Observations</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {userResult.observations.map((obs) => (
                <div
                  key={obs.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{obs.title}</span>
                    <span className="font-mono text-[11px] text-cyan-400 font-semibold">{obs.metric}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {obs.observation}
                  </p>
                  <p className="text-slate-400 text-[10px] italic border-t border-slate-800/80 pt-1 mt-1">
                    {obs.academicImplication}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Export Results Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export Analysis Results</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Download generated PNG maps, CSV tabular data, or compile an academic PDF report
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleDownloadPng(userResult.changeMapDataUrl, 'GeoEcoAI_Change_Map.png')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                Change Map (PNG)
              </button>

              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                Transitions (CSV)
              </button>

              <button
                id="generate-user-pdf-btn"
                disabled={pdfGenerating}
                onClick={handleGeneratePdf}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pdfSuccess
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                }`}
              >
                {pdfGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating PDF...</span>
                  </>
                ) : pdfSuccess ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>✓ PDF Downloaded</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-cyan-200" />
                    <span>Generate & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
