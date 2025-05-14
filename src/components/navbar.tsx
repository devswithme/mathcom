"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { buttonVariants } from "./ui/button";
import {
	ArrowUpRight,
	ChevronDown,
	ChevronUp,
	HomeIcon,
	Info,
	MailIcon,
	MessageCircle,
	Upload,
	Star,
	ExternalLink,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from 'next/navigation';
import { useNavbar } from '@/context/NavbarContext';
import { Quicksand, Smooch_Sans } from 'next/font/google';
import Image from 'next/image';
import { useChatShortcuts } from '@/context/ChatShortcutsContext';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const quicksand = Quicksand({ subsets: ['latin'] });
const smoochSans = Smooch_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const Navbar = ({ className }: { className?: string }) => {
	const [photoURL, setPhotoURL] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);
	const pathname = usePathname();
	const { isNavbarOpen } = useNavbar();
	const [isMounted, setIsMounted] = useState(false);
	const router = useRouter();
	const shortcuts = useChatShortcuts();
	
	const [communityOpen, setCommunityOpen] = useState(true);
	const [resourcesOpen, setResourcesOpen] = useState(true);
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	// Add a mapping for community avatars
	const communityAvatars: Record<string, string> = {
		general_math: '/community_avatars/general_math.png',
		cie_checkpoint: '/community_avatars/cie_checkpoint.png',
		cie_igcse: '/community_avatars/cie_igcse.png',
		cie_alevel: '/community_avatars/cie_alevel.png',
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setPhotoURL(user.photoURL);
				setUser(user);
			} else {
				setPhotoURL(null);
				setUser(null);
			}
		});
		
		setIsMounted(true);
		
		return () => unsubscribe();
	}, []);

	const isActive = (path: string) => {
		return pathname === path;
	};

	// Handle server-side rendering
	if (!isMounted) {
		return null;
	}

	// Only check visibility on mobile, desktop always shows
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
	if (!isNavbarOpen && isMobile) {
		return null;
	}

	// Helper: check if on chat page
	const isOnChatPage = pathname === '/chat';

	// Intercept navigation for Home, Explore, Community
	const handleNav = (href: string) => {
		if (isOnChatPage) {
			setPendingHref(href);
			setShowLeaveDialog(true);
		} else {
			router.push(href);
		}
	};

	return (
		<>
			{/* Leave Chat Confirmation Dialog */}
			<AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave chat?</AlertDialogTitle>
						<AlertDialogDescription>
							If you leave this page, your current chat will be lost. Are you sure you want to leave?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setShowLeaveDialog(false);
								if (pendingHref) router.push(pendingHref);
							}}
						>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<aside className={`${className} flex flex-col text-gray-800 ${quicksand.className}`}>
				<div className="py-3">
					<span
						onClick={() => handleNav('/')}
						className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
							isActive('/')
								? 'bg-gray-100 text-gray-900 font-medium'
								: 'text-gray-700'
						}`}
					>
						<HomeIcon size={20} strokeWidth={1.5} />
						<span>Home</span>
					</span>
					<span
						onClick={() => handleNav('/explore')}
						className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
							isActive('/explore')
								? 'bg-gray-100 text-gray-900 font-medium'
								: 'text-gray-700'
						}`}
					>
						<Star size={20} strokeWidth={1.5} />
						<span>Explore</span>
					</span>
					{/* Messages feature temporarily hidden */}
				</div>

				<div className="border-t border-gray-200 pt-4 pb-2">
					<div className="flex items-center justify-between px-4 mb-2 cursor-pointer" onClick={() => setCommunityOpen(!communityOpen)}>
						<span className={`text-base font-medium text-gray-500 uppercase tracking-wider ${smoochSans.className}`}>Community</span>
						{communityOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
					</div>
					{communityOpen && (
						<div className="space-y-1">
							<span
								onClick={() => handleNav('/community/general_math')}
								className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
									isActive('/community/general_math')
										? 'bg-gray-100 text-gray-900 font-medium'
										: 'text-gray-700'
								}`}
							>
								<Image
									src={communityAvatars.general_math}
									alt='general_math avatar'
									width={20}
									height={20}
									className='w-5 h-5 rounded-full object-cover flex-shrink-0'
								/>
								<span>m/general_math</span>
							</span>
							<span
								onClick={() => handleNav('/community/cie_checkpoint')}
								className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
									isActive('/community/cie_checkpoint')
										? 'bg-gray-100 text-gray-900 font-medium'
										: 'text-gray-700'
								}`}
							>
								<Image
									src={communityAvatars.cie_checkpoint}
									alt='cie_checkpoint avatar'
									width={20}
									height={20}
									className='w-5 h-5 rounded-full object-cover flex-shrink-0'
								/>
								<span>m/cie_checkpoint</span>
							</span>
							<span
								onClick={() => handleNav('/community/cie_igcse')}
								className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
									isActive('/community/cie_igcse')
										? 'bg-gray-100 text-gray-900 font-medium'
										: 'text-gray-700'
								}`}
							>
								<Image
									src={communityAvatars.cie_igcse}
									alt='cie_igcse avatar'
									width={20}
									height={20}
									className='w-5 h-5 rounded-full object-cover flex-shrink-0'
								/>
								<span>m/cie_igcse</span>
							</span>
							<span
								onClick={() => handleNav('/community/cie_alevel')}
								className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md cursor-pointer ${
									isActive('/community/cie_alevel')
										? 'bg-gray-100 text-gray-900 font-medium'
										: 'text-gray-700'
								}`}
							>
								<Image
									src={communityAvatars.cie_alevel}
									alt='cie_alevel avatar'
									width={20}
									height={20}
									className='w-5 h-5 rounded-full object-cover flex-shrink-0'
								/>
								<span>m/cie_alevel</span>
							</span>
						</div>
					)}
				</div>

				<div className="border-t border-gray-200 pt-4 pb-2">
					<div className="flex items-center justify-between px-4 mb-2 cursor-pointer" onClick={() => setResourcesOpen(!resourcesOpen)}>
						<span className={`text-base font-medium text-gray-500 uppercase tracking-wider ${smoochSans.className}`}>Resources</span>
						{resourcesOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
					</div>
					{resourcesOpen && (
						<div className="space-y-1">
							<a
								href="https://forms.gle/RhYm61Kgn8myngMCA"
								target="_blank"
								rel="noopener noreferrer"
								className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
									isActive('/feedback') 
										? 'bg-gray-100 text-gray-900 font-medium' 
										: 'text-gray-700'
								}`}
							>
								<Info size={20} strokeWidth={1.5} className="text-gray-700" />
								<span>Feedback</span>
								<ExternalLink size={18} className="ml-1 text-gray-400" />
							</a>
						</div>
					)}
				</div>

				{/* Shortcuts Panel: Only show on /chat */}
				{pathname === '/chat' && (
					<div className="mb-2 w-full">
						<div className="border border-gray-200 p-4 rounded-lg bg-white w-full">
							<h2 className="font-semibold text-sm mb-2 px-1">Shortcuts</h2>
							<div className="space-y-3">
								<div className="bg-neutral-100 flex items-center gap-x-3 py-2 px-3 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer text-sm w-full pl-4 justify-start"
									onClick={shortcuts.handleAskTutor}>
									<span className="" style={{ fontSize: '1.2rem', minWidth: '2.2rem', textAlign: 'center', verticalAlign: 'middle' }}>🧑‍🏫</span>
									<h3 className="font-medium text-sm w-full text-left">Ask Tutor</h3>
								</div>
								<button 
									onClick={shortcuts.handleEndChat}
									className="w-full block"
								>
									<div className="bg-[#7f0000] flex items-center gap-x-3 py-2 px-3 rounded-full hover:bg-[#a30000] transition-colors cursor-pointer text-sm w-full pl-4 justify-start">
										<span className="flex items-center justify-center" style={{ fontSize: '1.2rem', minWidth: '2.2rem', textAlign: 'center', verticalAlign: 'middle' }}>
											<svg className="w-5 h-5 text-white" strokeWidth={3} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
										</span>
										<h3 className="font-medium text-sm w-full text-left text-white">End Chat</h3>
									</div>
								</button>
							</div>
						</div>
					</div>
				)}
			</aside>
		</>
	);
};

export default Navbar;
