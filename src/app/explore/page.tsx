'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface CommunityCardProps {
  name: string
  slug: string
  members: number
  description: string
}

const CommunityCard = ({ name, slug, members, description }: CommunityCardProps) => {
  const router = useRouter()

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/community/${slug}`)
  }

  return (
    <Link href={`/community/${slug}`} className="block group">
      <div className="p-6 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm relative transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-xs text-gray-500">{members} members</p>
            </div>
          </div>
          <Button 
            className="bg-[#11244DB3] hover:bg-[#11244D] text-white font-medium rounded-full px-4"
            onClick={handleJoin}
          >
            Join
          </Button>
        </div>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </Link>
  )
}

export default function ExplorePage() {
  const cambridgeCommunities = [
    {
      name: 'm/cie_checkpoint',
      slug: 'cie_checkpoint',
      members: 508,
      description: 'A space for students preparing for the Cambridge Checkpoint Math exam to ask questions, explore past papers, and collaborate with peers.'
    },
    {
      name: 'm/cie_igcse',
      slug: 'cie_igcse',
      members: 508,
      description: 'A space for students preparing for the Cambridge IGCSE Math exam to ask questions, explore past papers, and collaborate with peers.'
    },
    {
      name: 'm/cie_aslevel',
      slug: 'cie_aslevel',
      members: 508,
      description: 'A space for students preparing for the Cambridge AS Level Pure Math exam to ask questions, explore past papers, and collaborate with peers.'
    },
    {
      name: 'm/cie_a2level',
      slug: 'cie_a2level',
      members: 508,
      description: 'A space for students preparing for the Cambridge A2 Level Pure Math exam to ask questions, explore past papers, and collaborate with peers.'
    }
  ]

  return (
    <main className="container py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Explore Communities</h1>
      
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Cambridge Curriculum</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cambridgeCommunities.map((community) => (
            <CommunityCard 
              key={community.slug}
              name={community.name}
              slug={community.slug}
              members={community.members}
              description={community.description}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="py-3 px-6 bg-gray-100 rounded-full text-gray-600 text-sm font-medium">
          More coming soon!
        </div>
      </div>
    </main>
  )
} 