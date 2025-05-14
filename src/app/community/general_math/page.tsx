'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc, increment, where, deleteDoc, addDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import PostCard from '@/components/post/PostCard'
import { handlePostVote } from '@/lib/handlePostVote'

export default function GeneralMathCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({})
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [postToReport, setPostToReport] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginDialogMessage, setLoginDialogMessage] = useState('You need to be logged in to comment on posts.');
  
  const COMMUNITY_SLUG = "general_math";

  const votingInProgressRef = useRef(false);

  useEffect(() => {
    // Check current user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user ? user.uid : null);
      if (user) {
        // Check if user has joined this community
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHasJoined(userData.communities?.includes(COMMUNITY_SLUG) || false);
        }
      }
    });
    fetchMemberCount();
    return () => unsubscribe();
  }, []);

  // Fetch posts whenever currentUser changes
  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsQuery = query(
        collection(db, 'posts'),
        where('community', '==', COMMUNITY_SLUG),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(postsQuery);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);

      // --- Upvote logic: set votedPosts based on upvotedBy field ---
      if (currentUser) {
        const newVotedPosts: Record<string, boolean> = {};
        fetchedPosts.forEach(post => {
          const p: any = post;
          if (p.upvotedBy && p.upvotedBy[currentUser]) {
            newVotedPosts[post.id] = true;
          }
        });
        setVotedPosts({ ...newVotedPosts });
      }
      // -----------------------------------------------------------
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberCount = async () => {
    const q = query(
      collection(db, 'users'),
      where('communities', 'array-contains', COMMUNITY_SLUG)
    );
    const snapshot = await getDocs(q);
    setMemberCount(snapshot.size);
  };

  const handleJoin = async () => {
    if (!currentUser) return;
    setIsJoining(true);
    try {
      const userRef = doc(db, 'users', currentUser);
      await updateDoc(userRef, {
        communities: arrayUnion(COMMUNITY_SLUG)
      });
      setHasJoined(true);
      fetchMemberCount(); // update member count after joining
    } catch (e) {
      // handle error (optional: show toast)
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    setIsJoining(true);
    try {
      const userRef = doc(db, 'users', currentUser);
      await updateDoc(userRef, {
        communities: arrayRemove(COMMUNITY_SLUG)
      });
      setHasJoined(false);
      fetchMemberCount();
    } catch (e) {
      // handle error (optional: show toast)
    } finally {
      setIsJoining(false);
    }
  };

  const handleVote = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      setLoginDialogMessage('You need to be logged in to upvote posts.');
      setShowLoginDialog(true);
      return;
    }
    if (loadingVote === postId || votingInProgressRef.current) return;
    await handlePostVote({
      postId,
      currentVoted: votedPosts[postId] || false,
      userId: currentUser,
      setLoadingId: (id) => setLoadingVote(id),
      votingInProgressRef,
      updateLocalState: (newVoteState) => {
        setVotedPosts((prev) => ({ ...prev, [postId]: newVoteState }));
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  upvotes: (post.upvotes || 0) + (newVoteState ? 1 : -1),
                  upvotedBy: {
                    ...(post.upvotedBy || {}),
                    [currentUser]: newVoteState ? Date.now() : undefined,
                  },
                }
              : post
          )
        );
      },
    });
    // Re-fetch posts to get the latest upvote state from Firestore
    fetchPosts();
  };

  const handleCommentClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) {
      setLoginDialogMessage('You need to be logged in to comment on posts.');
      setShowLoginDialog(true);
      return;
    }
    router.push(`/post/${postId}?from=general_math`)
  }

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const postUrl = `${window.location.origin}/post/${postId}?from=general_math`
    setShareUrl(postUrl)
    setShareDialogOpen(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {})
      .catch(err => {});
  }

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      setDeletingPost(postId);
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setConfirmDeleteOpen(false);
      toast('Post deleted', { description: 'Your post has been successfully deleted.' });
    } catch (error) {
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
      await addDoc(collection(db, 'reports'), {
        postId: postToReport,
        reason: reportReason,
        reportedBy: currentUser,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setReportReason('');
      setPostToReport(null);
      setReportDialogOpen(false);
    } catch (error) {}
  };

  return (
    <div className="flex w-full px-8 flex-col">
      {/* Banner Area - full width */}
      <div className="w-full rounded-lg mb-6 mt-8 relative overflow-hidden">
        {/* Banner Image */}
        <Image 
          src="/community_banners/generalmath_banner.png" 
          alt="General Math Community Banner"
          width={1000}
          height={200}
          priority
          className="w-full h-auto"
        />
        <div className="absolute inset-x-0 top-2 bottom-2 bg-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
        {hasJoined && (
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-gray-100/30 text-white">
                  <MoreVertical className="h-6 w-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setConfirmLeaveOpen(true)} className="cursor-pointer text-red-600">
                  Leave community
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {/* Community Header - full width */}
      <div className="w-full flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold pt-8 mb-2">m/general_math</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A space for all general math questions, discussions, and support across any curriculum or level.
          </p>
        </div>
        <div className="flex flex-col items-end">
          {!hasJoined && (
            <Button 
              className="rounded-full font-medium bg-[#11244DB3] hover:bg-[#11244D]/90 text-white px-7 mb-1"
              onClick={handleJoin}
              disabled={hasJoined || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          )}
          <div className="text-right">
            <div className="text-lg font-semibold">{memberCount || 0}</div>
            <div className="text-sm text-muted-foreground">members</div>
          </div>
        </div>
      </div>
      {/* Main content - posts list */}
      <div className="w-full max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-8">
            <p className='text-sm text-muted-foreground'>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className='text-center text-muted-foreground text-sm font-medium'>
              No questions have been posted in this community yet. 
            </p>
            <Link href='/ask?community=general_math&from=community/general_math' className='mt-4'>
              <Button className="bg-[#11244DB3] hover:bg-[#11244D]/90 rounded-full px-6">
                Ask a Question
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex w-full">
            <div className="w-full max-w-3xl">
              <div className="flex flex-col">
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    isVoted={!!votedPosts[post.id]}
                    currentUser={currentUser}
                    loadingVote={loadingVote}
                    canVote={!!currentUser}
                    getVoteButtonClass={(v) => v ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}
                    onVote={handleVote}
                    onComment={handleCommentClick}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onReport={handleReportPost}
                    descRef={() => {}}
                    getPreviewHtml={(html) => html}
                    mode="user"
                    postLink={`/post/${post.id}?from=general_math`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md px-6 py-5 flex flex-col items-center justify-center">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-center text-xl">Link copied to clipboard!</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button 
              variant="default" 
              className="bg-[#11244DB3] hover:bg-[#11244D]/90 rounded-full px-8" 
              onClick={() => setShareDialogOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md px-6 py-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl">Delete Post</DialogTitle>
            <DialogDescription className="text-center mt-2">
              Are you sure you want to delete this post? This action cannot be undone.
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
            <DialogTitle className="text-center text-xl">Report Post</DialogTitle>
            <DialogDescription className="text-center mt-2">
              Tell us why you're reporting this post.
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
                  setReportReason('');
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
      {/* Leave Community Confirmation Dialog */}
      <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <DialogContent className="sm:max-w-md px-6 py-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl">Leave Community</DialogTitle>
            <DialogDescription className="text-center mt-2">
              Are you sure you want to leave this community? You can always rejoin later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmLeaveOpen(false)}
              className="px-8 py-2 text-base"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleLeave();
                setConfirmLeaveOpen(false);
              }}
              className="px-8 py-2 text-base bg-red-600 hover:bg-red-700"
            >
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Login Required Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-xs border-0 rounded-xl overflow-hidden shadow-md">
          <div className="text-center py-6 px-4">
            <DialogTitle className="text-2xl font-semibold mb-2">Login Required</DialogTitle>
            <DialogDescription className="text-base mb-8">
              {loginDialogMessage}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 