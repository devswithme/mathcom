import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

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
  const lastSentMessageRef = useRef('');

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

  const sendMessage = useCallback(async (newMessage: string) => {
    if (!newMessage.trim() || !onMessageRender) return;


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

    } catch (error: unknown) {
      if ((error as DOMException)?.name === 'AbortError') {
        if (userInitiatedAbortRef.current) {
          onMessageRender?.({ role: 'assistant', content: '[Stopped by user]' });
        }
        // else: do not show any message if abort was not user-initiated
      } else {
        onMessageRender?.({ role: 'assistant', content: 'Error reaching server.' });
      }
    }
  }, [messageHistory, onMessageRender]);

  useEffect(() => {
    if (
      externalMessage?.trim() &&
      externalMessage !== lastSentMessageRef.current
    ) {
      lastSentMessageRef.current = externalMessage;
      streamingContentRef.current = ''; // reset stream buffer
      sendMessage(externalMessage);
    }
  }, [externalMessage, sendMessage]);

  // Only abort on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return null;
});

Chat.displayName = "Chat";

export default Chat;