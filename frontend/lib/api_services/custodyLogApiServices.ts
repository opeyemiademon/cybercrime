import graphqlClient from './graphqlClient';

export interface CustodyLogData {
  id: string;
  evidenceId: string;
  caseId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  location?: string;
  purpose?: string;
  notes?: string;
  previousHash?: string;
  currentHash?: string;
  hashChain?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustodyLogData {
  evidenceId: string;
  caseId: string;
  action: string;
  location?: string;
  purpose?: string;
  notes?: string;
  previousHash?: string;
  currentHash?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export const getAllCustodyLogs = async (params?: {
  evidenceId?: string;
  caseId?: string;
  action?: string;
  search?: string;
}): Promise<{ logs: CustodyLogData[]; total: number }> => {
  const query = `
    query GetAllCustodyLogs($evidenceId: ID, $caseId: ID, $action: String, $search: String) {
      getAllCustodyLogs(evidenceId: $evidenceId, caseId: $caseId, action: $action, search: $search) {
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

  const response = await graphqlClient.post('', {
    query,
    variables: params,
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getAllCustodyLogs;
};

export const getCustodyLogsByEvidence = async (evidenceId: string): Promise<{ logs: CustodyLogData[]; total: number }> => {
  const query = `
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

  const response = await graphqlClient.post('', {
    query,
    variables: { evidenceId },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getCustodyLogsByEvidence;
};

export const getCustodyLogsByCase = async (caseId: string): Promise<{ logs: CustodyLogData[]; total: number }> => {
  const query = `
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

  const response = await graphqlClient.post('', {
    query,
    variables: { caseId },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getCustodyLogsByCase;
};

export const createCustodyLog = async (data: CreateCustodyLogData) => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createCustodyLog;
};
