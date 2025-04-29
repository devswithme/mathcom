'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ImagePlus, Info } from 'lucide-react'
import { db, auth, storage } from '@/lib/firebase'
import {
	addDoc,
	collection,
	serverTimestamp,
	doc,
	getDoc
} from 'firebase/firestore'
import {
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { v4 as uuid } from 'uuid'

const communities = ['Checkpoint', 'IGCSE', 'A Level']

export default function AskPage() {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [selectedCommunity, setSelectedCommunity] = useState(communities[0])
	const [user, setUser] = useState<any>(null)
	const [imageFile, setImageFile] = useState<File | null>(null)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (u) => {
			if (u) setUser(u)
		})
		return () => unsubscribe()
	}, [])

	const handlePost = async () => {
		if (!title.trim()) return alert('Title is required')
		if (!user) return alert('You must be logged in to post')
	
		let imageURL = ''
	
		// Upload image
		if (imageFile) {
			const imageRef = ref(storage, `post_images/${uuid()}-${imageFile.name}`)
			const snapshot = await uploadBytes(imageRef, imageFile)
			imageURL = await getDownloadURL(snapshot.ref)
		}
	
		// Fetch user profile data from Firestore
		const userRef = doc(db, 'users', user.uid)
		const userSnap = await getDoc(userRef)
		const userData = userSnap.exists() ? userSnap.data() : {}
	
		// Submit post
		await addDoc(collection(db, 'posts'), {
			title,
			description,
			community: selectedCommunity,
			userId: user.uid,
			username: userData.username || 'Anonymous',
			avatar: userData.avatarUrl || '',
			imageURL,
			createdAt: serverTimestamp(),
			upvotes: 0,
			commentsCount: 0
		})
	
		setTitle('')
		setDescription('')
		setSelectedCommunity(communities[0])
		setImageFile(null)
		alert('Posted!')
	}
	

	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5'>
			<h1 className='text-2xl font-bold'>Ask a question</h1>

			{/* Community Dropdown */}
			<div className='bg-neutral-100 flex items-center gap-x-2 py-2 pl-2 pr-4 w-fit rounded-full relative'>
				<div className='w-8 h-8 bg-neutral-200 rounded-full' />
				<select
					value={selectedCommunity}
					onChange={(e) => setSelectedCommunity(e.target.value)}
					className='bg-neutral-100 text-sm font-bold focus:outline-none pr-6 cursor-pointer appearance-none'>
					{communities.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
				<ChevronDown className='w-4 h-4 absolute right-2 pointer-events-none text-muted-foreground' />
			</div>

			{/* Title */}
			<div className='max-w-2xl border border-black p-4 rounded-2xl'>
				<h1 className='text-sm font-medium'>
					Title<span className='text-red-600'>*</span>
				</h1>
				<Input
					className='border-none shadow-none focus-visible:ring-0 px-0'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
			</div>

			{/* Description + Upload */}
			<div className='max-w-2xl border border-black p-4 rounded-2xl flex gap-x-4 items-start'>
				<div className='w-full'>
					<h1 className='text-sm font-medium'>Description</h1>
					<Textarea
						className='border-none shadow-none focus-visible:ring-0 px-0'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className='flex-1/6 aspect-square rounded-xl border border-black flex items-center justify-center relative overflow-hidden'>
					<ImagePlus className='z-10 pointer-events-none' />
					<Input
						type='file'
						accept='image/*'
						onChange={(e) =>
							setImageFile(e.target.files?.[0] || null)
						}
						className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer'
					/>
				</div>
			</div>

			{/* Buttons */}
			<div className='flex justify-between max-w-2xl'>
				<div />
				<div className='flex items-center gap-x-3'>
					<Button
						size='lg'
						variant='outline'
						className='rounded-full'
						onClick={handlePost}>
						Post
					</Button>
					<Button
						size='lg'
						className='bg-[#7F0000] rounded-full !font-bold'>
						Ask AI
					</Button>
					<Info className='w-4 h-4' />
				</div>
			</div>
		</main>
	)
}
