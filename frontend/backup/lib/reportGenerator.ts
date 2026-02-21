import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from './utils';

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
  createdAt: string;
}

interface CustodyLogData {
  action: string;
  performedByName: string;
  location?: string;
  purpose?: string;
  notes?: string;
  createdAt: string;
  evidenceId?: string;
}

interface ReportOptions {
  reportType: 'custody' | 'full' | 'evidence' | 'timeline';
  includeCaseDetails: boolean;
  includeEvidenceList: boolean;
  includeHashValues: boolean;
  includeCustodyChain: boolean;
}

export const generatePDFReport = (
  caseData: CaseData,
  evidence: EvidenceData[],
  custodyLogs: CustodyLogData[],
  options: ReportOptions
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Evidence Management System', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(16);
  doc.text('Case Report', 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Case Details Section
  if (options.includeCaseDetails) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Details', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
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

    if (caseData.description) {
      caseDetails.push(['Description:', caseData.description]);
    }

    if (caseData.notes) {
      caseDetails.push(['Notes:', caseData.notes]);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: caseDetails,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 140 }
      },
      margin: { left: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Evidence List Section
  if (options.includeEvidenceList && evidence.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evidence List', 14, yPosition);
    yPosition += 8;

    const evidenceHeaders = options.includeHashValues
      ? ['Evidence ID', 'Filename', 'Type', 'Hash (SHA-256)', 'Status', 'Collected By']
      : ['Evidence ID', 'Filename', 'Type', 'Status', 'Collected By'];

    const evidenceRows = evidence.map(e => {
      const row = [
        e.evidenceId,
        e.filename.length > 25 ? e.filename.substring(0, 22) + '...' : e.filename,
        e.evidenceType,
      ];

      if (options.includeHashValues) {
        row.push(e.hash.substring(0, 16) + '...');
      }

      row.push(e.status, e.collectedByName);
      return row;
    });

    autoTable(doc, {
      startY: yPosition,
      head: [evidenceHeaders],
      body: evidenceRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: options.includeHashValues ? {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 }
      } : {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40 }
      },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Chain of Custody Section
  if (options.includeCustodyChain && custodyLogs.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Chain of Custody', 14, yPosition);
    yPosition += 8;

    const custodyHeaders = ['Date/Time', 'Action', 'Performed By', 'Location', 'Purpose'];
    const custodyRows = custodyLogs.map(log => [
      formatDate(log.createdAt),
      log.action,
      log.performedByName,
      log.location || 'N/A',
      log.purpose || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [custodyHeaders],
      body: custodyRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${pageCount} - ${caseData.caseId}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `${caseData.caseId}_${options.reportType}_report_${Date.now()}.pdf`;
  doc.save(filename);
};

export const generateExcelReport = (
  caseData: CaseData,
  evidence: EvidenceData[],
  custodyLogs: CustodyLogData[],
  options: ReportOptions
) => {
  const workbook = XLSX.utils.book_new();

  // Case Details Sheet
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

    if (caseData.notes) {
      caseSheet.push(['Notes', caseData.notes]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(caseSheet);
    ws1['!cols'] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, ws1, 'Case Details');
  }

  // Evidence Sheet
  if (options.includeEvidenceList && evidence.length > 0) {
    const evidenceHeaders = [
      'Evidence ID',
      'Filename',
      'File Type',
      'File Size (bytes)',
      'Evidence Type',
      'Status',
      'Verification Status',
      'Collected By',
      'Source Device',
      'Location',
      'Captured At',
      'Created At'
    ];

    if (options.includeHashValues) {
      evidenceHeaders.push('Hash (SHA-256)', 'Hash Algorithm');
    }

    const evidenceRows = evidence.map(e => {
      const row = [
        e.evidenceId,
        e.filename,
        e.fileType,
        e.fileSize,
        e.evidenceType,
        e.status,
        e.verificationStatus,
        e.collectedByName,
        e.sourceDevice || 'N/A',
        e.location || 'N/A',
        e.capturedAt ? formatDate(e.capturedAt) : 'N/A',
        formatDate(e.createdAt)
      ];

      if (options.includeHashValues) {
        row.push(e.hash, e.hashAlgorithm);
      }

      return row;
    });

    const ws2 = XLSX.utils.aoa_to_sheet([evidenceHeaders, ...evidenceRows]);
    ws2['!cols'] = Array(evidenceHeaders.length).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(workbook, ws2, 'Evidence');
  }

  // Chain of Custody Sheet
  if (options.includeCustodyChain && custodyLogs.length > 0) {
    const custodyHeaders = [
      'Date/Time',
      'Action',
      'Performed By',
      'Location',
      'Purpose',
      'Notes'
    ];

    const custodyRows = custodyLogs.map(log => [
      formatDate(log.createdAt),
      log.action,
      log.performedByName,
      log.location || 'N/A',
      log.purpose || 'N/A',
      log.notes || 'N/A'
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet([custodyHeaders, ...custodyRows]);
    ws3['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 30 },
      { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws3, 'Chain of Custody');
  }

  // Save the Excel file
  const filename = `${caseData.caseId}_${options.reportType}_report_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
