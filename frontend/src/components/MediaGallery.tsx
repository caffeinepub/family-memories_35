import React from 'react';
import { useGetMessages } from '../hooks/useQueries';
import { MediaType } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Video, ImageOff } from 'lucide-react';

interface MediaGalleryProps {
  groupId: string;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return principal.slice(0, 6) + '…' + principal.slice(-4);
}

export default function MediaGallery({ groupId }: MediaGalleryProps) {
  const { data: messages = [], isLoading } = useGetMessages(groupId, 500);

  const mediaMessages = messages.filter(
    (msg) => msg.mediaUrl && (msg.mediaType === MediaType.image || msg.mediaType === MediaType.video)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-xl w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (mediaMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <ImageOff className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="font-serif text-xl text-foreground">No media shared yet</p>
        <p className="font-body text-sm text-muted-foreground">
          Photos and videos shared in the group chat will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {mediaMessages.map((msg) => {
        const senderName = msg.displayName || truncatePrincipal(msg.sender.toString());
        return (
          <div
            key={msg.id}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-scrapbook hover:shadow-scrapbook-lg transition-shadow"
          >
            {/* Media */}
            <div className="aspect-square bg-muted relative overflow-hidden">
              {msg.mediaType === MediaType.image ? (
                <img
                  src={msg.mediaUrl!}
                  alt={`Shared by ${senderName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
                    }
                  }}
                />
              ) : (
                <video
                  src={msg.mediaUrl!}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              {/* Type badge */}
              <div className="absolute top-2 right-2">
                <span className="bg-black/50 text-white rounded-full p-1 flex items-center justify-center">
                  {msg.mediaType === MediaType.image ? (
                    <Image className="w-3 h-3" />
                  ) : (
                    <Video className="w-3 h-3" />
                  )}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="px-3 py-2">
              <p className="font-body text-sm font-medium text-foreground truncate">{senderName}</p>
              <p className="font-body text-xs text-muted-foreground">{formatDate(msg.timestamp)}</p>
              {msg.text && (
                <p className="font-body text-xs text-muted-foreground mt-1 truncate italic">
                  &ldquo;{msg.text}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
