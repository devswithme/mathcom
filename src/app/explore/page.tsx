'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface CommunityCardProps {
  name: string
  slug: string
  members: number
  description: string
  loading: boolean
  isUserMember: boolean
}

const CommunityCard = ({ name, slug, members, description, loading, isUserMember }: CommunityCardProps) => {
  const router = useRouter()

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/community/${slug}`)
  }

  return (
    <Link href={`/community/${slug}`} className="block group">
      <div className="p-6 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm relative transition-colors">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-x-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{name}</h3>
              <p className="text-xs text-gray-500">
                {loading ? (
                  <span className="inline-block w-8 h-3 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  `${members} members`
                )}
              </p>
            </div>
          </div>
          {!isUserMember && (
            <Button 
              className="bg-[#11244DB3] hover:bg-[#11244D] text-white font-medium rounded-full px-4 mt-2 md:mt-0"
              onClick={handleJoin}
            >
              Join
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </Link>
  )
}

export default function ExplorePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [curriculumRequest, setCurriculumRequest] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({
    cie_checkpoint: 0,
    cie_igcse: 0,
    cie_alevel: 0
  })
  const [loading, setLoading] = useState(true)
  const [userCommunities, setUserCommunities] = useState<string[]>([])

  // Check user auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch member counts from Firebase
  useEffect(() => {
    const fetchMemberCounts = async () => {
      const counts = { ...memberCounts }
      
      try {
        for (const community of Object.keys(counts)) {
          const q = query(
            collection(db, 'users'),
            where('communities', 'array-contains', community)
          )
          
          const snapshot = await getDocs(q)
          counts[community] = snapshot.size
        }
        
        setMemberCounts(counts)
      } catch (error) {
        console.error('Error fetching member counts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMemberCounts()
  }, [])

  // Get user's joined communities
  useEffect(() => {
    if (!currentUser) {
      setUserCommunities([])
      return
    }

    const fetchUserCommunities = async () => {
      try {
        // Get user document directly by ID (the user's UID is the document ID)
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          setUserCommunities(userData.communities || [])
          console.log('User communities:', userData.communities)
        } else {
          console.log('No user document found')
        }
      } catch (error) {
        console.error('Error fetching user communities:', error)
      }
    }

    fetchUserCommunities()
  }, [currentUser])

  const cambridgeCommunities = [
    {
      name: 'm/cie_checkpoint',
      slug: 'cie_checkpoint',
      description: 'A space for students preparing for the Cambridge Checkpoint Math exam to ask questions, explore past papers, and collaborate with peers.'
    },
    {
      name: 'm/cie_igcse',
      slug: 'cie_igcse',
      description: 'A space for students preparing for the Cambridge IGCSE Math exam to ask questions, explore past papers, and collaborate with peers.'
    },
    {
      name: 'm/cie_alevel',
      slug: 'cie_alevel',
      description: 'A space for students preparing for the Cambridge A Level (AS & A2) Math exam to ask questions, explore past papers, and collaborate with peers.'
    }
  ]

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (curriculumRequest.trim()) {
      // Here you would typically send this to a backend API
      console.log('Curriculum request:', curriculumRequest)
      setRequestSubmitted(true)
      setCurriculumRequest('')
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setRequestSubmitted(false)
        setDialogOpen(false)
      }, 2000)
    }
  }

  return (
    <div className="flex w-full px-8">
      <div className="w-full">
      <h1 className="text-3xl font-bold mb-8 mt-8">Explore Communities</h1>
      
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Cambridge Curriculum</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cambridgeCommunities.map((community) => (
            <CommunityCard 
              key={community.slug}
              name={community.name}
              slug={community.slug}
              members={loading ? 0 : memberCounts[community.slug]}
              description={community.description}
              loading={loading}
              isUserMember={userCommunities.includes(community.slug)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="w-full max-w-md flex justify-center">
          <button 
            onClick={() => setDialogOpen(true)}
            className="text-base font-medium text-[#11244D] hover:text-[#11244DB3] hover:underline cursor-pointer transition-colors"
          >
            Don't see your curriculum here?
          </button>
        </div>
      </div>

      {/* Curriculum Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md px-6 py-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl">Request a Curriculum</DialogTitle>
            <DialogDescription className="text-center">
              Let us know which curriculum you'd like to see on MathCom.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRequestSubmit} className="flex flex-col space-y-4">
            <Input
              type="text"
              value={curriculumRequest}
              onChange={(e) => setCurriculumRequest(e.target.value)}
              placeholder="Enter the curriculum name..."
              className="border border-gray-200 focus:ring-1 focus:ring-[#11244DB3]"
            />
            
            <div className="flex justify-end">
              {requestSubmitted ? (
                <p className="text-green-600 text-sm mr-auto">
                  Thanks for your request! We'll consider adding this curriculum.
                </p>
              ) : (
                <Button
                  type="submit"
                  disabled={!curriculumRequest.trim()}
                  className="bg-[#11244DB3] hover:bg-[#11244D] text-white rounded-full px-6"
                >
                  Submit Request
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
} 