// ❌ REMOVE 'use client'
import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css';

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
				<div className="flex min-h-screen">
					<Navbar className="fixed top-[56px] left-0 w-64 h-[calc(100vh-56px)] border-r border-neutral-200 bg-white px-4 overflow-y-auto hidden sm:block z-40" />
					<main className="sm:ml-64 w-full px-4 pt-[66px] pb-4">
						{children}
					</main>
				</div>
			</body>
		</html>
	)
}
