'use client';

import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import AI_Chat from "@/components/AI_Chat";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from "next/link";

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

  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise();
    }
  }, [messages]); // Rerun MathJax when messages change

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

  return (
    <div className="flex w-full h-[calc(100vh-80px)] gap-6">
      <div className="flex-grow relative flex flex-col bg-neutral-100 rounded-md overflow-hidden">
        <div className="flex-grow overflow-y-auto p-6">
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
        </div>
      </div>

      <div className="w-[300px] hidden lg:block">
        <div className="border border-neutral-200 p-4 rounded-lg bg-white">
          <h1 className="font-semibold text-xl mb-4">Shortcuts</h1>
          <div className="space-y-3">
            <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
              <div className="w-7 h-7 bg-neutral-300 rounded-full" />
              <h1 className="font-medium">Get Similar Questions</h1>
            </div>
            <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
              <div className="w-7 h-7 bg-neutral-300 rounded-full" />
              <h1 className="font-medium">Ask a Tutor</h1>
            </div>
            <Link href="/feedback" className="block">
              <div className="bg-neutral-100 flex items-center gap-x-3 p-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">
                <div className="w-7 h-7 bg-neutral-300 rounded-full" />
                <h1 className="font-medium">Close Session</h1>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
