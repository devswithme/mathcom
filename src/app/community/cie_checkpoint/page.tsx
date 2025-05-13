'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ArrowUp, MessageCircle, Share2, Plus, MoreVertical, Trash, Flag } from 'lucide-react'
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'

// Function to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

const communityAvatars: Record<string, string> = {
  cie_checkpoint: '/community_avatars/cie_checkpoint.png',
  cie_igcse: '/community_avatars/cie_igcse.png',
  cie_alevel: '/community_avatars/cie_alevel.png',
};

export default function CIECheckpointCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({})
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
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
  
  const COMMUNITY_SLUG = "cie_checkpoint";

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

    fetchPosts();
    fetchMemberCount();

    return () => unsubscribe();
  }, []);

  // Load user votes
  useEffect(() => {
    if (currentUser && posts.length > 0) {
      const loadUserVotes = async () => {
        try {
          const postIds = posts.map(post => post.id);
          const userVotesQuery = query(
            collection(db, 'users', currentUser, 'votes'),
            where('postId', 'in', postIds)
          );
          
          const votesSnapshot = await getDocs(userVotesQuery);
          const newVotedPosts: Record<string, boolean> = {};
          
          votesSnapshot.forEach(doc => {
            const voteData = doc.data();
            newVotedPosts[voteData.postId] = true;
          });
          
          // Also include any local votes from this session
          setVotedPosts({...newVotedPosts, ...localVotes});
        } catch (error) {
          console.error('Error loading user votes:', error);
        }
      };
      
      loadUserVotes();
    }
  }, [currentUser, posts, localVotes]);

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
      // handle error
    } finally {
      setIsJoining(false);
    }
  };

  const handleVote = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't process if already processing a vote for this post
    if (loadingVote === postId) return;
    
    // Start loading state immediately to prevent double clicks
    setLoadingVote(postId);
    
    // Get current vote state
    const currentVoted = votedPosts[postId] || false;
    const newVoteState = !currentVoted;
    
    // Update UI optimistically
    setVotedPosts(prev => ({
      ...prev,
      [postId]: newVoteState
    }));
    
    // Remember local vote state for this session
    setLocalVotes(prev => ({
      ...prev,
      [postId]: newVoteState
    }));
    
    try {
      // Update in Firebase
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        upvotes: increment(newVoteState ? 1 : -1)
      });
    } catch (error) {
      console.error('Error updating vote:', error);
      
      // Revert UI state
      setVotedPosts(prev => ({
        ...prev,
        [postId]: currentVoted
      }));
      
      setLocalVotes(prev => ({
        ...prev,
        [postId]: currentVoted
      }));
    } finally {
      // Clear loading state
      setLoadingVote(null);
    }
  }
  
  const handleCommentClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentUser) {
      setLoginDialogMessage('You need to be logged in to comment on posts.');
      setShowLoginDialog(true);
      return;
    }
    
    router.push(`/post/${postId}`)
  }

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create the full URL to share
    const postUrl = `${window.location.origin}/post/${postId}`
    setShareUrl(postUrl)
    setShareDialogOpen(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        // Success - don't auto-close
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
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
          src="/community_banners/cie_checkpoint_banner.png" 
          alt="CIE Checkpoint Community Banner"
          width={1000}
          height={200}
          priority
          className="w-full h-auto"
        />
        {/* Hover effect overlay */}
        <div className="absolute inset-x-0 top-2 bottom-2 bg-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
        
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
          <h1 className="text-3xl font-bold pt-8 mb-2">m/cie_checkpoint</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A space for Cambridge Checkpoint students to ask math questions, share tips, and support one another.
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
            <Link href='/ask?community=cie_checkpoint&from=community/cie_checkpoint' className='mt-4'>
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
                  <div 
                    key={post.id}
                    className="border-b border-black/20 last:border-b-0 group"
                  >
                    <Link
                      href={`/post/${post.id}`}
                      className={`block px-5 py-4 space-y-3 relative ${index === 0 ? 'pt-5' : ''}`}
                    >
                      {/* Hover effect overlay */}
                      <div className="absolute inset-x-0 top-2 bottom-2 bg-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
                      
                      {/* Content wrapper */}
                      <div className="relative z-10">
                        {/* User Info */}
                        <div className='flex items-center gap-x-3'>
                          {post.username === 'Anonymous User' ? (
                            <img
                              src="/defaultprofile.png"
                              alt='Anonymous Avatar'
                              className='w-10 h-10 rounded-full object-cover bg-neutral-100'
                            />
                          ) : post.avatar ? (
                            <img
                              src={post.avatar}
                              alt='User Avatar'
                              className='w-10 h-10 rounded-full object-cover bg-neutral-100'
                            />
                          ) : (
                            <div className='w-10 h-10 bg-neutral-100 rounded-full' />
                          )}
                          <div className="flex-1">
                            <h1 className='font-semibold text-sm'>
                              {post.username || 'Unknown'}
                            </h1>
                            <div className='flex items-center gap-x-1 text-xs text-muted-foreground'>
                              <span>
                                {post.createdAt?.seconds
                                  ? formatRelativeTime(post.createdAt.seconds * 1000)
                                  : 'Just now'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Triple dot menu */}
                          <div onClick={(e) => e.preventDefault()} className="relative z-20 -mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 hover:bg-gray-100/10">
                                  <MoreVertical className="h-5 w-5 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {currentUser && post.userId === currentUser ? (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setDeletingPost(post.id);
                                      setConfirmDeleteOpen(true);
                                    }} 
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash className="h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleReportPost(post.id)} 
                                    className="cursor-pointer text-yellow-600"
                                  >
                                    <Flag className="h-4 w-4" />
                                    Report
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Post Content */}
                        <h1 className='text-lg font-bold'>{post.title}</h1>
                        <p className='text-sm'>{post.description}</p>

                        {/* Uploaded Image */}
                        {post.imageURL && (
                          <div className='w-full aspect-video bg-neutral-100 rounded-xl my-5'>
                            <img
                              src={post.imageURL}
                              alt='Uploaded image'
                              className='w-full h-full object-cover rounded-xl'
                            />
                          </div>
                        )}

                        {/* Buttons */}
                        <div className='flex items-center gap-x-1 mt-4'>
                          <button 
                            onClick={(e) => handleVote(e, post.id)}
                            className={`flex items-center px-3 py-1.5 rounded-full transition-all gap-x-2 ${
                              votedPosts[post.id] 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <ArrowUp className={`w-5 h-5 transform transition-transform ${votedPosts[post.id] ? 'scale-110' : ''}`} />
                            <span className='font-medium text-sm'>{(post.upvotes || 0) + (votedPosts[post.id] ? 1 : 0)}</span>
                          </button>
                          
                          <button
                            onClick={(e) => handleCommentClick(e, post.id)}
                            className='flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100'
                          >
                            <MessageCircle className='w-5 h-5' />
                            <span className='text-sm'>{post.commentsCount || 0}</span>
                          </button>
                          
                          <button 
                            onClick={(e) => handleShare(e, post.id)}
                            className='flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100'
                          >
                            <Share2 className='w-5 h-5' />
                            <span className='text-sm'>Share</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
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
