'use client';
import { useEffect } from 'react';

export default function FeedbackRedirect() {
  useEffect(() => {
    window.location.href = 'https://ngl.link/mathcom';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Redirecting to Feedback...</h1>
      <p>If you are not redirected, <a href="https://ngl.link/mathcom" className="text-blue-600 underline">click here</a>.</p>
    </div>
  );
} 