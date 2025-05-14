'use client';

import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, HelpCircle, MessageCircle, X as LucideX, Square as StopSquare } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import AI_Chat from "@/components/AI_Chat";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import FeedbackPopup from "@/components/FeedbackPopup";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChatShortcutsProvider } from '@/context/ChatShortcutsContext';
import { useChatShortcutsHandlersBridge } from '@/context/ChatShortcutsHandlersBridgeContext';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// Helper: auto-wrap common LaTeX patterns in $...$ if not already wrapped
function autoWrapLatex(content: string): string {
  // Only wrap if not already inside $...$
  // This is a simple heuristic and can be improved for edge cases
  // Patterns: \frac, \sqrt, ^{...}, _{...}, x^2, y^3, etc.
  const latexPattern = /(?<!\$)(\\frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|[a-zA-Z]\^\d+|[a-zA-Z]_\d+|\\[a-zA-Z]+)(?![^{]*\$)/g;
  return content.replace(latexPattern, (match) => `$${match}$`);
}

// Helper component to render markdown content
const MarkdownContent = ({ content, autoWrap = false }: { content: string, autoWrap?: boolean }) => {
  const processed = autoWrap ? autoWrapLatex(content) : content;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Add custom styling for different markdown elements
        p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
        strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
        // Preserve line breaks
        br: () => <br />,
        // Make sure inline code and code blocks are styled nicely
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <pre style={{ backgroundColor: '#f3f4f6', padding: '0.5em', borderRadius: '4px', overflow: 'auto' }}>
              <code>{children}</code>
            </pre>
          ) : (
            <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.2em 0.4em', borderRadius: '3px' }}>
              {children}
            </code>
          )
        },
      }}
    >
      {processed}
    </ReactMarkdown>
  );
};

const Page = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>("Guest"); // Initialize with Guest or loading state
  const [currentUserProfileImageUrl, setCurrentUserProfileImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null); // Ref for latest message
  const scrollOffsetRef = useRef<number | null>(null);
  const teleportLockRef = useRef(false);
  const router = useRouter();
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showAskTutorDialog, setShowAskTutorDialog] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [similarQuestion, setSimilarQuestion] = useState<string | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showAiThinkingBubble, setShowAiThinkingBubble] = useState(false);
  const aiChatRef = useRef<any>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);
  const { setHandlers } = useChatShortcutsHandlersBridge();

  // Placeholder for AI profile picture
  const aiProfileImageUrl: string | null = "/mathcomai.png";

  // Cache original question from sessionStorage on first load
  const [originalQuestion, setOriginalQuestion] = useState(() => {
    return {
      title: sessionStorage.getItem('ai_question_title') || '',
      description: sessionStorage.getItem('ai_question_description') || '',
      community: sessionStorage.getItem('ai_question_community') || 'cie_checkpoint',
      anonymous: JSON.parse(sessionStorage.getItem('ai_question_anonymous') || 'false'),
    };
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUserName(user.displayName || "User");
        setCurrentUserProfileImageUrl(user.photoURL);
      } else {
        setCurrentUserName("Guest");
        setCurrentUserProfileImageUrl(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Set viewport height for mobile browsers
  useEffect(() => {
    // Fix for mobile browsers
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    
    // Prevent default touch behavior on iOS
    document.body.addEventListener('touchmove', function(e) {
      if (e.target === document.body) {
        e.preventDefault();
      }
    }, { passive: false });
    
    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  // Prevent overscroll behavior
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const preventOverscroll = (e: TouchEvent) => {
      const scrollTop = chatContainer.scrollTop;
      const scrollHeight = chatContainer.scrollHeight;
      const height = chatContainer.clientHeight;
      const delta = e.touches[0].clientY;

      // Prevent scrolling beyond boundaries
      if ((scrollTop <= 0 && delta > 0) || (scrollTop + height >= scrollHeight && delta < 0)) {
        e.preventDefault();
      }
    };

    chatContainer.addEventListener('touchmove', preventOverscroll, { passive: false });
    
    return () => {
      chatContainer.removeEventListener('touchmove', preventOverscroll);
    };
  }, []);

  // Handler: Similar Qs
  const handleSimilarQs = useCallback(async () => {
    setLoadingSimilar(true);
    setSimilarQuestion(null);
    try {
      const res = await fetch('http://localhost:5001/ask-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const text = await res.text();
      setSimilarQuestion(text.trim());
    } catch (err) {
      setSimilarQuestion('Error generating similar question.');
    } finally {
      setLoadingSimilar(false);
    }
  }, [messages]);

  // Handler: Ask Tutor
  const handleAskTutor = useCallback(async () => {
    setShowAskTutorDialog(true);
  }, []);
  const confirmAskTutor = async () => {
    setIsPosting(true);
    try {
      // Use cached original question
      const { title, description, community, anonymous } = originalQuestion;
      console.log('Posting to community:', { title, description, community, anonymous });

      // Get current user
      const user = auth.currentUser;
      if (!user) {
        toast('You must be logged in to post a question.', { variant: 'error' });
        setIsPosting(false);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Prepare post data (same as ask page)
      const postData: any = {
        title,
        description,
        community,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
        anonymous,
      };
      if (!anonymous) {
        postData.userId = user.uid;
        postData.userName = userData?.displayName || user.displayName || 'User';
        postData.userPhotoURL = userData?.photoURL || user.photoURL || '/defaultprofile.png';
      } else {
        postData.userId = user.uid; // For moderation
        postData.userName = 'Anonymous User';
        postData.userPhotoURL = '/defaultprofile.png';
      }

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);

      // Clear chat
      setMessages([]);
      setShowAskTutorDialog(false);
      setIsPosting(false);

      // Remove sessionStorage keys after posting
      sessionStorage.removeItem('ai_question_title');
      sessionStorage.removeItem('ai_question_description');
      sessionStorage.removeItem('ai_question_community');
      sessionStorage.removeItem('ai_question_anonymous');

      // Redirect to the new post page and show success toast
      toast('Your question has been posted to the community!', { variant: 'success' });
      router.push(`/post/${docRef.id}`);
    } catch (error) {
      setIsPosting(false);
      setShowAskTutorDialog(false);
      toast('There was an error posting your question. Please try again.', { variant: 'error' });
      console.error('Error posting to community:', error);
    }
  };

  // Handler: End Chat
  const handleEndChat = useCallback(() => {
    setShowEndChatDialog(true);
  }, []);
  const confirmEndChat = () => {
    setShowEndChatDialog(false);
    router.push('/feedback');
  };

  // Register handlers with the bridge context
  useEffect(() => {
    setHandlers({
      handleSimilarQs,
      handleAskTutor,
      handleEndChat,
    });
  }, [handleSimilarQs, handleAskTutor, handleEndChat, setHandlers]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Allow Shift+Enter to create a new line
    // The whitespace-pre-line class will preserve these line breaks when displayed
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setAiThinking(true);
    setShowAiThinkingBubble(true);
    const newMessage = inputValue.trim();
    setMessages(prev => [
      ...prev,
      { role: 'user', content: newMessage },
      { role: 'assistant', content: '' } // Add placeholder assistant message
    ]);
    setSubmittedMessage(newMessage);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleCloseSession = () => {
    // Show feedback popup when closing session
    setShowFeedbackPopup(true);
  };

  // Helper: get last user message
  const getLastUserMessage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  };

  useEffect(() => {
    // Check for question from Ask page via sessionStorage
    const askTitle = sessionStorage.getItem('ai_question_title');
    const askDesc = sessionStorage.getItem('ai_question_description');
    if (askTitle || askDesc) {
      // Build a Markdown string: title in **bold**, description in normal text
      let combined = '';
      if (askTitle) {
        combined += `**${askTitle}**`;          // bold title
      }
      if (askDesc) {
        combined += (askTitle ? '\n' : '') + askDesc;  // only one newline
      }
      if (combined.trim()) {
        setAiThinking(true);
        setShowAiThinkingBubble(true);
        setMessages(prev => [
          ...prev,
          { role: 'user', content: combined },
          { role: 'assistant', content: '' }
        ]);
        setSubmittedMessage(combined);
      }
      sessionStorage.removeItem('ai_question_title');
      sessionStorage.removeItem('ai_question_description');
    }
  }, []);

  // Teleportation: scroll to latest message after assistant response
  useEffect(() => {
    const el = latestMessageRef.current;
    const container = chatContainerRef.current;
    if (el && container) {
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = rect.top - containerRect.top - 24;

      console.log("Teleporting to latest user message");
      container.scrollTo({
        top: container.scrollTop + offset,
        behavior: 'auto',
      });

      scrollOffsetRef.current = null;
      teleportLockRef.current = false;
    }
  }, [submittedMessage]);

  return (
    <div className="chat-page w-full overscroll-none -mt-[8px] flex h-full min-h-0">
      <div className="flex flex-col flex-1 max-w-5xl w-full mx-auto px-8 h-[calc(100vh-56px)] min-h-0 max-h-[calc(100vh-56px)] rounded-md overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="h-full min-h-0 max-h-full overflow-y-scroll pt-8 pb-6 px-8 overscroll-contain chat-scrollarea"
          style={{
            scrollbarGutter: 'stable',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(180,180,180,0.5) transparent'
          }}
        >
          {messages.map((message, index) => (
            <div 
              key={`${message.role}-${index}`} 
              className="mb-8 w-full"
            >
              {message.role === 'user' && index === messages.length - 2 && (
                <div ref={latestMessageRef} className="h-6" />
              )}
              {message.role === 'assistant' ? (
                <div className="flex w-full items-start">
                  {aiProfileImageUrl ? (
                    <img src={aiProfileImageUrl} alt="MathCom AI" className="w-10 h-10 rounded-full shrink-0 mr-3 -mt-2 object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-300 rounded-full shrink-0 mr-3 -mt-1" />
                  )}
                  <div className="flex flex-col items-start w-full max-w-full">
                    <span className="text-sm font-semibold mb-1 text-left text-neutral-700 flex items-center gap-2">
                      MathCom AI
                    </span>
                    <div className="text-black whitespace-pre-line overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {aiThinking && index === messages.length - 1
                        ? <span className="animate-pulse text-gray-600 text-base">is thinking<span className="animate-bounce">...</span></span>
                        : <MarkdownContent content={message.content} autoWrap={true} />
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full justify-end items-end">
                  <div className="flex flex-col items-end max-w-[70%] w-[70%] max-w-full max-w-[600px]">
                    <div className="text-black p-3 whitespace-pre-line overflow-hidden border rounded-xl" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', borderColor: 'rgba(0,0,0,0.7)' }}>
                      <MarkdownContent content={message.content} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* spacer so newest message can align to top */}
          <div style={{ height: '60vh' }} />

          <AI_Chat
            ref={aiChatRef}
            externalMessage={submittedMessage}
            messageHistory={messages.filter(m => m.role !== 'assistant' || m.content)}
            onMessageRender={(msg) => {
              setMessages((prev) => {
                if (msg.role === 'assistant') {
                  // Remove the thinking bubble as soon as the AI starts typing
                  setAiThinking(false);
                  setShowAiThinkingBubble(false);
                  // Find the last placeholder assistant message and update it
                  const lastIndex = prev.map(m => m.role).lastIndexOf('assistant');
                  if (lastIndex !== -1) {
                    const updated = [...prev];
                    updated[lastIndex] = { ...updated[lastIndex], content: msg.content };
                    return updated;
                  }
                  return [...prev, msg];
                }
                if (msg.role === 'user') {
                  // Check if this is a duplicate user message
                  const isDuplicate = prev.some(m => 
                    m.role === 'user' && 
                    m.content === msg.content && 
                    prev.indexOf(m) >= prev.length - 2
                  );
                  if (isDuplicate) {
                    return prev;
                  }
                  return [...prev, msg];
                }
                return prev;
              });
              if (msg.role === 'assistant') {
                setSubmittedMessage('');
              }
              // No auto-scroll or scrollTo logic here
            }}
            onStopStreaming={setStopFn}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-3 relative rounded-lg" style={{ background: '#f4f4f4' }}>
            <Textarea
              ref={textareaRef}
              placeholder="Ask MathCom AI"
              className="border-none focus-visible:ring-0 shadow-none resize-none bg-transparent py-1.5 px-2 text-base overflow-y-auto flex-grow min-h-[40px] max-h-[160px] pr-16 scrollbar-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={() => {
                const el = textareaRef.current;
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                }
              }}
              disabled={aiThinking}
            />
            {aiThinking ? (
              <button
                onClick={() => {
                  stopFn?.();
                  setAiThinking(false);
                }}
                className="absolute bottom-4 right-4 p-1 rounded-full text-[#7f0000] transition-colors"
                style={{ zIndex: 2 }}
                aria-label="Stop AI"
              >
                <StopSquare className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`absolute bottom-4 right-4 p-1 rounded-full ${inputValue.trim() ? 'text-[#11244D] hover:bg-[#11244D]/10' : 'text-neutral-400'} transition-colors`}
                style={{ zIndex: 2 }}
                aria-label="Send"
              >
                <ArrowUpCircle className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {/* Mobile close session button */}
          <div className="mt-4 lg:hidden">
            <button 
              onClick={handleCloseSession}
              className="w-full py-2.5 bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-full font-medium text-sm flex items-center justify-center"
            >
              Close Session
            </button>
          </div>
        </div>
      </div>

      {/* End Chat Confirmation Dialog */}
      <Dialog open={showEndChatDialog} onOpenChange={setShowEndChatDialog}>
      <div className="end-chat-dialog-no-x">
      <DialogContent className="sm:max-w-md px-6 py-5 ask-tutor-dialog-no-x">
      <DialogHeader className="mb-4">
      <DialogTitle className="text-center text-xl">End Chat</DialogTitle>
      <DialogDescription className="text-center mt-2">
        This conversation won't be saved, but you'll have the chance to summarize it on the next page.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex justify-center gap-4 mt-4">
      <Button variant="outline" onClick={() => setShowEndChatDialog(false)}>
        Cancel
      </Button>
      <Button
        variant="default"
        onClick={confirmEndChat}
        style={{ opacity: 0.7, transition: 'opacity 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
  </div>
</Dialog>

<Dialog open={showAskTutorDialog} onOpenChange={setShowAskTutorDialog}>
  <div className="no-x-button-wrapper">
  <DialogContent className="sm:max-w-md px-6 py-5 ask-tutor-dialog-no-x">
  <DialogHeader className="mb-4">
        <DialogTitle className="text-center text-xl">Ask a Tutor</DialogTitle>
        <DialogDescription className="text-center mt-2">
          This conversation will be deleted, and your question will be posted to the community forum for tutors to respond.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex justify-center gap-4 mt-4">
        <Button variant="outline" onClick={() => setShowAskTutorDialog(false)} disabled={isPosting}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={confirmAskTutor}
          disabled={isPosting}
          style={{ opacity: 0.7, transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
        >
          {isPosting ? 'Posting...' : 'Continue'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </div>
</Dialog>

      {/* Feedback Popup */}
      <FeedbackPopup 
        isOpen={showFeedbackPopup} 
        onClose={() => setShowFeedbackPopup(false)} 
        sessionMessages={messages}
      />
    </div>
  );
};

export default Page;