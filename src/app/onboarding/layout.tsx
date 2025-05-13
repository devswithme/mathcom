'use client';

import React from 'react';
import { Quicksand } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";

const quickSand = Quicksand({
  subsets: ["latin"],
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${quickSand.className} min-h-screen bg-white`}>
      {children}
      <Toaster position="bottom-center" richColors />
    </div>
  );
} 