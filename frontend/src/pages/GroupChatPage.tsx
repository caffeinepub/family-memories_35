import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetMessages,
  useSendMessage,
  useDeleteMessage,
  useGetFamilyGroupDetails,
} from '../hooks/useQueries';
import { MediaType } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Send, Trash2, Image, Video, MessageCircle, Users, Loader2, Lock } from 'lucide-react';
import type { Message } from '../backend';

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return principal.slice(0, 6) + '…' + principal.slice(-4);
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (id: string) => void;
  canDelete: boolean;
}

function MessageBubble({ message, isOwn, onDelete, canDelete }: MessageBubbleProps) {
  const senderName = message.displayName || truncatePrincipal(message.sender.toString());

  return (
    <div className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[65%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      {!isOwn && (
        <span className="text-xs font-medium text-primary px-1">{senderName}</span>
      )}
      <div
        className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-bl-sm'
        }`}
      >
        {/* Text */}
        {message.text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {/* Media */}
        {message.mediaUrl && message.mediaType === MediaType.image && (
          <div className="mt-2">
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="rounded-lg max-w-full max-h-64 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {message.mediaUrl && message.mediaType === MediaType.video && (
          <div className="mt-2">
            <video
              src={message.mediaUrl}
              controls
              className="rounded-lg max-w-full max-h-64"
            />
          </div>
        )}

        {/* Timestamp + delete */}
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatTime(message.timestamp)}
          </span>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                isOwn ? 'text-primary-foreground/60 hover:text-primary-foreground' : 'text-muted-foreground hover:text-destructive'
              }`}
              title="Delete message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {isOwn && (
        <span className="text-xs text-muted-foreground px-1">You</span>
      )}
    </div>
  );
}

export default function GroupChatPage() {
  const { groupId } = useParams({ strict: false }) as { groupId: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [sendError, setSendError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: groupDetails, isLoading: groupLoading } = useGetFamilyGroupDetails(groupId || null);
  const { data: messages = [], isLoading: messagesLoading } = useGetMessages(groupId || null, 100);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();

  const currentPrincipal = identity?.getPrincipal().toString() ?? '';

  // Redirect if not authenticated
  useEffect(() => {
    if (!identity) {
      navigate({ to: '/feed' });
    }
  }, [identity, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMediaTypeEnum = (): MediaType => {
    if (mediaType === 'image') return MediaType.image;
    if (mediaType === 'video') return MediaType.video;
    return MediaType.none;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const trimmedUrl = mediaUrl.trim();

    if (!trimmedText && !trimmedUrl) {
      setSendError('Please enter a message or media URL.');
      return;
    }
    if (trimmedUrl && mediaType === 'none') {
      setSendError('Please select a media type (Image or Video) for the URL.');
      return;
    }

    setSendError('');
    try {
      await sendMessage.mutateAsync({
        id: generateMessageId(),
        groupId: groupId!,
        text: trimmedText || null,
        mediaUrl: trimmedUrl || null,
        mediaType: getMediaTypeEnum(),
      });
      setText('');
      setMediaUrl('');
      setMediaType('none');
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId, groupId: groupId! });
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (!identity) return null;

  if (!groupId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground opacity-40" />
        <p className="font-serif text-xl text-foreground">No group selected</p>
        <p className="font-body text-sm text-muted-foreground">Please select a group from the Groups page.</p>
        <Button onClick={() => navigate({ to: '/groups' })}>Go to Groups</Button>
      </div>
    );
  }

  // Access denied if group not found (user not a member)
  if (!groupLoading && groupDetails === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Lock className="w-12 h-12 text-muted-foreground opacity-40" />
        <p className="font-serif text-xl text-foreground">Access Denied</p>
        <p className="font-body text-sm text-muted-foreground text-center">
          You are not a member of this group or the group does not exist.
        </p>
        <Button onClick={() => navigate({ to: '/groups' })}>Go to Groups</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {groupLoading ? (
              <>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <h1 className="font-serif text-lg font-semibold text-foreground truncate">
                  {groupDetails?.name ?? 'Group Chat'}
                </h1>
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {groupDetails ? `${Number(groupDetails.memberCount)} member${Number(groupDetails.memberCount) !== 1 ? 's' : ''}` : ''}
                </p>
              </>
            )}
          </div>
          <Badge variant="secondary" className="font-body text-xs shrink-0">
            Live
          </Badge>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex flex-col gap-1 max-w-[60%] ${i % 2 === 0 ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageCircle className="w-14 h-14 text-muted-foreground opacity-30" />
              <p className="font-serif text-xl text-foreground">No messages yet</p>
              <p className="font-body text-sm text-muted-foreground">
                Be the first to say something in <strong>{groupDetails?.name}</strong>!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const isOwn = msg.sender.toString() === currentPrincipal;
                const isGroupOwner = groupDetails?.owner.toString() === currentPrincipal;
                const canDelete = isOwn || isGroupOwner;
                return (
                  <div key={msg.id} className="group flex flex-col">
                    <MessageBubble
                      message={msg}
                      isOwn={isOwn}
                      onDelete={handleDelete}
                      canDelete={canDelete}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-card border-t border-border px-4 sm:px-6 py-3 shrink-0">
          <form onSubmit={handleSend} className="space-y-2">
            {/* Media URL row */}
            <div className="flex gap-2">
              <Input
                placeholder="Media URL (optional)…"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="font-body text-sm flex-1"
              />
              <Select value={mediaType} onValueChange={(v) => setMediaType(v as 'none' | 'image' | 'video')}>
                <SelectTrigger className="w-28 font-body text-sm shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-1.5">No media</span>
                  </SelectItem>
                  <SelectItem value="image">
                    <span className="flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Image
                    </span>
                  </SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Video
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text + Send row */}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="font-body text-sm flex-1 resize-none min-h-[40px] max-h-32"
              />
              <Button
                type="submit"
                disabled={sendMessage.isPending}
                size="icon"
                className="shrink-0 h-10 w-10"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {sendError && (
              <p className="text-destructive text-xs font-body">{sendError}</p>
            )}
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
