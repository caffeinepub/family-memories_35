import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAllFamilyGroups } from '../hooks/useQueries';
import { Users } from 'lucide-react';

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
}

export default function GroupSelector({ selectedGroupId, onSelect }: GroupSelectorProps) {
  const { data: groups = [], isLoading } = useGetAllFamilyGroups();

  if (isLoading) {
    return (
      <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={selectedGroupId ?? ''} onValueChange={onSelect}>
        <SelectTrigger className="w-48 font-body text-sm">
          <SelectValue placeholder="Select a group…" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id} className="font-body">
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
