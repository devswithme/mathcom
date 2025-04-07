'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { LogOut, Menu, Plus, Search, Settings } from 'lucide-react'
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

export default function Header() {
	const router = useRouter()
	const [photoURL, setPhotoURL] = useState<string | null>(null)

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
		<header className='fixed top-0 z-50 w-full border-b-[0.1px] border-black px-10 py-2 flex justify-between items-center gap-x-10 bg-white'>
			<Link href='/'>
				<Image src='/logo.svg' alt='logo' width={50} height={50} />
			</Link>
			<Button
				className='justify-start w-full lg:max-w-lg max-w-sm rounded-full hidden md:flex'
				size='lg'
				variant='secondary'>
				<Search className='mr-2' />
				<p className='text-muted-foreground'>Search MathCom</p>
			</Button>
			<div className='flex gap-x-5 items-center'>
				<Link
					href='/login'
					className={buttonVariants({
						className:
							'!bg-[#11244DB2] !rounded-full !hidden sm:!flex !font-bold',
						size: 'lg',
					})}>
					Log In
				</Link>
				<Link
					href='/ask'
					className={buttonVariants({
						className:
							'!bg-[#11244DB2] !rounded-full uppercase !hidden sm:!flex !font-bold',
						size: 'lg',
					})}>
					<Plus strokeWidth={4} />
					Ask
				</Link>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							className='rounded-full aspect-square p-0'
							size='lg'
							variant='secondary'>
							{photoURL ? (
								<img
									src={photoURL}
									alt='Profile'
									className='w-8 h-8 rounded-full object-cover'
								/>
							) : (
								<div className='w-8 h-8 bg-neutral-200 rounded-full' />
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='shadow-none bg-neutral-50 border w-42'>
						<DropdownMenuLabel className='flex gap-x-2.5 items-center'>
							{photoURL ? (
								<img
									src={photoURL}
									alt='Profile'
									className='w-8 h-8 rounded-full object-cover'
								/>
							) : (
								<div className='w-8 h-8 bg-neutral-200 rounded-full' />
							)}
							<p>Profile</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Link
								href='/profile'
								className='flex items-center gap-x-2'>
								<Settings /> Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut /> Log Out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Sheet>
					<SheetTrigger className='block sm:hidden'>
						<Button asChild size='icon' variant='link'>
							<Menu className='w-6 h-6' />
						</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetTitle></SheetTitle>
						<Navbar className='px-5 py-8' />
					</SheetContent>
				</Sheet>
			</div>
		</header>
	)
}
