"use client";

import Image from "next/image";
import { MoreVertical, Trash, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const communityAvatars: Record<string, string> = {
  general_math: "/community_avatars/general_math.png",
  cie_checkpoint: "/community_avatars/cie_checkpoint.png",
  cie_igcse: "/community_avatars/cie_igcse.png",
  cie_alevel: "/community_avatars/cie_alevel.png",
};

interface PostHeaderProps {
  community: string;
  username: string;
  postUserId: string;
  createdAt: { seconds: number } | null;
  currentUser: string | null;
  onDelete: () => void;
  onReport: () => void;
  mode: "community" | "user" | "post";
  postAvatar?: string;
}

interface UserData {
  displayName: string;
  photoURL: string | null;
}

/**
 * PostHeader Component
 *
 * Displays the header of a post, including the community name, username, avatar, and creation time.
 * Provides options for deleting or reporting the post via a dropdown menu.
 *
 * Props:
 * - community: The name of the community the post belongs to.
 * - username: The username of the post author.
 * - postUserId: The user ID of the post author.
 * - createdAt: The creation timestamp of the post.
 * - currentUser: The ID of the currently logged-in user.
 * - onDelete: Callback for handling post deletion.
 * - onReport: Callback for handling post reporting.
 * - mode: The display mode (community or user profile).
 * - postAvatar: Optional avatar for the post.
 */
export default function PostHeader({
  community,
  username,
  postUserId,
  createdAt,
  currentUser,
  onDelete,
  onReport,
  mode,
  postAvatar,
}: PostHeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!postUserId) return;

      try {
        const userDoc = await getDoc(doc(db, "users", postUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || data.username || username,
            photoURL: data.photoURL || data.avatarUrl || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mode === "user" || mode === "post") {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [postUserId, mode, username]);

  // Determine which avatar to show
  const avatarSrc = mode === "community"
    ? communityAvatars[community] || "/defaultprofile.png"
    : (userData?.photoURL || postAvatar || "/defaultprofile.png");

  // Determine which name to show
  const displayName = userData?.displayName || username || "Unknown";

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  };

  const timeAgo = formatRelativeTime(createdAt?.seconds ? createdAt.seconds * 1000 : Date.now());

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200">
          <Image
            src={avatarSrc}
            alt={mode === "community" ? `${community} avatar` : `${displayName}'s avatar`}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          {mode === "community" ? (
            <>
              <span className="font-semibold text-sm">m/{community}</span>
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                {displayName}
                <span className="mx-1">•</span>
                {timeAgo}
              </span>
            </>
          ) : mode === "post" ? (
            <>
              <span className="font-medium text-sm">{!loading ? displayName : "Loading..."}</span>
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                m/{community}
                <span className="mx-1">•</span>
                {timeAgo}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-sm">{!loading ? displayName : "Loading..."}</span>
              <span className="text-xs text-neutral-500">{timeAgo}</span>
            </>
          )}
        </div>
      </div>
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentUser === postUserId ? (
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
              >
                Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onReport();
                }}
              >
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
