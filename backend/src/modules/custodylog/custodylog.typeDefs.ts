import { gql } from 'graphql-tag';

const custodyLogTypeDefs = gql`
  scalar JSON

  type CustodyLog {
    id: ID!
    evidenceId: ID!
    caseId: ID!
    action: String!
    performedBy: ID!
    performedByName: String!
    location: String
    purpose: String
    notes: String
    previousHash: String
    currentHash: String
    hashChain: String
    ipAddress: String
    userAgent: String
    metadata: JSON
    createdAt: String!
    updatedAt: String!
  }

  type CustodyLogResponse {
    success: Boolean!
    message: String!
    log: CustodyLog
  }

  type CustodyLogsResponse {
    success: Boolean!
    message: String!
    logs: [CustodyLog!]!
    total: Int!
  }

  input CreateCustodyLogInput {
    evidenceId: ID!
    caseId: ID!
    action: String!
    location: String
    purpose: String
    notes: String
    previousHash: String
    currentHash: String
    ipAddress: String
    userAgent: String
    metadata: JSON
  }

  extend type Query {
    getCustodyLog(id: ID!): CustodyLogResponse!
    getAllCustodyLogs(evidenceId: ID, caseId: ID, action: String, search: String): CustodyLogsResponse!
    getCustodyLogsByEvidence(evidenceId: ID!): CustodyLogsResponse!
    getCustodyLogsByCase(caseId: ID!): CustodyLogsResponse!
  }

  extend type Mutation {
    createCustodyLog(input: CreateCustodyLogInput!): CustodyLogResponse!
  }
`;

export default custodyLogTypeDefs;
