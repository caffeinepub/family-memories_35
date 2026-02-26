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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateMemoryPost } from '../hooks/useQueries';
import { Loader2, ImageIcon } from 'lucide-react';

interface CreateMemoryModalProps {
  open: boolean;
  onClose: () => void;
  familyGroupId: string;
}

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function CreateMemoryModal({ open, onClose, familyGroupId }: CreateMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<{ title?: string; general?: string }>({});

  const createMemory = useCreateMemoryPost();

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; general?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'A title is required for your memory.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await createMemory.mutateAsync({
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        familyGroupId,
      });
      handleClose();
    } catch (err) {
      setErrors({ general: 'Failed to save memory. Please try again.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a New Memory</DialogTitle>
          <DialogDescription className="font-body">
            Capture a special moment to share with your family.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="mem-title" className="font-body font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mem-title"
              placeholder="e.g. Summer at the Lake"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-body"
            />
            {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="mem-desc" className="font-body font-medium">Description</Label>
            <Textarea
              id="mem-desc"
              placeholder="Share the story behind this memory…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-body resize-none"
              rows={3}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="mem-img" className="font-body font-medium flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              Image URL
            </Label>
            <Input
              id="mem-img"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="font-body"
              type="url"
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {errors.general && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
              {errors.general}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={createMemory.isPending} className="flex-1">
              {createMemory.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Memory'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
