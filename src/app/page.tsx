"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import PostSkeleton from "@/components/post/post-skeleton";
import { toast } from "sonner";
import LoginPopup from "@/components/LoginPopup";
import LoginRequired from "@/components/LoginRequired";
import SimpleShareDialog from "@/components/SimpleShareDialog";
import { renderMathInNode } from "@/utils/mathlive";
import { toggleVote } from "@/lib/toggleVote";
import PostCard from "@/components/post/PostCard";
import { handlePostVote } from "@/lib/handlePostVote";

function stripHtml(html: string) {
  if (typeof window === "undefined" || !html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

function getPreviewHtml(html: string) {
  if (typeof window === "undefined" || !html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;

  // If the first meaningful block contains a math node, return the entire block
  const firstBlock = div.querySelector("p, div, ul, ol, li");
  if (firstBlock) {
    return firstBlock.innerHTML.trim() !== "" ? firstBlock.outerHTML : "";
  }

  // Fallback: just truncate raw HTML
  return div.innerHTML.slice(0, 200);
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({});
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState<Record<string, boolean>>({});
  const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<string | null | undefined>(
    undefined
  );
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [postToReport, setPostToReport] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginDialogMessage, setLoginDialogMessage] = useState(
    "You need to be logged in to comment on posts."
  );
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState("/");
  const [mathLiveReady, setMathLiveReady] = useState(
    typeof window !== "undefined" &&
      !!window.MathLive &&
      !!customElements.get("math-field")
  );

  const descRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Step 1: Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user.uid : null);

      if (!user) {
        // Clear voted posts when logged out
        setVotedPosts({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Step 2: Fetch posts after currentUser is known
  useEffect(() => {
    if (currentUser === undefined) return; // Wait only until the auth state is resolved

    const fetchPosts = async () => {
      setLoading(true);
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const fetched = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const postData = docSnap.data();
          const postId = docSnap.id;

          const userRef = doc(db, "users", postData.userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          let userPhotoURL = "";
          try {
            const postUserAuth =
              auth.currentUser && auth.currentUser.uid === postData.userId
                ? auth.currentUser
                : null;

            if (postUserAuth) {
              userPhotoURL = postUserAuth.photoURL || "";
            }
          } catch (error) {
            console.error("Error getting user photo URL:", error);
          }

          // ✅ Track whether this user has upvoted this post
          if (postData.upvotedBy?.[currentUser]) {
            setVotedPosts((prev) => ({
              ...prev,
              [postId]: true,
            }));
          }

          // ✅ Count comments
          let actualCommentsCount = postData.commentsCount || 0;
          try {
            const commentsQuery = query(
              collection(db, "comments"),
              where("postId", "==", postId)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            actualCommentsCount = commentsSnapshot.size;
          } catch (error) {
            console.error("Error fetching comments count:", error);
          }

          return {
            id: postId,
            ...postData,
            username: postData.username || userData.username || "Unknown",
            avatar: postData.avatar || userPhotoURL || "",
            commentsCount: actualCommentsCount,
          };
        })
      );

      setPosts(fetched);
      setLoading(false);
    };

    fetchPosts();
  }, [currentUser]);

  const votingInProgressRef = useRef(false);

  const handleVote = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      setLoginDialogMessage("You need to be logged in to upvote posts.");
      setShowLoginDialog(true);
      return;
    }

    const currentVoted = votedPosts[postId] || false;

    await handlePostVote({
      postId,
      currentVoted,
      userId: currentUser,
      setLoadingId: (id) =>
        setLoadingVotes((prev) =>
          id
            ? { ...prev, [id]: true }
            : Object.fromEntries(
                Object.entries(prev).filter(([k]) => k !== postId)
              )
        ),
      votingInProgressRef,
      updateLocalState: (newVoteState) => {
        setVotedPosts((prev) => ({ ...prev, [postId]: newVoteState }));
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  upvotes: (post.upvotes || 0) + (newVoteState ? 1 : -1),
                }
              : post
          )
        );
      },
    });
  };

  const getVoteButtonClass = (isVoted: boolean) => {
    return isVoted
      ? "text-blue-600 bg-blue-50"
      : "text-gray-500 hover:bg-gray-100";
  };

  const handleCommentClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      setLoginDialogMessage("You need to be logged in to comment on posts.");
      setShowLoginDialog(true);
      return;
    }

    router.push(`/post/${postId}`);
  };

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Create the full URL to share
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard
      .writeText(postUrl)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 1500);
      })
      .catch(() => {
        // fallback: show dialog with error
        setShareUrl(postUrl);
        setShareDialogOpen(true);
      });
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;

    try {
      setDeletingPost(postId);

      // First delete all comments and replies associated with this post
      // This is important to avoid orphaned comments in the database
      const commentsQuery = query(
        collection(db, "comments"),
        where("postId", "==", postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      // Create a batch to delete all comments efficiently
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();

      // Then delete the post itself
      await deleteDoc(doc(db, "posts", postId));

      // Remove the post from local state
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      setConfirmDeleteOpen(false);
      toast("Post deleted", {
        description: "Your post has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setDeletingPost(null);
    }
  };

  const handleReportPost = (postId: string) => {
    setPostToReport(postId);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!postToReport || !reportReason.trim()) return;

    try {
      // Add report to Firestore
      await addDoc(collection(db, "reports"), {
        postId: postToReport,
        reason: reportReason,
        reportedBy: currentUser,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      // Reset and close dialog
      setReportReason("");
      setPostToReport(null);
      setReportDialogOpen(false);
      toast("Post reported", {
        description: "Thank you for reporting. Our team will review this post.",
      });
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  useEffect(() => {
    function handleReady() {
      setMathLiveReady(true);
    }
    window.addEventListener("mathlive-ready", handleReady);
    return () => window.removeEventListener("mathlive-ready", handleReady);
  }, []);

  useLayoutEffect(() => {
    if (!mathLiveReady) return;
    function renderAllMath() {
      descRefs.current.forEach((descRef, i) => {
        if (descRef) {
          const mathNodes = descRef.querySelectorAll(
            'span.math-inline[data-type="math"]'
          );
          console.log("Preview", i, "math nodes:", mathNodes.length);
          mathNodes.forEach((node) => {
            renderMathInNode(node as HTMLElement);
          });
        }
      });
    }
    renderAllMath();
  }, [posts, mathLiveReady]);

  return (
    <>
      <div
        className={`flex w-full px-8 ${
          !loading && posts.length === 0 ? "pt-20" : "pt-0"
        }`}
      >
        <div className="w-full max-w-4xl mt-2">
          {loading ? (
            <>
              <PostSkeleton withImage={false} />
              <PostSkeleton withImage={false} />
              <PostSkeleton withImage={false} />
            </>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm font-medium">
              No questions have been posted yet. Be the first to{" "}
              <Link
                href="/ask?from=home"
                className="underline text-[#11244DB2]"
              >
                ask a question
              </Link>
              !
            </p>
          ) : (
            <div className="flex flex-col">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  isVoted={votedPosts[post.id]}
                  currentUser={currentUser}
                  loadingVote={loadingVotes[post.id] ? post.id : null}
                  canVote={!loadingVotes[post.id]}
                  getVoteButtonClass={getVoteButtonClass}
                  onVote={handleVote}
                  onComment={handleCommentClick}
                  onShare={handleShare}
                  onDelete={handleDeletePost}
                  onReport={handleReportPost}
                  descRef={(el) => (descRefs.current[index] = el)}
                  getPreviewHtml={getPreviewHtml}
                />
              ))}
            </div>
          )}

          {/* Share Dialog */}
          {showCopied && (
            <SimpleShareDialog
              open={showCopied}
              onClose={() => setShowCopied(false)}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <DialogContent className="sm:max-w-md px-6 py-5">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-center text-xl">
                  Delete Post
                </DialogTitle>
                <DialogDescription className="text-center mt-2">
                  Are you sure you want to delete this post? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-8 py-2 text-base"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deletingPost && handleDeletePost(deletingPost)}
                  disabled={!deletingPost}
                  className="px-8 py-2 text-base bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Report Dialog */}
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent className="sm:max-w-md px-6 py-5">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-center text-xl">
                  Report Post
                </DialogTitle>
                <DialogDescription className="text-center mt-2">
                  Tell us why you&#39;re reporting this post.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-4">
                <Textarea
                  placeholder="Please explain your reason for reporting this content..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="min-h-[100px] border border-gray-200"
                />
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReportReason("");
                      setReportDialogOpen(false);
                    }}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={submitReport}
                    disabled={!reportReason.trim()}
                    className="px-6"
                  >
                    Submit Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/*LoginRequired component */}
          <LoginRequired
            isOpen={showLoginDialog}
            onClose={() => setShowLoginDialog(false)}
            message={loginDialogMessage}
            redirectTo={loginRedirectPath}
            onLogin={() => {
              setShowLoginDialog(false);
              setShowLoginPopup(true);
            }}
          />

          {/* Login Popup */}
          <LoginPopup
            isOpen={showLoginPopup}
            onClose={() => setShowLoginPopup(false)}
            redirectTo={loginRedirectPath}
          />
        </div>
      </div>
    </>
  );
}
