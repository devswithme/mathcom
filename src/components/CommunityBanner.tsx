'use client';

import React from 'react';
import Image from 'next/image';
import { MoreVertical } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface CommunityBannerProps {
  communityId: string;
  title: string;
  description: string;
  memberCount: number;
}

// Map of community IDs to banner images
const communityBanners: Record<string, string> = {
  cie_checkpoint: '/community_banners/cie_checkpoint_banner.jpg',
  cie_igcse: '/community_banners/cie_igcse_banner.jpg',
  cie_alevel: '/community_banners/cie_alevel_banner.jpg',
};

// Default banner if specific one not found
const defaultBanner = '/community_banners/default_banner.jpg';

const CommunityBanner: React.FC<CommunityBannerProps> = ({
  communityId,
  title,
  description,
  memberCount
}) => {
  const bannerImage = communityBanners[communityId] || defaultBanner;

  return (
    <div className="w-full mb-8">
      {/* Banner Image */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden bg-slate-300 mb-6">
        <Image
          src={bannerImage}
          alt={`${title} banner`}
          fill
          priority
          className="object-cover"
        />
        
        {/* Options menu */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-700">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report Community</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Community Info */}
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-2">{description}</p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{memberCount.toLocaleString()}</span> members
        </div>
      </div>
    </div>
  );
};

export default CommunityBanner;
