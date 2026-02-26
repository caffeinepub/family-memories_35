import React, { useState, useEffect } from 'react';
import { useGetAllFamilyGroups, useGetMemoriesByGroup } from '../hooks/useQueries';
import MemoryCard from '../components/MemoryCard';
import CreateMemoryModal from '../components/CreateMemoryModal';
import GroupSelector from '../components/GroupSelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

function MemoryCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-scrapbook">
      <Skeleton className="h-52 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading: groupsLoading } = useGetAllFamilyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Auto-select first group
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const { data: memories = [], isLoading: memoriesLoading } = useGetMemoriesByGroup(selectedGroupId);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const isLoading = groupsLoading || memoriesLoading;

  // No groups state
  if (!groupsLoading && groups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground mb-3">
          No Family Groups Yet
        </h2>
        <p className="font-body text-muted-foreground mb-8 max-w-sm mx-auto">
          Create a family group to start sharing memories with your loved ones.
        </p>
        <Button onClick={() => navigate({ to: '/groups' })} size="lg">
          Create Your First Group
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            {selectedGroup ? selectedGroup.name : 'Memory Feed'}
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            {memories.length > 0
              ? `${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} shared`
              : 'No memories yet — be the first to share!'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GroupSelector
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
          />
          {selectedGroupId && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="shrink-0"
            >
              <PlusCircle className="mr-2 w-4 h-4" />
              Add Memory
            </Button>
          )}
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MemoryCardSkeleton key={i} />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <img
              src="/assets/generated/memory-icon.dim_128x128.png"
              alt="Memory"
              className="w-12 h-12 object-contain opacity-70"
            />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
            No memories yet
          </h3>
          <p className="font-body text-muted-foreground mb-6 max-w-xs mx-auto">
            Start building your family's story by adding the first memory.
          </p>
          {selectedGroupId && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <PlusCircle className="mr-2 w-4 h-4" />
              Add First Memory
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}

      {/* Create Memory Modal */}
      {selectedGroupId && (
        <CreateMemoryModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          familyGroupId={selectedGroupId}
        />
      )}
    </div>
  );
}
