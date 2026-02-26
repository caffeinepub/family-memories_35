import React from 'react';
import type { MemoryPost } from '../backend';
import { useGetUserProfile } from '../hooks/useQueries';
import { Calendar, User } from 'lucide-react';

interface MemoryCardProps {
  memory: MemoryPost;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function AuthorName({ principal }: { principal: string }) {
  const { data: profile } = useGetUserProfile(principal);
  return (
    <span className="font-body text-sm text-muted-foreground">
      {profile?.name ?? principal.slice(0, 12) + '…'}
    </span>
  );
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const authorPrincipal = memory.author.toString();

  return (
    <article className="bg-card rounded-xl shadow-scrapbook border border-border overflow-hidden animate-fade-in hover:shadow-scrapbook-lg transition-shadow duration-300 group">
      {/* Image */}
      {memory.imageUrl && (
        <div className="relative overflow-hidden h-52 bg-muted">
          <img
            src={memory.imageUrl}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Decorative tape strip */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-accent/60 rounded-sm rotate-1 opacity-70" />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-handwritten text-2xl font-semibold text-foreground leading-tight mb-2">
          {memory.title}
        </h3>

        {/* Description */}
        {memory.description && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
            {memory.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <AuthorName principal={authorPrincipal} />
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-body text-xs text-muted-foreground">{formatDate(memory.timestamp)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
