import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from './graphql-client';
import * as queries from './graphql-queries';

// User Hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      return graphqlClient.request(queries.LOGIN_MUTATION, { input });
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_ME_QUERY);
    },
  });
};

export const useUsers = (params?: { limit?: number; offset?: number; role?: string; search?: string }) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_ALL_USERS_QUERY, params);
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      return graphqlClient.request(queries.CREATE_USER_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: any }) => {
      return graphqlClient.request(queries.UPDATE_USER_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request(queries.DELETE_USER_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Case Hooks
export const useCases = (params?: { limit?: number; offset?: number; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_ALL_CASES_QUERY, params);
    },
  });
};

export const useCase = (id: string) => {
  return useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_CASE_QUERY, { id });
    },
    enabled: !!id,
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      return graphqlClient.request(queries.CREATE_CASE_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: any }) => {
      return graphqlClient.request(queries.UPDATE_CASE_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
    },
  });
};

export const useDeleteCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request(queries.DELETE_CASE_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_DASHBOARD_STATS_QUERY);
    },
  });
};

// Evidence Hooks
export const useEvidence = (params?: { limit?: number; offset?: number; caseId?: string; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ['evidence', params],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_ALL_EVIDENCE_QUERY, params);
    },
  });
};

export const useEvidenceByCase = (caseId: string) => {
  return useQuery({
    queryKey: ['evidence', 'case', caseId],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_EVIDENCE_BY_CASE_QUERY, { caseId });
    },
    enabled: !!caseId,
  });
};

export const useCreateEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      return graphqlClient.request(queries.CREATE_EVIDENCE_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: any }) => {
      return graphqlClient.request(queries.UPDATE_EVIDENCE_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
};

export const useDeleteEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request(queries.DELETE_EVIDENCE_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useVerifyEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { evidenceId: string; hash: string }) => {
      return graphqlClient.request(queries.VERIFY_EVIDENCE_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['custodyLogs'] });
    },
  });
};

// Custody Log Hooks
export const useCustodyLogs = (params?: { limit?: number; offset?: number; evidenceId?: string; caseId?: string; action?: string; search?: string }) => {
  return useQuery({
    queryKey: ['custodyLogs', params],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_ALL_CUSTODY_LOGS_QUERY, params);
    },
  });
};

export const useCustodyLogsByEvidence = (evidenceId: string) => {
  return useQuery({
    queryKey: ['custodyLogs', 'evidence', evidenceId],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_CUSTODY_LOGS_BY_EVIDENCE_QUERY, { evidenceId });
    },
    enabled: !!evidenceId,
  });
};

export const useCustodyLogsByCase = (caseId: string) => {
  return useQuery({
    queryKey: ['custodyLogs', 'case', caseId],
    queryFn: async () => {
      return graphqlClient.request(queries.GET_CUSTODY_LOGS_BY_CASE_QUERY, { caseId });
    },
    enabled: !!caseId,
  });
};

export const useCreateCustodyLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      return graphqlClient.request(queries.CREATE_CUSTODY_LOG_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodyLogs'] });
    },
  });
};
