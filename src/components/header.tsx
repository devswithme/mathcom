'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { LogOut, Menu, MenuIcon, Plus, Search, Settings, SidebarClose, SidebarOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { useNavbar } from '@/context/NavbarContext'

export default function Header() {
	const router = useRouter()
	const [photoURL, setPhotoURL] = useState<string | null>(null)
	const { isNavbarOpen, toggleNavbar } = useNavbar()

	useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user?.photoURL) {
                setPhotoURL(user.photoURL)
            } else {
                setPhotoURL(null)
            }
        })
        return () => unsubscribe()
    }, [])
    

	const handleLogout = async () => {
		await signOut(auth)
		router.push('/login')
	}

	return (
		<header className='fixed top-0 z-50 w-full bg-white px-3 md:px-6 py-2 flex justify-between items-center gap-x-4 shadow-sm'>
			{/* Mobile menu button - shown only on small screens */}
			<Button 
				onClick={toggleNavbar}
				variant="ghost" 
				size="sm" 
				className="p-1 mr-2 md:hidden"
			>
				<Menu className="h-6 w-6" />
			</Button>
			
			<Link href='/' className="flex items-center">
				<Image 
					src='/logo.svg' 
					alt='logo' 
					width={50} 
					height={50} 
					priority 
					style={{ width: '50px', height: 'auto' }}
				/>
			</Link>
			
			<div className="relative w-full lg:max-w-lg max-w-sm hidden md:block">
				<input 
					type="search" 
					placeholder="Search MathCom" 
					className="w-full py-2 px-4 rounded-full bg-gray-50 border border-gray-200 text-sm"
				/>
			</div>
			
			<div className='flex gap-x-3 items-center'>
				<Link
					href='/ask'
					className='bg-[#11244D] hover:bg-[#11244D]/90 text-white px-4 py-2 rounded-full hidden sm:flex items-center text-sm'>
					<Plus className="mr-1" size={18} strokeWidth={2.5} />
					Ask
				</Link>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							className='rounded-full aspect-square p-0'
							size='sm'
							variant='outline'>
							{photoURL ? (
								<img
									src={photoURL}
									alt='Profile'
									className='w-8 h-8 rounded-full object-cover'
								/>
							) : (
								<div className='w-8 h-8 bg-gray-200 rounded-full' />
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='shadow-md bg-white border rounded-md w-48'>
						<DropdownMenuLabel className='flex gap-x-2.5 items-center'>
							{photoURL ? (
								<img
									src={photoURL}
									alt='Profile'
									className='w-8 h-8 rounded-full object-cover'
								/>
							) : (
								<div className='w-8 h-8 bg-gray-200 rounded-full' />
							)}
							<p>Profile</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Link
								href='/profile'
								className='flex items-center gap-x-2'>
								<Settings size={16} /> Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut size={16} /> Log Out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	)
}
