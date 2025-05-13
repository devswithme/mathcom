"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import LoginRequired from "@/components/LoginRequired";

const UserProfilePage = () => {
  interface UserData {
    avatarUrl?: string;
    username: string;
    gradeLevel?: string;
    examLevels?: string[];
    curriculum?: string;
    postCount?: number;
    followerCount?: number;
    followingCount?: number;
    followers?: string[];
    following?: string[];
    about?: string;
    communities?: string[];
  }

  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<{uid: string} | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState<boolean>(false);
  const [postCount, setPostCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser({ uid: user.uid });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const ref = doc(db, "users", userId);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // Get user's photoURL from Firebase Auth if this is the current user
          let avatarUrl = data.avatarUrl || "";
          if (auth.currentUser && auth.currentUser.uid === userId) {
            avatarUrl = auth.currentUser.photoURL || data.avatarUrl || "";
          }
          
          setUserData({
            avatarUrl: avatarUrl,
            username: data.username || "Unknown",
            gradeLevel: data.gradeLevel || "",
            examLevels: data.examLevels || [],
            curriculum: data.curriculum || "",
            postCount: data.postCount || 0,
            followerCount: data.followerCount || 0,
            followingCount: data.followingCount || 0,
            followers: data.followers || [],
            following: data.following || [],
            about: data.about || "",
            communities: data.communities || [],
          });
          
          // Check if current user is following this user
          if (currentUser && data.followers) {
            setIsFollowing(data.followers.includes(currentUser.uid));
          }
        } else {
          // User not found
          toast("User not found", {
            description: "This user profile doesn't exist",
            type: "error"
          });
          router.push("/");
        }
        
        // Fetch post count for this user
        const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
        const postsSnap = await getDocs(postsQuery);
        setPostCount(postsSnap.size);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    if (userId && (currentUser || !auth.currentUser)) {
      fetchUserData();
    }
  }, [userId, currentUser, router]);

  // Add a mapping for community avatars
  const communityAvatars: Record<string, string> = {
    cie_checkpoint: '/community_avatars/cie_checkpoint.png',
    cie_igcse: '/community_avatars/cie_igcse.png',
    cie_alevel: '/community_avatars/cie_alevel.png',
  };

  // Handle follow/unfollow action
  const handleFollowAction = async () => {
    if (!currentUser) {
      // Redirect to login if not logged in
      router.push('/login');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(!isFollowing);
        
        // Update follower count in UI
        if (userData) {
          setUserData({
            ...userData,
            followerCount: isFollowing ? 
              (userData.followerCount || 1) - 1 : 
              (userData.followerCount || 0) + 1
          });
        }
        
        toast(
          isFollowing ? "Unfollowed user" : "Following user",
          { 
            description: isFollowing ? 
              `You unfollowed ${userData?.username}` : 
              `You're now following ${userData?.username}`,
            type: "success"
          }
        );
      } else {
        toast("Action failed", {
          description: data.error || "An error occurred",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast("Action failed", {
        description: "There was a problem with your request",
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get formatted exam level and curriculum text
  const getEducationInfo = () => {
    if (!userData?.curriculum) return "";
    
    let level = "";
    
    // If secondary grade with Cambridge, show exam level
    if (userData.gradeLevel === "secondary" && userData.curriculum === "cambridge" && userData.examLevels && userData.examLevels.length > 0) {
      // Convert exam level values to display labels
      const examLevelMap: Record<string, string> = {
        'checkpoint': 'Checkpoint',
        'igcse': 'IGCSE',
        'alevel': 'A Level (AS & A2)'
      };
      
      level = userData.examLevels.map(level => examLevelMap[level] || level).join(", ");
    }
    
    // Convert curriculum value to display label
    const curriculumMap: Record<string, string> = {
      'cambridge': 'Cambridge',
      'national_indonesia': 'National (Indonesia)',
      'other': 'Other'
    };
    
    const curriculumLabel = curriculumMap[userData.curriculum] || userData.curriculum;
    
    return level ? `${level} | ${curriculumLabel}` : curriculumLabel;
  };

  if (isLoading || !userData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full px-8 pt-8 justify-center">
      <div className="bg-white p-6 rounded-2xl w-full max-w-4xl space-y-5 border shadow-sm">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-x-3">
              <div className="w-12 h-12 bg-neutral-300 rounded-full overflow-hidden">
                <Image
                  src={userData.avatarUrl || "/default-avatar.png"}
                  alt="avatar"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  {userData.username}
                </h1>
                <span className="text-xs text-muted-foreground">
                  {getEducationInfo()}
                </span>
              </div>
            </div>
            
            {isOwnProfile ? (
              <Link href="/profile/edit">
                <Button variant="outline" className="border-black px-4 transition-colors hover:bg-neutral-200 hover:border-gray-400" size="sm">
                  Edit profile
                </Button>
              </Link>
            ) : (
              <Button 
                variant={isFollowing ? "outline" : "default"}
                className={isFollowing ? "border-black px-4 transition-colors hover:bg-neutral-200 hover:border-gray-400" : "px-4"}
                size="sm"
                onClick={handleFollowAction}
                disabled={isProcessing}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          <div className="flex flex-row gap-12 items-end pl-1">
            <div>
              <h1 className="font-semibold">{postCount}</h1>
              <p className="font-medium">posted qs</p>
            </div>
            <Link href={`/profile/${userId}/followers`}>
              <div className="cursor-pointer hover:opacity-80">
                <h1 className="font-semibold">
                  {userData.followerCount || 0}
                </h1>
                <p className="font-medium">followers</p>
              </div>
            </Link>
            <Link href={`/profile/${userId}/following`}>
              <div className="cursor-pointer hover:opacity-80">
                <h1 className="font-semibold">
                  {userData.followingCount || 0}
                </h1>
                <p className="font-medium">following</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="border-y py-5 space-y-3">
          <h1 className="text-lg font-semibold">About me</h1>
          {userData.about ? (
            <p className="text-sm text-balance">{userData.about}</p>
          ) : (
            <p className="text-sm text-gray-500">No bio yet</p>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-lg font-semibold">Joined communities</h1>
          {userData.communities && userData.communities.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {userData.communities.map((community) => {
                const slug = community.replace('m/', '');
                return (
                  <Link
                    key={community}
                    href={`/community/${slug}`}
                    className="bg-[#f3f6fa] flex items-end p-4 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer w-64 max-w-xs"
                  >
                    <Image
                      src={communityAvatars[slug] || '/community_avatars/default.png'}
                      alt={slug}
                      width={36}
                      height={36}
                      className="rounded-full object-cover bg-neutral-100 mr-4"
                    />
                    <p className="text-base font-medium text-left">{slug}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No communities joined yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;