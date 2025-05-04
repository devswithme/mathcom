'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase'

const Page = () => {
	const handleLogin = async () => {
		try {
			const result = await signInWithPopup(auth, provider)
			const user = result.user
			console.log('Logged in as:', user.displayName)

			// Optional: Redirect after login
			// router.push('/dashboard') — if you're using next/router or next/navigation
		} catch (error) {
			console.error('Login failed:', error)
		}
	}

	return (
		<div className="flex items-start justify-center pt-[20vh] h-[calc(100vh-80px)]">
			<div className='bg-neutral-100 py-8 px-10 rounded-xl max-w-md w-full space-y-5 shadow-sm border'>
				<div className='space-y-2 text-center'>
					<h1 className='font-bold text-2xl'>Log In</h1>
					<p className='text-muted-foreground text-sm font-semibold'>
						Access your account to continue learning.
					</p>
				</div>
				<Button
					onClick={handleLogin}
					className='w-full border-black font-semibold'
					size='lg'
					variant='outline'>
					<Image
						src='/google.svg'
						alt='google'
						width={25}
						height={25}
						className="mr-2"
					/>
					Continue with Google
				</Button>
				<p className='text-sm text-muted-foreground mt-3 font-semibold text-center'>
					New to MathCom?{' '}
					<Link
						href='/signup'
						className='text-[#11244DB2]'>
						Sign Up
					</Link>
				</p>
			</div>
		</div>
	)
}

export default Page
