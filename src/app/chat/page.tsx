'use client';

import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, HelpCircle, MessageCircle, X as LucideX } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import AI_Chat from "@/components/AI_Chat";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import FeedbackPopup from "@/components/FeedbackPopup";
import { auth } from '@/lib/firebase'; // Added import for auth
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Added import for onAuthStateChanged and FirebaseUser
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Helper component to render markdown content
const MarkdownContent = ({ content }: { content: string }) => {
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
      {content}
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
  const router = useRouter();
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showAskTutorDialog, setShowAskTutorDialog] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [similarQuestion, setSimilarQuestion] = useState<string | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showAiThinkingBubble, setShowAiThinkingBubble] = useState(false);

  // Placeholder for AI profile picture
  const aiProfileImageUrl: string | null = "/mathcomai.png";

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

  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise();
    }
  }, [messages]); // Rerun MathJax when messages change

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

  // Auto-scroll to the newest message (smooth scroll, align top of latest message to top of chat container, only scroll chat area)
  useEffect(() => {
    const container = chatContainerRef.current;
    const latest = latestMessageRef.current;
    if (container && latest) {
      container.scrollTo({ top: latest.offsetTop, behavior: 'smooth' });
    }
  }, [messages]);

  // Helper: get last user message
  const getLastUserMessage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  };

  // Handler: Similar Qs
  const handleSimilarQs = async () => {
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
  };

  // Handler: Ask Tutor
  const handleAskTutor = async () => {
    setShowAskTutorDialog(true);
  };
  const confirmAskTutor = async () => {
    setIsPosting(true);
    // Placeholder: Post to community forum
    const lastUserMsg = getLastUserMessage();
    // await postToCommunity(lastUserMsg, messages); // Implement this
    setMessages([]);
    setIsPosting(false);
    setShowAskTutorDialog(false);
    router.push('/community'); // Or to the new post
  };

  // Handler: End Chat
  const handleEndChat = () => {
    setShowEndChatDialog(true);
  };
  const confirmEndChat = () => {
    setShowEndChatDialog(false);
    router.push('/feedback');
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

  return (
    <div className="chat-page w-full px-8 overscroll-none -mt-[8px] grid grid-cols-[auto_1fr_auto] gap-x-8 h-full min-h-0">
      <div className="flex-grow relative flex flex-col bg-neutral-100 rounded-md overflow-hidden h-[calc(100vh-56px)] min-h-0 max-h-[calc(100vh-56px)] max-w-[calc(100vw-320px)]">
        <div 
          ref={chatContainerRef}
          className="h-full min-h-0 max-h-full overflow-y-auto p-6 overscroll-contain"
        >
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="mb-8 w-full" ref={index === messages.length - 1 ? latestMessageRef : null}>
              {message.role === 'assistant' ? (
                <div className="flex w-full items-start">
                  {aiProfileImageUrl ? (
                    <img src={aiProfileImageUrl} alt="MathCom AI" className="w-10 h-10 rounded-full shrink-0 mr-3 -mt-2 object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-300 rounded-full shrink-0 mr-3 -mt-1" />
                  )}
                  <div className="flex flex-col items-start w-[70%] max-w-full max-w-[600px]">
                    <span className="text-sm font-semibold mb-1 text-left text-neutral-700 flex items-center gap-2">
                      MathCom AI
                    </span>
                    <div className="text-black whitespace-pre-line overflow-hidden max-h-[600px] overflow-y-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {aiThinking && index === messages.length - 1
                        ? <span className="animate-pulse text-gray-600 text-base">is thinking<span className="animate-bounce">...</span></span>
                        : <MarkdownContent content={message.content} />
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full justify-end items-end">
                  <div className="flex flex-col items-end max-w-[70%] w-[70%] max-w-full max-w-[600px]">
                    <div className="bg-neutral-100 text-black rounded-xl p-3 border border-neutral-300 whitespace-pre-line overflow-hidden max-h-[600px] overflow-y-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      <MarkdownContent content={message.content} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <AI_Chat
            externalMessage={submittedMessage}
            messageHistory={messages.filter(m => m.role !== 'assistant' || m.content)} // Only send non-placeholder messages to AI
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
            }}
          />
        </div>

        <div className="p-6 bg-neutral-100">
          <div className="flex items-center justify-between bg-neutral-200 rounded-lg p-3 relative">
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
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`absolute bottom-4 right-4 p-1 rounded-full ${inputValue.trim() ? 'text-[#11244D] hover:bg-[#11244D]/10' : 'text-neutral-400'} transition-colors`}
              style={{ zIndex: 2 }}
            >
              <ArrowUpCircle className="w-6 h-6" />
            </button>
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

      <div className="w-[200px] hidden lg:block pt-4">
        <div className="border border-neutral-200 p-4 rounded-lg bg-white">
          <h2 className="font-semibold text-sm mb-2 px-1">Shortcuts</h2>
          <div className="space-y-3">
            <div className="bg-neutral-100 flex items-center gap-x-3 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer text-sm w-full pl-4 justify-start"
              onClick={handleSimilarQs}>
              <span className="" style={{ fontSize: '1.3rem', minWidth: '2.2rem', textAlign: 'center', verticalAlign: 'middle' }}>❓</span>
              <h3 className="font-medium text-sm w-full text-left">Similar Qs</h3>
            </div>
            {loadingSimilar && <div className="mt-2 text-sm text-gray-500">Generating similar question...</div>}
            {similarQuestion && <div className="mt-2 p-3 bg-blue-50 rounded text-blue-900 text-sm">{similarQuestion}</div>}
            <div className="bg-neutral-100 flex items-center gap-x-3 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer text-sm w-full pl-4 justify-start"
              onClick={handleAskTutor}>
              <span className="" style={{ fontSize: '1.2rem', minWidth: '2.2rem', textAlign: 'center', verticalAlign: 'middle' }}>🧑‍🏫</span>
              <h3 className="font-medium text-sm w-full text-left">Ask Tutor</h3>
            </div>
            <button 
              onClick={handleEndChat} 
              className="w-full block"
            >
              <div className="bg-[#7f0000] flex items-center gap-x-3 py-2 px-3 rounded-full hover:bg-[#a30000] transition-colors cursor-pointer text-sm w-full pl-4 justify-start">
                <span className="flex items-center justify-center" style={{ fontSize: '1.2rem', minWidth: '2.2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                  <LucideX className="w-5 h-5 text-white" strokeWidth={3} />
                </span>
                <h3 className="font-medium text-sm w-full text-left text-white">End Chat</h3>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Popup */}
      <FeedbackPopup 
        isOpen={showFeedbackPopup} 
        onClose={() => setShowFeedbackPopup(false)} 
        sessionMessages={messages}
      />

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


    </div>
  );
};

export default Page;