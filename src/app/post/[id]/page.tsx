'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	ArrowLeftCircleIcon,
	ArrowUp,
	MessageCircle,
	Share2,
	Send,
	Reply,
	X,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog"
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, increment, query, orderBy, where, serverTimestamp } from 'firebase/firestore'
import { useParams, useRouter as useNextRouter } from 'next/navigation'
import { useRouter } from 'next/router'
import { getFirebaseErrorMessage, safeFetchWithFallback } from '@/lib/firebase-utils'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'
import LoginRequired from '@/components/LoginRequired'
import LoginPopup from '@/components/LoginPopup'
import SimpleShareDialog from '@/components/SimpleShareDialog'

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

interface Comment {
	id: string;
	text: string;
	userId: string;
	username: string;
	avatar?: string;
	createdAt: any;
	upvotes: number;
	parentId?: string;
}

interface Post {
	id: string;
	title: string;
	description: string;
	userId: string;
	username: string;
	community: string;
	avatar?: string;
	imageURL?: string;
	createdAt: any;
	upvotes: number;
	commentsCount: number;
}

// MentionComponent - makes @ mentions undeletable and styled differently
const MentionTag: React.FC<{username: string}> = ({ username }) => {
	return (
		<span className="text-blue-600 font-medium inline-flex items-center bg-blue-50 rounded px-1 py-0.5 mr-1 whitespace-nowrap">
			@{username}
		</span>
	);
};

const Page = () => {
	const params = useParams();
	const router = useNextRouter();
	const postId = params.id as string;
	const commentInputRef = useRef<HTMLTextAreaElement>(null);
	const pillInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const votingInProgress = useRef<boolean>(false);
	
	const [loading, setLoading] = useState(true);
	const [post, setPost] = useState<Post | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [voted, setVoted] = useState(false);
	const [commentVotes, setCommentVotes] = useState<Record<string, boolean>>({});
	const [commentVotingInProgress, setCommentVotingInProgress] = useState<Record<string, boolean>>({});
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [shareUrl, setShareUrl] = useState('');
	const [newComment, setNewComment] = useState('');
	const [isExpanded, setIsExpanded] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [replySubmitting, setReplySubmitting] = useState(false);
	const [currentUser, setCurrentUser] = useState<{ id: string, username: string } | null>(null);
	const [error, setError] = useState('');
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
	const [replying, setReplying] = useState<{ 
		commentId: string | null, 
		username: string | null,
		replyId: string | null  // Add a replyId field to track which specific reply we're responding to
	}>({ 
		commentId: null, 
		username: null,
		replyId: null
	});
	const [replyText, setReplyText] = useState('');
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	const [showLoginPopup, setShowLoginPopup] = useState(false);
	const [loginDialogMessage, setLoginDialogMessage] = useState('You need to be logged in to comment.');
	const [loginRedirectPath, setLoginRedirectPath] = useState('/');
	
	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setCurrentUser({ id: user.uid, username: user.displayName || 'User' });
			} else {
				setCurrentUser(null);
			}
		});
		return () => unsubscribe();
	}, []);
	
	// Fetch post data and comments
	useEffect(() => {
		const fetchPostAndComments = async () => {
			try {
				// Get post data
				const postRef = doc(db, 'posts', postId);
				const postSnap = await getDoc(postRef);
				
				if (postSnap.exists()) {
					const postData = postSnap.data();
					
					// Get user data
					const userRef = doc(db, 'users', postData.userId);
					const userSnap = await getDoc(userRef);
					const userData = userSnap.exists() ? userSnap.data() : {};

					let finalUsername = postData.username;
					let finalAvatar = postData.avatar;

					if (postData.username === "Anonymous User") {
						finalUsername = "Anonymous User";
						finalAvatar = "/defaultprofile.png";
					} else {
						finalUsername = userData.username || 'Unknown';
						finalAvatar = userData.avatarUrl || '/defaultprofile.png';
					}
					
					setPost({
						id: postSnap.id,
						...postData,
						username: finalUsername,
						avatar: finalAvatar,
						upvotes: postData.upvotes || 0,
						commentsCount: postData.commentsCount || 0
					} as Post);
					
					// Check if we have local vote state
					if (localVotes[postId]) {
						setVoted(true);
					}
					
					// Use safe fetch with fallback for comments
					const getCommentsWithOrderBy = async () => {
						const commentsQuery = query(
							collection(db, 'comments'),
							where('postId', '==', postId),
							orderBy('createdAt', 'desc')
						);
						
						return await getDocs(commentsQuery);
					};
					
					const getCommentsWithoutOrderBy = async () => {
						const commentsQuery = query(
							collection(db, 'comments'),
							where('postId', '==', postId)
						);
						
						return await getDocs(commentsQuery);
					};
					
					// Try to fetch with ordering, fall back to simpler query if needed
					const commentsSnapshot = await safeFetchWithFallback(
						getCommentsWithOrderBy,
						getCommentsWithoutOrderBy
					);
					
					const commentsData = await Promise.all(
						commentsSnapshot.docs.map(async (commentDoc: any) => {
							const comment = commentDoc.data();
							const commentUserId = comment.userId;
							
							let commentUsername = comment.username;
							let commentAvatar = comment.avatar;

							if (comment.username === "Anonymous User") {
								commentUsername = "Anonymous User";
								commentAvatar = "/defaultprofile.png";
							} else {
								// Get comment user data
								const commentUserRef = doc(db, 'users', commentUserId);
								const commentUserSnap = await getDoc(commentUserRef);
								const commentUserData = commentUserSnap.exists() ? commentUserSnap.data() : {};
								
								commentUsername = commentUserData.username || 'Unknown';
								// Get profile picture from Firebase Auth if this is the current user
								let avatarUrl = commentUserData.avatarUrl || '/defaultprofile.png';
								if (auth.currentUser && auth.currentUser.uid === commentUserId) {
									avatarUrl = auth.currentUser.photoURL || commentUserData.avatarUrl || '/defaultprofile.png';
								}
								commentAvatar = avatarUrl;
							}
							
							return {
								id: commentDoc.id,
								...comment,
								username: commentUsername,
								avatar: commentAvatar,
								upvotes: comment.upvotes || 0,
								parentId: comment.parentId || null // Ensure parentId is explicitly null if not present
							} as Comment;
						})
					);
					
					// Apply any locally saved votes to comments
					commentsData.forEach(comment => {
						if (localVotes[comment.id]) {
							setCommentVotes(prev => ({
								...prev,
								[comment.id]: true
							}));
						}
					});
					
					// Sort comments by creation time after fetching (useful if we fell back to the non-ordered query)
					const sortedComments = [...commentsData].sort((a, b) => {
						const timeA = a.createdAt?.seconds || 0;
						const timeB = b.createdAt?.seconds || 0;
						return timeB - timeA; // Sort in descending order (newest first)
					});
					
					setComments(sortedComments);
				}
				
				setLoading(false);
			} catch (error) {
				console.error('Error fetching data:', error);
				setError(getFirebaseErrorMessage(error));
				setLoading(false);
			}
		};
		
		if (postId) {
			fetchPostAndComments();
		}
	}, [postId, localVotes]);
	
	// This function safely handles upvote state with Firestore
	const updateVoteInFirestore = async (
		collectionName: string, 
		docId: string, 
		isUpvoting: boolean,
		onSuccess: () => void,
		onError: () => void
	) => {
		setLoadingId(docId);
		
		try {
			// Update vote in Firestore
			const docRef = doc(db, collectionName, docId);
			await updateDoc(docRef, {
				upvotes: increment(isUpvoting ? 1 : -1)
			});
			
			// Call success callback
			onSuccess();
			
		} catch (error) {
			console.error(`Error updating ${collectionName} vote:`, error);
			// Call error callback
			onError();
		} finally {
			// Clear loading state
			setLoadingId(null);
		}
	};
	
	// Handle post vote
	const handleVote = async () => {
		if (!currentUser) {
			setLoginDialogMessage('You need to be logged in to upvote posts.');
			setShowLoginDialog(true);
			return;
		}
		if (!post || votingInProgress.current) return;
		
		// Set voting in progress immediately to prevent double clicks
		votingInProgress.current = true;
		setLoadingId(postId);
		
		// Get current vote state
		const newVoteState = !voted;
		
		// Optimistic UI update
		setVoted(newVoteState);
		
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
			
			// Success: we don't need to update upvotes here since UI displays it with voted state
		} catch (error) {
			console.error('Error updating vote:', error);
			
			// Error: revert UI state
			setVoted(!newVoteState);
			setLocalVotes(prev => ({
				...prev,
				[postId]: !newVoteState
			}));
		} finally {
			// Clear loading state
			setLoadingId(null);
			// Reset voting in progress flag with a small delay to prevent accidental double clicks
			setTimeout(() => {
				votingInProgress.current = false;
			}, 300);
		}
	};
	
	// Handle comment vote
	const handleCommentVote = async (commentId: string) => {
		if (votingInProgress.current) return;
		
		// Set voting in progress immediately to prevent double clicks
		votingInProgress.current = true;
		setLoadingId(commentId);
		
		// Get current vote state
		const currentVoted = commentVotes[commentId] || false;
		const newVoteState = !currentVoted;
		
		// Optimistic UI update
		setCommentVotes(prev => ({
			...prev,
			[commentId]: newVoteState
		}));
		
		// Remember local vote state for this session
		setLocalVotes(prev => ({
			...prev,
			[commentId]: newVoteState
		}));
		
		try {
			// Update in Firebase
			const commentRef = doc(db, 'comments', commentId);
			await updateDoc(commentRef, {
				upvotes: increment(newVoteState ? 1 : -1)
			});
			
			// Success: we don't need to update upvotes here since UI displays it with voted state
		} catch (error) {
			console.error('Error updating comment vote:', error);
			
			// Error: revert UI state
			setCommentVotes(prev => ({
				...prev,
				[commentId]: currentVoted
			}));
			setLocalVotes(prev => ({
				...prev,
				[commentId]: currentVoted
			}));
		} finally {
			// Clear loading state
			setLoadingId(null);
			// Reset voting in progress flag with a small delay to prevent accidental double clicks
			setTimeout(() => {
				votingInProgress.current = false;
			}, 300);
		}
	};
	
	const handleShare = () => {
		// Create the full URL to share
		const postUrl = window.location.href;
		setShareUrl(postUrl);
		setShareDialogOpen(true);
	};
	
	const copyToClipboard = () => {
		navigator.clipboard.writeText(shareUrl)
			.then(() => {
				// Don't auto-close the dialog
			});
	};
	
	const handleInputFocus = () => {
		setIsExpanded(true);
	};

	const handleInputBlur = (e: React.FocusEvent) => {
		// Only collapse if it's empty and the related target is not within the comment container
		// This prevents collapse when clicking the submit button
		if (!newComment.trim() && !e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsExpanded(false);
		}
	};
	
	const handleCancel = () => {
		setIsExpanded(false);
		setNewComment('');
	};
	
	// Modified handleReplyClick to remove the @ from the text
	const handleReplyClick = (commentId: string, username: string, replyId?: string) => {
		if (!currentUser) {
			setLoginDialogMessage('You need to be logged in to reply.');
			setShowLoginDialog(true);
			return;
		}
		// Store the parent comment ID and username
		setReplying({ 
			commentId, 
			username,
			replyId: replyId || null
		});
		
		// Let text area render before focusing
		setTimeout(() => {
			const selector = replyId 
				? `[data-reply-to="${commentId}"][data-reply-id="${replyId}"]`
				: `[data-reply-to="${commentId}"]:not([data-reply-id])`;
				
			const replyBoxes = document.querySelectorAll(selector);
			if (replyBoxes.length > 0) {
				const textarea = replyBoxes[0].querySelector('textarea');
				if (textarea) {
					textarea.focus();
				}
			}
		}, 100);
	};

	// Cancel reply
	const handleCancelReply = () => {
		setReplyText('');
		setReplying({ commentId: null, username: null, replyId: null });
	};

	// Submit a comment or reply
	const submitComment = async () => {
		if (!currentUser) {
			toast('You must be signed in to comment.');
			return;
		}
		
		let text = replyText || newComment;
		const isReply = replying.commentId !== null;
		
		// Add the username to the beginning of the text for replies
		if (isReply && replying.username) {
			text = `@${replying.username} ${text}`;
		}
		
		if (!text.trim() || (replyText && replySubmitting) || (!replyText && submitting)) return;
		
		if (isReply) {
			setReplySubmitting(true);
		} else {
			setSubmitting(true);
		}
		
		setError('');
		
		try {
			// Check if this is a reply (has a parent comment ID)
			
			// Add comment to Firebase
			const commentData = {
				postId,
				text: text.trim(),
				userId: currentUser.id,
				createdAt: serverTimestamp(),
				upvotes: 0,
				// Only include parentId if this is a reply
				...(isReply && { parentId: replying.commentId })
			};
			
			await addDoc(collection(db, 'comments'), commentData);
			
			// Update comment count on post
			const postRef = doc(db, 'posts', postId);
			await updateDoc(postRef, {
				commentsCount: increment(1)
			});
			
			// Add to local state
			const newCommentObj: Comment = {
				id: Date.now().toString(), // Temporary ID until reload
				...commentData,
				username: currentUser.username,
				avatar: auth.currentUser?.photoURL || "", // Include current user's avatar
				createdAt: { seconds: Math.floor(Date.now() / 1000) }, // Temporary timestamp
				parentId: isReply && replying.commentId ? replying.commentId : undefined
			};
			
			setComments(prev => [newCommentObj, ...prev]);
			setNewComment('');
			setReplyText('');
			setReplying({ commentId: null, username: null, replyId: null });
			
			// Update post comment count in local state
			setPost(prev => {
				if (!prev) return null;
				return {
					...prev,
					commentsCount: prev.commentsCount + 1
				};
			});
			
		} catch (error) {
			console.error('Error adding comment:', error);
			setError(getFirebaseErrorMessage(error));
		} finally {
			if (isReply) {
				setReplySubmitting(false);
			} else {
				setSubmitting(false);
			}
		}
	};

	// Get replies for a comment
	const getRepliesForComment = (commentId: string) => {
		const replies = comments.filter(comment => comment.parentId === commentId);
		// Sort replies chronologically (oldest first)
		return replies.sort((a, b) => {
			const timeA = a.createdAt?.seconds || 0;
			const timeB = b.createdAt?.seconds || 0;
			return timeA - timeB; // Sort in ascending order (oldest first)
		});
	};

	if (loading) {
		return (
			<div className='flex w-full pl-8'>
				<div className='w-full max-w-3xl px-4'>
					<div className='space-y-6 pt-6'>
						<Link href='/' className="flex items-center gap-x-2 text-gray-600 hover:text-gray-900 my-2">
							<ArrowLeftCircleIcon />
							<span>Back to Home</span>
						</Link>
						
						<div className='flex flex-col gap-6 px-6 py-6'>
							<div className='h-10 w-full max-w-md bg-neutral-100 animate-pulse rounded-md'></div>
							<div className='h-40 w-full bg-neutral-100 animate-pulse rounded-md'></div>
							<div className='h-20 w-full bg-neutral-100 animate-pulse rounded-md'></div>
							<div className='h-6 w-40 bg-neutral-100 animate-pulse rounded-full'></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className='flex w-full pl-8'>
				<div className='w-full max-w-3xl px-4'>
					<div className='space-y-6 pt-6'>
						<Link href='/' className="flex items-center gap-x-2 text-gray-600 hover:text-gray-900 my-2">
							<ArrowLeftCircleIcon />
							<span>Back to Home</span>
						</Link>
						<div className='flex flex-col items-center justify-center py-8 gap-4'>
							<p className='text-red-500 font-medium'>Error loading post</p>
							<p className='text-gray-500 text-sm'>{error}</p>
							{error.includes('permission') && (
								<p className='text-sm text-gray-600 max-w-md text-center'>
									It looks like you don't have permission to access this content. You may need to sign in or contact an administrator.
								</p>
							)}
							<Button 
								variant="outline" 
								onClick={() => window.location.reload()}
								className="mt-2"
							>
								Try Again
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='flex w-full pl-8'>
			<div className='w-full max-w-3xl px-4'>
				<div className='space-y-6 pt-6'>
					<button 
						onClick={() => router.back()} 
						className="flex items-center gap-x-2 text-gray-600 hover:text-gray-900 my-2 bg-transparent border-0"
					>
						<ArrowLeftCircleIcon />
						<span>Back</span>
					</button>
					<div className='space-y-5'>
						<div className='space-y-3'>
							<div className='flex items-center gap-x-3'>
								{post.avatar ? (
									<img
										src={post.avatar}
										alt='Avatar'
										className='w-10 h-10 rounded-full object-cover bg-neutral-100'
									/>
								) : (
									<div className='w-10 h-10 bg-neutral-100 rounded-full' />
								)}
								<div>
									<h1 className='font-semibold text-sm'>
										m/{post.community?.toLowerCase().replace(/\s/g, '_')}
									</h1>
									<div className='flex items-center gap-x-1 text-xs text-muted-foreground'>
										<span>{post.username}</span>
										<span className='mx-0.5'>•</span>
										<span>
											{post.createdAt?.seconds
												? formatRelativeTime(post.createdAt.seconds * 1000)
												: 'Just now'}
										</span>
									</div>
								</div>
							</div>
							
							<h1 className='text-lg font-bold'>{post.title}</h1>
							<p className='text-sm'>{post.description}</p>
							
							{post.imageURL && (
								<div className='w-full aspect-video bg-neutral-100 rounded-xl my-5'>
									<img
										src={post.imageURL}
										alt='Uploaded image'
										className='w-full h-full object-cover rounded-xl'
									/>
								</div>
							)}
							
							{/* Interaction buttons */}
							<div className='flex items-center gap-x-1 my-5'>
								<button 
									onClick={handleVote}
									className={`flex items-center px-3 py-1.5 rounded-full transition-all gap-x-2 ${
										voted 
											? 'text-blue-600 bg-blue-50' 
											: 'text-gray-500 hover:bg-gray-100'
									}`}
								>
									<ArrowUp className={`w-5 h-5 transform transition-transform ${voted ? 'scale-110' : ''}`} />
									<span className='font-medium text-sm'>{post.upvotes + (voted ? 1 : 0)}</span>
								</button>
								
								<button 
									className='flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100'
									onClick={() => {
										if (!currentUser) {
											setLoginDialogMessage('You need to be logged in to comment on posts.');
											setShowLoginDialog(true);
											return;
										}
										
										setIsExpanded(true);
										// Use a small timeout to ensure the textarea is rendered before focusing
										setTimeout(() => {
											if (commentInputRef.current) {
												commentInputRef.current.focus();
											}
										}, 0);
									}}
								>
									<MessageCircle className='w-5 h-5' />
									<span className='text-sm'>{post.commentsCount}</span>
								</button>
								
								<button 
									onClick={handleShare}
									className='flex items-center gap-x-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100'
								>
									<Share2 className='w-5 h-5' />
									<span className='text-sm'>Share</span>
								</button>
							</div>
						</div>
						
						{/* Comments section */}
						<div className="space-y-6">
							{/* Comment Input Field - Only show if signed in */}
							{currentUser && (
								isExpanded ? (
									// Expanded state - rectangular with textarea and button
									<div className="rounded-xl border border-gray-200 bg-white py-3 px-4 flex flex-col space-y-2 mb-6">
										<Textarea
											ref={commentInputRef}
											placeholder="Add your thoughts..."
											className="flex-1 outline-none text-sm px-2 min-h-[40px] max-h-[120px] border-none shadow-none focus-visible:ring-0 resize-none"
											value={newComment}
											onChange={(e) => setNewComment(e.target.value)}
											autoFocus
										/>
										<div className="flex justify-end">
											<Button
												size='sm'
												variant="outline"
												className='rounded-full mr-2'
												onClick={() => {
													setNewComment('');
													setIsExpanded(false);
												}}>
												Cancel
											</Button>
											<Button
												size='sm'
												className='rounded-full bg-[#11244DB3] hover:bg-[#11244D] text-white px-6'
												onClick={submitComment}
												disabled={!newComment.trim() || submitting}>
												{submitting ? 'Posting...' : 'Comment'}
											</Button>
										</div>
									</div>
								) : (
									// Collapsed state - pill shaped input
									<div 
										className="rounded-full border border-gray-200 bg-white py-2 px-4 flex items-center mb-6 cursor-text"
										onClick={handleInputFocus}
									>
										<input
											ref={pillInputRef}
											placeholder="Add your thoughts..."
											className="flex-1 outline-none text-sm px-2 border-none shadow-none focus-visible:ring-0 bg-transparent"
											onFocus={handleInputFocus}
											readOnly
										/>
									</div>
								)
							)}

							{/* Comments and replies list */}
							{comments.length > 0 ? (
								<div className="flex flex-col space-y-6">
									{comments.filter(comment => !comment.parentId).map((comment) => (
										<div 
											key={comment.id} 
											className='space-y-4 border-b border-black/15 pb-4 last:border-b-0'
										>
											<div>
												<div className='flex items-center gap-x-3'>
													{comment.avatar ? (
														<img
															src={comment.avatar}
															alt='Avatar'
															className='w-10 h-10 rounded-full object-cover bg-neutral-100'
														/>
													) : (
														<div className='w-10 h-10 bg-neutral-100 rounded-full' />
													)}
													<div>
														<h1 className='font-semibold text-sm'>{comment.username}</h1>
														<div className='text-xs text-muted-foreground'>
															{comment.createdAt?.seconds
																? formatRelativeTime(comment.createdAt.seconds * 1000)
																: 'Just now'}
														</div>
													</div>
												</div>
												<div className='pl-12 space-y-1 mt-2'>
													<p className='text-sm'>
														{comment.text.split(' ').map((word, i) => {
															if (word.startsWith('@')) {
																const username = word.substring(1);
																return <React.Fragment key={i}>
																	<MentionTag username={username} />{' '}
																</React.Fragment>;
															}
															return word + ' ';
														})}
													</p>
													<div className="flex items-center gap-2 mt-2">
														<button
															onClick={() => handleCommentVote(comment.id)}
															className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-sm ${
																commentVotes[comment.id] ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
															}`}>
															<ArrowUp className={`w-4 h-4 ${commentVotes[comment.id] ? 'fill-blue-600' : ''}`} /> 
															<span>{comment.upvotes + (commentVotes[comment.id] ? 1 : 0)}</span>
														</button>
														
														<button
															onClick={() => handleReplyClick(comment.id, comment.username)}
															className="inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-sm text-[#11244DB3] hover:bg-gray-100"
														>
															<Reply className="w-4 h-4" />
															<span>Reply</span>
														</button>
													</div>
													
													{/* Inline reply box */}
													{replying.commentId === comment.id && !replying.replyId && (
														<div className='mt-4 space-y-3' data-reply-to={comment.id}>
															<div className="relative bg-white border border-gray-200 rounded-xl p-4">
																<div className="text-xs font-medium mb-2">
																	Replying to <MentionTag username={replying.username || ""} />
																</div>
																<Textarea
																	placeholder="Write your reply..."
																	className="border-none shadow-none focus-visible:ring-0 px-0 py-0 resize-y min-h-[40px] max-h-[100px]"
																	value={replyText}
																	onChange={(e) => setReplyText(e.target.value)}
																/>
																<div className="flex justify-end gap-2 mt-2">
																	<Button
																		size="sm"
																		variant="outline"
																		className="rounded-full"
																		onClick={handleCancelReply}
																	>
																		Cancel
																	</Button>
																	<Button
																		size="sm"
																		className="rounded-full bg-[#11244DB3] hover:bg-[#11244D]"
																		onClick={submitComment}
																		disabled={!replyText.trim() || replySubmitting}
																	>
																		{replySubmitting ? "Posting..." : "Reply"}
																	</Button>
																</div>
															</div>
														</div>
													)}
												</div>
											</div>
											
											{/* Replies to this comment */}
											{getRepliesForComment(comment.id).length > 0 && (
												<div className="pl-12 space-y-4">
													{getRepliesForComment(comment.id).map(reply => (
														<div key={reply.id} className="border-l-2 border-gray-200 pl-4">
															<div className='flex items-center gap-x-2'>
																{reply.avatar ? (
																	<img
																		src={reply.avatar}
																		alt='Avatar'
																		className='w-6 h-6 rounded-full object-cover bg-neutral-100'
																	/>
																) : (
																	<div className='w-6 h-6 bg-neutral-100 rounded-full' />
																)}
																<div>
																	<h1 className='font-medium text-xs'>{reply.username}</h1>
																	<div className='text-xs text-muted-foreground'>
																		{reply.createdAt?.seconds
																			? formatRelativeTime(reply.createdAt.seconds * 1000)
																			: 'Just now'}
																	</div>
																</div>
															</div>
															<div className='ml-8 mt-1'>
																<p className='text-sm'>
																	{reply.text.split(' ').map((word, i) => {
																		if (word.startsWith('@')) {
																			const username = word.substring(1);
																			return <React.Fragment key={i}>
																				<MentionTag username={username} />{' '}
																			</React.Fragment>;
																		}
																		return word + ' ';
																	})}
																</p>
																<div className="flex items-center gap-2 mt-1">
																	<button
																		onClick={() => handleCommentVote(reply.id)}
																		className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs ${
																			commentVotes[reply.id] ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
																		}`}>
																		<ArrowUp className={`w-3 h-3 ${commentVotes[reply.id] ? 'fill-blue-600' : ''}`} /> 
																		<span>{reply.upvotes + (commentVotes[reply.id] ? 1 : 0)}</span>
																	</button>
																	
																	<button
																		onClick={() => handleReplyClick(comment.id, reply.username, reply.id)}
																		className="inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs text-[#11244DB3] hover:bg-gray-100"
																	>
																		<Reply className="w-3 h-3" />
																		<span>Reply</span>
																	</button>
																</div>
																
																{/* Inline reply to a reply */}
																{replying.commentId === comment.id && replying.replyId === reply.id && (
																	<div className='mt-3 space-y-3' data-reply-to={comment.id} data-reply-id={reply.id}>
																		<div className="relative bg-white border border-gray-200 rounded-xl p-3">
																			<div className="text-xs font-medium mb-2">
																				Replying to <MentionTag username={replying.username || ""} />
																			</div>
																			<Textarea
																				placeholder="Write your reply..."
																				className="border-none shadow-none focus-visible:ring-0 px-0 py-0 resize-y min-h-[40px] max-h-[100px]"
																				value={replyText}
																				onChange={(e) => setReplyText(e.target.value)}
																			/>
																			<div className="flex justify-end gap-2 mt-2">
																				<Button
																					size="sm"
																					variant="outline"
																					className="rounded-full"
																					onClick={handleCancelReply}
																				>
																					Cancel
																				</Button>
																				<Button
																					size="sm"
																					className="rounded-full bg-[#11244DB3] hover:bg-[#11244D]"
																					onClick={submitComment}
																					disabled={!replyText.trim() || replySubmitting}
																				>
																					{replySubmitting ? "Posting..." : "Reply"}
																				</Button>
																			</div>
																		</div>
																	</div>
																)}
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							) : null}
						</div>
					</div>
				</div>
				
				{/* Improved Share Dialog */}
				<SimpleShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} />

				{/* Login Required Dialog */}
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
				<LoginPopup 
					isOpen={showLoginPopup} 
					onClose={() => setShowLoginPopup(false)} 
					redirectTo={loginRedirectPath}
				/>
			</div>
		</div>
	);
}

export default Page;