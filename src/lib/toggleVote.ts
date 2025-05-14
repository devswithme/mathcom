import {
  doc,
  updateDoc,
  deleteField,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Toggle upvote on a post or comment and update Firestore.
 *
 * @param type - "posts" or "comments"
 * @param id - The ID of the post or comment
 * @param userId - The ID of the current user
 * @param isVoted - Whether the user has already voted (from client-side)
 */
export const toggleVote = async ({
  type,
  id,
  userId,
  isVoted,
}: {
  type: "posts" | "comments";
  id: string;
  userId: string;
  isVoted: boolean;
}) => {
  const itemRef = doc(db, type, id);
  const userRef = doc(db, "users", userId);

  const voteField =
    type === "posts" ? `upvotedPosts.${id}` : `upvotedComments.${id}`;
  const voteDelta = isVoted ? -1 : 1;

  // Update Firestore
  await updateDoc(itemRef, {
    upvotes: increment(voteDelta),
  });

  await updateDoc(userRef, {
    [voteField]: isVoted ? deleteField() : serverTimestamp(),
  });
};
