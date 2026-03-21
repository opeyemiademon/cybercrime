import graphqlClient from './graphqlClient';

export interface ForensicTool {
  name: string;
  version: string;
  purpose: string;
}

export interface ForensicMethodology {
  standardsReferenced: string[];
  toolsUsed: ForensicTool[];
}

export interface ForensicExaminationProcess {
  forensicImaging: string;
  dataAnalysis: string;
  timelineExamination: string;
  artifactRecovery: string;
}

export interface ForensicFindings {
  fileSystemFindings: string;
  internetActivity: string;
  deletedDataRecovery: string;
  communicationArtifacts: string;
  timelineCorrelation: string;
}

export interface ForensicLimitations {
  encryptionIssues: string;
  damagedSectors: string;
  cloudAccessRestrictions: string;
  other: string;
}

export interface ForensicReportData {
  id: string;
  caseId: string;
  caseRef: string;
  generatedBy: string;
  generatedByName: string;
  reportDate?: string;
  status: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
  expertQualifications?: string;
  expertExperience?: string;
  expertProfessionalBody?: string;
  independenceStatement?: string;
  oathDeclaration?: string;
  expertName?: string;
  methodology?: ForensicMethodology;
  examinationProcess?: ForensicExaminationProcess;
  findings?: ForensicFindings;
  limitations?: ForensicLimitations;
  expertOpinion?: string;
  conclusion?: string;
  recommendations?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateForensicReportData {
  caseId: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
  expertQualifications?: string;
  expertExperience?: string;
  expertProfessionalBody?: string;
  independenceStatement?: string;
  oathDeclaration?: string;
  expertName?: string;
  methodology?: ForensicMethodology;
  examinationProcess?: ForensicExaminationProcess;
  findings?: ForensicFindings;
  limitations?: ForensicLimitations;
  expertOpinion?: string;
  conclusion?: string;
  recommendations?: string[];
  status?: string;
}

export type UpdateForensicReportData = Omit<CreateForensicReportData, 'caseId'>;

const FORENSIC_REPORT_FIELDS = `
  id
  caseId
  caseRef
  generatedBy
  generatedByName
  reportDate
  status
  courtTribunal
  requestingAuthority
  investigationReference
  requestingAgency
  dateOfInstruction
  scopeOfEngagement
  specificQuestions
  expertQualifications
  expertExperience
  expertProfessionalBody
  independenceStatement
  oathDeclaration
  expertName
  methodology {
    standardsReferenced
    toolsUsed { name version purpose }
  }
  examinationProcess {
    forensicImaging
    dataAnalysis
    timelineExamination
    artifactRecovery
  }
  findings {
    fileSystemFindings
    internetActivity
    deletedDataRecovery
    communicationArtifacts
    timelineCorrelation
  }
  limitations {
    encryptionIssues
    damagedSectors
    cloudAccessRestrictions
    other
  }
  expertOpinion
  conclusion
  recommendations
  createdAt
  updatedAt
`;

export const getForensicReport = async (id: string): Promise<ForensicReportData> => {
  const query = `
    query GetForensicReport($id: ID!) {
      getForensicReport(id: $id) {
        success
        message
        report { ${FORENSIC_REPORT_FIELDS} }
      }
    }
  `;

  const response = await graphqlClient.post('', { query, variables: { id } });
  if (response.data.errors) throw new Error(response.data.errors[0].message);
  const result = response.data.data.getForensicReport;
  if (!result.success) throw new Error(result.message);
  return result.report;
};

export const getForensicReportsByCase = async (caseId: string): Promise<{ reports: ForensicReportData[]; total: number }> => {
  const query = `
    query GetForensicReportsByCase($caseId: ID!) {
      getForensicReportsByCase(caseId: $caseId) {
        success
        message
        reports { ${FORENSIC_REPORT_FIELDS} }
        total
      }
    }
  `;

  const response = await graphqlClient.post('', { query, variables: { caseId } });
  if (response.data.errors) throw new Error(response.data.errors[0].message);
  return response.data.data.getForensicReportsByCase;
};

export const createForensicReport = async (data: CreateForensicReportData): Promise<ForensicReportData> => {
  const mutation = `
    mutation CreateForensicReport($input: CreateForensicReportInput!) {
      createForensicReport(input: $input) {
        success
        message
        report { ${FORENSIC_REPORT_FIELDS} }
      }
    }
  `;

  const response = await graphqlClient.post('', { query: mutation, variables: { input: data } });
  if (response.data.errors) throw new Error(response.data.errors[0].message);
  const result = response.data.data.createForensicReport;
  if (!result.success) throw new Error(result.message);
  return result.report;
};

export const updateForensicReport = async (id: string, data: UpdateForensicReportData): Promise<ForensicReportData> => {
  const mutation = `
    mutation UpdateForensicReport($id: ID!, $input: UpdateForensicReportInput!) {
      updateForensicReport(id: $id, input: $input) {
        success
        message
        report { ${FORENSIC_REPORT_FIELDS} }
      }
    }
  `;

  const response = await graphqlClient.post('', { query: mutation, variables: { id, input: data } });
  if (response.data.errors) throw new Error(response.data.errors[0].message);
  const result = response.data.data.updateForensicReport;
  if (!result.success) throw new Error(result.message);
  return result.report;
};

export const deleteForensicReport = async (id: string): Promise<void> => {
  const mutation = `
    mutation DeleteForensicReport($id: ID!) {
      deleteForensicReport(id: $id) {
        success
        message
      }
    }
  `;

  const response = await graphqlClient.post('', { query: mutation, variables: { id } });
  if (response.data.errors) throw new Error(response.data.errors[0].message);
};
