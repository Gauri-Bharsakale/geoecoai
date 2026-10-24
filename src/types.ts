export interface LandCoverClass {
  id: number;
  name: string;
  displayName: string;
  colorHex: string;
  colorRgb: [number, number, number];
  category: 'Background' | 'Hydrosphere' | 'Lithosphere' | 'Biosphere' | 'Anthroposphere';
  description: string;
  iou: number;
}

export interface ScenarioDataset {
  id: string;
  title: string;
  sceneCode: string;
  regionDescription: string;
  temporalBaseline: string; // e.g. "2019-04 (T1)"
  temporalTarget: string;   // e.g. "2024-04 (T2)"
  sensor: string;
  gsd: string;             // e.g. "1.0 m / pixel"
  totalPixels: number;     // 512 * 512 = 262,144
  totalAreaHa: number;     // calculated or calibrated
  description: string;
  t1ClassDistribution: Record<number, number>; // classId -> ha or pixels
  t2ClassDistribution: Record<number, number>; // classId -> ha or pixels
  transitions: Array<{
    fromId: number;
    toId: number;
    areaHa: number;
    pixelCount: number;
    percentage: number;
  }>;
}

export interface TransitionMatrixCell {
  fromClassId: number;
  toClassId: number;
  areaHa: number;
  pixelCount: number;
  percentage: number;
}

export interface EnvironmentalObservation {
  id: string;
  classId?: number;
  title: string;
  metric: string;
  type: 'increase' | 'decrease' | 'neutral';
  observation: string;
  academicImplication: string;
}

export interface ModelBenchmarkStats {
  modelName: string;
  architectureType: string;
  backbone: string;
  decoder: string;
  mIoU: number;
  f1Score: number;
  accuracy: number;
  precision: number;
  recall: number;
  framework: string;
  lossFunction: string;
  datasetName: string;
  totalParameters: number;
  trainableParameters: number;
  nonTrainableParameters: number;
  parametersMillion: number;
}

export interface ModelExperimentLog {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  learningRate: string;
  optimizer: string;
  batchSize: number;
  epochs: number;
  lossFunction: string;
  augmentation: string;
  trainableLayers: string;
  valAccuracy: number;
  valF1: number;
  valIoU: number;
  isSelectedBest?: boolean;
  testAccuracy?: number;
  testF1?: number;
  testIoU?: number;
}

export interface TrainingHistoryPoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAcc: number;
  valAcc: number;
  trainIoU: number;
  valIoU: number;
}

export interface LayerSummaryItem {
  layerName: string;
  stage: string;
  outputShape: string;
  paramCount: number;
  trainable: boolean;
}

export interface ConfusionMatrixRow {
  actualClassId: number;
  actualClassName: string;
  predictions: number[]; // counts for each predicted class 0..6
  total: number;
}

export interface UserImageFile {
  name: string;
  size: number;
  width: number;
  height: number;
  channels: number;
  dataUrl: string;
  isValid: boolean;
  validationError?: string;
  preprocessedReady: boolean;
}

export interface UserClassWiseStat {
  classId: number;
  className: string;
  colorHex: string;
  t1Pixels: number;
  t1Percentage: number;
  t2Pixels: number;
  t2Percentage: number;
  diffPixels: number;
  diffPercentage: number;
}

export interface UserTransitionItem {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  fromColorHex: string;
  toColorHex: string;
  pixelCount: number;
  percentageOfChange: number;
}

export interface UserAnalysisResult {
  t1Image: UserImageFile;
  t2Image: UserImageFile;
  timestamp: string;
  totalPixels: number;
  unchangedPixels: number;
  changedPixels: number;
  unchangedPercentage: number;
  changedPercentage: number;
  classWiseStats: UserClassWiseStat[];
  transitions: UserTransitionItem[];
  observations: EnvironmentalObservation[];
  gsdMeters?: number; // Ground sample distance if user provided
  t1CanvasDataUrl?: string;
  t2CanvasDataUrl?: string;
  t1PredDataUrl?: string;
  t2PredDataUrl?: string;
  changeMapDataUrl?: string;
  // Confidence-Aware PCC Visual Maps & Fields
  t1ConfidenceDataUrl?: string;
  t2ConfidenceDataUrl?: string;
  highConfChangeDataUrl?: string;
  uncertainMapDataUrl?: string;
  caPccMapDataUrl?: string;
  confidenceThreshold?: number; // e.g. 0.80
  confidenceStats?: ConfidenceAwarePccStats;
  evaluation: SampleEvaluationResult;
  // Raw cached pixel arrays for fast client-side threshold adjustment
  t1ClassMapRaw?: Uint8Array;
  t2ClassMapRaw?: Uint8Array;
  t1ConfidencesRaw?: Float32Array;
  t2ConfidencesRaw?: Float32Array;
}

export type CaPccPixelState = 
  | 1 // High-confidence change
  | 2 // Uncertain change
  | 3 // High-confidence unchanged
  | 4; // Uncertain unchanged

export interface TransitionConfidenceItem {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  fromColorHex: string;
  toColorHex: string;
  totalPixels: number;
  highConfPixels: number;
  highConfPctOfTransition: number; // % of this specific transition that meets threshold
  uncertainPixels: number;
  pctOfAllHighConfChange: number; // % of total high-confidence change in scene
}

export interface BinaryConfusionCounts {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  total: number;
}

export interface ConfidencePccEvaluationComparison {
  standardBaseline: {
    coveragePct: number; // 100%
    rejectedPct: number; // 0%
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    iou: number;
    counts: BinaryConfusionCounts;
    description: string;
  };
  confidenceAware: {
    threshold: number;
    coveragePct: number; // % of valid pixels accepted
    rejectedPct: number; // % of valid pixels rejected as uncertain
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    iou: number;
    counts: BinaryConfusionCounts;
    description: string;
  };
  thresholdSensitivity: Array<{
    threshold: number;
    coveragePct: number;
    rejectedPct: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    iou: number;
  }>;
  scientificDiscussion: string;
}

export interface ConfidenceAwarePccStats {
  threshold: number; // e.g. 0.80
  totalValidPixels: number; // 262,144 px (512x512)
  
  // 4 Mutually Exclusive Categories (Sum to totalValidPixels and 100.0%)
  highConfChangedPixels: number;
  highConfChangedPct: number; // % of all valid pixels
  
  uncertainChangedPixels: number;
  uncertainChangedPct: number; // % of all valid pixels
  
  highConfUnchangedPixels: number;
  highConfUnchangedPct: number; // % of all valid pixels
  
  uncertainUnchangedPixels: number;
  uncertainUnchangedPct: number; // % of all valid pixels
  
  // Aggregate Metrics
  totalUncertainPixels: number; // uncertainChanged + uncertainUnchanged
  totalUncertainPct: number; // % of all valid pixels
  
  coveragePixels: number; // highConfChanged + highConfUnchanged
  coveragePct: number; // % of all valid pixels
  
  // Proportion of apparent changes that are rejected
  totalApparentChangedPixels: number;
  highConfOfApparentChangedPct: number; // highConfChanged / apparentChanged
  uncertainOfApparentChangedPct: number; // uncertainChanged / apparentChanged
  
  // Detailed transition confidence breakdown
  transitions: TransitionConfidenceItem[];
  
  // Ground truth evaluation comparison (when reference or GT masks available)
  evaluationComparison?: ConfidencePccEvaluationComparison;
}

export type TabType =
  | 'dashboard'
  | 'dataset'
  | 'model-evaluation'
  | 'temporal-analysis'
  | 'user-analysis'
  | 'change-detection'
  | 'statistics'
  | 'report';

export interface ClassEvaluationMetric {
  classId: number;
  className: string;
  colorHex: string;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  pixelCountGT: number;
  pixelCountPred: number;
  precision: number; // %
  recall: number; // %
  f1Score: number; // %
  iou: number; // %
}

export interface BinaryChangeMetrics {
  accuracy: number; // %
  precision: number; // %
  recall: number; // %
  f1Score: number; // %
  iou: number; // %
  trueChangePixels: number;
  predChangePixels: number;
  tpChangePixels: number;
}

export interface SampleEvaluationResult {
  available: true;
  scenarioId: string;
  sceneCode: string;
  title: string;
  totalEvaluatedPixels: number;
  evaluationTimestamp: string;
  
  // Overall & Macro Metrics
  pixelAccuracy: number; // Overall pixel-based accuracy %
  macroPrecision: number; // Macro average %
  macroRecall: number; // Macro average %
  macroF1: number; // Macro average %
  macroIoU: number; // Mean IoU / mIoU %

  // Weighted Average across classes
  weightedPrecision: number;
  weightedRecall: number;
  weightedF1: number;
  weightedIoU: number;

  // Change Detection Specific Binary Metrics
  changeMetrics: BinaryChangeMetrics;

  // 7x7 Confusion Matrix
  confusionMatrix: number[][]; // counts
  confusionMatrixNormalized: number[][]; // row-normalized %
  classNames: string[];
  classMetrics: ClassEvaluationMetric[];

  calculationMethodLabel: string;
  interpretation: string;
  isSampleReferenceFallback?: boolean;
  sourceLabel?: string;
  confidencePccComparison?: ConfidencePccEvaluationComparison;
}

export interface UnavailableMetricsResult {
  available: false;
  reason: string;
  explanation: string;
}

export type DynamicModelEvaluation = SampleEvaluationResult | UnavailableMetricsResult;


