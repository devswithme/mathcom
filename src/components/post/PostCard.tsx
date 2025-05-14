"use client";

import Link from "next/link";
import PostBody from "./PostBody";
import PostFooter from "./PostFooter";
import PostHeader from "./PostHeader";

interface PostCardProps {
  post: {
    id: string;
    community: string;
    username: string;
    userId: string;
    createdAt: { seconds: number } | null;
    title: string;
    description: string;
    imageURL?: string;
    upvotes: number;
    commentsCount: number;
  };
  index: number;
  isVoted: boolean;
  currentUser: string | null;
  loadingVote: string | null;
  canVote: boolean;
  getVoteButtonClass: (v: boolean) => string;
  onVote: (e: React.MouseEvent, postId: string) => void;
  onComment: (e: React.MouseEvent, postId: string) => void;
  onShare: (e: React.MouseEvent, postId: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
  descRef: (el: HTMLDivElement | null) => void;
  getPreviewHtml: (html: string) => string;
}

/**
 * PostCard Component
 *
 * Represents a single post card, including the header, body, and footer.
 * Provides interactivity for voting, commenting, sharing, deleting, and reporting posts.
 *
 * Props:
 * - post: The post data, including ID, title, description, etc.
 * - index: The index of the post in the list.
 * - isVoted: Indicates if the current user has upvoted the post.
 * - currentUser: The ID of the current user (if logged in).
 * - loadingVote: The ID of the post currently being voted on (if any).
 * - canVote: Indicates if the user is allowed to vote.
 * - getVoteButtonClass: Function to determine the CSS class for the vote button.
 * - onVote: Callback for handling upvote actions.
 * - onComment: Callback for handling comment actions.
 * - onShare: Callback for handling share actions.
 * - onDelete: Callback for handling post deletion.
 * - onReport: Callback for handling post reporting.
 * - descRef: A ref callback for the description container.
 * - getPreviewHtml: Function to generate a preview of the description HTML.
 */
export default function PostCard({
  post,
  index,
  isVoted,
  currentUser,
  loadingVote,
  canVote,
  getVoteButtonClass,
  onVote,
  onComment,
  onShare,
  onDelete,
  onReport,
  descRef,
  getPreviewHtml,
}: PostCardProps) {
  return (
    <div className="border-b border-black/20 last:border-b-0 group">
      <Link
        href={`/post/${post.id}`}
        className={`block px-4 py-4 space-y-3 relative ${
          index === 0 ? "pt-5" : ""
        }`}
      >
        <div className="absolute inset-x-0 top-2 bottom-2 bg-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />

        <div className="relative z-10">
          <PostHeader
            community={post.community}
            username={post.username}
            postUserId={post.userId}
            currentUser={currentUser}
            createdAt={post.createdAt}
            onDelete={() => onDelete(post.id)}
            onReport={() => onReport(post.id)}
            mode="community"
          />

          <PostBody
            title={post.title}
            description={post.description}
            imageURL={post.imageURL}
            descRef={descRef}
            getPreviewHtml={getPreviewHtml}
          />

          <PostFooter
            isVoted={isVoted}
            postId={post.id}
            upvotes={post.upvotes}
            commentsCount={post.commentsCount}
            loadingVote={loadingVote}
            canVote={canVote}
            getVoteButtonClass={getVoteButtonClass}
            onVote={onVote}
            onComment={onComment}
            onShare={onShare}
          />
        </div>
      </Link>
    </div>
  );
}
