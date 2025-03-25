import { Button } from '@/components/ui/button'
import React from 'react'

const Page = () => {
	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 sm:pt-24 pb-8 flex flex-col md:flex-row items-start gap-5'>
			<div className='bg-neutral-50 p-6 rounded-xl max-w-2xl space-y-5 border shadow-lg'>
				<div className='flex sm:items-center gap-5 justify-between sm:flex-row flex-col items-start'>
					<div className='flex items-center gap-x-3'>
						<div className='w-10 h-10 bg-neutral-100 rounded-full' />
						<div>
							<h1 className='font-bold'>Username_username</h1>
							<span className='text-xs text-muted-foreground line-clamp-1'>
								IGCSE Student | Cambridge Learner
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
						<h1 className='font-semibold'>24</h1>
						<p className='font-medium'>posted qs</p>
					</div>
					<div>
						<h1 className='font-semibold'>80</h1>
						<p className='font-medium'>followers</p>
					</div>
					<div>
						<h1 className='font-semibold'>84</h1>
						<p className='font-medium'>following</p>
					</div>
				</div>
				<div className='flex gap-3 sm:flex-row flex-col'>
					<Button
						className='bg-[#11244DB2] px-6'
						size='sm'>
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
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et dolore magna
						aliqua. Ut enim ad minim veniam
					</p>
				</div>
				<div className='space-y-3'>
					<h1 className='text-lg font-semibold'>
						Joined communities
					</h1>
					<div className='grid md:grid-cols-3 grid-cols-1 gap-5'>
						<div className='bg-neutral-200 flex items-end justify-between p-4 rounded-2xl'>
							<p className='text-sm'>m/cie_checkpoint</p>
							<div className='w-10 h-10 bg-neutral-300 rounded-full' />
						</div>
						<div className='bg-neutral-200 flex items-end justify-between p-4 rounded-2xl'>
							<p className='text-sm'>m/cie_igcse</p>
							<div className='w-10 h-10 bg-neutral-300 rounded-full' />
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

export default Page
