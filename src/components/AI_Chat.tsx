import React, { useEffect, useRef } from 'react';

const Chat = ({
  externalMessage,
  messageHistory,
  onMessageRender
}: {
  externalMessage?: string;
  messageHistory: { role: 'user' | 'assistant' | 'system'; content: string }[];
  onMessageRender?: (msg: { role: 'user' | 'assistant'; content: string }) => void;
}) => {
  const streamingContentRef = useRef('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !onMessageRender) return;

    // Immediately show user message once
    onMessageRender({ role: 'user', content: newMessage });

    try {
      const res = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      streamingContentRef.current = '';
      let lastRendered = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamingContentRef.current += chunk;

          if (streamingContentRef.current !== lastRendered) {
            lastRendered = streamingContentRef.current;
            onMessageRender({
              role: 'assistant',
              content: streamingContentRef.current
            });

            if ((window as any).MathJax?.typesetPromise) {
              (window as any).MathJax.typesetPromise();
            }
          }
        }
      }

      // Final assistant message (if any remaining content)
      if (streamingContentRef.current !== lastRendered) {
        onMessageRender({
          role: 'assistant',
          content: streamingContentRef.current
        });
      }
    } catch (error) {
      onMessageRender({ role: 'assistant', content: 'Error reaching server.' });
    }
  };

  useEffect(() => {
    if (externalMessage?.trim()) {
      streamingContentRef.current = ''; // reset stream buffer
      sendMessage(externalMessage);
    }
  }, [externalMessage]);

  return null;
};

export default Chat;
