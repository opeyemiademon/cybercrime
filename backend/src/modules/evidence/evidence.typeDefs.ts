import { gql } from 'graphql-tag';

const evidenceTypeDefs = gql`
  scalar JSON

  type Evidence {
    id: ID!
    evidenceId: String!
    caseId: ID!
    filename: String!
    fileType: String!
    fileSize: Int!
    evidenceType: String!
    hash: String!
    hashAlgorithm: String!
    sourceDevice: String
    capturedAt: String
    collectedBy: ID!
    collectedByName: String!
    location: String
    status: String!
    verificationStatus: String!
    lastVerifiedAt: String
    verificationCount: Int!
    tags: [String!]
    serialNumber: String
    conditionOnReceipt: String
    notes: String
    metadata: JSON
    filePath: String
    createdAt: String!
    updatedAt: String!
  }

  type EvidenceResponse {
    success: Boolean!
    message: String!
    evidence: Evidence
  }

  type EvidencesResponse {
    success: Boolean!
    message: String!
    evidences: [Evidence!]!
    total: Int!
  }

  type VerificationResult {
    success: Boolean!
    message: String!
    isValid: Boolean!
    storedHash: String!
    calculatedHash: String!
    evidence: Evidence
  }

  input CreateEvidenceInput {
    evidenceId: String
    caseId: ID!
    filename: String!
    fileType: String!
    fileSize: Int!
    evidenceType: String!
    hash: String!
    hashAlgorithm: String
    sourceDevice: String
    capturedAt: String
    location: String
    tags: [String!]
    serialNumber: String
    conditionOnReceipt: String
    notes: String
    metadata: JSON
    filePath: String
    fileData: String
  }

  input UpdateEvidenceInput {
    filename: String
    evidenceType: String
    sourceDevice: String
    location: String
    status: String
    tags: [String!]
    serialNumber: String
    conditionOnReceipt: String
    notes: String
    metadata: JSON
  }

  input VerifyEvidenceInput {
    evidenceId: ID!
    hash: String!
  }

  extend type Query {
    getEvidence(id: ID!): EvidenceResponse!
    getAllEvidence(caseId: ID, status: String, search: String): EvidencesResponse!
    getEvidenceByCase(caseId: ID!): EvidencesResponse!
  }

  extend type Mutation {
    createEvidence(input: CreateEvidenceInput!): EvidenceResponse!
    updateEvidence(id: ID!, input: UpdateEvidenceInput!): EvidenceResponse!
    deleteEvidence(id: ID!): EvidenceResponse!
    verifyEvidence(input: VerifyEvidenceInput!): VerificationResult!
  }
`;

export default evidenceTypeDefs;
