import React, { createContext, useContext, useState } from 'react';

export type ChatShortcutsHandlers = {
  handleSimilarQs: () => void;
  handleAskTutor: () => void;
  handleEndChat: () => void;
};

const noop = () => {};
const defaultHandlers: ChatShortcutsHandlers = {
  handleSimilarQs: noop,
  handleAskTutor: noop,
  handleEndChat: noop,
};

const ChatShortcutsHandlersBridgeContext = createContext<{
  handlers: ChatShortcutsHandlers;
  setHandlers: React.Dispatch<React.SetStateAction<ChatShortcutsHandlers>>;
}>({
  handlers: defaultHandlers,
  setHandlers: () => {},
});

export function ChatShortcutsHandlersBridgeProvider({ children }: { children: React.ReactNode }) {
  const [handlers, setHandlers] = useState<ChatShortcutsHandlers>(defaultHandlers);
  return (
    <ChatShortcutsHandlersBridgeContext.Provider value={{ handlers, setHandlers }}>
      {children}
    </ChatShortcutsHandlersBridgeContext.Provider>
  );
}

export function useChatShortcutsHandlersBridge() {
  return useContext(ChatShortcutsHandlersBridgeContext);
} 