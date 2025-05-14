"use client";

import { ArrowUp, MessageCircle, Share2 } from "lucide-react";

interface PostFooterProps {
  isVoted: boolean;
  postId: string;
  upvotes: number;
  commentsCount: number;
  loadingVote: string | null;
  canVote: boolean;
  getVoteButtonClass: (v: boolean) => string;
  onVote: (e: React.MouseEvent, postId: string) => void;
  onComment: (e: React.MouseEvent, postId: string) => void;
  onShare: (e: React.MouseEvent, postId: string) => void;
}

/**
 * PostFooter Component
 *
 * Displays the footer of a post, including upvote, comment, and share buttons.
 * Handles user interactions for voting, commenting, and sharing.
 *
 * Props:
 * - isVoted: Indicates if the current user has upvoted the post.
 * - postId: The unique ID of the post.
 * - upvotes: The total number of upvotes for the post.
 * - commentsCount: The total number of comments on the post.
 * - loadingVote: The ID of the post currently being voted on (if any).
 * - canVote: Indicates if the user is allowed to vote.
 * - getVoteButtonClass: Function to determine the CSS class for the vote button.
 * - onVote: Callback for handling upvote actions.
 * - onComment: Callback for handling comment actions.
 * - onShare: Callback for handling share actions.
 */
export default function PostFooter({
  isVoted,
  postId,
  upvotes,
  commentsCount,
  loadingVote,
  canVote,
  getVoteButtonClass,
  onVote,
  onComment,
  onShare,
}: PostFooterProps) {
  return (
    <div className="flex items-center gap-x-1 mt-4">
      <button
        onClick={(e) => canVote && onVote(e, postId)}
        disabled={!canVote}
        className={`flex items-center px-3 py-1.5 rounded-full transition-all gap-x-2 ${
          canVote
            ? getVoteButtonClass(isVoted)
            : "text-gray-400 bg-gray-100 cursor-not-allowed"
        }`}
      >
        <ArrowUp
          className={`w-5 h-5 transform transition-transform ${
            canVote && isVoted ? "scale-110 fill-blue-600" : ""
          }`}
        />
        <span className="font-medium text-sm">{upvotes}</span>
      </button>

      <button
        onClick={(e) => onComment(e, postId)}
        className="flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">{commentsCount}</span>
      </button>

      <button
        onClick={(e) => onShare(e, postId)}
        className="flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm">Share</span>
      </button>
    </div>
  );
}
