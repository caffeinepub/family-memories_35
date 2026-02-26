import React from 'react';
import LoginButton from './LoginButton';
import { Heart, Image, Users, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: <MessageCircle className="w-7 h-7 text-primary" />,
    title: 'Group Chat',
    desc: 'Chat with your group in real time — send text, photos, and videos all in one place.',
  },
  {
    icon: <Image className="w-7 h-7 text-primary" />,
    title: 'Photo & Video Sharing',
    desc: 'Share your favourite moments with photos and videos directly in the group chat.',
  },
  {
    icon: <Users className="w-7 h-7 text-primary" />,
    title: 'Private Groups',
    desc: 'Create private groups, invite members by name, and keep your conversations secure.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/assets/generated/memory-icon.dim_128x128.png" alt="Heavenuse" className="w-9 h-9 object-contain" />
          <span className="font-handwritten text-2xl text-primary font-semibold">Heavenuse</span>
        </div>
        <LoginButton variant="default" />
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/assets/generated/hero-banner.dim_1200x400.png"
          alt="Heavenuse group chat"
          className="w-full h-64 sm:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end">
          <div className="px-6 pb-8 sm:px-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Welcome to Heavenuse
            </h1>
            <p className="mt-2 font-body text-lg text-muted-foreground max-w-xl">
              A private space to chat, share photos &amp; videos, and stay connected with the people you love.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <main className="flex-1 px-6 py-12 sm:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-center text-foreground mb-10">
            Everything you need to stay connected
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-xl p-6 shadow-scrapbook border border-border flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="font-body text-muted-foreground mb-4">
              Sign in securely — no passwords needed.
            </p>
            <LoginButton size="lg" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5 text-center">
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
