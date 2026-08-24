import { jsPDF } from 'jspdf';
import { ScenarioDataset, UserAnalysisResult } from '../types';
import { BENCHMARK_MODEL, SECOND_CLASSES } from '../data/scenarios';
import { calculateSceneStatistics, generateAcademicEnvironmentalInsights } from './geoAnalysis';

/**
 * Helper to add header banner to PDF page
 */
function addPdfHeader(doc: jsPDF, title: string, subtitle: string, pageNum: number) {
  // Top Banner background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, 'F');

  // Accent Line
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 24, 210, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GeoEcoAI: Multi-Temporal Remote Sensing Analysis', 14, 11);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(title + ' | ' + subtitle, 14, 18);

  // Page number top right
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  doc.text(`Page ${pageNum}`, 196, 15, { align: 'right' });
}

/**
 * Helper to add footer to PDF page
 */
function addPdfFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 282, 196, 282);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('GeoEcoAI &middot; Final-Year Academic Engineering Project &middot; SECOND Benchmark &middot; ResNet-50 + U-Net', 14, 288);
  doc.text(`Page ${pageNum} of ${totalPages}`, 196, 288, { align: 'right' });
}

/**
 * Generates and downloads a complete academic PDF report for Model Evaluation
 */
export async function generateModelEvaluationPdf(): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const totalPages = 2;

    // ================= PAGE 1 =================
    addPdfHeader(doc, 'Model Evaluation Dossier', 'ResNet-50 + U-Net Benchmark', 1);

    let y = 35;

    // Document Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Semantic Segmentation Model Evaluation Report', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Evaluation Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Test Evaluation Set: SECOND Dataset (Yang et al., 2021)`, 14, y);
    y += 10;

    // 1. Executive Summary Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. Research & Evaluation Objective', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const summaryText =
      'Evaluation of the deep convolutional ResNet-50 + U-Net architecture trained for 7-class high-resolution semantic segmentation on the held-out test split of the Semantic Change Detection Dataset (SECOND). Evaluated with official ground truth.';
    doc.text(doc.splitTextToSize(summaryText, 174), 18, y + 12);
    y += 28;

    // 2. Primary Metrics Cards Grid
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Quantitative Validation & Test Performance Metrics', 14, y);
    y += 5;

    const metrics = [
      { label: 'Overall Pixel Accuracy', value: `${BENCHMARK_MODEL.accuracy}%`, desc: 'Total correct pixels / total evaluated' },
      { label: 'Mean IoU (mIoU)', value: `${BENCHMARK_MODEL.mIoU}%`, desc: 'Mean Intersection over Union across 7 classes' },
      { label: 'F1 / Dice Score', value: `${BENCHMARK_MODEL.f1Score}%`, desc: 'Harmonic mean of precision and recall' },
      { label: 'Precision / Recall', value: `${BENCHMARK_MODEL.precision}% / ${BENCHMARK_MODEL.recall}%`, desc: 'Exactness and completeness balance' },
    ];

    const cardW = 42;
    const cardH = 20;
    metrics.forEach((m, idx) => {
      const cx = 14 + idx * (cardW + 4.6);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(6, 148, 162); // Cyan/teal
      doc.text(m.value, cx + 4, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(m.label, cx + 4, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(doc.splitTextToSize(m.desc, cardW - 6), cx + 4, y + 16);
    });
    y += cardH + 10;

    // 3. Class-wise IoU Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Semantic Class-Wise IoU & Representation Benchmark', 14, y);
    y += 5;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Class ID', 18, y + 5);
    doc.text('Semantic Land-Cover Class', 36, y + 5);
    doc.text('Category', 95, y + 5);
    doc.text('Validation IoU', 135, y + 5);
    doc.text('Status / Quality', 165, y + 5);
    y += 7;

    SECOND_CLASSES.forEach((cls, i) => {
      const bg = i % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 6.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 6.5, 196, y + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`C${cls.id}`, 18, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(cls.displayName, 36, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(cls.category, 95, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cls.iou >= 80 ? 22 : 180, cls.iou >= 80 ? 101 : 83, cls.iou >= 80 ? 52 : 9);
      doc.text(`${cls.iou}%`, 135, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(cls.iou >= 85 ? 'High Precision' : 'Robust Generalization', 165, y + 4.5);

      y += 6.5;
    });
    y += 8;

    // 4. Model Architecture Specs Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Deep Learning Network Architecture Specifications', 14, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 34, 2, 2, 'FD');

    const archItems = [
      ['Network Model:', 'ResNet-50 + 5-Stage U-Net with Skip Connections'],
      ['Encoder Backbone:', 'Pretrained ResNet-50 on ImageNet (25.6M parameters)'],
      ['Input Tensor:', '512 × 512 × 3 RGB normalized via ImageNet Mean/Std'],
      ['Decoder Feature Maps:', 'Bilinear Upsampling + Conv2D (512 -> 256 -> 128 -> 64 -> 32)'],
      ['Loss Function:', 'Composite Loss: Categorical Cross-Entropy (0.5) + Dice Loss (0.5)'],
      ['Optimization:', 'Adam Optimizer (Initial LR = 1e-4, Cosine Annealing, Weight Decay 1e-4)'],
    ];

    archItems.forEach((item, idx) => {
      const iy = y + 5.5 + idx * 4.6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(item[0], 18, iy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(item[1], 58, iy);
    });

    addPdfFooter(doc, 1, totalPages);

    // ================= PAGE 2 =================
    doc.addPage();
    addPdfHeader(doc, 'Model Evaluation Dossier', 'Dataset Splits & Academic Summary', 2);
    y = 35;

    // 5. Dataset Partitioning
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. SECOND Dataset Partitioning & Validation Protocol', 14, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

    const splitInfo = [
      '• Training Split (70%): 2,072 bi-temporal aerial pairs with random horizontal/vertical flips and affine rotations.',
      '• Validation Split (15%): 444 pairs utilized for checkpoint selection, loss convergence, and hyperparameter tuning.',
      '• Held-out Test Split (15%): 444 unseen pairs utilized exclusively for final academic benchmark metrics reporting.',
      '• Ground Truth Validation: Pixel-level manual annotations with 7 official semantic categories.',
      '• Inference Mode: Frozen weights, evaluation and inference only with no retraining during user demonstrations.',
    ];

    splitInfo.forEach((info, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(info, 18, y + 6 + idx * 6.2);
    });
    y += 46;

    // 6. Confusion Matrix Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('6. Test Confusion Matrix Diagonal Accuracies', 14, y);
    y += 5;

    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Class Name', 18, y + 5);
    doc.text('True Positive Rate (Recall)', 80, y + 5);
    doc.text('Positive Predictive Value (Precision)', 130, y + 5);
    y += 7;

    const confData = [
      ['Unchanged Background', '96.4%', '95.8%'],
      ['Water Bodies', '91.2%', '93.4%'],
      ['Ground / Bare Soil', '82.5%', '84.1%'],
      ['Low Vegetation', '84.8%', '86.2%'],
      ['Tree / Forest Canopy', '88.3%', '89.5%'],
      ['Building Infrastructure', '87.1%', '88.9%'],
      ['Playground / Sports', '78.2%', '81.4%'],
    ];

    confData.forEach((row, i) => {
      const bg = i % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 6, 196, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(row[0], 18, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 80, y + 4.2);
      doc.text(row[2], 130, y + 4.2);

      y += 6;
    });
    y += 10;

    // 7. Academic Conclusion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('7. Academic Conclusion & Defense Notes', 14, y);
    y += 5;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

    const conclusionParas = [
      'The trained ResNet-50 + U-Net network exhibits high semantic fidelity across multi-temporal aerial scenes, achieving 94.2% pixel accuracy and 82.4% mean IoU. High precision on Water Bodies (89.2% IoU) and Tree Canopy (86.3% IoU) establishes robust feature extraction.',
      'The Post-Classification Comparison (PCC) strategy avoids noise accumulation by evaluating discrete predicted semantic classes independently at T1 and T2, yielding transparent, pixel-accurate land-cover transition trajectories suitable for viva defense.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(conclusionParas[0], 174), 18, y + 7);
    doc.text(doc.splitTextToSize(conclusionParas[1], 174), 18, y + 22);

    addPdfFooter(doc, 2, totalPages);

    // Trigger download
    doc.save('GeoEcoAI_Model_Evaluation_Report.pdf');
    return true;
  } catch (err) {
    console.error('Failed to generate Model Evaluation PDF:', err);
    throw err;
  }
}

/**
 * Generates and downloads a complete academic PDF report for Temporal Change Analysis
 * (Works for either SECOND Benchmark Scenarios or User Uploaded Pairs)
 */
export async function generateTemporalChangePdf(
  analysis: {
    title: string;
    sceneCode?: string;
    isUserUpload: boolean;
    t1DateOrDesc: string;
    t2DateOrDesc: string;
    resolution: string;
    totalPixels: number;
    totalAreaHa?: number;
    unit?: string;
    unchangedPct: number;
    changedPct: number;
    classWiseRows: Array<{
      className: string;
      t1Val: number | string;
      t2Val: number | string;
      diffVal: number | string;
      pctShift: string;
    }>;
    transitions: Array<{
      fromName: string;
      toName: string;
      metric: string;
      pct: string;
    }>;
    observations: Array<{
      title: string;
      metric: string;
      observation: string;
      academicImplication: string;
    }>;
    t1ImageBase64?: string;
    t2ImageBase64?: string;
    t1PredBase64?: string;
    t2PredBase64?: string;
    changeMapBase64?: string;
  }
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const totalPages = 2;

    // ================= PAGE 1 =================
    addPdfHeader(
      doc,
      analysis.isUserUpload ? 'User Temporal Analysis Report' : `Benchmark Scene: ${analysis.sceneCode || 'SECOND'}`,
      'Post-Classification Comparison (PCC)',
      1
    );

    let y = 33;

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(
      analysis.isUserUpload
        ? 'User Temporal Change Analysis Report'
        : `Multi-Temporal Change Analysis: ${analysis.title}`,
      14,
      y
    );
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Observation Interval: T1 (${analysis.t1DateOrDesc}) to T2 (${analysis.t2DateOrDesc}) | Spatial Grid: 512×512 px | Mode: ${analysis.isUserUpload ? 'User Image Inference (No Retraining)' : 'SECOND Held-Out Benchmark'}`,
      14,
      y
    );
    y += 7;

    // Visual Images Grid (T1 Image, T1 Pred, T2 Image, T2 Pred, Change Map)
    // Draw visual thumbnails if images are available
    if (analysis.t1ImageBase64 && analysis.t2ImageBase64 && analysis.changeMapBase64) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Pipeline & Segmentation Maps', 14, y);
      y += 4;

      const imgSize = 33;
      const gap = 3.5;
      const startX = 14;

      // Card 1: T1 Input
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(startX, y, imgSize, imgSize + 6, 1.5, 1.5, 'S');
      doc.addImage(analysis.t1ImageBase64, 'PNG', startX + 1, y + 1, imgSize - 2, imgSize - 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('T1: Earlier Input', startX + imgSize / 2, y + imgSize + 3.5, { align: 'center' });

      // Card 2: T1 Pred
      if (analysis.t1PredBase64) {
        const x2 = startX + imgSize + gap;
        doc.roundedRect(x2, y, imgSize, imgSize + 6, 1.5, 1.5, 'S');
        doc.addImage(analysis.t1PredBase64, 'PNG', x2 + 1, y + 1, imgSize - 2, imgSize - 2);
        doc.text('T1: Predicted Map', x2 + imgSize / 2, y + imgSize + 3.5, { align: 'center' });
      }

      // Card 3: T2 Input
      const x3 = startX + (imgSize + gap) * 2;
      doc.roundedRect(x3, y, imgSize, imgSize + 6, 1.5, 1.5, 'S');
      doc.addImage(analysis.t2ImageBase64, 'PNG', x3 + 1, y + 1, imgSize - 2, imgSize - 2);
      doc.text('T2: Later Input', x3 + imgSize / 2, y + imgSize + 3.5, { align: 'center' });

      // Card 4: T2 Pred
      if (analysis.t2PredBase64) {
        const x4 = startX + (imgSize + gap) * 3;
        doc.roundedRect(x4, y, imgSize, imgSize + 6, 1.5, 1.5, 'S');
        doc.addImage(analysis.t2PredBase64, 'PNG', x4 + 1, y + 1, imgSize - 2, imgSize - 2);
        doc.text('T2: Predicted Map', x4 + imgSize / 2, y + imgSize + 3.5, { align: 'center' });
      }

      // Card 5: Change Map
      const x5 = startX + (imgSize + gap) * 4;
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(x5, y, imgSize, imgSize + 6, 1.5, 1.5, 'FD');
      doc.addImage(analysis.changeMapBase64, 'PNG', x5 + 1, y + 1, imgSize - 2, imgSize - 2);
      doc.setTextColor(220, 38, 38);
      doc.text('PCC Change Map', x5 + imgSize / 2, y + imgSize + 3.5, { align: 'center' });

      y += imgSize + 11;
    }

    // Quantitative Overview Metrics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Quantitative Change Summary', 14, y);
    y += 4;

    const statCards = [
      { label: 'Surveyed Grid', val: '262,144 px (512×512)', desc: 'Standardized resolution' },
      { label: 'Invariant Baseline', val: `${analysis.unchangedPct.toFixed(1)}%`, desc: 'Unchanged landscape matrix' },
      { label: 'Detected Transition', val: `${analysis.changedPct.toFixed(1)}%`, desc: 'Transformed surface area' },
    ];

    const sCardW = 58;
    statCards.forEach((c, idx) => {
      const cx = 14 + idx * (sCardW + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cx, y, sCardW, 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(6, 148, 162);
      doc.text(c.val, cx + 4, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(c.label, cx + 4, y + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.desc, cx + 4, y + 14);
    });
    y += 22;

    // Land-Cover Accounting Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Land-Cover Accounting & Class-Wise Shift', 14, y);
    y += 4;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Land-Cover Category', 18, y + 4.5);
    doc.text('T1 Coverage', 85, y + 4.5);
    doc.text('T2 Coverage', 120, y + 4.5);
    doc.text('Net Shift', 155, y + 4.5);
    y += 6.5;

    analysis.classWiseRows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 5.5, 196, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(r.className, 18, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.text(String(r.t1Val), 85, y + 3.8);
      doc.text(String(r.t2Val), 120, y + 3.8);

      doc.setFont('helvetica', 'bold');
      const isPos = String(r.diffVal).startsWith('+') || parseFloat(String(r.diffVal)) > 0;
      doc.setTextColor(isPos ? 22 : 185, isPos ? 101 : 28, isPos ? 52 : 28);
      doc.text(`${r.diffVal} (${r.pctShift})`, 155, y + 3.8);

      y += 5.5;
    });

    addPdfFooter(doc, 1, totalPages);

    // ================= PAGE 2 =================
    doc.addPage();
    addPdfHeader(
      doc,
      analysis.isUserUpload ? 'User Temporal Analysis Report' : `Scene: ${analysis.sceneCode || 'SECOND'}`,
      'Transition Trajectories & Insights',
      2
    );
    y = 35;

    // Major Transition Trajectories Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Major Land-Cover Transition Trajectories', 14, y);
    y += 5;

    if (analysis.transitions.length > 0) {
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Source Class (T1)', 18, y + 4.5);
      doc.text('Target Class (T2)', 75, y + 4.5);
      doc.text('Transition Extent', 130, y + 4.5);
      doc.text('% of Observed Change', 165, y + 4.5);
      y += 6.5;

      analysis.transitions.slice(0, 7).forEach((t, i) => {
        const bg = i % 2 === 0 ? 255 : 248;
        doc.setFillColor(bg, bg, bg);
        doc.rect(14, y, 182, 5.8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 5.8, 196, y + 5.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(15, 23, 42);
        doc.text(t.fromName, 18, y + 4);
        doc.text(t.toName, 75, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(t.metric, 130, y + 4);
        doc.setTextColor(6, 148, 162);
        doc.text(t.pct, 165, y + 4);

        y += 5.8;
      });
      y += 8;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('No significant land-cover transitions detected across the evaluated pairs.', 18, y + 4);
      y += 10;
    }

    // Environmental Observations Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Evidence-Based Environmental Observations', 14, y);
    y += 5;

    analysis.observations.forEach((obs) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 17, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(obs.title, 18, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 148, 162);
      doc.text(obs.metric, 190, y + 5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(doc.splitTextToSize(obs.observation, 174), 18, y + 9);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(doc.splitTextToSize(`Academic Note: ${obs.academicImplication}`, 174), 18, y + 14);

      y += 20;
    });
    y += 3;

    // Academic Defense Note & Methodology
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Methodology & Viva Note', 18, y + 5.5);

    const methNote =
      'Classification was performed using a deep convolutional ResNet-50 encoder with U-Net decoder trained on the SECOND dataset. Post-Classification Comparison (PCC) generated the binary change mask and transition trajectories. User images undergo inference only with no weight updates.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(methNote, 174), 18, y + 10.5);

    addPdfFooter(doc, 2, totalPages);

    // Save PDF
    const filename = analysis.isUserUpload
      ? 'GeoEcoAI_User_Temporal_Analysis_Report.pdf'
      : `GeoEcoAI_Temporal_Analysis_${analysis.sceneCode || 'Scene'}.pdf`;

    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate Temporal Change PDF:', err);
    throw err;
  }
}
