import {
  ConfidenceAwarePccStats,
  ConfidencePccEvaluationComparison,
  TransitionConfidenceItem,
  CaPccPixelState,
} from '../types';
import { SECOND_CLASSES } from '../data/scenarios';

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;
export const MIN_CONFIDENCE_THRESHOLD = 0.5;
export const MAX_CONFIDENCE_THRESHOLD = 0.99;

export const CA_PCC_STATES = {
  HIGH_CONF_CHANGE: 1 as CaPccPixelState,
  UNCERTAIN_CHANGE: 2 as CaPccPixelState,
  HIGH_CONF_UNCHANGED: 3 as CaPccPixelState,
  UNCERTAIN_UNCHANGED: 4 as CaPccPixelState,
};

// Distinct colors conforming to research guidelines:
// High-confidence change: Red
// High-confidence unchanged: Green
// Uncertain change: Vibrant Orange
// Uncertain unchanged: Amber/Yellow
// No-data / neutral: Dark slate
export const CA_PCC_COLORS = {
  HIGH_CONF_CHANGE: { hex: '#EF4444', rgb: [239, 68, 68] as [number, number, number], label: 'High-Confidence Change' },
  HIGH_CONF_UNCHANGED: { hex: '#10B981', rgb: [16, 185, 129] as [number, number, number], label: 'High-Confidence Unchanged' },
  UNCERTAIN_CHANGE: { hex: '#F97316', rgb: [249, 115, 22] as [number, number, number], label: 'Uncertain Change' },
  UNCERTAIN_UNCHANGED: { hex: '#FBBF24', rgb: [251, 191, 36] as [number, number, number], label: 'Uncertain Unchanged' },
  NEUTRAL_BACKGROUND: { hex: '#0F172A', rgb: [15, 23, 42] as [number, number, number], label: 'Neutral / Invariant' },
};

/**
 * Computes Confidence-Aware PCC statistics and pixel state assignment.
 * Assigns each pixel to one of four mutually exclusive categories:
 *  1. High-Confidence Change: T1 != T2 && T1_conf >= tau && T2_conf >= tau
 *  2. Uncertain Change: T1 != T2 && (T1_conf < tau || T2_conf < tau)
 *  3. High-Confidence Unchanged: T1 == T2 && T1_conf >= tau && T2_conf >= tau
 *  4. Uncertain Unchanged: T1 == T2 && (T1_conf < tau || T2_conf < tau)
 */
export function computeConfidenceAwarePcc(
  t1ClassMap: Uint8Array | number[],
  t1Confidences: Float32Array | number[],
  t2ClassMap: Uint8Array | number[],
  t2Confidences: Float32Array | number[],
  threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
  totalPixels: number = 262144
): {
  stats: ConfidenceAwarePccStats;
  pixelStates: Uint8Array;
} {
  const pixelStates = new Uint8Array(totalPixels);

  let highConfChangedCount = 0;
  let uncertainChangedCount = 0;
  let highConfUnchangedCount = 0;
  let uncertainUnchangedCount = 0;

  // Track transitions: [fromId][toId] -> { total, highConf, uncertain }
  const transMap = new Map<string, { total: number; highConf: number; uncertain: number }>();

  for (let i = 0; i < totalPixels; i++) {
    const c1 = t1ClassMap[i];
    const c2 = t2ClassMap[i];
    const conf1 = t1Confidences[i];
    const conf2 = t2Confidences[i];

    const isDifferent = c1 !== c2;
    const isBothConfident = conf1 >= threshold && conf2 >= threshold;

    if (isDifferent) {
      const key = `${c1}_${c2}`;
      let trans = transMap.get(key);
      if (!trans) {
        trans = { total: 0, highConf: 0, uncertain: 0 };
        transMap.set(key, trans);
      }
      trans.total++;

      if (isBothConfident) {
        pixelStates[i] = CA_PCC_STATES.HIGH_CONF_CHANGE;
        highConfChangedCount++;
        trans.highConf++;
      } else {
        pixelStates[i] = CA_PCC_STATES.UNCERTAIN_CHANGE;
        uncertainChangedCount++;
        trans.uncertain++;
      }
    } else {
      if (isBothConfident) {
        pixelStates[i] = CA_PCC_STATES.HIGH_CONF_UNCHANGED;
        highConfUnchangedCount++;
      } else {
        pixelStates[i] = CA_PCC_STATES.UNCERTAIN_UNCHANGED;
        uncertainUnchangedCount++;
      }
    }
  }

  // Denominator is strictly totalValidPixels
  const totalValidPixels = totalPixels;
  const highConfChangedPct = (highConfChangedCount / totalValidPixels) * 100;
  const uncertainChangedPct = (uncertainChangedCount / totalValidPixels) * 100;
  const highConfUnchangedPct = (highConfUnchangedCount / totalValidPixels) * 100;
  const uncertainUnchangedPct = (uncertainUnchangedCount / totalValidPixels) * 100;

  const totalUncertainPixels = uncertainChangedCount + uncertainUnchangedCount;
  const totalUncertainPct = (totalUncertainPixels / totalValidPixels) * 100;

  const coveragePixels = highConfChangedCount + highConfUnchangedCount;
  const coveragePct = (coveragePixels / totalValidPixels) * 100;

  const totalApparentChangedPixels = highConfChangedCount + uncertainChangedCount;
  const highConfOfApparentChangedPct =
    totalApparentChangedPixels > 0 ? (highConfChangedCount / totalApparentChangedPixels) * 100 : 0;
  const uncertainOfApparentChangedPct =
    totalApparentChangedPixels > 0 ? (uncertainChangedCount / totalApparentChangedPixels) * 100 : 0;

  // Build transition list
  const transitions: TransitionConfidenceItem[] = [];
  transMap.forEach((val, key) => {
    const [fromStr, toStr] = key.split('_');
    const fromId = parseInt(fromStr, 10);
    const toId = parseInt(toStr, 10);
    const fromCls = SECOND_CLASSES.find((c) => c.id === fromId) || SECOND_CLASSES[0];
    const toCls = SECOND_CLASSES.find((c) => c.id === toId) || SECOND_CLASSES[0];

    const highConfPctOfTrans = val.total > 0 ? (val.highConf / val.total) * 100 : 0;
    const pctOfAllHighConf = highConfChangedCount > 0 ? (val.highConf / highConfChangedCount) * 100 : 0;

    transitions.push({
      fromId,
      fromName: fromCls.displayName,
      toId,
      toName: toCls.displayName,
      fromColorHex: fromCls.colorHex,
      toColorHex: toCls.colorHex,
      totalPixels: val.total,
      highConfPixels: val.highConf,
      highConfPctOfTransition: highConfPctOfTrans,
      uncertainPixels: val.uncertain,
      pctOfAllHighConfChange: pctOfAllHighConf,
    });
  });

  // Sort descending by high-confidence pixel count
  transitions.sort((a, b) => b.highConfPixels - a.highConfPixels);

  const stats: ConfidenceAwarePccStats = {
    threshold,
    totalValidPixels,
    highConfChangedPixels: highConfChangedCount,
    highConfChangedPct: Number(highConfChangedPct.toFixed(2)),
    uncertainChangedPixels: uncertainChangedCount,
    uncertainChangedPct: Number(uncertainChangedPct.toFixed(2)),
    highConfUnchangedPixels: highConfUnchangedCount,
    highConfUnchangedPct: Number(highConfUnchangedPct.toFixed(2)),
    uncertainUnchangedPixels: uncertainUnchangedCount,
    uncertainUnchangedPct: Number(uncertainUnchangedPct.toFixed(2)),
    totalUncertainPixels,
    totalUncertainPct: Number(totalUncertainPct.toFixed(2)),
    coveragePixels,
    coveragePct: Number(coveragePct.toFixed(2)),
    totalApparentChangedPixels,
    highConfOfApparentChangedPct: Number(highConfOfApparentChangedPct.toFixed(2)),
    uncertainOfApparentChangedPct: Number(uncertainOfApparentChangedPct.toFixed(2)),
    transitions,
  };

  return { stats, pixelStates };
}

/**
 * Generates an RGB visual heatmap representing prediction confidence.
 * Maps confidence values [0.50, 1.00] to a clear perceptual color gradient:
 *  - <= 0.55: Deep violet/indigo (low certainty)
 *  - 0.55 - 0.70: Cyan / Teal
 *  - 0.70 - 0.85: Green / Amber
 *  - >= 0.85: High-intensity bright amber / warm white (very high certainty)
 */
export function generateConfidenceHeatmapDataUrl(
  confidences: Float32Array | number[],
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const conf = Math.max(0, Math.min(1, confidences[i]));

    // Map 0.40 - 1.00 to 0.0 - 1.0
    const norm = Math.max(0, Math.min(1, (conf - 0.4) / 0.6));

    let r = 0, g = 0, b = 0;
    if (norm < 0.33) {
      // 0.0 -> 0.33: Deep indigo (20, 24, 82) to Teal (14, 165, 233)
      const t = norm / 0.33;
      r = Math.round(20 * (1 - t) + 14 * t);
      g = Math.round(24 * (1 - t) + 165 * t);
      b = Math.round(82 * (1 - t) + 233 * t);
    } else if (norm < 0.66) {
      // 0.33 -> 0.66: Teal (14, 165, 233) to Emerald (16, 185, 129)
      const t = (norm - 0.33) / 0.33;
      r = Math.round(14 * (1 - t) + 16 * t);
      g = Math.round(165 * (1 - t) + 185 * t);
      b = Math.round(233 * (1 - t) + 129 * t);
    } else {
      // 0.66 -> 1.0: Emerald (16, 185, 129) to Bright Amber / Yellow (245, 158, 11)
      const t = (norm - 0.66) / 0.34;
      r = Math.round(16 * (1 - t) + 245 * t);
      g = Math.round(185 * (1 - t) + 158 * t);
      b = Math.round(129 * (1 - t) + 11 * t);
    }

    imgData.data[idx] = r;
    imgData.data[idx + 1] = g;
    imgData.data[idx + 2] = b;
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Generates the High-Confidence Change Map:
 * Only transitions meeting the confidence threshold are rendered in red;
 * all other pixels (high-conf unchanged, uncertain change, uncertain unchanged)
 * are dimmed to neutral dark slate.
 */
export function generateHighConfChangeDataUrl(
  pixelStates: Uint8Array,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const state = pixelStates[i];

    if (state === CA_PCC_STATES.HIGH_CONF_CHANGE) {
      imgData.data[idx] = 239;     // Red
      imgData.data[idx + 1] = 68;
      imgData.data[idx + 2] = 68;
    } else {
      imgData.data[idx] = 15;      // Slate-900 background
      imgData.data[idx + 1] = 23;
      imgData.data[idx + 2] = 42;
    }
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Generates the Uncertain Prediction Map:
 * Highlights pixels where change or no-change decisions have insufficient confidence.
 * Uncertain changes: Orange (#F97316)
 * Uncertain unchanged: Amber/Yellow (#FBBF24)
 * High confidence pixels: Slate-900 neutral
 */
export function generateUncertainMapDataUrl(
  pixelStates: Uint8Array,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const state = pixelStates[i];

    if (state === CA_PCC_STATES.UNCERTAIN_CHANGE) {
      imgData.data[idx] = 249;     // Orange
      imgData.data[idx + 1] = 115;
      imgData.data[idx + 2] = 22;
    } else if (state === CA_PCC_STATES.UNCERTAIN_UNCHANGED) {
      imgData.data[idx] = 251;     // Amber
      imgData.data[idx + 1] = 191;
      imgData.data[idx + 2] = 36;
    } else {
      imgData.data[idx] = 15;      // Slate-900
      imgData.data[idx + 1] = 23;
      imgData.data[idx + 2] = 42;
    }
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Generates the unified Confidence-Aware PCC Map:
 * Combines high-confidence changes (red), high-confidence unchanged (emerald green),
 * and uncertain areas (orange for uncertain change, amber for uncertain unchanged).
 */
export function generateCaPccMapDataUrl(
  pixelStates: Uint8Array,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const state = pixelStates[i];

    if (state === CA_PCC_STATES.HIGH_CONF_CHANGE) {
      imgData.data[idx] = 239;     // Red
      imgData.data[idx + 1] = 68;
      imgData.data[idx + 2] = 68;
    } else if (state === CA_PCC_STATES.HIGH_CONF_UNCHANGED) {
      imgData.data[idx] = 16;      // Emerald Green
      imgData.data[idx + 1] = 185;
      imgData.data[idx + 2] = 129;
    } else if (state === CA_PCC_STATES.UNCERTAIN_CHANGE) {
      imgData.data[idx] = 249;     // Vibrant Orange
      imgData.data[idx + 1] = 115;
      imgData.data[idx + 2] = 22;
    } else if (state === CA_PCC_STATES.UNCERTAIN_UNCHANGED) {
      imgData.data[idx] = 251;     // Amber / Yellow
      imgData.data[idx + 1] = 191;
      imgData.data[idx + 2] = 36;
    } else {
      imgData.data[idx] = 15;      // Dark Slate
      imgData.data[idx + 1] = 23;
      imgData.data[idx + 2] = 42;
    }
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Evaluates whether Confidence-Aware PCC improves transition reliability
 * compared with Standard PCC on ground-truth verified test imagery.
 */
export function evaluateGroundTruthConfidencePcc(
  gtT1: Uint8Array | number[],
  gtT2: Uint8Array | number[],
  predT1: Uint8Array | number[],
  confT1: Float32Array | number[],
  predT2: Uint8Array | number[],
  confT2: Float32Array | number[],
  threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
  totalPixels: number = 262144
): ConfidencePccEvaluationComparison {
  // 1. Standard PCC Baseline (Evaluated on ALL pixels, 100% coverage)
  let baseTP = 0, baseFP = 0, baseFN = 0, baseTN = 0;

  for (let i = 0; i < totalPixels; i++) {
    const isGtChange = gtT1[i] !== gtT2[i];
    const isPredChange = predT1[i] !== predT2[i];

    if (isGtChange && isPredChange) baseTP++;
    else if (!isGtChange && isPredChange) baseFP++;
    else if (isGtChange && !isPredChange) baseFN++;
    else baseTN++;
  }

  const baseAcc = ((baseTP + baseTN) / totalPixels) * 100;
  const basePrec = baseTP + baseFP > 0 ? (baseTP / (baseTP + baseFP)) * 100 : 100;
  const baseRec = baseTP + baseFN > 0 ? (baseTP / (baseTP + baseFN)) * 100 : 100;
  const baseF1 = basePrec + baseRec > 0 ? (2 * basePrec * baseRec) / (basePrec + baseRec) : 0;
  const baseIoU = baseTP + baseFP + baseFN > 0 ? (baseTP / (baseTP + baseFP + baseFN)) * 100 : 100;

  // 2. Multi-threshold sensitivity analysis on the exact test split
  const testThresholds = [0.6, 0.7, 0.8, 0.9, 0.95];
  const thresholdSensitivity = testThresholds.map((th) => {
    let selTP = 0, selFP = 0, selFN = 0, selTN = 0;
    let accepted = 0;

    for (let i = 0; i < totalPixels; i++) {
      const isConfident = confT1[i] >= th && confT2[i] >= th;
      if (!isConfident) continue; // Rejected as uncertain

      accepted++;
      const isGtChange = gtT1[i] !== gtT2[i];
      const isPredChange = predT1[i] !== predT2[i];

      if (isGtChange && isPredChange) selTP++;
      else if (!isGtChange && isPredChange) selFP++;
      else if (isGtChange && !isPredChange) selFN++;
      else selTN++;
    }

    const covPct = (accepted / totalPixels) * 100;
    const rejPct = 100 - covPct;
    const acc = accepted > 0 ? ((selTP + selTN) / accepted) * 100 : 0;
    const prec = selTP + selFP > 0 ? (selTP / (selTP + selFP)) * 100 : 100;
    const rec = selTP + selFN > 0 ? (selTP / (selTP + selFN)) * 100 : 100;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    const iou = selTP + selFP + selFN > 0 ? (selTP / (selTP + selFP + selFN)) * 100 : 100;

    return {
      threshold: th,
      coveragePct: Number(covPct.toFixed(2)),
      rejectedPct: Number(rejPct.toFixed(2)),
      accuracy: Number(acc.toFixed(2)),
      precision: Number(prec.toFixed(2)),
      recall: Number(rec.toFixed(2)),
      f1Score: Number(f1.toFixed(2)),
      iou: Number(iou.toFixed(2)),
    };
  });

  // 3. Selective Metrics for chosen threshold
  let caTP = 0, caFP = 0, caFN = 0, caTN = 0;
  let caAccepted = 0;

  for (let i = 0; i < totalPixels; i++) {
    const isConfident = confT1[i] >= threshold && confT2[i] >= threshold;
    if (!isConfident) continue;

    caAccepted++;
    const isGtChange = gtT1[i] !== gtT2[i];
    const isPredChange = predT1[i] !== predT2[i];

    if (isGtChange && isPredChange) caTP++;
    else if (!isGtChange && isPredChange) caFP++;
    else if (isGtChange && !isPredChange) caFN++;
    else caTN++;
  }

  const caCovPct = (caAccepted / totalPixels) * 100;
  const caRejPct = 100 - caCovPct;
  const caAcc = caAccepted > 0 ? ((caTP + caTN) / caAccepted) * 100 : 0;
  const caPrec = caTP + caFP > 0 ? (caTP / (caTP + caFP)) * 100 : 100;
  const caRec = caTP + caFN > 0 ? (caTP / (caTP + caFN)) * 100 : 100;
  const caF1 = caPrec + caRec > 0 ? (2 * caPrec * caRec) / (caPrec + caRec) : 0;
  const caIoU = caTP + caFP + caFN > 0 ? (caTP / (caTP + caFP + caFN)) * 100 : 100;

  const precDelta = caPrec - basePrec;
  const discussion = `Confidence-Aware PCC introduces a selective decision rule that screens apparent transitions against joint prediction confidence (τ = ${(threshold * 100).toFixed(0)}%). On this verified test evaluation, CA-PCC filters ambiguous boundary and spectral mixed pixels, raising change precision by ${precDelta >= 0 ? '+' : ''}${precDelta.toFixed(1)} percentage points (${basePrec.toFixed(1)}% → ${caPrec.toFixed(1)}%) and change IoU to ${caIoU.toFixed(1)}%. This reliability gain is accompanied by a coverage reduction to ${caCovPct.toFixed(1)}% of valid pixels, with ${caRejPct.toFixed(1)}% explicitly isolated as uncertain. Crucially, uncertain pixels are not misclassified as invariant, preventing false certainty in sensitive environmental management contexts.`;

  return {
    standardBaseline: {
      coveragePct: 100,
      rejectedPct: 0,
      accuracy: Number(baseAcc.toFixed(2)),
      precision: Number(basePrec.toFixed(2)),
      recall: Number(baseRec.toFixed(2)),
      f1Score: Number(baseF1.toFixed(2)),
      iou: Number(baseIoU.toFixed(2)),
      counts: { tp: baseTP, fp: baseFP, fn: baseFN, tn: baseTN, total: totalPixels },
      description: 'Standard Post-Classification Comparison (Full 100% Coverage, No Confidence Screening)',
    },
    confidenceAware: {
      threshold,
      coveragePct: Number(caCovPct.toFixed(2)),
      rejectedPct: Number(caRejPct.toFixed(2)),
      accuracy: Number(caAcc.toFixed(2)),
      precision: Number(caPrec.toFixed(2)),
      recall: Number(caRec.toFixed(2)),
      f1Score: Number(caF1.toFixed(2)),
      iou: Number(caIoU.toFixed(2)),
      counts: { tp: caTP, fp: caFP, fn: caFN, tn: caTN, total: caAccepted },
      description: `Confidence-Aware PCC (Selective Screening at τ = ${(threshold * 100).toFixed(0)}%)`,
    },
    thresholdSensitivity,
    scientificDiscussion: discussion,
  };
}
