'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { buttonVariants } from './ui/button'
import {
	ArrowUpRight,
	ChevronDown,
	HomeIcon,
	Info,
	MailIcon,
	MessageCircle,
	Upload,
} from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const Navbar = ({ className }: { className?: string }) => {
	const [photoURL, setPhotoURL] = useState<string | null>(null)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user && user.photoURL) {
				setPhotoURL(user.photoURL)
			} else {
				setPhotoURL(null)
			}
		})
		return () => unsubscribe()
	}, [])

	return (
		<aside className={className}>
			{/* Profile section */}
			{photoURL && (
				<div className='flex items-center gap-3 px-2 pb-4'>
					<img
						src={photoURL}
						alt='Profile'
						className='w-10 h-10 rounded-full object-cover border'
					/>
					<div className='text-sm font-medium line-clamp-1'>
						My Profile
					</div>
				</div>
			)}

			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'secondary',
					className: 'w-full justify-start',
				})}>
				<HomeIcon strokeWidth={2} /> Home
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start',
				})}>
				<ArrowUpRight /> Explore
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start',
				})}>
				<MessageCircle /> Messages
			</Link>
			<hr className='my-2' />
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full flex !justify-between !p-0 !pl-4',
				})}>
				Community <ChevronDown />
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<div className='w-5 h-5 rounded-full bg-neutral-100 mr-1' />
				m/cie_checkpoint
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<div className='w-5 h-5 rounded-full bg-neutral-100 mr-1' />{' '}
				m/cie_igcse
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<div className='w-5 h-5 rounded-full bg-neutral-100 mr-1' />{' '}
				m/cie_aslevel
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<div className='w-5 h-5 rounded-full bg-neutral-100 mr-1' />{' '}
				m/cie_a2level
			</Link>
			<hr className='my-2' />
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full flex !justify-between !p-0 !pl-4',
				})}>
				Resources <ChevronDown />
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<Info />
				About MathCom
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<MailIcon />
				MathCom Rules
			</Link>
			<Link
				href='/'
				className={buttonVariants({
					size: 'lg',
					variant: 'link',
					className: 'w-full justify-start !p-0 !pl-4',
				})}>
				<Upload />
				Help
			</Link>
		</aside>
	)
}

export default Navbar
