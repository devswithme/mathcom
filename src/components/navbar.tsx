'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { buttonVariants } from './ui/button'
import {
	Star,
	Home,
	Info,
	Mail,
	MessageSquare,
	Download,
	ChevronDown,
} from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Quicksand, Smooch_Sans } from 'next/font/google'
import { usePathname } from 'next/navigation'

const quicksand = Quicksand({ subsets: ['latin'] })
const smoochSans = Smooch_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const Navbar = ({ className }: { className?: string }) => {
	const [photoURL, setPhotoURL] = useState<string | null>(null)
	const pathname = usePathname()

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

	const isActive = (path: string) => {
		return pathname === path
	}

	return (
		<aside className={`${className} flex flex-col text-neutral-800 ${quicksand.className}`}>
			<div className="py-3">
				<Link
					href='/'
					className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-neutral-100 rounded-md ${
						isActive('/') 
							? 'bg-neutral-100 text-neutral-900 font-medium' 
							: 'text-neutral-900'
					}`}>
					<Home size={20} strokeWidth={1.5} />
					<span>Home</span>
				</Link>
				<Link
					href='/explore'
					className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-neutral-100 rounded-md ${
						isActive('/explore') 
							? 'bg-neutral-100 text-neutral-900 font-medium' 
							: 'text-neutral-900'
					}`}>
					<Star size={20} strokeWidth={1.5} />
					<span>Explore</span>
				</Link>
				<Link
					href='/messages'
					className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-neutral-100 rounded-md ${
						isActive('/messages') 
							? 'bg-neutral-100 text-neutral-900 font-medium' 
							: 'text-neutral-900'
					}`}>
					<MessageSquare size={20} strokeWidth={1.5} />
					<span>Messages</span>
				</Link>
			</div>

			<div className="border-t border-neutral-200 pt-4 pb-2">
				<div className="flex items-center justify-between px-4 mb-2">
					<span className={`text-base font-medium text-neutral-500 uppercase tracking-wider ${smoochSans.className}`}>Community</span>
					<ChevronDown size={16} className="text-neutral-500" />
				</div>
				<div className="space-y-1">
					<Link
						href='/community/cie_checkpoint'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/community/cie_checkpoint') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<div className='w-5 h-5 rounded-full bg-neutral-400 flex-shrink-0' />
						<span>m/cie_checkpoint</span>
					</Link>
					<Link
						href='/community/cie_igcse'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/community/cie_igcse') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<div className='w-5 h-5 rounded-full bg-neutral-400 flex-shrink-0' />
						<span>m/cie_igcse</span>
					</Link>
					<Link
						href='/community/cie_aslevel'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/community/cie_aslevel') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<div className='w-5 h-5 rounded-full bg-neutral-400 flex-shrink-0' />
						<span>m/cie_aslevel</span>
					</Link>
					<Link
						href='/community/cie_a2level'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/community/cie_a2level') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<div className='w-5 h-5 rounded-full bg-neutral-400 flex-shrink-0' />
						<span>m/cie_a2level</span>
					</Link>
				</div>
			</div>

			<div className="border-t border-neutral-200 pt-4 pb-2">
				<div className="flex items-center justify-between px-4 mb-2">
					<span className={`text-base font-medium text-neutral-500 uppercase tracking-wider ${smoochSans.className}`}>Resources</span>
					<ChevronDown size={16} className="text-neutral-500" />
				</div>
				<div className="space-y-1">
					<Link
						href='/about'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/about') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<Info size={20} strokeWidth={1.5} className="text-neutral-900" />
						<span>About MathCom</span>
					</Link>
					<Link
						href='/rules'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/rules') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<Mail size={20} strokeWidth={1.5} className="text-neutral-900" />
						<span>MathCom Rules</span>
					</Link>
					<Link
						href='/help'
						className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-neutral-100 rounded-md ${
							isActive('/help') 
								? 'bg-neutral-100 text-neutral-900 font-medium' 
								: 'text-neutral-900'
						}`}>
						<Download size={20} strokeWidth={1.5} className="text-neutral-900" />
						<span>Help</span>
					</Link>
				</div>
			</div>
		</aside>
	)
}

export default Navbar 