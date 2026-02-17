export type UserRole = 'Admin' | 'Investigator' | 'Reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Case {
  id: string;
  caseId: string;
  title: string;
  description: string;
  location?: string;
  suspectLabel?: string;
  incidentLabel?: string;
  investigatorName: string;
  createdBy: string;
  createdAt: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Archived' | 'Active' | 'Under Review';
  priority: CasePriority;
  evidenceCount?: number;
}

export type EvidenceType = 'Image' | 'Video' | 'Document' | 'Log' | 'Other';

export interface Evidence {
  id: string;
  evidenceId: string;
  caseId: string;
  filename: string;
  fileType: EvidenceType;
  sourceDevice: string;
  sha256Hash: string;
  md5Hash?: string;
  size: number;
  capturedAt: string;
  uploadedBy: string;
  storedPath?: string;
  notes?: string;
  verified?: boolean;
  lastVerifiedAt?: string;
}

export type CustodyAction = 'Collected' | 'Transferred' | 'Analyzed' | 'Stored' | 'Archived' | 'Retrieved' | 'Verified';

export interface CustodyLog {
  id: string;
  evidenceId: string;
  action: CustodyAction;
  performedBy: string;
  performedTo?: string;
  purpose: string;
  timestamp: string;
  prevLogHash?: string;
  logHash?: string;
  digitalSignature?: string;
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalEvidence: number;
  verifications: number;
  recentVerifications: number;
  pendingReviews: number;
}

export interface AuditTrailFilter {
  caseId?: string;
  evidenceId?: string;
  action?: CustodyAction;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
