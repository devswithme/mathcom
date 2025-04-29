import React from 'react';
import { useEffect } from 'react';
import Chat from '../../components/Chat';

export default function AskPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise();
      }
    }, 300); // Delay 300ms to ensure MathJax is loaded
    return () => clearTimeout(timer);
  }, []);
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Ask MathCom AI</h1>
      <Chat />
    </main>
  );
}