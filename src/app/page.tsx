import { Button } from '@/components/ui/button'
import { ArrowUp, MessageCircle, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5'>
			<div className='bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border'>
				<div className='flex items-center gap-x-3'>
					<div className='w-10 h-10 bg-neutral-100 rounded-full' />
					<div className='-space-y-2'>
						<h1 className='font-medium'>m/cie_checkpoint</h1>
						<span className='text-xs text-muted-foreground'>
							Username_username &bull; 7hr. ago
						</span>
					</div>
				</div>
				<h1 className='text-lg font-medium'>
					Input question prompt here
				</h1>
				<p className='text-sm'>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
					do eiusmod tempor incididunt ut labore et dolore magna
					aliqua. Ut enim ad minim veniam
				</p>
				<div className='flex gap-x-4 mt-5'>
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
			</div>
			<Link
				href='/post/123'
				className='bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border'>
				<div className='flex items-center gap-x-3'>
					<div className='w-10 h-10 bg-neutral-100 rounded-full' />
					<div className='-space-y-2'>
						<h1 className='font-medium'>m/cie_checkpoint</h1>
						<span className='text-xs text-muted-foreground'>
							Username_username &bull; 7hr. ago
						</span>
					</div>
				</div>
				<h1 className='text-lg font-medium'>
					Input question prompt here
				</h1>
				<p className='text-sm'>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
					do eiusmod tempor incididunt ut labore et dolore magna
					aliqua. Ut enim ad minim veniam
				</p>
				<div className='w-full aspect-video bg-neutral-100 rounded-xl my-5' />
				<div className='flex gap-x-4'>
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
			</Link>
		</main>
	)
}
