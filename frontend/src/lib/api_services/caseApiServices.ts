import graphqlClient from './graphqlClient';

export interface CaseData {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  investigatorId: string;
  investigatorName: string;
  suspectLabel?: string;
  location?: string;
  incidentDate?: string;
  evidenceCount: number;
  tags?: string[];
  notes?: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseData {
  caseId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  suspectLabel?: string;
  location?: string;
  incidentDate?: string;
  tags?: string[];
  notes?: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
}

export interface UpdateCaseData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  suspectLabel?: string;
  location?: string;
  incidentDate?: string;
  tags?: string[];
  notes?: string;
  courtTribunal?: string;
  requestingAuthority?: string;
  investigationReference?: string;
  requestingAgency?: string;
  dateOfInstruction?: string;
  scopeOfEngagement?: string;
  specificQuestions?: string[];
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  totalEvidence: number;
  verifications: number;
}

export const getAllCases = async (params?: {
  status?: string;
  search?: string;
}): Promise<{ cases: CaseData[]; total: number }> => {
  const query = `
    query GetAllCases($status: String, $search: String) {
      getAllCases(status: $status, search: $search) {
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
          courtTribunal
          requestingAuthority
          investigationReference
          requestingAgency
          dateOfInstruction
          scopeOfEngagement
          specificQuestions
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

  return response.data.data.getAllCases;
};

export const getCase = async (id: string): Promise<CaseData> => {
  const query = `
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
          courtTribunal
          requestingAuthority
          investigationReference
          requestingAgency
          dateOfInstruction
          scopeOfEngagement
          specificQuestions
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

  return response.data.data.getCase.case;
};

export const createCase = async (data: CreateCaseData) => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createCase;
};

export const updateCase = async (id: string, data: UpdateCaseData) => {
  const mutation = `
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

  const response = await graphqlClient.post('', {
    query: mutation,
    variables: { id, input: data },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateCase;
};

export const deleteCase = async (id: string) => {
  const mutation = `
    mutation DeleteCase($id: ID!) {
      deleteCase(id: $id) {
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

  return response.data.data.deleteCase;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const query = `
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

  const response = await graphqlClient.post('', { query });

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.getDashboardStats;
};
