import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SkipLink } from '@/components/ui/skip-link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useRealtimePushNotifications } from '@/hooks/useRealtimePushNotifications';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useSessionTimeout();
  useRealtimeSubscription();
  useRealtimePushNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip Link for accessibility */}
      <SkipLink targetId="main-content" />

      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-success/5 blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block" aria-label="Menu principal">
        <Sidebar />
      </nav>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <nav aria-label="Menu principal mobile">
            <Sidebar />
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main 
          id="main-content" 
          className="flex-1 overflow-auto"
          role="main"
          tabIndex={-1}
        >
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
            <Breadcrumbs />
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Chat Interno */}
      <ChatPanel />

      {/* Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
