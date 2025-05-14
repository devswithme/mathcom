'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Header from '@/components/header';
import { useNavbar } from '@/context/NavbarContext';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { ChatShortcutsProvider } from '@/context/ChatShortcutsContext';
import { ChatShortcutsHandlersBridgeProvider, useChatShortcutsHandlersBridge } from '@/context/ChatShortcutsHandlersBridgeContext';

// Provide no-op handlers by default
const noop = () => {};
const shortcutsValue = {
  handleSimilarQs: noop,
  handleAskTutor: noop,
  handleEndChat: noop,
};

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { isNavbarOpen, toggleNavbar, closeNavbar } = useNavbar();
  const pathname = usePathname();
  const { handlers } = useChatShortcutsHandlersBridge();
  
  // Check if we're on the onboarding page
  const isOnboarding = pathname.includes('/onboarding');
  
  // If we're on onboarding, just render the children without navbar/header
  if (isOnboarding) {
    return <>{children}</>;
  }
  
  // Use real handlers only on /chat
  const value = pathname === '/chat' ? handlers : shortcutsValue;
  
  return (
    <ChatShortcutsProvider value={value}>
      <>
        <Header />
        <div className="flex min-h-screen">
          {/* Sidebar - always visible on desktop, toggleable on mobile */}
          <div className={`fixed top-[56px] left-0 w-64 h-[calc(100vh-56px)] overflow-y-auto z-40 transition-all duration-300 ease-in-out transform ${
            isNavbarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } md:border-r md:border-gray-200 md:bg-white bg-white shadow-lg md:shadow-none`}>
            <Navbar className="p-4" />
            
            {/* Mobile-only close button */}
            {isNavbarOpen && (
              <div className="absolute top-4 right-4 md:hidden">
                <Button variant="ghost" size="sm" onClick={closeNavbar} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Overlay for mobile */}
          {isNavbarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-30 md:hidden" 
              onClick={closeNavbar}
              aria-hidden="true" 
            />
          )}
          
          {/* Main content - with standardized padding */}
          <main className="w-full transition-all duration-300 ease-in-out pt-[40px] pb-4 md:ml-64">
            {children}
          </main>
        </div>
      </>
    </ChatShortcutsProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatShortcutsHandlersBridgeProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </ChatShortcutsHandlersBridgeProvider>
  );
} 