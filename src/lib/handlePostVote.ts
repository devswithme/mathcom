import { toggleVote } from "./toggleVote";
import { toast } from "sonner";

/**
 * Handles optimistic voting updates for a post.
 */
export async function handlePostVote({
  postId,
  currentVoted,
  userId,
  updateLocalState,
  setLoadingId,
  votingInProgressRef,
}: {
  postId: string;
  currentVoted: boolean;
  userId: string;
  updateLocalState: (newVoteState: boolean) => void;
  setLoadingId: (id: string | null) => void;
  votingInProgressRef: React.MutableRefObject<boolean>;
}) {
  if (votingInProgressRef.current) return;

  const newVoteState = !currentVoted;

  updateLocalState(newVoteState);
  votingInProgressRef.current = true;
  setLoadingId(postId);

  try {
    await toggleVote({
      type: "posts",
      id: postId,
      userId,
      isVoted: currentVoted,
    });
  } catch (error) {
    console.error("Vote failed:", error);
    toast("Failed to update vote. Please try again.");
    updateLocalState(currentVoted); // revert
  } finally {
    setLoadingId(null);
    setTimeout(() => {
      votingInProgressRef.current = false;
    }, 300);
  }
}
