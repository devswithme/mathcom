'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc, where, deleteDoc, addDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore'
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import PostCard from '@/components/post/PostCard'
import { handlePostVote } from '@/lib/handlePostVote'

// Define the Post interface at the top of the file
interface Post {
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
  avatar?: string;
}

export default function CIEALevelCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({})
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
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
  const votingInProgressRef = useRef(false);
  
  const COMMUNITY_SLUG = "cie_alevel";

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
    // Query posts for this specific community
    const q = query(
      collection(db, 'posts'), 
      where('community', '==', COMMUNITY_SLUG),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)

    const fetched = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data();
        
        let finalUsername = postData.username;
        let finalAvatar = postData.avatar;

        if (postData.username === "Anonymous User") {
          finalUsername = "Anonymous User";
          finalAvatar = "/defaultprofile.png"; // Ensure default avatar for anonymous
        } else {
          // Post is not anonymous, fetch original user's details
          const userRef = doc(db, 'users', postData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            finalUsername = userData.username || 'Unknown';
            finalAvatar = userData.avatarUrl || '/defaultprofile.png'; // Fallback if no user avatar
          } else {
            // Fallback if user data is missing for a non-anonymous post
            finalUsername = postData.username || 'Unknown'; // Use post's username or mark unknown
            finalAvatar = postData.avatar || '/defaultprofile.png'; // Use post's avatar or default
          }
        }
        
        // Get actual comment count including replies
        let actualCommentsCount = postData.commentsCount || 0;
        try {
          // Get all comments for this post
          const commentsQuery = query(
            collection(db, 'comments'),
            where('postId', '==', docSnap.id)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          
          // Count all comments (including replies)
          actualCommentsCount = commentsSnapshot.size;
        } catch (error) {
          console.error('Error fetching comments count:', error);
          // Fallback to the stored commentsCount if there's an error
        }

        return {
          id: docSnap.id,
          ...postData,
          username: finalUsername,
          avatar: finalAvatar,
          commentsCount: actualCommentsCount,
        };
      })
    )

    setPosts(fetched)
    setLoading(false)
  }

  const fetchMemberCount = async () => {
    // Query users whose communities array contains 'cie_alevel'
    const q = query(
      collection(db, 'users'),
      where('communities', 'array-contains', 'cie_alevel')
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
        communities: arrayUnion('cie_alevel')
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
        communities: arrayRemove('cie_alevel')
      });
      setHasJoined(false);
      fetchMemberCount();
    } catch (e) {
      // handle error
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
  
  const handleCommentClick = (postId: string) => {
    if (!currentUser) {
      setLoginDialogMessage('You need to be logged in to comment on posts.');
      setShowLoginDialog(true);
      return;
    }
    router.push(`/post/${postId}?from=cie_alevel`)
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      setDeletingPost(postId);
      
      // First delete all comments and replies associated with this post
      // This is important to avoid orphaned comments in the database
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      // Create a batch to delete all comments efficiently
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();
      
      // Then delete the post itself
      await deleteDoc(doc(db, 'posts', postId));
      
      // Remove the post from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setConfirmDeleteOpen(false);
      toast('Post deleted', {
        description: 'Your post has been successfully deleted.'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
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
      await addDoc(collection(db, 'reports'), {
        postId: postToReport,
        reason: reportReason,
        reportedBy: currentUser,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      // Reset and close dialog
      setReportReason('');
      setPostToReport(null);
      setReportDialogOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <div className="flex w-full px-8 flex-col">
      {/* Banner Area - full width */}
      <div className="w-full rounded-lg mb-6 mt-8 relative overflow-hidden">
        {/* Banner Image */}
        <Image 
          src="/community_banners/cie_alevel_banner.png" 
          alt="CIE A-Level Community Banner"
          width={1000}
          height={200}
          priority
          className="w-full h-auto"
        />
        {/* Triple dot menu for leave - positioned in the top right of banner */}
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
          <h1 className="text-3xl font-bold pt-8 mb-2">m/cie_alevel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A space for Cambridge A Level (AS & A2) students to ask math questions, share tips, and support one another.
          </p>
        </div>
        <div className="flex flex-col items-end">
          {/* Join button only if not joined */}
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
            <Link href='/ask?community=cie_alevel&from=community/cie_alevel' className='mt-4'>
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
                    onComment={(_, postId) => handleCommentClick(postId)}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onReport={handleReportPost}
                    descRef={() => {}}
                    getPreviewHtml={(html) => html}
                    mode="user"
                    postLink={`/post/${post.id}?from=cie_alevel`}
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
            
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={() => setShowLoginDialog(false)}
                variant="secondary"
                className="rounded-full bg-gray-100 hover:bg-gray-200 text-black border-0 px-5 py-1.5"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { setShowLoginDialog(false); router.push('/login'); }}
                className="rounded-full bg-[#495670] hover:bg-[#3a4458] text-white px-5 py-1.5"
              >
                Log In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}