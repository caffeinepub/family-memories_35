import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import LoginButton from './LoginButton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetAllFamilyGroups } from '../hooks/useQueries';
import { Heart, BookOpen, Users, Menu, X, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: groups = [] } = useGetAllFamilyGroups();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use the first group for the chat link, or a placeholder
  const firstGroupId = groups.length > 0 ? groups[0].id : null;

  const navItems = [
    { label: 'Memories', path: '/feed', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Groups', path: '/groups', icon: <Users className="w-4 h-4" /> },
    ...(firstGroupId
      ? [{ label: 'Chat', path: `/chat/${firstGroupId}`, icon: <MessageCircle className="w-4 h-4" /> }]
      : [{ label: 'Chat', path: '/groups', icon: <MessageCircle className="w-4 h-4" /> }]
    ),
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/chat/')) return location.pathname.startsWith('/chat/');
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate({ to: '/feed' })}
            className="flex items-center gap-2 shrink-0"
          >
            <img
              src="/assets/generated/memory-icon.dim_128x128.png"
              alt="Heavenuse"
              className="w-8 h-8 object-contain"
            />
            <span className="font-handwritten text-xl sm:text-2xl text-primary font-semibold hidden sm:block">
              Heavenuse
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate({ to: item.path })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {profile && (
              <span className="hidden sm:block font-body text-sm text-muted-foreground">
                Hello, <span className="text-foreground font-medium">{profile.name}</span>
              </span>
            )}
            {identity && <LoginButton variant="outline" size="sm" />}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate({ to: item.path });
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            {profile && (
              <p className="px-4 py-2 font-body text-sm text-muted-foreground">
                Signed in as <span className="text-foreground font-medium">{profile.name}</span>
              </p>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5 text-center bg-card/50">
        <p className="font-body text-sm text-muted-foreground">
          © {new Date().getFullYear()} Heavenuse &nbsp;·&nbsp; Built with{' '}
          <Heart className="inline w-3.5 h-3.5 text-primary fill-primary" />{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'heavenuse')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
