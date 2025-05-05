'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Header from '@/components/header';
import { useNavbar } from '@/context/NavbarContext';
import { X } from 'lucide-react';
import { Button } from './ui/button';

// Client component to handle navbar state
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isNavbarOpen, toggleNavbar, closeNavbar } = useNavbar();
  
  return (
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
        
        {/* Main content - always adjusted for desktop */}
        <main className="w-full transition-all duration-300 ease-in-out px-4 pt-[86px] pb-4 md:ml-64">
          {children}
        </main>
      </div>
    </>
  );
} 