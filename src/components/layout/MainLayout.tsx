import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-success/5 blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
