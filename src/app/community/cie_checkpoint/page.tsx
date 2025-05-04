'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, MessageCircle, Share2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc, increment, where } from 'firebase/firestore'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

export default function CIECheckpointCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [votedPosts, setVotedPosts] = useState<Record<string, boolean>>({})
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
  
  const COMMUNITY_NAME = "CIE Checkpoint";

  useEffect(() => {
    const fetchPosts = async () => {
      // Query posts for this specific community
      const q = query(
        collection(db, 'posts'), 
        where('community', '==', COMMUNITY_NAME),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)

      const fetched = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const postData = docSnap.data()
          const userRef = doc(db, 'users', postData.userId)
          const userSnap = await getDoc(userRef)
          const userData = userSnap.exists() ? userSnap.data() : {}
          
          // Check for local vote state
          const postId = docSnap.id;
          if (localVotes[postId]) {
            setVotedPosts(prev => ({
              ...prev,
              [postId]: true
            }));
          }

          return {
            id: docSnap.id,
            ...postData,
            username: userData.username || 'Unknown',
            avatar: userData.avatarUrl || '',
          }
        })
      )

      setPosts(fetched)
      setLoading(false)
    }

    fetchPosts()
  }, [localVotes])

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
        setTimeout(() => {
          setShareDialogOpen(false)
        }, 1500)
      })
  }

  return (
    <main className='flex flex-col'>
      {/* Banner Area */}
      <div className="w-full aspect-[5/1] bg-gray-400 rounded-lg mb-6"></div>
      
      {/* Community Header */}
      <div className="pb-5">
        <div className="flex justify-between px-4">
          <div>
            <h1 className="text-3xl font-bold">m/cie_checkpoint</h1>
            <p className="text-sm text-muted-foreground mt-1">
              A space for Cambridge Checkpoint students to ask math questions, share tips, and support one another.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-4 mb-1">
              <Link href="/ask">
                <Button className="rounded-full font-medium bg-white text-black border border-gray-300 hover:bg-gray-100 flex items-center">
                  <Plus className="w-5 h-5 mr-1" />
                  ASK
                </Button>
              </Link>
              <Button className="rounded-full font-medium bg-[#11244DB3] hover:bg-[#11244D] text-white px-7">
                Join
              </Button>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">15.2k</div>
              <div className="text-sm text-muted-foreground">members</div>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <p className='text-sm text-muted-foreground'>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className='text-center text-muted-foreground text-sm font-medium'>
            No questions have been posted in this community yet. 
          </p>
          <Link href='/ask' className='mt-4'>
            <Button className="bg-[#11244DB3] hover:bg-[#11244D] rounded-full px-6">
              Ask a Question
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col pt-4 px-4">
          {posts.map((post, index) => (
            <Link
              href={`/post/${post.id}`}
              key={post.id}
              className={`px-6 py-6 max-w-3xl space-y-3 transition-all duration-200 hover:bg-neutral-50 hover:rounded-xl hover:shadow-sm border-b border-neutral-200/30 last:border-b-0 ${index === 0 ? 'pt-8' : ''}`}>
              {/* User Info */}
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
                    <span>{post.username || 'Unknown'}</span>
                    <span className='mx-0.5'>•</span>
                    <span>
                      {post.createdAt?.seconds
                        ? formatRelativeTime(post.createdAt.seconds * 1000)
                        : 'Just now'}
                    </span>
                  </div>
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
            </Link>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Post</DialogTitle>
            <DialogDescription className="text-center">
              Share this post with others by copying the link
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-md">
              <span className="text-sm text-gray-700 overflow-hidden text-ellipsis flex-1">{shareUrl}</span>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500">
              Link copied to clipboard!
            </p>
            <div className="flex justify-center">
              <Button 
                variant="default" 
                className="bg-[#11244DB3] hover:bg-[#11244D] rounded-full px-8" 
                onClick={() => setShareDialogOpen(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 