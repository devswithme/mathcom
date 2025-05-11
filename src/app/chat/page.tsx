'use client';

import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import AI_Chat from "@/components/AI_Chat";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import FeedbackPopup from "@/components/FeedbackPopup";

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
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: newMessage }]);
    setSubmittedMessage(newMessage);
    setInputValue('');
  };

  const handleCloseSession = () => {
    // Show feedback popup when closing session
    setShowFeedbackPopup(true);
  };

  return (
    <div className="chat-page w-full px-8 pt-0 overscroll-none" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="w-full max-w-6xl flex gap-6">
        <div className="flex-grow relative flex flex-col bg-neutral-100 rounded-b-md overflow-hidden h-[calc(100vh-56px)]" style={{ height: 'calc(var(--vh, 1vh) * 100 - 56px)' }}>
          <div 
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto p-6 overscroll-contain"
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="mb-8 w-full">
                {message.role === 'assistant' ? (
                  <div className="flex w-full items-start">
                    <div className="w-10 h-10 bg-neutral-300 rounded-full shrink-0 mr-3" />
                    <div className="flex flex-col items-start max-w-xl">
                      <span className="text-sm font-semibold mb-1 text-left text-neutral-700">MathCom AI</span>
                      <div className="text-black">
                        <MarkdownContent content={message.content} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full justify-end items-end">
                    <div className="flex flex-col items-end max-w-xl">
                      <span className="text-sm font-semibold mb-1 text-right text-neutral-700">Username_username</span>
                      <div className="bg-neutral-100 text-black rounded-xl p-3 border border-neutral-300">
                        <MarkdownContent content={message.content} />
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-neutral-300 rounded-full shrink-0 ml-3" />
                  </div>
                )}
              </div>
            ))}

            <AI_Chat
              externalMessage={submittedMessage}
              messageHistory={messages}
              onMessageRender={(msg) => {
                setMessages((prev) => {
                  if (msg.role === 'assistant') {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        ...last,
                        content: msg.content,
                      };
                      return updated;
                    }
                    return [...prev, msg];
                  }

                  if (msg.role === 'user') {
                    // Check if this is a duplicate user message
                    const isDuplicate = prev.some(m => 
                      m.role === 'user' && 
                      m.content === msg.content && 
                      // Only consider it a duplicate if it was one of the last 2 messages
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

          <div className="p-4 bg-neutral-100">
            <div className="flex items-center justify-between bg-neutral-200 rounded-lg p-2">
              <Textarea
                placeholder="Ask MathCom AI"
                className="border-none focus-visible:ring-0 shadow-none resize-none bg-transparent py-1.5 px-2 text-base min-h-[40px] flex-grow"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`p-1 rounded-full ${inputValue.trim() ? 'text-blue-500 hover:bg-blue-100' : 'text-neutral-400'} transition-colors ml-2`}
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

        <div className="w-[220px] hidden lg:block pt-4">
          <div className="border border-neutral-200 p-3 rounded-lg bg-white">
            <h2 className="font-semibold text-lg mb-2 px-1">Shortcuts</h2>
            <div className="space-y-2">
              <div className="bg-neutral-100 flex items-center gap-x-2 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
                <div className="w-6 h-6 bg-neutral-300 rounded-full" />
                <h3 className="font-medium text-sm">Get Similar Questions</h3>
              </div>
              <div className="bg-neutral-100 flex items-center gap-x-2 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
                <div className="w-6 h-6 bg-neutral-300 rounded-full" />
                <h3 className="font-medium text-sm">Ask a Tutor</h3>
              </div>
              <button 
                onClick={handleCloseSession} 
                className="w-full block"
              >
                <div className="bg-neutral-100 flex items-center gap-x-2 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
                  <div className="w-6 h-6 bg-neutral-300 rounded-full" />
                  <h3 className="font-medium text-sm">Close Session</h3>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

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
