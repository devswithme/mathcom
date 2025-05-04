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
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, increment, query, orderBy, where, serverTimestamp } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import { getFirebaseErrorMessage, safeFetchWithFallback } from '@/lib/firebase-utils'

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

const Page = () => {
	const params = useParams();
	const postId = params.id as string;
	const commentInputRef = useRef<HTMLInputElement>(null);
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
	const [currentUser, setCurrentUser] = useState({ id: 'user123', username: 'Current User' }); // Mock user for demo
	const [error, setError] = useState('');
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
	const [replying, setReplying] = useState<{ commentId: string | null, username: string | null }>({ 
		commentId: null, 
		username: null 
	});
	const [replyText, setReplyText] = useState('');
	
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
					
					setPost({
						id: postSnap.id,
						...postData,
						username: userData.username || 'Unknown',
						avatar: userData.avatarUrl || '',
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
							orderBy('createdAt', 'asc')
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
							
							// Get comment user data
							const commentUserRef = doc(db, 'users', commentUserId);
							const commentUserSnap = await getDoc(commentUserRef);
							const commentUserData = commentUserSnap.exists() ? commentUserSnap.data() : {};
							
							return {
								id: commentDoc.id,
								...comment,
								username: commentUserData.username || 'Unknown',
								avatar: commentUserData.avatarUrl || '',
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
						return timeA - timeB; // Sort in ascending order (oldest first)
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
				setTimeout(() => {
					setShareDialogOpen(false);
				}, 1500);
			});
	};
	
	const handleInputFocus = () => {
		setIsExpanded(true);
		
		// Focus the textarea after it's shown
		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus();
			}
		}, 100);
	};
	
	const handleCancel = () => {
		setIsExpanded(false);
		setNewComment('');
	};
	
	// Handle reply to comment
	const handleReplyClick = (commentId: string, username: string) => {
		// Set the reply text with the username and focus the comment input box
		setReplyText(`@${username} `);
		// Store the parent comment ID for when we submit
		setReplying({ 
			commentId, 
			username 
		});
		
		// Scroll to comment box
		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus();
				// Place cursor at the end of the text
				const length = textareaRef.current.value.length;
				textareaRef.current.setSelectionRange(length, length);
				textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	};

	// Cancel reply
	const handleCancelReply = () => {
		setReplyText('');
		setReplying({ commentId: null, username: null });
	};

	// Submit a comment or reply
	const submitComment = async () => {
		const text = replyText || newComment;
		if (!text.trim() || !post || submitting) return;
		
		setSubmitting(true);
		setError('');
		
		try {
			// Check if this is a reply (has a parent comment ID)
			const isReply = replying.commentId !== null;
			
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
				createdAt: { seconds: Math.floor(Date.now() / 1000) }, // Temporary timestamp
				parentId: isReply && replying.commentId ? replying.commentId : undefined
			};
			
			setComments(prev => [...prev, newCommentObj]);
			setNewComment('');
			setReplyText('');
			setReplying({ commentId: null, username: null });
			
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
			setSubmitting(false);
		}
	};

	// Get replies for a comment
	const getRepliesForComment = (commentId: string) => {
		const replies = comments.filter(comment => comment.parentId === commentId);
		return replies;
	};

	if (loading) {
		return (
			<div className='flex flex-col space-y-6 pt-6 px-4'>
				<Link href='/' className="flex items-center gap-x-2 text-gray-600 hover:text-gray-900 my-2">
					<ArrowLeftCircleIcon />
					<span>Back to Home</span>
				</Link>
				<div className='flex justify-center py-8'>
					<p className='text-gray-500'>Loading post...</p>
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className='flex flex-col space-y-6 pt-6 px-4'>
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
		);
	}

	return (
		<div className='flex flex-col space-y-6 pt-6 px-4'>
			<Link href='/' className="flex items-center gap-x-2 text-gray-600 hover:text-gray-900 my-2">
				<ArrowLeftCircleIcon />
				<span>Back to Home</span>
			</Link>
			<div className='space-y-5'>
				<div className='px-6 py-6 max-w-3xl space-y-3'>
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
								if (commentInputRef.current) commentInputRef.current.focus();
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
				<div className='px-6 py-4 max-w-3xl space-y-6'>
					{/* Comment Input Field - Moved to top of comments section */}
					<div className='rounded-full bg-white border border-gray-200 py-2 px-4 flex items-center space-x-2 mb-6'>
						<input
							ref={commentInputRef}
							placeholder="Join the conversation"
							className="flex-1 outline-none text-sm px-2"
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
						/>
						<Button
							size='sm'
							className='rounded-full bg-[#11244DB3] hover:bg-[#11244D] text-white px-6'
							onClick={submitComment}
							disabled={!newComment.trim() || submitting}>
							{submitting ? 'Posting...' : 'Comment'}
						</Button>
					</div>

					{/* Comments and replies list */}
					{comments.length > 0 ? (
						<div className="flex flex-col space-y-6">
							{comments.filter(comment => !comment.parentId).map((comment) => (
								<div 
									key={comment.id} 
									className='space-y-4 border-b border-neutral-200/30 pb-4 last:border-b-0'
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
											<p className='text-sm'>{comment.text}</p>
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
														<p className='text-sm'>{reply.text}</p>
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
																onClick={() => handleReplyClick(comment.id, reply.username)}
																className="inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs text-[#11244DB3] hover:bg-gray-100"
															>
																<Reply className="w-3 h-3" />
																<span>Reply</span>
															</button>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					) : null}
					
					{/* Reply input - Only shown when replying */}
					{replyText && (
						<div className='bg-white space-y-3 pt-4 border-t border-gray-100 mt-4'>
							<div className="relative">
								<div className="absolute top-3 left-4 flex items-center text-sm text-blue-600 font-medium">
									Replying to {replying.username}:
								</div>
								<Textarea
									ref={textareaRef}
									placeholder="Write your reply..."
									className="border border-gray-200 focus:border-gray-300 shadow-none focus-visible:ring-0 rounded-md pt-10 pb-4 px-4"
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
								/>
							</div>
							{error && (
								<div className="px-4 text-sm text-red-500">
									{error}
								</div>
							)}
							<div className='flex justify-end items-center px-4'>
								<div className='flex gap-x-2'>
									<Button
										size='sm'
										variant='outline'
										className='rounded-full'
										onClick={handleCancelReply}>
										Cancel Reply
									</Button>
									<Button
										size='sm'
										variant='default'
										className='rounded-full bg-[#11244DB3] hover:bg-[#11244D] text-white'
										onClick={submitComment}
										disabled={!replyText.trim() || submitting}>
										{submitting ? 'Posting...' : 'Reply'}
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Page;