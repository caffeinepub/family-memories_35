import React, { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useNavigate } from '@tanstack/react-router';
import {
  useGetAllFamilyGroups,
  useCreateFamilyGroup,
  useAddMemberToGroup,
  useRemoveMemberFromGroup,
  useGetDisplayName,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, PlusCircle, UserPlus, UserMinus, Loader2, Crown, MessageCircle, Image } from 'lucide-react';
import type { FamilyGroupDTO } from '../backend';
import MediaGallery from '../components/MediaGallery';

function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isValidPrincipal(text: string): boolean {
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return principal.slice(0, 8) + '…' + principal.slice(-6);
}

function MemberDisplayName({ principalStr }: { principalStr: string }) {
  const { data: name, isLoading } = useGetDisplayName(principalStr);
  if (isLoading) return <Skeleton className="h-4 w-24 inline-block" />;
  if (name) return <span className="font-medium text-foreground">{name}</span>;
  return <span className="font-mono text-xs text-muted-foreground">{truncatePrincipal(principalStr)}</span>;
}

function CreateGroupCard() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const createGroup = useCreateFamilyGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    setError('');
    try {
      await createGroup.mutateAsync({ id: generateGroupId(), name: name.trim() });
      setName('');
    } catch {
      setError('Failed to create group. Please try again.');
    }
  };

  return (
    <Card className="shadow-scrapbook border-border">
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          Create a New Group
        </CardTitle>
        <CardDescription className="font-body">
          Start a private group and invite your members to chat and share.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 space-y-1">
            <Label htmlFor="group-name" className="sr-only">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. The Johnson Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button type="submit" disabled={createGroup.isPending} className="shrink-0">
            {createGroup.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
            ) : (
              'Create Group'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupCard({ group }: { group: FamilyGroupDTO }) {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [invitePrincipal, setInvitePrincipal] = useState('');
  const [inviteError, setInviteError] = useState('');
  const addMember = useAddMemberToGroup();
  const removeMember = useRemoveMemberFromGroup();

  const isOwner = identity?.getPrincipal().toString() === group.owner.toString();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = invitePrincipal.trim();
    if (!trimmed) {
      setInviteError('Please enter a principal ID.');
      return;
    }
    if (!isValidPrincipal(trimmed)) {
      setInviteError('Invalid principal ID format.');
      return;
    }
    setInviteError('');
    try {
      await addMember.mutateAsync({ groupId: group.id, memberPrincipal: trimmed });
      setInvitePrincipal('');
    } catch {
      setInviteError('Failed to add member. They may already be in the group.');
    }
  };

  const handleRemoveSelf = async () => {
    const principal = identity?.getPrincipal().toString();
    if (!principal) return;
    try {
      await removeMember.mutateAsync({ groupId: group.id, memberPrincipal: principal });
    } catch {
      // ignore
    }
  };

  return (
    <Card className="shadow-scrapbook border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary shrink-0" />
              {group.name}
            </CardTitle>
            <CardDescription className="font-body mt-1">
              {Number(group.memberCount)} member{Number(group.memberCount) !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <Badge variant="secondary" className="font-body flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Owner
              </Badge>
            )}
            <Button
              size="sm"
              variant="default"
              className="flex items-center gap-1.5"
              onClick={() => navigate({ to: '/chat/$groupId', params: { groupId: group.id } })}
            >
              <MessageCircle className="w-4 h-4" />
              Open Chat
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members" className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Members
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Gallery
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-5">
            {/* Owner info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-body text-xs text-muted-foreground mb-1">Group Owner</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
                <MemberDisplayName principalStr={group.owner.toString()} />
                <span className="font-mono text-xs text-muted-foreground break-all">
                  ({truncatePrincipal(group.owner.toString())})
                </span>
              </div>
            </div>

            {/* Member count note */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-body text-xs text-muted-foreground mb-1">Total Members</p>
              <p className="font-body text-sm font-medium text-foreground">
                {Number(group.memberCount)} member{Number(group.memberCount) !== 1 ? 's' : ''} in this group
              </p>
            </div>

            {/* Invite member (owner only) */}
            {isOwner && (
              <div className="space-y-2">
                <Label className="font-body font-medium flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Invite a Member
                </Label>
                <form onSubmit={handleInvite} className="flex gap-2 flex-col sm:flex-row">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Enter principal ID…"
                      value={invitePrincipal}
                      onChange={(e) => setInvitePrincipal(e.target.value)}
                      className="font-mono text-sm"
                    />
                    {inviteError && <p className="text-destructive text-sm">{inviteError}</p>}
                  </div>
                  <Button type="submit" variant="outline" disabled={addMember.isPending} className="shrink-0">
                    {addMember.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Invite'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Leave group (non-owner) */}
            {!isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <UserMinus className="mr-2 w-4 h-4" />
                    Leave Group
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Leave &quot;{group.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription className="font-body">
                      You will no longer be able to view or send messages in this group. The group owner can re-invite you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveSelf}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                    >
                      Leave Group
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <MediaGallery groupId={group.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function FamilyGroupPage() {
  const { data: groups = [], isLoading } = useGetAllFamilyGroups();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
          Groups
        </h1>
        <p className="font-body text-muted-foreground mt-1">
          Manage your groups, invite members, and open group chats.
        </p>
      </div>

      <div className="space-y-6">
        {/* Create group */}
        <CreateGroupCard />

        {/* Existing groups */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-scrapbook">
                <CardHeader>
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border shadow-scrapbook">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-serif text-xl text-foreground mb-1">No groups yet</p>
            <p className="font-body text-sm text-muted-foreground">
              Create your first group above to get started.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))
        )}
      </div>
    </div>
  );
}
