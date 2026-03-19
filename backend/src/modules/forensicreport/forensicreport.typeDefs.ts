import { gql } from 'graphql-tag';

const forensicReportTypeDefs = gql`
  type ForensicTool {
    name: String
    version: String
    purpose: String
  }

  type ForensicMethodology {
    standardsReferenced: [String!]
    toolsUsed: [ForensicTool!]
  }

  type ForensicExaminationProcess {
    forensicImaging: String
    dataAnalysis: String
    timelineExamination: String
    artifactRecovery: String
  }

  type ForensicFindings {
    fileSystemFindings: String
    internetActivity: String
    deletedDataRecovery: String
    communicationArtifacts: String
    timelineCorrelation: String
  }

  type ForensicLimitations {
    encryptionIssues: String
    damagedSectors: String
    cloudAccessRestrictions: String
    other: String
  }

  type ForensicReport {
    id: ID!
    caseId: ID!
    caseRef: String!
    generatedBy: ID!
    generatedByName: String!
    reportDate: String
    status: String!
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
    expertQualifications: String
    expertExperience: String
    expertProfessionalBody: String
    independenceStatement: String
    oathDeclaration: String
    expertName: String
    methodology: ForensicMethodology
    examinationProcess: ForensicExaminationProcess
    findings: ForensicFindings
    limitations: ForensicLimitations
    expertOpinion: String
    conclusion: String
    recommendations: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type ForensicReportResponse {
    success: Boolean!
    message: String!
    report: ForensicReport
  }

  type ForensicReportsResponse {
    success: Boolean!
    message: String!
    reports: [ForensicReport!]!
    total: Int!
  }

  input ForensicToolInput {
    name: String
    version: String
    purpose: String
  }

  input ForensicMethodologyInput {
    standardsReferenced: [String!]
    toolsUsed: [ForensicToolInput!]
  }

  input ForensicExaminationProcessInput {
    forensicImaging: String
    dataAnalysis: String
    timelineExamination: String
    artifactRecovery: String
  }

  input ForensicFindingsInput {
    fileSystemFindings: String
    internetActivity: String
    deletedDataRecovery: String
    communicationArtifacts: String
    timelineCorrelation: String
  }

  input ForensicLimitationsInput {
    encryptionIssues: String
    damagedSectors: String
    cloudAccessRestrictions: String
    other: String
  }

  input CreateForensicReportInput {
    caseId: ID!
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
    expertQualifications: String
    expertExperience: String
    expertProfessionalBody: String
    independenceStatement: String
    oathDeclaration: String
    expertName: String
    methodology: ForensicMethodologyInput
    examinationProcess: ForensicExaminationProcessInput
    findings: ForensicFindingsInput
    limitations: ForensicLimitationsInput
    expertOpinion: String
    conclusion: String
    recommendations: [String!]
    status: String
  }

  input UpdateForensicReportInput {
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
    expertQualifications: String
    expertExperience: String
    expertProfessionalBody: String
    independenceStatement: String
    oathDeclaration: String
    expertName: String
    methodology: ForensicMethodologyInput
    examinationProcess: ForensicExaminationProcessInput
    findings: ForensicFindingsInput
    limitations: ForensicLimitationsInput
    expertOpinion: String
    conclusion: String
    recommendations: [String!]
    status: String
  }

  extend type Query {
    getForensicReport(id: ID!): ForensicReportResponse!
    getForensicReportsByCase(caseId: ID!): ForensicReportsResponse!
    getAllForensicReports: ForensicReportsResponse!
  }

  extend type Mutation {
    createForensicReport(input: CreateForensicReportInput!): ForensicReportResponse!
    updateForensicReport(id: ID!, input: UpdateForensicReportInput!): ForensicReportResponse!
    deleteForensicReport(id: ID!): ForensicReportResponse!
  }
`;

export default forensicReportTypeDefs;
