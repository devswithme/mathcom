import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	ArrowLeftCircleIcon,
	ArrowUp,
	MessageCircle,
	Share2,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Page = () => {
	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 flex flex-col md:flex-row items-start gap-5'>
			<Link href='/'>
				<ArrowLeftCircleIcon />
			</Link>
			<div className='space-y-5'>
				<div className='bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border'>
					<div className='flex items-center gap-x-3'>
						<div className='w-10 h-10 bg-neutral-100 rounded-full' />
						<div className='-space-y-1'>
							<h1 className='font-medium'>m/cie_checkpoint</h1>
							<span className='text-xs text-muted-foreground'>
								Username_username &bull; 7hr. ago
							</span>
						</div>
					</div>
					<h1 className='text-lg font-bold'>
						Input question prompt here
					</h1>
					<p className='text-sm'>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et dolore magna
						aliqua. Ut enim ad minim veniam
					</p>
					<div className='w-full aspect-video bg-neutral-100 rounded-xl my-5' />
					<div className='flex gap-x-4 my-5'>
						<Button
							variant='secondary'
							size='sm'>
							<ArrowUp /> 309
						</Button>
						<Button
							variant='secondary'
							size='sm'>
							<MessageCircle /> 15
						</Button>
						<Button
							variant='secondary'
							size='sm'>
							<Share2 /> Share
						</Button>
					</div>
					<Input
						className='p-5 rounded-full bg-white shadow-none'
						placeholder='Add a comment'
					/>
					<div className='bg-white border rounded-2xl space-y-3 pb-3 hidden'>
						<Textarea
							placeholder='Add a comment'
							className='p-4 border-none shadow-none focus-visible:ring-0'
						/>
						<div className='flex justify-between'>
							<div />
							<div className='flex gap-x-2 pr-3'>
								<Button
									size='sm'
									variant='outline'
									className='rounded-full'>
									Cancel
								</Button>
								<Button
									size='sm'
									variant='secondary'
									className='rounded-full'>
									Comment
								</Button>
							</div>
						</div>
					</div>
				</div>
				<div className='bg-neutral-50 p-6 rounded-xl max-w-3xl hover:border'>
					<div>
						<div className='flex items-center gap-x-3'>
							<div className='w-10 h-10 bg-neutral-100 rounded-full' />
							<h1 className='font-semibold'>
								Username_username{' '}
								<span className='text-xs font-normal text-muted-foreground'>
									&bull; 7hr. ago
								</span>
							</h1>
						</div>
						<div className='border-l pl-8 ml-5 my-1 space-y-1'>
							<p className='text-sm'>
								Lorem ipsum dolor sit amet, consectetur adipiscing
								elit, sed do eiusmod tempor incididunt ut labore et
								dolore magna aliqua. Ut enim ad minim veniam
							</p>
							<Button
								size='sm'
								variant='link'
								className='!p-0'>
								<ArrowUp /> 12
							</Button>
						</div>
					</div>
					<div>
						<div className='flex items-center gap-x-3'>
							<div className='w-10 h-10 bg-neutral-100 rounded-full' />
							<h1 className='font-semibold'>
								Username_username{' '}
								<span className='text-xs font-normal text-muted-foreground'>
									&bull; 7hr. ago
								</span>
							</h1>
						</div>
						<div className='pl-8 ml-5 space-y-1'>
							<p className='text-sm'>
								Lorem ipsum dolor sit amet, consectetur adipiscing
								elit, sed do eiusmod tempor incididunt ut labore et
								dolore magna aliqua. Ut enim ad minim veniam
							</p>
							<Button
								size='sm'
								variant='link'
								className='!p-0'>
								<ArrowUp /> 5
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

export default Page
