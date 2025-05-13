"use client";

import React from "react";
import Image from "next/image";

interface LoadingPageProps {
  message?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = "Loading..."
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16 mb-2">
          <Image 
            src="/logo.png" 
            alt="MathCom Logo" 
            width={64} 
            height={64}
            className="animate-pulse"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="h-full bg-[#646F8B] absolute left-0 top-0 animate-loadingBar"></div>
          </div>
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage; 