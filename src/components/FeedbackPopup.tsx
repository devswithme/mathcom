'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMessages?: { role: 'user' | 'assistant', content: string }[];
  initialQuestion?: { title: string; description: string; community: string; anonymous: boolean };
}

const FeedbackPopup = ({ isOpen, onClose, sessionMessages, initialQuestion }: FeedbackPopupProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const [step, setStep] = useState<'initial' | 'yes' | 'no'>('initial');
  const [shareSummary, setShareSummary] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const postToCommunity = async (summary?: string) => {
    if (!initialQuestion) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      let userData = null;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        userData = userDoc.data();
      }
      const postData: any = {
        title: initialQuestion.title,
        description: initialQuestion.description,
        community: initialQuestion.community,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
        anonymous: initialQuestion.anonymous,
      };
      if (summary) postData.summary = summary;
      if (!initialQuestion.anonymous && user) {
        postData.userId = user.uid;
        postData.userName = userData?.displayName || user.displayName || 'User';
        postData.userPhotoURL = userData?.photoURL || user.photoURL || '/defaultprofile.png';
      } else if (user) {
        postData.userId = user.uid;
        postData.userName = 'Anonymous User';
        postData.userPhotoURL = '/defaultprofile.png';
      }
      const docRef = await addDoc(collection(db, 'posts'), postData);
      setCompleted(true);
      setTimeout(() => {
        onClose();
        router.push(`/post/${docRef.id}`);
      }, 1200);
    } catch (e) {
      setCompleted(true);
      setTimeout(() => {
        onClose();
        router.push('/');
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleShareDecision = async (share: boolean) => {
    setShareSummary(share);
    setCompleted(false);
    if (share) {
      setLoading(true);
      // Call /summarize-chat endpoint
      try {
        const res = await fetch('http://localhost:5001/summarize-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: sessionMessages }),
        });
        const data = await res.json();
        const summary = data.summary || '';
        console.log('Summary from /summarize-chat:', summary);
        await postToCommunity(summary);
      } catch (e) {
        await postToCommunity(); // fallback: post without summary
      }
    } else {
      setCompleted(true);
      setTimeout(() => {
        onClose();
        router.push('/');
      }, 1200);
    }
  };

  const handlePostQuestion = async () => {
    await postToCommunity();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full relative animate-scale-in mx-4">
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
              
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#11244D]/70 mr-3"></div>
                  <span className="text-base font-medium text-[#11244D]/70">
                    Summarizing your conversation...
                  </span>
                </div>
              ) : (
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
              )}
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
                  onClick={() => {
                    onClose();
                    router.push('/');
                  }}
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
                ? "If you're satisfied, MathCom AI can summarize this chat and post it to the community feed."
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