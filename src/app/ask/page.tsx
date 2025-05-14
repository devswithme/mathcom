"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ImagePlus, Info, Loader2, Trash } from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuid } from 'uuid';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import LatexEditor from '@/components/LatexEditor';
import TipTapEditor from '@/components/TipTapEditor';

const communityOptions = [
  { label: 'm/cie_checkpoint', value: 'cie_checkpoint' },
  { label: 'm/cie_igcse', value: 'cie_igcse' },
  { label: 'm/cie_alevel', value: 'cie_alevel' },
];

// Add a mapping for community avatars
const communityAvatars: Record<string, string> = {
  general_math: '/community_avatars/general_math.png',
  cie_checkpoint: '/community_avatars/cie_checkpoint.png',
  cie_igcse: '/community_avatars/cie_igcse.png',
  cie_alevel: '/community_avatars/cie_alevel.png',
};

// Helper: Convert TipTap HTML to plain text with $...$ for math
function tiptapHtmlToTextWithMath(html: string): string {
  if (typeof window === 'undefined' || !html) return html;
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let result = '';
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.getAttribute('data-type') === 'math' && el.hasAttribute('data-latex')) {
        const latex = el.getAttribute('data-latex');
        result += ` $${latex}$ `;
      } else {
        for (const child of Array.from(el.childNodes)) {
          walk(child);
        }
        if ([
          'P', 'DIV', 'BR', 'LI', 'UL', 'OL', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'HR', 'TABLE', 'TR', 'TD', 'TH', 'HEADER', 'FOOTER', 'MAIN'
        ].includes(el.tagName)) {
          result += '\n';
        }
      }
    }
  }
  walk(doc.body);
  return result.replace(/\n{2,}/g, '\n').replace(/ +/g, ' ').replace(/\s+\n/g, '\n').trim();
}

export default function AskPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get the community from URL query parameter or default to "cie_checkpoint"
  const communityFromURL = searchParams.get('community');
  const defaultCommunity = communityOptions.find(
    option => option.value === communityFromURL
  ) || communityOptions[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(defaultCommunity.value);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mathLiveReady, setMathLiveReady] = useState(
    typeof window !== 'undefined' && !!window.MathLive && !!customElements.get('math-field')
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        // Redirect to login if user is not authenticated
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Set viewport height for mobile browsers
  useEffect(() => {
    // Fix for mobile browsers
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

// Make sure we mark MathLive as ready even if the event fired
// before this component mounted (e.g., navigating from Home → Ask)
useEffect(() => {
  const isReadyNow = () =>
    typeof window !== 'undefined' &&
    !!window.MathLive &&
    !!customElements.get('math-field');

  // If MathLive is available already, update state immediately
  if (isReadyNow()) {
    setMathLiveReady(true);
    return;
  }

  // Otherwise, wait for the ready event
  const handleReady = () => setMathLiveReady(true);

  window.addEventListener('mathlive-ready', handleReady);
  return () => window.removeEventListener('mathlive-ready', handleReady);
}, []);

  const handlePost = async () => {
    if (!title.trim()) {
      toast(
        <div>
          <p className="font-semibold text-red-600">Missing Title</p>
          <p className="text-sm text-muted-foreground">
            Please provide a title for your question.
          </p>
        </div>,
        {
          duration: 3000,
        }
      );
      return;
    }
    if (title.length > 200) {
      toast(
        <div>
          <p className="font-semibold text-red-600">Title Too Long</p>
          <p className="text-sm text-muted-foreground">
            Title must be 200 characters or fewer.
          </p>
        </div>,
        {
          duration: 3000,
        }
      );
      return;
    }
    if (description.length > 2000) {
      toast(
        <div>
          <p className="font-semibold text-red-600">Description Too Long</p>
          <p className="text-sm text-muted-foreground">
            Description must be 2000 characters or fewer.
          </p>
        </div>,
        {
          duration: 3000,
        }
      );
      return;
    }

    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    setIsPosting(true);

    try {
      // Get user info
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Prepare post data
      const postData: any = {
        title,
        description: tiptapHtmlToTextWithMath(description),
        community: selectedCommunity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
        anonymous: postAnonymously,
      };

      // Only include user data if not anonymous
      if (!postAnonymously) {
        postData.userId = user.uid;
        postData.userName = userData?.displayName || user.displayName || 'User';
        postData.userPhotoURL = userData?.photoURL || user.photoURL || '/defaultprofile.png';
      } else {
        postData.userId = user.uid; // Still store the real user ID for moderation purposes
        postData.userName = 'Anonymous User';
        postData.userPhotoURL = '/defaultprofile.png';
      }

      // Image upload functionality removed

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Success notification
      toast(
        <div>
          <p className="font-semibold">Post Created</p>
          <p className="text-sm text-muted-foreground">
            Your question has been posted successfully.
          </p>
        </div>,
        {
          duration: 3000,
        }
      );

      // Redirect to home page or the post
      router.push('/');
    } catch (error) {
      console.error('Error creating post:', error);
      toast(
        <div>
          <p className="font-semibold text-red-600">Error</p>
          <p className="text-sm text-muted-foreground">
            There was an error creating your post. Please try again.
          </p>
        </div>,
        {
          duration: 3000,
        }
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Formatting handlers no longer needed with Quill

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Ask a question</h1>

        {/* Community selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-x-2 mt-5 border border-gray-400 rounded-full pl-2 pr-4 py-1.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <Image 
                  src={communityAvatars[selectedCommunity] || '/defaultprofile.png'}
                  alt={selectedCommunity}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium">m/{selectedCommunity}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white border border-gray-200 rounded-md shadow-md">
            {communityOptions.map((c) => (
              <DropdownMenuItem
                key={c.value}
                onClick={() => setSelectedCommunity(c.value)}
                className="flex items-center gap-x-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <Image 
                    src={communityAvatars[c.value] || '/defaultprofile.png'}
                    alt={c.value}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-medium">
                  {c.label}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main content area */}
        <div className="max-w-4xl ml-0 mt-8 space-y-6 pr-40 xl:pr-0">
          {/* Title input */}
          <div className="border border-gray-400 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2">
              Title<span className="text-red-600">*</span>
            </label>
            <Input
              placeholder="How do I solve x equations?"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              className="border-none shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground placeholder:italic"
              maxLength={200}
            />
          </div>

          {/* Description with TipTap editor */}
          <div className="border border-gray-400 rounded-lg mb-6">
            <div className="p-4 pb-0">
              <label className="block text-sm font-medium">Description</label>
            </div>
            {mathLiveReady ? (
              <TipTapEditor
                value={description}
                onChange={(val: string) => setDescription(val)}
                placeholder="Provide more details about your question"
                className="min-h-[200px]"
              />
            ) : (
              <div className="p-4 text-gray-400">Loading math editor... (Editor: Yes, MathLive: No)</div>
            )}
          </div>
          
          {/* Image upload removed */}

          {/* Buttons and checkbox */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[24px] flex items-center">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-x-2 text-sm cursor-pointer group">
                      <Checkbox
                        id="anonymous"
                        checked={postAnonymously}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          setPostAnonymously(Boolean(checked))
                        }
                      />
                      <span className="flex items-center">
                        Post Anonymously
                        {postAnonymously && (
                          <span className="ml-2 text-xs bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                            as Anonymous User
                          </span>
                        )}
                      </span>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs p-3 text-sm">
                    You&apos;ll appear as &quot;Anonymous User&quot; to others.
                    Your real name and profile picture will be hidden.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-x-3 sm:ml-auto">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                onClick={handlePost}
                disabled={isPosting}
              >
                {isPosting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                {isPosting ? "Posting..." : "Post"}
              </Button>

              <Button
                type="button"
                size="lg"
                className="bg-[#7F0000] hover:bg-[#6a0000] text-white rounded-full !font-bold"
                style={{ zIndex: 9999, position: 'relative' }}
                onClick={() => {
                  // Convert TipTap HTML to plain text with $...$ for math
                  const html = description;
                  let text = html;
                  if (typeof window !== 'undefined') {
                    text = tiptapHtmlToTextWithMath(html);
                  }
                  // Debug log
                  console.log('Storing to sessionStorage:', { title, text, selectedCommunity, postAnonymously });
                  sessionStorage.setItem('ai_question_title', title);
                  sessionStorage.setItem('ai_question_description', text);
                  sessionStorage.setItem('ai_question_community', selectedCommunity);
                  sessionStorage.setItem('ai_question_anonymous', JSON.stringify(postAnonymously));
                  sessionStorage.setItem('fromAsk', 'true');
                  router.push('/chat');
                }}
              >
                Ask AI
              </Button>

              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex items-center justify-center">
                      <Info className="w-5 h-5 cursor-pointer text-gray-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-xs p-4 text-base bg-neutral-100 text-black rounded-lg shadow border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Info className="w-6 h-6 text-[#11244D]/70 mr-3" />
                      <span className="font-semibold text-[#11244D] text-lg">About MathCom AI</span>
                    </div>
                    <div className="text-[#11244D]/80 text-base space-y-2">
                      <p>An AI tutor designed to guide you—not just give answers.</p>
                      <p>Still in beta, so remember to double-check responses.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Login Alert Dialog */}
        <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Login Required</AlertDialogTitle>
              <AlertDialogDescription>
                You must be logged in to post a question.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowLoginAlert(false)}>
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Modal removed */}
        </div>
      </div>
    </>
  );
}
