import { toggleVote } from "./toggleVote";
import { toast } from "sonner";

export async function handleCommentVote({
  commentId,
  currentVoted,
  userId,
  updateLocalState,
  setLoadingId,
  votingInProgressRef,
}: {
  commentId: string;
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
  setLoadingId(commentId);

  try {
    await toggleVote({
      type: "comments",
      id: commentId,
      userId,
      isVoted: currentVoted,
    });
  } catch (error) {
    console.error("Comment vote failed:", error);
    toast("Failed to update vote. Please try again.");
    updateLocalState(currentVoted); // Revert
  } finally {
    setLoadingId(null);
    setTimeout(() => {
      votingInProgressRef.current = false;
    }, 300);
  }
}
