import {
  doc,
  writeBatch,
  deleteField,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Toggle upvote on a post or comment and update Firestore in both directions.
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
  const itemRef = doc(db, type, id); // e.g., posts/{id}
  const userRef = doc(db, "users", userId);

  const userVoteField =
    type === "posts" ? `upvotedPosts.${id}` : `upvotedComments.${id}`;
  const itemVoteField =
    type === "posts" ? `upvotedBy.${userId}` : `upvotedBy.${userId}`;
  const voteDelta = isVoted ? -1 : 1;

  const batch = writeBatch(db);

  batch.update(itemRef, {
    upvotes: increment(voteDelta),
    [itemVoteField]: isVoted ? deleteField() : serverTimestamp(),
  });

  batch.update(userRef, {
    [userVoteField]: isVoted ? deleteField() : serverTimestamp(),
  });

  await batch.commit();
};
