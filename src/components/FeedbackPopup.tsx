'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMessages?: { role: 'user' | 'assistant', content: string }[];
}

const FeedbackPopup = ({ isOpen, onClose, sessionMessages }: FeedbackPopupProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const [step, setStep] = useState<'initial' | 'yes' | 'no'>('initial');
  const [shareSummary, setShareSummary] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  // Close modal on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showInfo) {
        setShowInfo(false);
      } else {
        onClose();
      }
    }
  }, [showInfo, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when popup is closed
      setStep('initial');
      setShareSummary(null);
      setCompleted(false);
    }
  }, [isOpen]);

  const handleSatisfied = (satisfied: boolean) => {
    setStep(satisfied ? 'yes' : 'no');
  };

  const handleShareDecision = (share: boolean) => {
    setShareSummary(share);
    setCompleted(true);
    // Here you would handle posting to community if share is true
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handlePostQuestion = () => {
    // Logic to post question to community
    setCompleted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full relative animate-scale-in mx-4">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-[#11244D]/70 hover:text-[#11244D] text-xl font-medium focus:outline-none"
        >
          ×
        </button>

        <div className="w-full bg-neutral-100 rounded-2xl border border-neutral-200 flex flex-col items-start p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-[28px] text-[#11244D] text-left w-full">
            Satisfied with AI Response?
          </h1>
          
          {step === 'initial' && (
            <div className="flex gap-[16px] w-full">
              <Button 
                onClick={() => handleSatisfied(true)}
                className="rounded-full py-1.5 px-8 text-base font-semibold bg-[#11244D]/70 hover:bg-[#11244D]/80 text-white"
              >
                Yes
              </Button>
              <Button 
                onClick={() => handleSatisfied(false)}
                variant="outline" 
                className="rounded-full py-1.5 px-8 text-base font-semibold border border-[#11244D]/50 text-[#11244D] bg-white hover:bg-[#11244D]/10 hover:border-[#11244D] hover:text-[#11244D] transition-colors"
              >
                No
              </Button>
            </div>
          )}

          {step === 'yes' && !completed && (
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
                <Button 
                  onClick={() => handleShareDecision(true)}
                  className="rounded-full py-1.5 px-8 text-base font-semibold bg-[#11244D]/70 hover:bg-[#11244D]/80 text-white"
                >
                  Yes
                </Button>
                <Button 
                  onClick={() => handleShareDecision(false)}
                  variant="outline" 
                  className="rounded-full py-1.5 px-8 text-base font-semibold border border-[#11244D]/50 text-[#11244D] bg-white hover:bg-[#11244D]/10 hover:border-[#11244D] hover:text-[#11244D] transition-colors"
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {step === 'no' && !completed && (
            <div className="w-full pb-1">
              <div className="mb-0 w-full">
                <span className="text-base md:text-lg font-semibold text-[#11244D]/80 text-left mb-0">
                  Still need help?
                </span>
              </div>
              <div className="mb-[28px] w-full">
                <div className="flex items-center">
                  <span className="text-base md:text-lg font-semibold text-[#11244D]/80">
                    Ask the community or a tutor.
                  </span>
                  <button onClick={() => setShowInfo(true)} className="inline-flex items-center justify-center ml-2">
                    <Info className="w-4 h-4 text-[#11244D]/70" />
                  </button>
                </div>
              </div>
              <div className="flex gap-[16px] w-full">
                <Button 
                  onClick={handlePostQuestion}
                  className="rounded-full py-1.5 px-6 text-base font-semibold bg-[#11244D]/70 hover:bg-[#11244D]/80 text-white"
                >
                  Post my question
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline" 
                  className="rounded-full py-1.5 px-8 text-base font-semibold border border-[#11244D]/50 text-[#11244D] bg-white hover:bg-[#11244D]/10 hover:border-[#11244D] hover:text-[#11244D] transition-colors"
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {completed && (
            <div className="w-full text-center py-4">
              <div className="text-lg font-medium text-green-600">
                Thank you for your feedback!
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
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
              {step === 'yes' 
                ? "If you're satisfied, MathCom AI can summarize this chat and post it to the community feed. You'll have the option to stay anonymous."
                : "Still need help? You can post your question in the community forum to get answers from others or tutors."
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPopup; 