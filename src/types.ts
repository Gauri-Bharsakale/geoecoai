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
  parametersMillion: number;
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


