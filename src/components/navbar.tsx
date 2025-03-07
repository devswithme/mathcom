import Link from 'next/link'
import React from 'react'
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

const Navbar = ({ className }: { className?: string }) => {
	return (
		<aside className={className}>
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
