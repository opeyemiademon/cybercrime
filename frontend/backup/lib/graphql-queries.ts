import { gql } from 'graphql-request';

// User Queries
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        fullname
        email
        role
        department
        phone
        isActive
        lastLogin
      }
    }
  }
`;

export const GET_ME_QUERY = gql`
  query GetMe {
    me {
      id
      fullname
      email
      role
      department
      phone
      isActive
      lastLogin
    }
  }
`;

export const GET_ALL_USERS_QUERY = gql`
  query GetAllUsers($limit: Int, $offset: Int, $role: String, $search: String) {
    getAllUsers(limit: $limit, offset: $offset, role: $role, search: $search) {
      success
      message
      users {
        id
        fullname
        email
        role
        department
        phone
        isActive
        lastLogin
        createdAt
      }
      total
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      user {
        id
        fullname
        email
        role
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      success
      message
      user {
        id
        fullname
        email
        role
      }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

// Case Queries
export const GET_ALL_CASES_QUERY = gql`
  query GetAllCases($limit: Int, $offset: Int, $status: String, $search: String) {
    getAllCases(limit: $limit, offset: $offset, status: $status, search: $search) {
      success
      message
      cases {
        id
        caseId
        title
        description
        status
        priority
        investigatorId
        investigatorName
        suspectLabel
        location
        incidentDate
        evidenceCount
        tags
        notes
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_CASE_QUERY = gql`
  query GetCase($id: ID!) {
    getCase(id: $id) {
      success
      message
      case {
        id
        caseId
        title
        description
        status
        priority
        investigatorId
        investigatorName
        suspectLabel
        location
        incidentDate
        evidenceCount
        tags
        notes
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_CASE_MUTATION = gql`
  mutation CreateCase($input: CreateCaseInput!) {
    createCase(input: $input) {
      success
      message
      case {
        id
        caseId
        title
        status
        priority
      }
    }
  }
`;

export const UPDATE_CASE_MUTATION = gql`
  mutation UpdateCase($id: ID!, $input: UpdateCaseInput!) {
    updateCase(id: $id, input: $input) {
      success
      message
      case {
        id
        caseId
        title
        status
      }
    }
  }
`;

export const DELETE_CASE_MUTATION = gql`
  mutation DeleteCase($id: ID!) {
    deleteCase(id: $id) {
      success
      message
    }
  }
`;

export const GET_DASHBOARD_STATS_QUERY = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalCases
      activeCases
      closedCases
      totalEvidence
      verifications
    }
  }
`;

// Evidence Queries
export const GET_ALL_EVIDENCE_QUERY = gql`
  query GetAllEvidence($limit: Int, $offset: Int, $caseId: ID, $status: String, $search: String) {
    getAllEvidence(limit: $limit, offset: $offset, caseId: $caseId, status: $status, search: $search) {
      success
      message
      evidences {
        id
        evidenceId
        caseId
        filename
        fileType
        fileSize
        evidenceType
        hash
        hashAlgorithm
        sourceDevice
        capturedAt
        collectedBy
        collectedByName
        location
        status
        verificationStatus
        lastVerifiedAt
        verificationCount
        tags
        notes
        metadata
        filePath
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_EVIDENCE_BY_CASE_QUERY = gql`
  query GetEvidenceByCase($caseId: ID!) {
    getEvidenceByCase(caseId: $caseId) {
      success
      message
      evidences {
        id
        evidenceId
        filename
        fileType
        fileSize
        evidenceType
        hash
        hashAlgorithm
        sourceDevice
        capturedAt
        collectedByName
        status
        verificationStatus
        verificationCount
        createdAt
      }
      total
    }
  }
`;

export const CREATE_EVIDENCE_MUTATION = gql`
  mutation CreateEvidence($input: CreateEvidenceInput!) {
    createEvidence(input: $input) {
      success
      message
      evidence {
        id
        evidenceId
        filename
        hash
      }
    }
  }
`;

export const UPDATE_EVIDENCE_MUTATION = gql`
  mutation UpdateEvidence($id: ID!, $input: UpdateEvidenceInput!) {
    updateEvidence(id: $id, input: $input) {
      success
      message
      evidence {
        id
        evidenceId
        status
      }
    }
  }
`;

export const DELETE_EVIDENCE_MUTATION = gql`
  mutation DeleteEvidence($id: ID!) {
    deleteEvidence(id: $id) {
      success
      message
    }
  }
`;

export const VERIFY_EVIDENCE_MUTATION = gql`
  mutation VerifyEvidence($input: VerifyEvidenceInput!) {
    verifyEvidence(input: $input) {
      success
      message
      isValid
      storedHash
      calculatedHash
      evidence {
        id
        evidenceId
        verificationStatus
        verificationCount
        lastVerifiedAt
      }
    }
  }
`;

// Custody Log Queries
export const GET_ALL_CUSTODY_LOGS_QUERY = gql`
  query GetAllCustodyLogs($limit: Int, $offset: Int, $evidenceId: ID, $caseId: ID, $action: String, $search: String) {
    getAllCustodyLogs(limit: $limit, offset: $offset, evidenceId: $evidenceId, caseId: $caseId, action: $action, search: $search) {
      success
      message
      logs {
        id
        evidenceId
        caseId
        action
        performedBy
        performedByName
        location
        purpose
        notes
        previousHash
        currentHash
        hashChain
        ipAddress
        userAgent
        metadata
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_CUSTODY_LOGS_BY_EVIDENCE_QUERY = gql`
  query GetCustodyLogsByEvidence($evidenceId: ID!) {
    getCustodyLogsByEvidence(evidenceId: $evidenceId) {
      success
      message
      logs {
        id
        action
        performedByName
        location
        purpose
        notes
        currentHash
        createdAt
      }
      total
    }
  }
`;

export const GET_CUSTODY_LOGS_BY_CASE_QUERY = gql`
  query GetCustodyLogsByCase($caseId: ID!) {
    getCustodyLogsByCase(caseId: $caseId) {
      success
      message
      logs {
        id
        evidenceId
        action
        performedByName
        location
        purpose
        createdAt
      }
      total
    }
  }
`;

export const CREATE_CUSTODY_LOG_MUTATION = gql`
  mutation CreateCustodyLog($input: CreateCustodyLogInput!) {
    createCustodyLog(input: $input) {
      success
      message
      log {
        id
        action
        performedByName
        createdAt
      }
    }
  }
`;
