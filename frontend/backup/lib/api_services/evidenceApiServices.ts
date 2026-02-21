import graphqlClient from './graphqlClient';

export interface EvidenceData {
  id: string;
  evidenceId: string;
  caseId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  evidenceType: string;
  hash: string;
  hashAlgorithm: string;
  sourceDevice?: string;
  capturedAt?: string;
  collectedBy: string;
  collectedByName: string;
  location?: string;
  status: string;
  verificationStatus: string;
  lastVerifiedAt?: string;
  verificationCount: number;
  tags?: string[];
  notes?: string;
  metadata?: any;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvidenceData {
  evidenceId?: string;
  caseId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  evidenceType: string;
  hash: string;
  hashAlgorithm?: string;
  sourceDevice?: string;
  capturedAt?: string;
  location?: string;
  tags?: string[];
  notes?: string;
  metadata?: any;
  filePath?: string;
  fileData?: string;
}

export interface UpdateEvidenceData {
  filename?: string;
  evidenceType?: string;
  sourceDevice?: string;
  location?: string;
  status?: string;
  tags?: string[];
  notes?: string;
  metadata?: any;
}

export interface VerifyEvidenceData {
  evidenceId: string;
  hash: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  isValid: boolean;
  storedHash: string;
  calculatedHash: string;
  evidence?: EvidenceData;
}

export const getEvidence = async (id: string): Promise<EvidenceData> => {
  const query = `
    query GetEvidence($id: ID!) {
      getEvidence(id: $id) {
        success
        message
        evidence {
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
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query,
    variables: { id },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getEvidence.evidence;
};

export const getAllEvidence = async (params?: {
  caseId?: string;
  status?: string;
  search?: string;
}): Promise<{ evidences: EvidenceData[]; total: number }> => {
  const query = `
    query GetAllEvidence($caseId: ID, $status: String, $search: String) {
      getAllEvidence(caseId: $caseId, status: $status, search: $search) {
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

  const response = await graphqlClient.post('', {
    query,
    variables: params,
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getAllEvidence;
};

export const getEvidenceByCase = async (caseId: string): Promise<{ evidences: EvidenceData[]; total: number }> => {
  const query = `
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

  const response = await graphqlClient.post('', {
    query,
    variables: { caseId },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getEvidenceByCase;
};

export const createEvidence = async (data: CreateEvidenceData) => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createEvidence;
};

export const updateEvidence = async (id: string, data: UpdateEvidenceData) => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { id, input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateEvidence;
};

export const deleteEvidence = async (id: string) => {
  const mutation = `
    mutation DeleteEvidence($id: ID!) {
      deleteEvidence(id: $id) {
        success
        message
      }
    }
  `;

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { id },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.deleteEvidence;
};

export const verifyEvidence = async (data: VerifyEvidenceData): Promise<VerificationResult> => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.verifyEvidence;
};
