import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css';

import { NavbarProvider } from '@/context/NavbarContext'
import ClientLayout from '@/components/ClientLayout'

const quickSand = Quicksand({
	variable: '--font-quicksand-sans',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'MathCom',
	description: '',
}

// This is the root layout with metadata
export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en'>
			<body className={`${quickSand.className} antialiased`}>
				<NavbarProvider>
					<ClientLayout>{children}</ClientLayout>
				</NavbarProvider>
			</body>
		</html>
	)
}
