import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ImagePlus, Info } from 'lucide-react'

export default function Home() {
	return (
		<main className='px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5'>
			<h1 className='text-2xl font-medium'>Ask a question</h1>
			<div className='bg-neutral-50 flex items-center gap-x-2 py-2 pl-2 pr-4 w-fit rounded-full'>
				<div className='w-8 h-8 bg-neutral-100 rounded-full' />
				<p className='text-sm'>Select a community</p>
				<ChevronDown className='w-4 h-4' />
			</div>
			<div className='max-w-2xl border p-4 rounded-2xl'>
				<h1 className='text-sm'>
					Title<span className='text-red-500'>*</span>
				</h1>
				<Input className='border-none shadow-none focus-visible:ring-0 px-0' />
			</div>
			<div className='max-w-2xl border p-4 rounded-2xl flex gap-x-4 items-start'>
				<div className='w-full'>
					<h1 className='text-sm'>Description</h1>
					<Textarea className='border-none shadow-none focus-visible:ring-0 px-0' />
				</div>
				<div className='flex-1/6 aspect-square rounded-xl border flex items-center justify-center relative'>
					<ImagePlus />
					<Input
						type='file'
						className='w-full h-full absolute rounded-xl opacity-0'
					/>
				</div>
			</div>
			<div className='flex justify-between max-w-2xl'>
				<div />
				<div className='flex items-center gap-x-3'>
					<Button
						size='lg'
						variant='outline'
						className='rounded-full'>
						Post
					</Button>
					<Button
						size='lg'
						className='bg-[#7F0000] rounded-full'>
						Ask AI
					</Button>
					<Info className='w-4 h-4' />
				</div>
			</div>
		</main>
	)
}
