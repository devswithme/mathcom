"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoginRequired from "@/components/LoginRequired";

const FollowingPage = () => {
  interface UserData {
    id: string;
    username: string;
    avatarUrl: string;
  }

  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [following, setFollowing] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<{username: string} | null>(null);
  const [currentUser, setCurrentUser] = useState<{uid: string} | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ uid: user.uid });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        // Get the user's data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          toast("User not found", {
            description: "This user profile doesn't exist",
            type: "error"
          });
          router.push("/");
          return;
        }
        
        const userData = userSnap.data();
        setUserData({ username: userData.username || "User" });
        
        // Get the users that this user is following
        const followingIds = userData.following || [];
        
        if (followingIds.length === 0) {
          setFollowing([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch each followed user's information
        const followingData = await Promise.all(
          followingIds.map(async (followingId: string) => {
            const followingRef = doc(db, "users", followingId);
            const followingSnap = await getDoc(followingRef);
            
            if (followingSnap.exists()) {
              const data = followingSnap.data();
              
              // Get user's photoURL from Firebase Auth if this is the current user
              let avatarUrl = data.avatarUrl || "";
              if (auth.currentUser && auth.currentUser.uid === followingId) {
                avatarUrl = auth.currentUser.photoURL || data.avatarUrl || "";
              }
              
              return {
                id: followingId,
                username: data.username || "Unknown",
                avatarUrl: avatarUrl,
              };
            }
            return null;
          })
        );
        
        // Filter out any null values (users that weren't found)
        setFollowing(followingData.filter(Boolean) as UserData[]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching following:", error);
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchFollowing();
    }
  }, [userId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <p>Loading following...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full px-8 pt-8 justify-center">
      <div className="bg-white p-6 rounded-2xl w-full max-w-4xl space-y-5 border shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Users {userData?.username} Follows
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
        
        {following.length > 0 ? (
          <div className="space-y-4">
            {following.map((followedUser) => (
              <Link 
                key={followedUser.id} 
                href={`/profile/${followedUser.id}`}
                className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-neutral-300 rounded-full overflow-hidden">
                  <Image
                    src={followedUser.avatarUrl || "/default-avatar.png"}
                    alt={followedUser.username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{followedUser.username}</p>
                </div>
                {currentUser && currentUser.uid === followedUser.id && (
                  <span className="text-xs text-muted-foreground">You</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">Not following anyone yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;