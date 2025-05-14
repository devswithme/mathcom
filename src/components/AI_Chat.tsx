import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const Chat = forwardRef(({
  externalMessage,
  messageHistory,
  onMessageRender,
  onStopStreaming
}: {
  externalMessage?: string;
  messageHistory: { role: 'user' | 'assistant' | 'system'; content: string }[];
  onMessageRender?: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  onStopStreaming?: (stopFn: () => void) => void;
}, ref) => {
  const streamingContentRef = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const userInitiatedAbortRef = useRef(false);

  const stopStreaming = () => {
    userInitiatedAbortRef.current = true;
    abortControllerRef.current?.abort();
  };

  useImperativeHandle(ref, () => ({ stopStreaming }));

  useEffect(() => {
    if (onStopStreaming) {
      onStopStreaming(stopStreaming);
    }
  }, [onStopStreaming]);

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !onMessageRender) return;

    // Immediately show user message once
    onMessageRender({ role: 'user', content: newMessage });

    try {
      userInitiatedAbortRef.current = false;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const res = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory }),
        signal: abortController.signal,
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
      if ((error as any).name === 'AbortError') {
        if (userInitiatedAbortRef.current) {
          onMessageRender?.({ role: 'assistant', content: '[Stopped by user]' });
        }
        // else: do not show any message if abort was not user-initiated
      } else {
        onMessageRender?.({ role: 'assistant', content: 'Error reaching server.' });
      }
    }
  };

  useEffect(() => {
    if (externalMessage?.trim()) {
      streamingContentRef.current = ''; // reset stream buffer
      sendMessage(externalMessage);
    }
    // No abort on prop change
  }, [externalMessage]);

  // Only abort on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return null;
});

export default Chat;
