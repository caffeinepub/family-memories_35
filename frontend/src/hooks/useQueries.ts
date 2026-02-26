import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, FamilyGroupDTO, MemoryPost, Message, MediaType } from '../backend';
import { Principal } from '@dfinity/principal';

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(principal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getUserProfile(Principal.fromText(principal));
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetDisplayName(principal: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['displayName', principal],
    queryFn: async () => {
      if (!actor || !principal) return '';
      try {
        return await actor.getDisplayName(Principal.fromText(principal));
      } catch {
        return '';
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Family Groups ─────────────────────────────────────────────────────────────

export function useGetAllFamilyGroups() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FamilyGroupDTO[]>({
    queryKey: ['familyGroups'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFamilyGroups();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetFamilyGroupDetails(groupId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FamilyGroupDTO | null>({
    queryKey: ['familyGroupDetails', groupId],
    queryFn: async () => {
      if (!actor || !groupId) return null;
      try {
        return await actor.getFamilyGroupDetails(groupId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!groupId,
  });
}

export function useCreateFamilyGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createFamilyGroup(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
    },
  });
}

export function useAddMemberToGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, memberPrincipal }: { groupId: string; memberPrincipal: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMemberToGroup(groupId, Principal.fromText(memberPrincipal));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
      queryClient.invalidateQueries({ queryKey: ['familyGroupDetails', variables.groupId] });
    },
  });
}

export function useRemoveMemberFromGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, memberPrincipal }: { groupId: string; memberPrincipal: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeMemberFromGroup(groupId, Principal.fromText(memberPrincipal));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
      queryClient.invalidateQueries({ queryKey: ['familyGroupDetails', variables.groupId] });
    },
  });
}

// ── Memories ──────────────────────────────────────────────────────────────────

export function useGetMemoriesByGroup(groupId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MemoryPost[]>({
    queryKey: ['memories', groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      const memories = await actor.getMemoriesByGroup(groupId);
      return [...memories].sort((a, b) => {
        if (a.timestamp > b.timestamp) return -1;
        if (a.timestamp < b.timestamp) return 1;
        return 0;
      });
    },
    enabled: !!actor && !actorFetching && !!groupId,
  });
}

export function useCreateMemoryPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      imageUrl,
      familyGroupId,
    }: {
      id: string;
      title: string;
      description: string;
      imageUrl: string;
      familyGroupId: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMemoryPost(id, title, description, imageUrl, familyGroupId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memories', variables.familyGroupId] });
    },
  });
}

// ── Chat / Messages ───────────────────────────────────────────────────────────

export function useGetMessages(groupId: string | null, limit: number = 100) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      try {
        const msgs = await actor.getMessages(groupId, BigInt(limit), null);
        // Backend returns newest-first; reverse so oldest is at top for chat display
        return [...msgs].reverse();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!groupId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      groupId,
      text,
      mediaUrl,
      mediaType,
    }: {
      id: string;
      groupId: string;
      text: string | null;
      mediaUrl: string | null;
      mediaType: MediaType;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(id, groupId, text, mediaUrl, mediaType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.groupId] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, groupId }: { messageId: string; groupId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMessage(messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.groupId] });
    },
  });
}
