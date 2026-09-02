import { useMutation, useQuery, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export interface RelationshipRegistration {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  relationshipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipRegistrationDetail extends RelationshipRegistration {
  relationships: RegisteredRelationship[];
}

export interface RegisteredRelationship {
  id: string;
  registrationId: string;
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  relationType: string;
  reason?: string;
  createdAt: string;
}

export interface CreateRelationshipRegistrationInput {
  name: string;
  description?: string;
}

export interface UpdateRelationshipRegistrationInput {
  name?: string;
  description?: string;
}

export interface CreateRegisteredRelationshipInput {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  reason?: string;
}

function relationshipRegistrationQueryKey(id?: string | null) {
  return id ? ['relationshipRegistrations', id] : ['relationshipRegistrations'];
}

export function useRelationshipRegistrations(): UseQueryResult<RelationshipRegistration[], Error> {
  return useQuery({
    queryKey: relationshipRegistrationQueryKey(),
    queryFn: () => apiRequest<RelationshipRegistration[]>('/api/relationship-registrations'),
  });
}

export function useRelationshipRegistration(
  id: string | null,
): UseQueryResult<RelationshipRegistrationDetail, Error> {
  return useQuery({
    queryKey: relationshipRegistrationQueryKey(id),
    queryFn: () => apiRequest<RelationshipRegistrationDetail>(`/api/relationship-registrations/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateRelationshipRegistration(): UseMutationResult<
  RelationshipRegistration,
  Error,
  CreateRelationshipRegistrationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRelationshipRegistrationInput) =>
      apiRequest<RelationshipRegistration>('/api/relationship-registrations', { method: 'POST', body: input }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey() });
    },
  });
}

export function useUpdateRelationshipRegistration(
  id: string,
): UseMutationResult<RelationshipRegistration, Error, UpdateRelationshipRegistrationInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRelationshipRegistrationInput) =>
      apiRequest<RelationshipRegistration>(`/api/relationship-registrations/${id}`, { method: 'PUT', body: input }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey(id) });
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey() });
    },
  });
}

export function useDeleteRelationshipRegistration(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/relationship-registrations/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey() });
    },
  });
}

export function useAddRelationshipToRegistration(
  registrationId: string,
): UseMutationResult<RegisteredRelationship, Error, CreateRegisteredRelationshipInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRegisteredRelationshipInput) =>
      apiRequest<RegisteredRelationship>(
        `/api/relationship-registrations/${registrationId}/relationships`,
        { method: 'POST', body: input },
      ),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey(registrationId) });
    },
  });
}

export function useRemoveRelationshipFromRegistration(
  registrationId: string,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relationshipId: string) =>
      apiRequest(
        `/api/relationship-registrations/${registrationId}/relationships/${relationshipId}`,
        { method: 'DELETE' },
      ),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: relationshipRegistrationQueryKey(registrationId) });
    },
  });
}
