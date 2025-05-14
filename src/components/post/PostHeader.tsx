"use client";

import Image from "next/image";
import { MoreVertical, Trash, Flag } from "lucide-react";
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

interface PostHeaderProps {
  community: string;
  username: string;
  postUserId: string;
  createdAt: { seconds: number } | null;
  currentUser: string | null;
  onDelete: () => void;
  onReport: () => void;
  mode: "community" | "user";
  avatarUrl?: string;
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
 * - avatarUrl: Optional URL for the user's avatar.
 */
export default function PostHeader({
  community,
  username,
  createdAt,
  currentUser,
  postUserId,
  onDelete,
  onReport,
  mode,
  avatarUrl,
}: PostHeaderProps) {
  const avatar =
    mode === "community"
      ? communityAvatars[community] || "/defaultprofile.png"
      : avatarUrl || "/defaultprofile.png";

  return (
    <div className="flex items-center gap-x-3">
      <Image
        src={avatar}
        alt="Avatar"
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover bg-neutral-100"
      />
      <div className="flex-1">
        <h1 className="font-semibold text-sm">
          m/{community?.toLowerCase().replace(/\s/g, "_")}
        </h1>
        <div className="flex items-center gap-x-1 text-xs text-muted-foreground">
          <span>{username}</span>
          <span className="mx-0.5">•</span>
          <span>
            {createdAt?.seconds
              ? formatRelativeTime(createdAt.seconds * 1000)
              : "Just now"}
          </span>
        </div>
      </div>

      <div onClick={(e) => e.preventDefault()} className="relative z-20 -mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentUser === postUserId ? (
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-red-600 hover:bg-gray-100"
              >
                <Trash className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={onReport}
                className="cursor-pointer text-yellow-600 hover:bg-gray-100"
              >
                <Flag className="h-4 w-4" /> Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
