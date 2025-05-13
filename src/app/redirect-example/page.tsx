"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import RedirectWrapper from "@/components/RedirectWrapper";

const RedirectExamplePage = () => {
  const [redirect, setRedirect] = useState({
    active: false,
    to: "",
    message: ""
  });

  const handleRedirect = (destination: string, message: string) => {
    setRedirect({
      active: true,
      to: destination,
      message
    });
  };

  // If redirect is active, render the RedirectWrapper
  if (redirect.active) {
    return (
      <RedirectWrapper
        to={redirect.to}
        message={redirect.message}
        delay={1000} // 1 second delay for demonstration purposes
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Redirect Examples</h1>
        <p className="text-gray-600 text-center">
          Click any button below to see the loading page during redirection.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={() => handleRedirect("/", "Taking you to home page...")}
            className="w-full"
          >
            Redirect to Home
          </Button>
          
          <Button
            onClick={() => handleRedirect("/profile", "Loading your profile...")}
            className="w-full"
          >
            Redirect to Profile
          </Button>
          
          <Button
            onClick={() => handleRedirect("/community/cie_igcse", "Loading IGCSE community...")}
            className="w-full"
          >
            Redirect to IGCSE Community
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RedirectExamplePage; 