import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css';
import Script from 'next/script';

import { NavbarProvider } from '@/context/NavbarContext'
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from "@/components/ui/sonner"
import MathLiveScript from '@/components/MathLiveScript';

const quickSand = Quicksand({
  variable: "--font-quicksand-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MathCom",
  description: "",
};

// This is the root layout with metadata
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en'>
			<head>
				{/* CSS files need to be loaded as link tags, not as Script components */}
				<link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.core.css" />
				<link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.css" />
			</head>
			<body className={`${quickSand.className} antialiased`}>
        {/* Load MathLive globally */}
        <MathLiveScript />
				<NavbarProvider>
					<ClientLayout>{children}</ClientLayout>
          <Toaster position="bottom-center" richColors />
				</NavbarProvider>
			</body>
		</html>
	)
}
