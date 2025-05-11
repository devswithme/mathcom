"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "./LoadingPage";

interface RedirectWrapperProps {
  to: string;
  message?: string;
  delay?: number;
  onRedirect?: () => void;
}

/**
 * A component that handles redirects with a loading screen
 * 
 * @param to The URL to redirect to
 * @param message The message to display during redirection
 * @param delay Optional delay before redirecting (in milliseconds)
 * @param onRedirect Optional callback to run before redirecting
 */
const RedirectWrapper: React.FC<RedirectWrapperProps> = ({
  to,
  message = "Redirecting...",
  delay = 0,
  onRedirect
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectTimer = setTimeout(async () => {
      if (onRedirect) {
        await onRedirect();
      }
      router.push(to);
    }, delay);

    return () => clearTimeout(redirectTimer);
  }, [to, delay, router, onRedirect]);

  return <LoadingPage message={message} />;
};

export default RedirectWrapper; 