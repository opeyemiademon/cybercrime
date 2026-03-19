import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from './utils';
import type { ForensicReportData } from './api_services/forensicReportApiServices';

// ─── Shared interfaces ───────────────────────────────────────────────────────

interface CaseData {
  caseId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  investigatorName?: string;
  suspectLabel?: string;
  location?: string;
  incidentDate?: string;
  evidenceCount?: number;
  notes?: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
  createdAt: string;
  updatedAt: string;
}

interface EvidenceData {
  evidenceId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  evidenceType: string;
  hash: string;
  hashAlgorithm: string;
  sourceDevice?: string;
  capturedAt?: string;
  collectedByName: string;
  location?: string;
  status: string;
  verificationStatus: string;
  serialNumber?: string;
  conditionOnReceipt?: string;
  notes?: string;
  createdAt: string;
}

interface CustodyLogData {
  action: string;
  performedByName: string;
  location?: string;
  purpose?: string;
  notes?: string;
  previousHash?: string;
  currentHash?: string;
  createdAt: string;
  evidenceId?: string;
}

interface ReportOptions {
  reportType: 'custody' | 'full' | 'evidence' | 'timeline' | 'expert';
  includeCaseDetails: boolean;
  includeEvidenceList: boolean;
  includeHashValues: boolean;
  includeCustodyChain: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode basic HTML entities for plain-text PDF output */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const PRIMARY_COLOR: [number, number, number] = [30, 58, 138];   // deep blue
const ACCENT_COLOR: [number, number, number]  = [59, 130, 246];  // lighter blue
const LIGHT_GRAY: [number, number, number]    = [243, 244, 246];
const DARK_GRAY: [number, number, number]     = [55, 65, 81];

function addPageFooter(doc: jsPDF, caseRef: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `CONFIDENTIAL — Digital Forensic Expert Opinion Report  |  ${caseRef}  |  Page ${i} of ${pageCount}`,
      105, 290, { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }
}

function sectionHeading(doc: jsPDF, y: number, number: string, title: string): number {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(14, y - 4, 182, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${number}. ${title.toUpperCase()}`, 17, y + 3);
  doc.setTextColor(0, 0, 0);
  return y + 14;
}

function subHeading(doc: jsPDF, y: number, title: string): number {
  if (y > 265) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_GRAY);
  doc.text(title, 14, y);
  doc.setTextColor(0, 0, 0);
  return y + 7;
}

function bodyText(doc: jsPDF, y: number, text: string, indent = 14): number {
  if (!text || text.trim() === '') {
    return labelValue(doc, y, '', '[Not provided]', indent);
  }
  if (y > 265) { doc.addPage(); y = 20; }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(text, 180 - (indent - 14));
  for (const line of lines) {
    if (y > 278) { doc.addPage(); y = 20; }
    doc.text(line, indent, y);
    y += 5;
  }
  doc.setTextColor(0, 0, 0);
  return y + 2;
}

function labelValue(doc: jsPDF, y: number, label: string, value: string, indent = 14): number {
  if (y > 278) { doc.addPage(); y = 20; }
  doc.setFontSize(9);
  if (label) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text(`${label}:`, indent, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const valLines = doc.splitTextToSize(value || 'N/A', 125);
    doc.text(valLines[0] || 'N/A', indent + 52, y);
    for (let i = 1; i < valLines.length; i++) {
      y += 5;
      doc.text(valLines[i], indent + 52, y);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(value || 'N/A', indent, y);
  }
  doc.setTextColor(0, 0, 0);
  return y + 6;
}

function divider(doc: jsPDF, y: number): number {
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  return y + 4;
}

// ─── MAIN: Generate Full 13-Section Expert Opinion PDF ───────────────────────

export const generateForensicExpertReport = (
  forensicReport: ForensicReportData,
  caseData: CaseData,
  evidence: EvidenceData[],
  custodyLogs: CustodyLogData[]
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportDateStr = forensicReport.reportDate
    ? formatDate(forensicReport.reportDate)
    : formatDate(new Date().toISOString());

  // ── COVER PAGE ──────────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, 210, 60, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DIGITAL FORENSIC', 105, 25, { align: 'center' });
  doc.text('EXPERT OPINION REPORT', 105, 36, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL', 105, 50, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let y = 75;

  // Cover block
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, y - 4, 182, 80, 'F');

  const expertDisplayName = forensicReport.expertName || forensicReport.generatedByName || 'N/A';

  const coverFields: [string, string][] = [
    ['Case Reference No', caseData.caseId],
    ['Case Title', caseData.title],
    ['Court / Tribunal', forensicReport.courtTribunal || 'N/A'],
    ['Requesting Authority', forensicReport.requestingAuthority || 'N/A'],
    ['Investigation Reference', forensicReport.investigationReference || 'N/A'],
    ['Date of Report', reportDateStr],
    ['Prepared By', expertDisplayName],
    ['Case Status', caseData.status],
  ];

  y += 4;
  for (const [label, val] of coverFields) {
    y = labelValue(doc, y, label, val, 18);
  }

  y += 12;

  // ── SECTION 2: EXPERT CREDENTIALS ──────────────────────────────────────────
  y = sectionHeading(doc, y, '2', 'Expert Credentials and Declaration');

  y = labelValue(doc, y, 'Full Name', expertDisplayName);
  y = labelValue(doc, y, 'Qualifications', forensicReport.expertQualifications || 'N/A');
  y = labelValue(doc, y, 'Experience', forensicReport.expertExperience || 'N/A');
  y = labelValue(doc, y, 'Professional Body', forensicReport.expertProfessionalBody || 'N/A');

  y += 3;
  y = subHeading(doc, y, 'Independence Statement');
  y = bodyText(doc, y,
    forensicReport.independenceStatement ||
    'I confirm that I have prepared this report independently and that my opinions are my own, based solely on the evidence examined. I understand my duty to the Court and I have complied with that duty.'
  );

  y += 3;
  y = subHeading(doc, y, 'Oath / Declaration');
  y = bodyText(doc, y,
    forensicReport.oathDeclaration ||
    'I declare that the contents of this report are true to the best of my knowledge and belief, and that I have not wilfully suppressed any material facts.'
  );

  y = divider(doc, y);

  // ── SECTION 3: INSTRUCTIONS RECEIVED ───────────────────────────────────────
  y = sectionHeading(doc, y, '3', 'Instructions Received');

  y = labelValue(doc, y, 'Requesting Agency', forensicReport.requestingAgency || 'N/A');
  y = labelValue(doc, y, 'Date of Instruction',
    forensicReport.dateOfInstruction ? formatDate(forensicReport.dateOfInstruction) : 'N/A'
  );
  y = labelValue(doc, y, 'Case Status', caseData.status);
  y = labelValue(doc, y, 'Priority', caseData.priority);
  y = labelValue(doc, y, 'Incident Date',
    caseData.incidentDate ? formatDate(caseData.incidentDate) : 'N/A'
  );

  y += 3;
  y = subHeading(doc, y, 'Scope of Engagement');
  y = bodyText(doc, y, stripHtml(forensicReport.scopeOfEngagement || caseData.description || 'N/A'));

  if (forensicReport.specificQuestions && forensicReport.specificQuestions.length > 0) {
    y += 3;
    y = subHeading(doc, y, 'Specific Questions Asked');
    for (let i = 0; i < forensicReport.specificQuestions.length; i++) {
      y = bodyText(doc, y, `${i + 1}. ${forensicReport.specificQuestions[i]}`, 18);
    }
  }

  y = divider(doc, y);

  // ── SECTION 4: MATERIALS RECEIVED ──────────────────────────────────────────
  y = sectionHeading(doc, y, '4', 'Materials Received for Examination');

  if (evidence.length === 0) {
    y = bodyText(doc, y, 'No evidence items recorded for this case.');
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Exhibit ID', 'Description / Filename', 'Serial No.', 'Date Received', 'Condition on Receipt']],
      body: evidence.map(e => [
        e.evidenceId,
        e.filename.length > 30 ? e.filename.substring(0, 27) + '...' : e.filename,
        e.serialNumber || 'N/A',
        e.capturedAt ? formatDate(e.capturedAt) : formatDate(e.createdAt),
        e.conditionOnReceipt || 'Intact'
      ]),
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 55 },
        2: { cellWidth: 28 },
        3: { cellWidth: 35 },
        4: { cellWidth: 34 }
      },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  y = divider(doc, y);

  // ── SECTION 5: CHAIN OF CUSTODY SUMMARY ────────────────────────────────────
  y = sectionHeading(doc, y, '5', 'Chain of Custody Summary');

  if (custodyLogs.length === 0) {
    y = bodyText(doc, y, 'No chain of custody records found for this case.');
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Date / Time', 'Action', 'Performed By', 'Location', 'Purpose', 'Hash Verified']],
      body: custodyLogs.map(log => [
        formatDate(log.createdAt),
        log.action,
        log.performedByName,
        log.location || 'N/A',
        log.purpose || 'N/A',
        log.currentHash ? 'Yes (SHA-256)' : 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 22 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 38 },
        5: { cellWidth: 24 }
      },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  y = divider(doc, y);

  // ── SECTION 6: METHODOLOGY ─────────────────────────────────────────────────
  y = sectionHeading(doc, y, '6', 'Methodology');

  const standards = forensicReport.methodology?.standardsReferenced?.length
    ? forensicReport.methodology.standardsReferenced
    : ['ISO/IEC 27037:2012', 'ISO/IEC 27042:2015', 'NIST SP 800-86', 'ACPO Good Practice Guide for Digital Evidence'];

  y = subHeading(doc, y, 'Standards Referenced');
  for (const std of standards) {
    y = bodyText(doc, y, `• ${std}`, 18);
  }

  const tools = forensicReport.methodology?.toolsUsed?.length
    ? forensicReport.methodology.toolsUsed
    : [{ name: 'Chaintrivex DEMS', version: '1.0', purpose: 'Digital evidence collection, hashing, and chain of custody management' }];

  y += 3;
  y = subHeading(doc, y, 'Forensic Tools Used');
  autoTable(doc, {
    startY: y,
    head: [['Tool Name', 'Version', 'Purpose']],
    body: tools.map(t => [t.name || '', t.version || '', t.purpose || '']),
    theme: 'grid',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 25 }, 2: { cellWidth: 112 } },
    margin: { left: 14, right: 14 }
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  y = divider(doc, y);

  // ── SECTION 7: EXAMINATION PROCESS ─────────────────────────────────────────
  y = sectionHeading(doc, y, '7', 'Examination Process');
  const ep = forensicReport.examinationProcess ?? { forensicImaging: '', dataAnalysis: '', timelineExamination: '', artifactRecovery: '' };

  y = subHeading(doc, y, 'Forensic Imaging');
  y = bodyText(doc, y, stripHtml(ep.forensicImaging) || 'N/A');

  y = subHeading(doc, y, 'Data Analysis');
  y = bodyText(doc, y, stripHtml(ep.dataAnalysis) || 'N/A');

  y = subHeading(doc, y, 'Timeline Examination');
  y = bodyText(doc, y, stripHtml(ep.timelineExamination) || 'N/A');

  y = subHeading(doc, y, 'Artifact Recovery');
  y = bodyText(doc, y, stripHtml(ep.artifactRecovery) || 'N/A');

  y = divider(doc, y);

  // ── SECTION 8: FINDINGS ────────────────────────────────────────────────────
  y = sectionHeading(doc, y, '8', 'Findings');
  const f = forensicReport.findings ?? { fileSystemFindings: '', internetActivity: '', deletedDataRecovery: '', communicationArtifacts: '', timelineCorrelation: '' };

  y = subHeading(doc, y, 'File System Findings');
  y = bodyText(doc, y, stripHtml(f.fileSystemFindings) || 'N/A');

  y = subHeading(doc, y, 'Internet Activity');
  y = bodyText(doc, y, stripHtml(f.internetActivity) || 'N/A');

  y = subHeading(doc, y, 'Deleted Data Recovery');
  y = bodyText(doc, y, stripHtml(f.deletedDataRecovery) || 'N/A');

  y = subHeading(doc, y, 'Communication Artifacts');
  y = bodyText(doc, y, stripHtml(f.communicationArtifacts) || 'N/A');

  y = subHeading(doc, y, 'Timeline Correlation');
  y = bodyText(doc, y, stripHtml(f.timelineCorrelation) || 'N/A');

  y = divider(doc, y);

  // ── SECTION 9: LIMITATIONS ─────────────────────────────────────────────────
  y = sectionHeading(doc, y, '9', 'Limitations');
  const lim = forensicReport.limitations ?? { encryptionIssues: '', damagedSectors: '', cloudAccessRestrictions: '', other: '' };

  y = subHeading(doc, y, 'Encryption Issues');
  y = bodyText(doc, y, stripHtml(lim.encryptionIssues) || 'None encountered.');

  y = subHeading(doc, y, 'Damaged Sectors');
  y = bodyText(doc, y, stripHtml(lim.damagedSectors) || 'None encountered.');

  y = subHeading(doc, y, 'Cloud Access Restrictions');
  y = bodyText(doc, y, stripHtml(lim.cloudAccessRestrictions) || 'None encountered.');

  if (lim.other) {
    y = subHeading(doc, y, 'Other Limitations');
    y = bodyText(doc, y, stripHtml(lim.other));
  }

  y = divider(doc, y);

  // ── SECTION 10: EXPERT OPINION ─────────────────────────────────────────────
  y = sectionHeading(doc, y, '10', 'Expert Opinion');
  y = bodyText(doc, y, stripHtml(forensicReport.expertOpinion || '') || 'N/A');

  y = divider(doc, y);

  // ── SECTION 11: CONCLUSION ─────────────────────────────────────────────────
  y = sectionHeading(doc, y, '11', 'Conclusion');
  y = bodyText(doc, y, stripHtml(forensicReport.conclusion || '') || 'N/A');

  y = divider(doc, y);

  // ── SECTION 12: RECOMMENDATIONS ────────────────────────────────────────────
  y = sectionHeading(doc, y, '12', 'Recommendations');
  const recs = forensicReport.recommendations || [];
  if (recs.length === 0) {
    y = bodyText(doc, y, 'No specific recommendations at this time.');
  } else {
    for (let i = 0; i < recs.length; i++) {
      y = bodyText(doc, y, `${i + 1}. ${stripHtml(recs[i])}`, 18);
    }
  }

  y = divider(doc, y);

  // ── SECTION 13: ANNEXURES ──────────────────────────────────────────────────
  if (y > 200) { doc.addPage(); y = 20; }
  y = sectionHeading(doc, y, '13', 'Annexures');

  // Annexure A – Full Hash Values
  y = subHeading(doc, y, 'Annexure A: Evidence Hash Values');
  if (evidence.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Exhibit ID', 'Filename', 'Algorithm', 'Hash Value', 'Verification']],
      body: evidence.map(e => [
        e.evidenceId,
        e.filename.length > 22 ? e.filename.substring(0, 19) + '...' : e.filename,
        e.hashAlgorithm || 'SHA-256',
        e.hash,
        e.verificationStatus
      ]),
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontSize: 7.5 },
      bodyStyles: { fontSize: 7, font: 'courier' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 30 },
        2: { cellWidth: 18 },
        3: { cellWidth: 88 },
        4: { cellWidth: 18 }
      },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    y = bodyText(doc, y, 'No evidence items.');
  }

  // Annexure B – Full Custody Chain
  y = subHeading(doc, y, 'Annexure B: Complete Chain of Custody');
  if (custodyLogs.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date / Time', 'Action', 'Performed By', 'Location', 'Purpose', 'Notes']],
      body: custodyLogs.map(log => [
        formatDate(log.createdAt),
        log.action,
        log.performedByName,
        log.location || 'N/A',
        log.purpose || 'N/A',
        log.notes || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 37 }
      },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── SIGNATURE BLOCK ────────────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  y += 10;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, y - 4, 182, 38, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_GRAY);
  doc.text('SIGNATURE BLOCK', 17, y + 4);

  y += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${expertDisplayName}`, 17, y);
  y += 6;
  doc.text('Title: Digital Forensic Expert', 17, y);
  y += 6;
  doc.text(`Date: ${reportDateStr}`, 17, y);
  y += 6;
  doc.text('Signature: _______________________________', 17, y);

  doc.setTextColor(0, 0, 0);

  // Add footer to all pages
  addPageFooter(doc, caseData.caseId);

  const filename = `${caseData.caseId}_Expert_Opinion_Report_${Date.now()}.pdf`;
  doc.save(filename);
};

// ─── EXISTING: Standard Case Report PDF ──────────────────────────────────────

export const generatePDFReport = (
  caseData: CaseData,
  evidence: EvidenceData[],
  custodyLogs: CustodyLogData[],
  options: ReportOptions
) => {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Evidence Management System', 105, y, { align: 'center' });

  y += 10;
  doc.setFontSize(16);
  doc.text('Case Report', 105, y, { align: 'center' });

  y += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 105, y, { align: 'center' });

  y += 15;

  if (options.includeCaseDetails) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Details', 14, y);
    y += 8;

    const caseDetails = [
      ['Case ID:', caseData.caseId],
      ['Title:', caseData.title],
      ['Status:', caseData.status],
      ['Priority:', caseData.priority],
      ['Investigator:', caseData.investigatorName || 'N/A'],
      ['Location:', caseData.location || 'N/A'],
      ['Incident Date:', caseData.incidentDate ? formatDate(caseData.incidentDate) : 'N/A'],
      ['Created:', formatDate(caseData.createdAt)],
      ['Last Updated:', formatDate(caseData.updatedAt)],
    ];

    if (caseData.description) caseDetails.push(['Description:', caseData.description]);
    if (caseData.notes) caseDetails.push(['Notes:', caseData.notes]);

    autoTable(doc, {
      startY: y,
      head: [],
      body: caseDetails,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 140 } },
      margin: { left: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (options.includeEvidenceList && evidence.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evidence List', 14, y);
    y += 8;

    const evidenceHeaders = options.includeHashValues
      ? ['Evidence ID', 'Filename', 'Type', 'Hash (SHA-256)', 'Status', 'Collected By']
      : ['Evidence ID', 'Filename', 'Type', 'Status', 'Collected By'];

    const evidenceRows = evidence.map(e => {
      const row = [
        e.evidenceId,
        e.filename.length > 25 ? e.filename.substring(0, 22) + '...' : e.filename,
        e.evidenceType,
      ];
      if (options.includeHashValues) row.push(e.hash.substring(0, 16) + '...');
      row.push(e.status, e.collectedByName);
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: [evidenceHeaders],
      body: evidenceRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (options.includeCustodyChain && custodyLogs.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Chain of Custody', 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Date/Time', 'Action', 'Performed By', 'Location', 'Purpose']],
      body: custodyLogs.map(log => [
        formatDate(log.createdAt),
        log.action,
        log.performedByName,
        log.location || 'N/A',
        log.purpose || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Page ${i} of ${pageCount} - ${caseData.caseId}`, 105, 285, { align: 'center' });
  }

  doc.save(`${caseData.caseId}_${options.reportType}_report_${Date.now()}.pdf`);
};

// ─── EXISTING: Standard Case Report Excel ────────────────────────────────────

export const generateExcelReport = (
  caseData: CaseData,
  evidence: EvidenceData[],
  custodyLogs: CustodyLogData[],
  options: ReportOptions
) => {
  const workbook = XLSX.utils.book_new();

  if (options.includeCaseDetails) {
    const caseSheet = [
      ['Digital Evidence Management System'],
      ['Case Report'],
      [''],
      ['Case ID', caseData.caseId],
      ['Title', caseData.title],
      ['Description', caseData.description || 'N/A'],
      ['Status', caseData.status],
      ['Priority', caseData.priority],
      ['Investigator', caseData.investigatorName || 'N/A'],
      ['Location', caseData.location || 'N/A'],
      ['Incident Date', caseData.incidentDate ? formatDate(caseData.incidentDate) : 'N/A'],
      ['Created', formatDate(caseData.createdAt)],
      ['Last Updated', formatDate(caseData.updatedAt)],
    ];
    if (caseData.notes) caseSheet.push(['Notes', caseData.notes]);

    const ws1 = XLSX.utils.aoa_to_sheet(caseSheet);
    ws1['!cols'] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, ws1, 'Case Details');
  }

  if (options.includeEvidenceList && evidence.length > 0) {
    const evidenceHeaders = ['Evidence ID', 'Filename', 'File Type', 'File Size (bytes)',
      'Evidence Type', 'Status', 'Verification Status', 'Collected By', 'Source Device',
      'Location', 'Captured At', 'Created At'];
    if (options.includeHashValues) evidenceHeaders.push('Hash (SHA-256)', 'Hash Algorithm');

    const evidenceRows = evidence.map(e => {
      const row: any[] = [e.evidenceId, e.filename, e.fileType, e.fileSize, e.evidenceType,
        e.status, e.verificationStatus, e.collectedByName, e.sourceDevice || 'N/A',
        e.location || 'N/A', e.capturedAt ? formatDate(e.capturedAt) : 'N/A', formatDate(e.createdAt)];
      if (options.includeHashValues) row.push(e.hash, e.hashAlgorithm);
      return row;
    });

    const ws2 = XLSX.utils.aoa_to_sheet([evidenceHeaders, ...evidenceRows]);
    ws2['!cols'] = Array(evidenceHeaders.length).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(workbook, ws2, 'Evidence');
  }

  if (options.includeCustodyChain && custodyLogs.length > 0) {
    const custodyHeaders = ['Date/Time', 'Action', 'Performed By', 'Location', 'Purpose', 'Notes'];
    const custodyRows = custodyLogs.map(log => [
      formatDate(log.createdAt), log.action, log.performedByName,
      log.location || 'N/A', log.purpose || 'N/A', log.notes || 'N/A'
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet([custodyHeaders, ...custodyRows]);
    ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, ws3, 'Chain of Custody');
  }

  XLSX.writeFile(workbook, `${caseData.caseId}_${options.reportType}_report_${Date.now()}.xlsx`);
};
