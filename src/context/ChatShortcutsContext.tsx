'use client';
import React, { createContext, useContext } from 'react';

type ChatShortcutsContextType = {
  handleSimilarQs: () => void;
  handleAskTutor: () => void;
  handleEndChat: () => void;
};

const ChatShortcutsContext = createContext<ChatShortcutsContextType | undefined>(undefined);

export function ChatShortcutsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ChatShortcutsContextType;
}) {
  return (
    <ChatShortcutsContext.Provider value={value}>
      {children}
    </ChatShortcutsContext.Provider>
  );
}

export function useChatShortcuts() {
  const ctx = useContext(ChatShortcutsContext);
  if (!ctx) throw new Error('useChatShortcuts must be used within a ChatShortcutsProvider');
  return ctx;
} 