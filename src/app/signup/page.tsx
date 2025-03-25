'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

const Page = () => {
	const [state, setState] = useState({
		one: true,
		two: false,
		three: false,
	})
	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-[28rem] pt-24 sm:pt-36 pb-8 flex flex-col md:flex-row items-start gap-5'>
			<div className='bg-neutral-50 p-8 rounded-xl max-w-md w-full space-y-5 shadow-md border'>
				{state.one && (
					<>
						<div className='space-y-2 text-center'>
							<h1 className='font-bold text-2xl'>Sign Up</h1>
							<p className='text-muted-foreground text-sm font-semibold'>
								Create an account to continue learning.
							</p>
						</div>
						<Button
							className='w-full border-black font-semibold'
							size='lg'
							variant='outline'
							onClick={() =>
								setState({
									one: false,
									two: true,
									three: false,
								})
							}>
							<Image
								src='/google.svg'
								alt='google'
								width={25}
								height={25}
							/>
							Continue with Google
						</Button>
						<p className='text-sm text-muted-foreground mt-3 font-semibold'>
							Already part of MathCom?{' '}
							<Link
								href='/login'
								className='text-[#11244DB2]'>
								Log In
							</Link>
						</p>
					</>
				)}
				{state.two && (
					<>
						<h1 className='font-bold text-2xl text-center'>
							Sign Up
						</h1>
						<div className='space-y-3'>
							<label className='text-sm font-semibold'>
								Username
							</label>
							<Input className='shadow-none focus-visible:border-b focus-visible:ring-0 border-t-0 border-l-0 border-r-0 border-b-black rounded-none px-0' />
							<p className='text-muted-foreground text-xs font-medium'>
								*This is the name that will be visible to others.
							</p>
						</div>
						<Button
							className='w-full bg-[#11244DB2] font-bold'
							size='lg'
							onClick={() =>
								setState({
									one: false,
									two: false,
									three: true,
								})
							}>
							Create Account
						</Button>
					</>
				)}
				{state.three && (
					<>
						<div className='space-y-2 text-center'>
							<h1 className='font-bold text-2xl'>Personalization</h1>
							<p className='text-muted-foreground text-sm font-semibold'>
								Pick the options that match your studies.
							</p>
						</div>
						<div className='space-y-3'>
							<h1 className='font-semibold'>Grade</h1>

							<div className='grid grid-cols-2 gap-3'>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full font-semibold'>
									Primary (1 - 6)
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full font-semibold'>
									Secondary (7 - 12)
								</Button>
							</div>
						</div>
						<div className='space-y-3'>
							<h1 className='font-semibold'>Curriculum</h1>

							<div className='grid grid-cols-3 gap-3'>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full font-semibold'>
									Cambridge
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full w-fit font-semibold'
									disabled>
									IB
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full col-span-2 font-semibold'
									disabled>
									National (Indonesia)
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full font-semibold'>
									Other
								</Button>
							</div>
						</div>
						<div className='space-y-3'>
							<h1 className='font-semibold'>Exam Levels</h1>

							<div className='grid grid-cols-3 gap-3'>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full font-semibold'>
									Checkpoint
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full w-fit font-semibold'
									disabled>
									IGCSE
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full col-span-2 font-semibold'
									disabled>
									A Level (AS & A2)
								</Button>
							</div>
						</div>
						<Button
							className='w-full bg-[#11244DB2] mt-3 font-bold'
							size='lg'
							onClick={() =>
								setState({
									one: false,
									two: false,
									three: true,
								})
							}>
							Continue
						</Button>
					</>
				)}
			</div>
		</main>
	)
}

export default Page
