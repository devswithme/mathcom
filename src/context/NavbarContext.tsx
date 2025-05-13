'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type NavbarContextType = {
  isNavbarOpen: boolean;
  toggleNavbar: () => void;
  closeNavbar: () => void;
};

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  // Start with navbar hidden on mobile, visible on desktop
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  // Initialize based on screen size when component mounts
  useEffect(() => {
    const updateNavbarState = () => {
      // Hide navbar by default on mobile/small screens
      if (window.innerWidth < 768) {
        setIsNavbarOpen(false);
      } else {
        setIsNavbarOpen(true);
      }
    };

    // Set initial state
    updateNavbarState();

    // Update when window resizes
    window.addEventListener('resize', updateNavbarState);
    return () => window.removeEventListener('resize', updateNavbarState);
  }, []);

  const toggleNavbar = () => setIsNavbarOpen(!isNavbarOpen);
  const closeNavbar = () => setIsNavbarOpen(false);

  return (
    <NavbarContext.Provider value={{ isNavbarOpen, toggleNavbar, closeNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
} 