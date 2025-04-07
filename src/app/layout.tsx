// ❌ REMOVE 'use client'
import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'

import Navbar from '@/components/navbar'
import Header from '@/components/header'

const quickSand = Quicksand({
	variable: '--font-quicksand-sans',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'MathCom',
	description: '',
}

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en'>
			<body className={`${quickSand.className} antialiased`}>
				<Header />
				<Navbar className='fixed z-40 left-0 border-r-[0.1px] border-black w-64 h-full bg-white pt-20 px-5 hidden sm:block' />
				{children}
			</body>
		</html>
	)
}
