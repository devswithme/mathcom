'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, MessageCircle, Share2 } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore'


export default function Home() {
	const [posts, setPosts] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchPosts = async () => {
			const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
			const snapshot = await getDocs(q)
	
			const fetched = await Promise.all(
				snapshot.docs.map(async (docSnap) => {
					const postData = docSnap.data()
					const userRef = doc(db, 'users', postData.userId)
					const userSnap = await getDoc(userRef)
					const userData = userSnap.exists() ? userSnap.data() : {}
	
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
	}, [])

	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5'>
			{loading ? (
				<p className='text-sm text-muted-foreground'>Loading posts...</p>
			) : posts.length === 0 ? (
				<p className='text-center text-muted-foreground text-sm font-medium'>
					No questions have been posted yet. Be the first to{' '}
					<Link href='/ask' className='underline text-[#11244DB2]'>
						ask a question
					</Link>
					!
				</p>
			) : (
				posts.map((post) => (
					<Link
						href={`/post/${post.id}`}
						key={post.id}
						className='bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border'>
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
							<div className='-space-y-1'>
								<h1 className='font-semibold'>
									m/{post.community?.toLowerCase().replace(/\s/g, '_')}
								</h1>
								<span className='text-xs text-muted-foreground'>
									{post.username || 'Unknown'} &bull;{' '}
									{post.createdAt?.seconds
										? new Date(post.createdAt.seconds * 1000).toLocaleString()
										: 'Just now'}
								</span>
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
						<div className='flex gap-x-4'>
							<Button variant='secondary' size='sm'>
								<ArrowUp /> {post.upvotes || 0}
							</Button>
							<Button variant='secondary' size='sm'>
								<MessageCircle /> {post.commentsCount || 0}
							</Button>
							<Button variant='secondary' size='sm'>
								<Share2 /> Share
							</Button>
						</div>
					</Link>
				))
			)}
		</main>
	)
}
