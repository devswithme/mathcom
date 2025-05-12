"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LoginRequiredProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectTo?: string;
  onLogin?: () => void;
}

/**
 * A component that displays a modal dialog when a user tries to perform an action that requires authentication.
 * This is different from LoginPopup as it's meant to be a notification/reminder rather than the full login flow.
 */
const LoginRequired: React.FC<LoginRequiredProps> = ({ 
  isOpen, 
  onClose, 
  message = "You need to be logged in to perform this action.",
  redirectTo = "/",
  onLogin
}) => {
  const router = useRouter();

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      // Close this dialog first
      onClose();
      
      // Redirect to login page with the return URL
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">Login Required</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogAction
            onClick={() => onClose()}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleLogin}
            className="bg-[#11244DB2] text-white hover:bg-[#11244D]/90"
          >
            Log In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoginRequired;