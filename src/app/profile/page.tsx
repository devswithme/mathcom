"use client";

import React, { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const ProfileRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirect to the user's profile page
        router.push(`/profile/${user.uid}`);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
      <p>Loading profile...</p>
    </div>
  );
};

export default ProfileRedirect;
