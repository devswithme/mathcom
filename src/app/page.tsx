'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, MessageCircle, Share2, MoreVertical, Trash, Flag } from 'lucide-react'
import Link from 'next/link'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc, increment, deleteDoc, addDoc, serverTimestamp, where, writeBatch } from 'firebase/firestore'
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
import PostSkeleton from "@/components/post/post-skeleton"
import { toast } from 'sonner'
import LoginPopup from "@/components/LoginPopup"
import LoginRequired from "@/components/LoginRequired"
import SimpleShareDialog from '@/components/SimpleShareDialog'
import { renderMathInNode } from '@/utils/mathlive'

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

// Add a mapping for community avatars
const communityAvatars: Record<string, string> = {
	general_math: '/community_avatars/general_math.png',
	cie_checkpoint: '/community_avatars/cie_checkpoint.png',
	cie_igcse: '/community_avatars/cie_igcse.png',
	cie_alevel: '/community_avatars/cie_alevel.png',
};

function stripHtml(html: string) {
	if (typeof window === 'undefined' || !html) return '';
	const div = document.createElement('div');
	div.innerHTML = html;
	return (div.textContent || div.innerText || '').trim();
}

function getPreviewHtml(html: string) {
  if (typeof window === 'undefined' || !html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;

  // If the first meaningful block contains a math node, return the entire block
  const firstBlock = div.querySelector('p, div, ul, ol, li');
  if (firstBlock) {
    return firstBlock.innerHTML.trim() !== '' ? firstBlock.outerHTML : '';
  }

  // Fallback: just truncate raw HTML
  return div.innerHTML.slice(0, 200);
}

export default function Home() {
	const router = useRouter();
	const [posts, setPosts] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({})
	const [shareDialogOpen, setShareDialogOpen] = useState(false)
	const [shareUrl, setShareUrl] = useState('')
	const [showCopied, setShowCopied] = useState(false)
	const [loadingVote, setLoadingVote] = useState<string | null>(null);
	const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
	const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [postToReport, setPostToReport] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginDialogMessage, setLoginDialogMessage] = useState('You need to be logged in to comment on posts.');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState("/");
  const [canVote, setCanVote] = useState(true);
  const [mathLiveReady, setMathLiveReady] = useState(
    typeof window !== 'undefined' && !!window.MathLive && !!customElements.get('math-field')
  );

  const descRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
	// Check current user
	const unsubscribe = onAuthStateChanged(auth, (user) => {
	  setCurrentUser(user ? user.uid : null);
	});
  
	const fetchPosts = async () => {
	  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
	  const snapshot = await getDocs(q);
  
	  const fetched = await Promise.all(
		snapshot.docs.map(async (docSnap) => {
		  const postData = docSnap.data();
  
		  // Get post user information
		  let userPhotoURL = '';
		  const userRef = doc(db, 'users', postData.userId);
		  const userSnap = await getDoc(userRef);
		  const userData = userSnap.exists() ? userSnap.data() : {};
  
		  // Try to get the photo URL from Firebase Auth
		  try {
			const postUserAuth =
			  auth.currentUser && auth.currentUser.uid === postData.userId
				? auth.currentUser
				: null;
  
			if (postUserAuth) {
			  userPhotoURL = postUserAuth.photoURL || '';
			}
		  } catch (error) {
			console.error('Error getting user photo URL:', error);
		  }
  
		  // Check for local vote state
		  const postId = docSnap.id;
		  if (localVotes[postId]) {
			setVotedPosts((prev) => ({
			  ...prev,
			  [postId]: true,
			}));
		  }
  
		  // Get actual comment count including replies
		  let actualCommentsCount = postData.commentsCount || 0;
		  try {
			const commentsQuery = query(
			  collection(db, 'comments'),
			  where('postId', '==', postId)
			);
			const commentsSnapshot = await getDocs(commentsQuery);
			actualCommentsCount = commentsSnapshot.size;
		  } catch (error) {
			console.error('Error fetching comments count:', error);
		  }
  
		  return {
			id: docSnap.id,
			...postData,
			username: postData.username || userData.username || 'Unknown',
			avatar: postData.avatar || userPhotoURL || '',
			commentsCount: actualCommentsCount,
		  };
		})
	  );
  
	  setPosts(fetched);
	  setLoading(false);
  
	  // Enable voting after delay
	  setTimeout(() => {
		setCanVote(true);
	  }, 1500);
	};
  
	fetchPosts();
	return () => unsubscribe();
  }, [localVotes]);
  

  const handleVote = async (e: React.MouseEvent, postId: string) => {
	e.preventDefault();
	e.stopPropagation();
  
	// Only allow signed-in users to upvote
	if (!currentUser) {
	  setLoginDialogMessage('You need to be logged in to upvote posts.');
	  setShowLoginDialog(true);
	  return;
	}
  
	// Prevent voting if still in cooldown or if another vote is processing
	if (loadingVote === postId || !canVote) return;
  
	try {
	  // Start loading state and disable voting immediately
	  setLoadingVote(postId);
	  setCanVote(false);
  
	  // Get the current state from Firestore first to ensure accuracy
	  const postRef = doc(db, 'posts', postId);
	  const postSnap = await getDoc(postRef);
	  
	  if (!postSnap.exists()) {
		console.error('Post does not exist');
		return;
	  }
  
	  // Get current vote state from local state
	  const currentVoted = votedPosts[postId] || false;
	  const newVoteState = !currentVoted;
	  
	  // Update UI optimistically
	  setVotedPosts(prev => ({
		...prev,
		[postId]: newVoteState,
	  }));
  
	  // Get actual current upvotes from database
	  const currentUpvotes = postSnap.data().upvotes || 0;
	  
	  // Calculate new upvotes value
	  let newUpvotes = currentUpvotes;
	  if (newVoteState) {
		// If upvoting
		newUpvotes = currentUpvotes + 1;
	  } else {
		// If removing upvote
		newUpvotes = Math.max(0, currentUpvotes - 1); // Ensure non-negative
	  }
  
	  // Update Firebase with new vote count
	  await updateDoc(postRef, {
		upvotes: newUpvotes,
	  });
  
	  // Remember local vote state for this session
	  setLocalVotes(prev => ({
		...prev,
		[postId]: newVoteState,
	  }));
  
	  // Update post in state to reflect new vote count
	  setPosts(prevPosts => 
		prevPosts.map(post => 
		  post.id === postId 
			? { ...post, upvotes: newUpvotes }
			: post
		)
	  );
  
	} catch (error) {
	  console.error('Error updating vote:', error);
	  
	  // Revert UI state on error
	  setVotedPosts(prev => ({
		...prev,
		[postId]: votedPosts[postId] || false, // Revert to previous state
	  }));
	  
	  setLocalVotes(prev => ({
		...prev,
		[postId]: votedPosts[postId] || false, // Revert to previous state
	  }));
  
	  toast('Failed to update vote', {
		description: 'There was an error processing your vote. Please try again.',
	  });
	} finally {
	  setLoadingVote(null); // Reset loading state
	  
	  // Re-enable voting after a longer delay (2 seconds)
	  setTimeout(() => {
		setCanVote(true);
	  }, 2000);
	}
  };

  const getVoteButtonClass = (isVoted: boolean) => {
	return isVoted
	  ? 'text-blue-600 bg-blue-50'
	  : 'text-gray-500 hover:bg-gray-100';
  };

	
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
		navigator.clipboard.writeText(postUrl)
			.then(() => {
				setShowCopied(true)
				setTimeout(() => setShowCopied(false), 1500)
			})
			.catch(err => {
				// fallback: show dialog with error
				setShareUrl(postUrl)
				setShareDialogOpen(true)
			})
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
			toast('Post reported', {
				description: 'Thank you for reporting. Our team will review this post.'
			});
		} catch (error) {
			console.error('Error submitting report:', error);
		}
	};

	// Modified login handling
	const handleLoginRequired = (message: string, redirectPath: string = "/") => {
		setLoginDialogMessage(message);
		setLoginRedirectPath(redirectPath);
		setShowLoginDialog(true);
	};

	useEffect(() => {
		function handleReady() {
			setMathLiveReady(true);
		}
		window.addEventListener('mathlive-ready', handleReady);
		return () => window.removeEventListener('mathlive-ready', handleReady);
	}, []);

	useLayoutEffect(() => {
		if (!mathLiveReady) return;
		function renderAllMath() {
			descRefs.current.forEach((descRef, i) => {
				if (descRef) {
					const mathNodes = descRef.querySelectorAll('span.math-inline[data-type="math"]');
					console.log('Preview', i, 'math nodes:', mathNodes.length);
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
			<div className="flex w-full px-8">
			<div className="w-full max-w-4xl mt-2">
				{loading ? (
					<>
						<PostSkeleton withImage={false} />
						<PostSkeleton withImage={false} />
						<PostSkeleton withImage={false} />
					</>
				) : posts.length === 0 ? (
				<p className='text-center text-muted-foreground text-sm font-medium'>
					No questions have been posted yet. Be the first to{' '}
					<Link href='/ask?from=home' className='underline text-[#11244DB2]'>
						ask a question
					</Link>
					!
				</p>
			) : (
					<div className="flex flex-col">
					{posts.map((post, index) => (
							<div 
								key={post.id}
								className="border-b border-black/20 last:border-b-0 group"
							>
						<Link
							href={`/post/${post.id}`}
									className={`block px-4 py-4 space-y-3 relative ${index === 0 ? 'pt-5' : ''}`}
								>
									{/* Hover effect overlay */}
									<div className="absolute inset-x-0 top-2 bottom-2 bg-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
									
									{/* Content wrapper */}
									<div className="relative z-10">
							{/* User Info */}
							<div className='flex items-center gap-x-3'>
								{communityAvatars[post.community] ? (
									<Image
										src={communityAvatars[post.community]}
										alt='Community Avatar'
										width={40}
										height={40}
										className='w-10 h-10 rounded-full object-cover bg-neutral-100'
									/>
								) : (
									<div className='w-10 h-10 rounded-full bg-neutral-100' />
								)}
								<div className="flex-1">
									<h1 className='font-semibold text-sm'>
										m/{post.community?.toLowerCase().replace(/\s/g, '_')}
									</h1>
									<div className='flex items-center gap-x-1 text-xs text-muted-foreground'>
										<span>{post.username || 'Unknown'}</span>
										<span className='mx-0.5'>•</span>
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
                      <button className="p-1.5 rounded-full hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="!bg-white border border-gray-200 rounded-md shadow-md">
                      {currentUser && post.userId === currentUser ? (
                        <DropdownMenuItem 
                          onClick={() => {
                            setDeletingPost(post.id);
                            setConfirmDeleteOpen(true);
                          }} 
                          className="cursor-pointer text-red-600 hover:bg-gray-100 focus:bg-transparent focus:outline-none"
                          variant="destructive"
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleReportPost(post.id)} 
                          className="cursor-pointer text-yellow-600 hover:bg-gray-100 focus:bg-transparent focus:outline-none"
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
							<div ref={(el) => {
								descRefs.current[index] = el;
							}} className='text-sm' dangerouslySetInnerHTML={{ __html: getPreviewHtml(post.description) }} />

							{/* Uploaded Image */}
							{post.imageURL && (
								<div className='w-full aspect-video bg-neutral-100 rounded-xl my-5'>
												<Image
										src={post.imageURL}
										alt='Uploaded image'
													width={800}
													height={400}
										className='w-full h-full object-cover rounded-xl'
									/>
								</div>
							)}

							{/* Buttons */}
							<div className='flex items-center gap-x-1 mt-4'>
							<button 
onClick={(e) => handleVote(e, post.id)}
disabled={!canVote || loadingVote === post.id}
className={`flex items-center px-3 py-1.5 rounded-full transition-all gap-x-2 
	${getVoteButtonClass(votedPosts[post.id])}
	${(!canVote || loadingVote === post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
>
<ArrowUp 
	className={`w-5 h-5 transform transition-transform ${votedPosts[post.id] ? 'scale-110' : ''}`} 
/>
<span className='font-medium text-sm'>{(post.upvotes || 0)}</span>
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
			)}

			{/* Share Dialog */}
			{showCopied && (
				<SimpleShareDialog open={showCopied} onClose={() => setShowCopied(false)} />
			)}

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
  )
}