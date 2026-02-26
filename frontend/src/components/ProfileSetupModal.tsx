import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Loader2, Heart } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    setError('');
    try {
      await saveProfile.mutateAsync({ name: trimmed });
    } catch {
      setError('Failed to save profile. Please try again.');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-7 h-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="font-serif text-2xl text-center">Welcome to Family Memories!</DialogTitle>
          <DialogDescription className="text-center">
            Before we begin, what should we call you? This name will be shown on your memories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-body">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g. Grandma Rose"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body"
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Start Sharing Memories'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
