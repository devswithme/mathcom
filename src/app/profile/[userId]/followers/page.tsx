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

const FollowersPage = () => {
  interface UserData {
    id: string;
    username: string;
    avatarUrl: string;
  }

  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<{username: string} | null>(null);
  const [currentUser, setCurrentUser] = useState<{uid: string} | null>(null);

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
    const fetchFollowers = async () => {
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
        
        // Get the user's followers
        const followerIds = userData.followers || [];
        
        if (followerIds.length === 0) {
          setFollowers([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch each follower's information
        const followersData = await Promise.all(
          followerIds.map(async (followerId: string) => {
            const followerRef = doc(db, "users", followerId);
            const followerSnap = await getDoc(followerRef);
            
            if (followerSnap.exists()) {
              const data = followerSnap.data();
              
              // Get user's photoURL from Firebase Auth if this is the current user
              let avatarUrl = data.avatarUrl || "";
              if (auth.currentUser && auth.currentUser.uid === followerId) {
                avatarUrl = auth.currentUser.photoURL || data.avatarUrl || "";
              }
              
              return {
                id: followerId,
                username: data.username || "Unknown",
                avatarUrl: avatarUrl,
              };
            }
            return null;
          })
        );
        
        // Filter out any null values (users that weren't found)
        setFollowers(followersData.filter(Boolean) as UserData[]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching followers:", error);
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchFollowers();
    }
  }, [userId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <p>Loading followers...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full px-8 pt-8 justify-center">
      <div className="bg-white p-6 rounded-2xl w-full max-w-4xl space-y-5 border shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {userData?.username}'s Followers
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
        
        {followers.length > 0 ? (
          <div className="space-y-4">
            {followers.map((follower) => (
              <Link 
                key={follower.id} 
                href={`/profile/${follower.id}`}
                className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-neutral-300 rounded-full overflow-hidden">
                  <Image
                    src={follower.avatarUrl || "/default-avatar.png"}
                    alt={follower.username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{follower.username}</p>
                </div>
                {currentUser && currentUser.uid === follower.id && (
                  <span className="text-xs text-muted-foreground">You</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">No followers yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage; 