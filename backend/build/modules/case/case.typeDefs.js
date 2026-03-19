import { gql } from 'graphql-tag';
const caseTypeDefs = gql `
  type Case {
    id: ID!
    caseId: String!
    title: String!
    description: String
    status: String!
    priority: String!
    investigatorId: ID!
    investigatorName: String!
    suspectLabel: String
    location: String
    incidentDate: String
    evidenceCount: Int!
    tags: [String!]
    notes: String
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type CaseResponse {
    success: Boolean!
    message: String!
    case: Case
  }

  type CasesResponse {
    success: Boolean!
    message: String!
    cases: [Case!]!
    total: Int!
  }

  type DashboardStats {
    totalCases: Int!
    activeCases: Int!
    closedCases: Int!
    totalEvidence: Int!
    verifications: Int!
  }

  input CreateCaseInput {
    caseId: String
    title: String!
    description: String
    status: String
    priority: String
    suspectLabel: String
    location: String
    incidentDate: String
    tags: [String!]
    notes: String
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
  }

  input UpdateCaseInput {
    title: String
    description: String
    status: String
    priority: String
    suspectLabel: String
    location: String
    incidentDate: String
    tags: [String!]
    notes: String
    courtTribunal: String
    requestingAuthority: String
    investigationReference: String
    requestingAgency: String
    dateOfInstruction: String
    scopeOfEngagement: String
    specificQuestions: [String!]
  }

  extend type Query {
    getCase(id: ID!): CaseResponse!
    getAllCases(status: String, search: String): CasesResponse!
    getDashboardStats: DashboardStats!
  }

  extend type Mutation {
    createCase(input: CreateCaseInput!): CaseResponse!
    updateCase(id: ID!, input: UpdateCaseInput!): CaseResponse!
    deleteCase(id: ID!): CaseResponse!
  }
`;
export default caseTypeDefs;
//# sourceMappingURL=case.typeDefs.js.map