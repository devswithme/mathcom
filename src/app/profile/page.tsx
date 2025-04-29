'use client'

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const Page = () => {
	const [userData, setUserData] = useState<any>(null)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const ref = doc(db, 'users', user.uid)
				const snap = await getDoc(ref)
				if (snap.exists()) setUserData(snap.data())
			}
		})
		return () => unsubscribe()
	}, [])

	if (!userData) {
		return <p className='pt-24 px-10'>Loading profile...</p>
	}

	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 sm:pt-24 pb-8 flex flex-col md:flex-row items-start gap-5'>
			<div className='bg-neutral-50 p-6 rounded-xl max-w-2xl space-y-5 border shadow-lg'>
				<div className='flex sm:items-center gap-5 justify-between sm:flex-row flex-col items-start'>
					<div className='flex items-center gap-x-3'>
						<div className='w-10 h-10 bg-neutral-100 rounded-full overflow-hidden'>
							<img
								src={userData.avatarUrl || '/default-avatar.png'}
								alt='avatar'
								className='w-full h-full object-cover'
							/>
						</div>
						<div>
							<h1 className='font-bold'>{userData.username}</h1>
							<span className='text-xs text-muted-foreground line-clamp-1'>
								{userData.examLevels?.join(', ') || '—'} | {userData.curriculum || '—'}
							</span>
						</div>
					</div>
					<Button
						variant='outline'
						className='border-black px-4'
						size='sm'>
						Edit profile
					</Button>
				</div>
				<div className='grid sm:grid-cols-3 grid-cols-2 sm:max-w-xs w-full gap-3 items-center'>
					<div>
						<h1 className='font-semibold'>{userData.postCount ?? 0}</h1>
						<p className='font-medium'>posted qs</p>
					</div>
					<div>
						<h1 className='font-semibold'>{userData.followerCount ?? 0}</h1>
						<p className='font-medium'>followers</p>
					</div>
					<div>
						<h1 className='font-semibold'>{userData.followingCount ?? 0}</h1>
						<p className='font-medium'>following</p>
					</div>
				</div>
				<div className='flex gap-3 sm:flex-row flex-col'>
					<Button className='bg-[#11244DB2] px-6' size='sm'>
						Follow
					</Button>
					<Button
						size='sm'
						className='px-6 border-black'
						variant='outline'>
						Message
					</Button>
				</div>
				<div className='border-y py-5 space-y-3'>
					<h1 className='text-lg font-semibold'>About me</h1>
					<p className='text-sm text-balance'>
						{userData.about || 'No bio yet.'}
					</p>
				</div>
				<div className='space-y-3'>
					<h1 className='text-lg font-semibold'>Joined communities</h1>
					<div className='grid md:grid-cols-3 grid-cols-1 gap-5'>
						{userData.communities?.length ? (
							userData.communities.map((community: string) => (
								<div
									key={community}
									className='bg-neutral-200 flex items-end justify-between p-4 rounded-2xl'>
									<p className='text-sm'>{community}</p>
									<div className='w-10 h-10 bg-neutral-300 rounded-full' />
								</div>
							))
						) : (
							<p className='text-sm text-muted-foreground'>No communities joined yet.</p>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}

export default Page
