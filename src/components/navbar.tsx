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
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname } from 'next/navigation';
import { useNavbar } from '@/context/NavbarContext';
import { Quicksand, Smooch_Sans } from 'next/font/google';
import { useRouter } from "next/navigation";
import Image from 'next/image';

const quicksand = Quicksand({ subsets: ['latin'] });
const smoochSans = Smooch_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const Navbar = ({ className }: { className?: string }) => {
	const [photoURL, setPhotoURL] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);
	const pathname = usePathname();
	const { isNavbarOpen } = useNavbar();
	const [isMounted, setIsMounted] = useState(false);
	const router = useRouter();
	
	const [communityOpen, setCommunityOpen] = useState(true);
	const [resourcesOpen, setResourcesOpen] = useState(true);

	// Add a mapping for community avatars
	const communityAvatars: Record<string, string> = {
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

	return (
		<aside className={`${className} flex flex-col text-gray-800 ${quicksand.className}`}>
			<div className="py-3">
				<Link
					href='/'
					className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-gray-100 rounded-md ${
						isActive('/') 
							? 'bg-gray-100 text-gray-900 font-medium' 
							: 'text-gray-700'
					}`}>
					<HomeIcon size={20} strokeWidth={1.5} />
					<span>Home</span>
				</Link>
				<Link
					href='/explore'
					className={`flex items-center gap-3 px-4 py-2.5 text-base hover:bg-gray-100 rounded-md ${
						isActive('/explore') 
							? 'bg-gray-100 text-gray-900 font-medium' 
							: 'text-gray-700'
					}`}>
					<Star size={20} strokeWidth={1.5} />
					<span>Explore</span>
				</Link>
				{/* Messages feature temporarily hidden */}
			</div>

			<div className="border-t border-gray-200 pt-4 pb-2">
				<div className="flex items-center justify-between px-4 mb-2 cursor-pointer" onClick={() => setCommunityOpen(!communityOpen)}>
					<span className={`text-base font-medium text-gray-500 uppercase tracking-wider ${smoochSans.className}`}>Community</span>
					{communityOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
				</div>
				{communityOpen && (
					<div className="space-y-1">
						<Link
							href='/community/cie_checkpoint'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/community/cie_checkpoint') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<Image
								src={communityAvatars.cie_checkpoint}
								alt='cie_checkpoint avatar'
								width={20}
								height={20}
								className='w-5 h-5 rounded-full object-cover flex-shrink-0'
							/>
							<span>m/cie_checkpoint</span>
						</Link>
						<Link
							href='/community/cie_igcse'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/community/cie_igcse') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<Image
								src={communityAvatars.cie_igcse}
								alt='cie_igcse avatar'
								width={20}
								height={20}
								className='w-5 h-5 rounded-full object-cover flex-shrink-0'
							/>
							<span>m/cie_igcse</span>
						</Link>
						<Link
							href='/community/cie_alevel'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/community/cie_alevel') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<Image
								src={communityAvatars.cie_alevel}
								alt='cie_alevel avatar'
								width={20}
								height={20}
								className='w-5 h-5 rounded-full object-cover flex-shrink-0'
							/>
							<span>m/cie_alevel</span>
						</Link>
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
						<Link
							href='/about'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/about') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<Info size={20} strokeWidth={1.5} className="text-gray-700" />
							<span>About MathCom</span>
						</Link>
						<Link
							href='/rules'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/rules') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<MailIcon size={20} strokeWidth={1.5} className="text-gray-700" />
							<span>MathCom Rules</span>
						</Link>
						<Link
							href='/help'
							className={`flex items-center gap-3 px-4 py-2 text-base hover:bg-gray-100 rounded-md ${
								isActive('/help') 
									? 'bg-gray-100 text-gray-900 font-medium' 
									: 'text-gray-700'
							}`}>
							<Upload size={20} strokeWidth={1.5} className="text-gray-700" />
							<span>Help</span>
						</Link>
					</div>
				)}
			</div>
    </aside>
  );
};

export default Navbar;
