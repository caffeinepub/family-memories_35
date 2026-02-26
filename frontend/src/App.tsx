import React from 'react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  redirect,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LandingPage from './components/LandingPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import FamilyGroupPage from './pages/FamilyGroupPage';
import GroupChatPage from './pages/GroupChatPage';
import { Toaster } from '@/components/ui/sonner';

// ── Route tree ────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Layout,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: FeedPage,
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups',
  component: FamilyGroupPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$groupId',
  component: GroupChatPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/feed' });
  },
});

const routeTree = rootRoute.addChildren([indexRoute, feedRoute, groupsRoute, chatRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ── Auth wrapper ──────────────────────────────────────────────────────────────

function AuthenticatedApp() {
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !isLoading && isFetched && userProfile === null;

  return (
    <>
      <RouterProvider router={router} />
      <ProfileSetupModal open={showProfileSetup} />
      <Toaster richColors position="top-right" />
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/memory-icon.dim_128x128.png"
            alt="Loading"
            className="w-16 h-16 object-contain mx-auto animate-pulse"
          />
          <p className="font-handwritten text-2xl text-primary">Loading Heavenuse…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return <AuthenticatedApp />;
}
