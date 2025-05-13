import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user ID to follow from the request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if the user is trying to follow themselves
    if (userId === currentUser.uid) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Get both user documents
    const currentUserRef = doc(db, "users", currentUser.uid);
    const targetUserRef = doc(db, "users", userId);

    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    // Check if both users exist
    if (!targetUserSnap.exists()) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (!currentUserSnap.exists()) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    // Check if already following
    const currentUserData = currentUserSnap.data();
    const isAlreadyFollowing = currentUserData.following && 
                               currentUserData.following.includes(userId);

    // Update both user documents
    await Promise.all([
      // Update current user's following list
      updateDoc(currentUserRef, {
        following: isAlreadyFollowing ? arrayRemove(userId) : arrayUnion(userId),
        followingCount: isAlreadyFollowing ? 
          increment(-1) : increment(1)
      }),
      
      // Update target user's followers list
      updateDoc(targetUserRef, {
        followers: isAlreadyFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        followerCount: isAlreadyFollowing ? 
          increment(-1) : increment(1)
      })
    ]);

    return NextResponse.json({ 
      success: true,
      action: isAlreadyFollowing ? "unfollowed" : "followed"
    });
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 