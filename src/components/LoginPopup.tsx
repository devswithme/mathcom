"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ 
  isOpen, 
  onClose, 
  redirectTo = "/" 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Logged in as:", user.displayName);

      setIsRedirecting(true);
      
      // Check if user needs to complete onboarding
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Delay briefly to let auth state propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If user hasn't completed onboarding (missing username or curriculum)
        if (!userData.username || !userData.curriculum) {
          setRedirectMessage("Setting up your profile...");
          router.push('/onboarding');
          return;
        }
      } else {
        // If user document doesn't exist yet, they need onboarding
        setRedirectMessage("Setting up your profile...");
        router.push('/onboarding');
        return;
      }
      
      // User has completed onboarding, redirect to destination
      onClose(); // Close the popup first
      
      // Then redirect if needed
      if (redirectTo && redirectTo !== "/") {
        router.push(redirectTo);
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      setIsRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none login-popup">
          <DialogTitle className="sr-only">Redirecting</DialogTitle>
          <DialogDescription className="sr-only">
            Please wait while we log you in and redirect you.
          </DialogDescription>
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center pt-6 pb-12 px-16">
            <div className="flex flex-col items-center">
              <div className="mb-5 mt-0">
                <Image 
                  src="/logo.png" 
                  alt="MathCom Logo" 
                  width={130} 
                  height={130}
                  className="animate-pulse"
                />
              </div>
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                  <div className="h-full bg-[#646F8B] absolute left-0 top-0 animate-loadingBar"></div>
                </div>
                <p className="text-gray-600 font-medium text-lg">{redirectMessage}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/40" />
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none login-popup">
        <DialogTitle className="sr-only">Log in to MathCom</DialogTitle>
        <DialogDescription className="sr-only">
          Access your account to continue learning on MathCom.
        </DialogDescription>
        <div className="bg-neutral-100 pt-6 pb-12 px-16 rounded-xl w-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] border">
          <div className="flex flex-col items-center">
            <div className="-mb-0 -mt-4">
              <Image 
                src="/logo.png" 
                alt="logo" 
                width={130} 
                height={130}
                className="mb-0"
              />
            </div>
            <div className="space-y-2 text-center mb-12">
              <h1 className="font-bold text-3xl">Welcome to MathCom</h1>
              <p className="text-muted-foreground text-base font-semibold opacity-60">
                Access your account to continue learning.
              </p>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="mx-auto w-full max-w-sm border border-gray-400 font-semibold bg-transparent hover:bg-[#D9D9D966] transition-colors flex items-center justify-center text-base py-6"
              size="lg"
              variant="outline"
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <Image 
                    src="/google.svg" 
                    alt="google" 
                    width={28} 
                    height={28}
                    className="mr-3"
                  />
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPopup; 