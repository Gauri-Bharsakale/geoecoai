import { ScenarioDataset, LandCoverClass, TransitionMatrixCell, EnvironmentalObservation } from '../types';
import { SECOND_CLASSES } from '../data/scenarios';

export interface ClassStatisticsRow {
  classId: number;
  className: string;
  category: string;
  colorHex: string;
  t1AreaHa: number;
  t2AreaHa: number;
  diffHa: number;
  pctChange: number;
  t1PixelCount: number;
  t2PixelCount: number;
  diffPixels: number;
}

export interface QuantitativeAnalysisResult {
  rows: ClassStatisticsRow[];
  totalAreaHa: number;
  totalPixels: number;
  totalChangedAreaHa: number;
  totalChangedPixels: number;
  stabilityIndexPct: number; // % unchanged
  primaryTransition?: {
    fromName: string;
    toName: string;
    areaHa: number;
    percentage: number;
  };
}

/**
 * Computes exact quantitative class distribution and change statistics from scenario data
 */
export function calculateSceneStatistics(
  scenario: ScenarioDataset,
  classes: LandCoverClass[] = SECOND_CLASSES
): QuantitativeAnalysisResult {
  let totalT1Ha = 0;
  let totalT2Ha = 0;
  const rows: ClassStatisticsRow[] = [];

  classes.forEach((cls) => {
    const t1 = scenario.t1ClassDistribution[cls.id] || 0;
    const t2 = scenario.t2ClassDistribution[cls.id] || 0;
    totalT1Ha += t1;
    totalT2Ha += t2;

    const diff = t2 - t1;
    const pct = t1 > 0 ? (diff / t1) * 100 : t2 > 0 ? 100 : 0;
    const t1Pixels = Math.round((t1 / (scenario.totalAreaHa || 26.21)) * scenario.totalPixels);
    const t2Pixels = Math.round((t2 / (scenario.totalAreaHa || 26.21)) * scenario.totalPixels);

    rows.push({
      classId: cls.id,
      className: cls.displayName,
      category: cls.category,
      colorHex: cls.colorHex,
      t1AreaHa: Number(t1.toFixed(2)),
      t2AreaHa: Number(t2.toFixed(2)),
      diffHa: Number(diff.toFixed(2)),
      pctChange: Number(pct.toFixed(1)),
      t1PixelCount: t1Pixels,
      t2PixelCount: t2Pixels,
      diffPixels: t2Pixels - t1Pixels,
    });
  });

  // Calculate total changed area from explicit transitions
  let totalChangedHa = 0;
  let totalChangedPixels = 0;
  let maxTransition = { fromId: -1, toId: -1, areaHa: 0, percentage: 0 };

  if (scenario.transitions && scenario.transitions.length > 0) {
    scenario.transitions.forEach((t) => {
      totalChangedHa += t.areaHa;
      totalChangedPixels += t.pixelCount || Math.round((t.areaHa / scenario.totalAreaHa) * scenario.totalPixels);
      if (t.areaHa > maxTransition.areaHa) {
        maxTransition = { fromId: t.fromId, toId: t.toId, areaHa: t.areaHa, percentage: t.percentage };
      }
    });
  }

  const totalArea = scenario.totalAreaHa || Number(totalT1Ha.toFixed(2));
  const unchangedHa = Math.max(0, totalArea - totalChangedHa);
  const stabilityIndexPct = totalArea > 0 ? Number(((unchangedHa / totalArea) * 100).toFixed(1)) : 100;

  const fromCls = classes.find((c) => c.id === maxTransition.fromId);
  const toCls = classes.find((c) => c.id === maxTransition.toId);

  return {
    rows,
    totalAreaHa: totalArea,
    totalPixels: scenario.totalPixels,
    totalChangedAreaHa: Number(totalChangedHa.toFixed(2)),
    totalChangedPixels,
    stabilityIndexPct,
    primaryTransition:
      maxTransition.areaHa > 0 && fromCls && toCls
        ? {
            fromName: fromCls.displayName,
            toName: toCls.displayName,
            areaHa: Number(maxTransition.areaHa.toFixed(2)),
            percentage: Number(maxTransition.percentage.toFixed(1)),
          }
        : undefined,
  };
}

/**
 * Computes full 7x7 Transition Matrix for the scenario
 */
export function calculateTransitionMatrix(
  scenario: ScenarioDataset,
  classes: LandCoverClass[] = SECOND_CLASSES
): TransitionMatrixCell[][] {
  const matrix: TransitionMatrixCell[][] = [];

  const transitionLookup = new Map<string, number>();
  scenario.transitions.forEach((t) => {
    transitionLookup.set(`${t.fromId}_${t.toId}`, t.areaHa);
  });

  classes.forEach((fromClass) => {
    const row: TransitionMatrixCell[] = [];
    const t1Area = scenario.t1ClassDistribution[fromClass.id] || 0;

    let totalConvertedOut = 0;
    classes.forEach((toClass) => {
      if (fromClass.id !== toClass.id) {
        totalConvertedOut += transitionLookup.get(`${fromClass.id}_${toClass.id}`) || 0;
      }
    });

    const persistedArea = Math.max(0, t1Area - totalConvertedOut);

    classes.forEach((toClass) => {
      let area = 0;
      if (fromClass.id === toClass.id) {
        area = persistedArea;
      } else {
        area = transitionLookup.get(`${fromClass.id}_${toClass.id}`) || 0;
      }

      const pct = scenario.totalAreaHa > 0 ? (area / scenario.totalAreaHa) * 100 : 0;
      const pixels = Math.round((area / (scenario.totalAreaHa || 26.21)) * scenario.totalPixels);

      row.push({
        fromClassId: fromClass.id,
        toClassId: toClass.id,
        areaHa: Number(area.toFixed(2)),
        pixelCount: pixels,
        percentage: Number(pct.toFixed(2)),
      });
    });

    matrix.push(row);
  });

  return matrix;
}

/**
 * Generates cautious, academic environmental observations based strictly on calculated shifts
 */
export function generateAcademicEnvironmentalInsights(
  scenario: ScenarioDataset,
  classes: LandCoverClass[] = SECOND_CLASSES
): EnvironmentalObservation[] {
  const stats = calculateSceneStatistics(scenario, classes);
  const observations: EnvironmentalObservation[] = [];

  // Tree / Forest canopy (class 4)
  const treeRow = stats.rows.find((r) => r.classId === 4);
  if (treeRow && Math.abs(treeRow.diffHa) > 0.05) {
    if (treeRow.diffHa < 0) {
      observations.push({
        id: 'obs-tree-loss',
        classId: 4,
        title: 'Tree Canopy Reduction',
        metric: `${Math.abs(treeRow.pctChange).toFixed(1)}% reduction (${Math.abs(treeRow.diffHa).toFixed(2)} ha)`,
        type: 'decrease',
        observation: `Tree / Forest Canopy decreased from ${treeRow.t1AreaHa.toFixed(2)} ha to ${treeRow.t2AreaHa.toFixed(2)} ha between T1 and T2.`,
        academicImplication: 'Reduced tree-cover area indicates a decrease in woody vegetation coverage in the analyzed temporal window.',
      });
    } else {
      observations.push({
        id: 'obs-tree-gain',
        classId: 4,
        title: 'Tree Canopy Increase',
        metric: `+${treeRow.pctChange.toFixed(1)}% increase (+${treeRow.diffHa.toFixed(2)} ha)`,
        type: 'increase',
        observation: `Tree / Forest Canopy increased from ${treeRow.t1AreaHa.toFixed(2)} ha to ${treeRow.t2AreaHa.toFixed(2)} ha between T1 and T2.`,
        academicImplication: 'Increased tree canopy suggests expansion of woody vegetation or canopy recovery in the surveyed parcel.',
      });
    }
  }

  // Building / Urban (class 5)
  const urbanRow = stats.rows.find((r) => r.classId === 5);
  if (urbanRow && Math.abs(urbanRow.diffHa) > 0.05) {
    if (urbanRow.diffHa > 0) {
      observations.push({
        id: 'obs-urban-growth',
        classId: 5,
        title: 'Built-Up Area Expansion',
        metric: `+${urbanRow.pctChange.toFixed(1)}% increase (+${urbanRow.diffHa.toFixed(2)} ha)`,
        type: 'increase',
        observation: `Building / Urban Infrastructure increased from ${urbanRow.t1AreaHa.toFixed(2)} ha to ${urbanRow.t2AreaHa.toFixed(2)} ha.`,
        academicImplication: 'Increased built-up area indicates expansion of artificial and impervious surfaces across the observation window.',
      });
    } else {
      observations.push({
        id: 'obs-urban-decrease',
        classId: 5,
        title: 'Built-Up Surface Shift',
        metric: `${urbanRow.pctChange.toFixed(1)}% change (${urbanRow.diffHa.toFixed(2)} ha)`,
        type: 'decrease',
        observation: `Built-Up footprint decreased slightly from ${urbanRow.t1AreaHa.toFixed(2)} ha to ${urbanRow.t2AreaHa.toFixed(2)} ha.`,
        academicImplication: 'May indicate demolition, site clearance, or conversion to alternate use.',
      });
    }
  }

  // Water bodies (class 1)
  const waterRow = stats.rows.find((r) => r.classId === 1);
  if (waterRow && Math.abs(waterRow.diffHa) > 0.05) {
    if (waterRow.diffHa < 0) {
      observations.push({
        id: 'obs-water-loss',
        classId: 1,
        title: 'Surface Water Boundary Shift',
        metric: `${Math.abs(waterRow.pctChange).toFixed(1)}% change (${Math.abs(waterRow.diffHa).toFixed(2)} ha)`,
        type: 'decrease',
        observation: `Surface Water extent changed from ${waterRow.t1AreaHa.toFixed(2)} ha to ${waterRow.t2AreaHa.toFixed(2)} ha.`,
        academicImplication: 'Indicates a shift in observable open water surface or shoreline boundary between the two dates.',
      });
    } else {
      observations.push({
        id: 'obs-water-gain',
        classId: 1,
        title: 'Surface Water Boundary Expansion',
        metric: `+${waterRow.pctChange.toFixed(1)}% change (+${waterRow.diffHa.toFixed(2)} ha)`,
        type: 'increase',
        observation: `Surface Water area increased from ${waterRow.t1AreaHa.toFixed(2)} ha to ${waterRow.t2AreaHa.toFixed(2)} ha.`,
        academicImplication: 'Reflects seasonal water level variation or expansion of local retention area.',
      });
    }
  }

  // Primary land-cover transition trajectory
  if (stats.primaryTransition) {
    observations.push({
      id: 'obs-primary-transition',
      title: 'Dominant Transition Trajectory',
      metric: `${stats.primaryTransition.areaHa.toFixed(2)} ha (${stats.primaryTransition.percentage.toFixed(1)}% of changed area)`,
      type: 'neutral',
      observation: `The largest detected land-cover conversion was from "${stats.primaryTransition.fromName}" to "${stats.primaryTransition.toName}".`,
      academicImplication: 'Highlights the main spatial direction of land-cover transition in this dataset scene.',
    });
  }

  // Overall landscape stability
  observations.push({
    id: 'obs-stability',
    title: 'Landscape Stability Index',
    metric: `${stats.stabilityIndexPct}% Invariant`,
    type: 'neutral',
    observation: `${stats.stabilityIndexPct}% of the surveyed area remained in the same land-cover category between T1 and T2.`,
    academicImplication: 'Provides an overall baseline indicator of temporal landscape stability across the 512×512 area.',
  });

  return observations;
}
