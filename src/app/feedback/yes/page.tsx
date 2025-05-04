'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Info } from 'lucide-react';

const FeedbackYesPage = () => {
  const [showInfo, setShowInfo] = useState(false);

  // Close modal on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowInfo(false);
  }, []);

  useEffect(() => {
    if (showInfo) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showInfo, handleKeyDown]);

  return (
    <div className="flex-grow flex items-start justify-center pt-[10vh] pb-10">
      <div className="w-full max-w-xl bg-neutral-100 rounded-2xl shadow-md border border-neutral-200 flex flex-col items-start p-8 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-[28px] text-[#11244D] text-left w-full">
          Satisfied with AI Response?
        </h1>
        
        <div className="flex gap-[16px] mb-[40px] w-full">
          <Button className="rounded-full py-1.5 px-8 text-base font-semibold bg-[#11244D]/70 hover:bg-[#11244D]/80 text-white">
            Yes
          </Button>
          <Link href="/feedback/no">
            <Button variant="outline" className="rounded-full py-1.5 px-8 text-base font-semibold border border-[#11244D]/50 text-[#11244D] bg-white hover:bg-[#11244D]/10 hover:border-[#11244D] hover:text-[#11244D] transition-colors">
              No
            </Button>
          </Link>
        </div>
        
        <div className="w-full pb-1">
          <div className="mb-[28px]">
            <div className="flex items-start">
              <div className="text-base md:text-lg font-semibold text-[#11244D]/80">
                Okay if MathCom AI shares a summary of <br />
                <div className="flex items-center">
                  <span>this chat with the community?</span>
                  <button 
                    onClick={() => setShowInfo(true)} 
                    className="inline-flex items-center justify-center ml-2"
                  >
                    <Info className="w-4 h-4 text-[#11244D]/70" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-[16px] w-full">
            <Button className="rounded-full py-1.5 px-8 text-base font-semibold bg-[#11244D]/70 hover:bg-[#11244D]/80 text-white">
              Yes
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full py-1.5 px-8 text-base font-semibold border border-[#11244D]/50 text-[#11244D] bg-white hover:bg-[#11244D]/10 hover:border-[#11244D] hover:text-[#11244D] transition-colors"
            >
              No
            </Button>
          </div>
        </div>
      </div>
      
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg pt-5 pb-8 px-8 max-w-md w-full relative animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-[#11244D]/70 mr-2" />
                <span className="font-semibold text-[#11244D]">Info</span>
              </div>
              <button 
                onClick={() => setShowInfo(false)} 
                className="text-[#11244D]/70 hover:text-[#11244D] text-xl font-medium focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="text-[#11244D]/80 text-base">
              If you're satisfied, MathCom AI can summarize this chat and post it to the community feed. You'll have the option to stay anonymous.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackYesPage;