import { Skeleton } from "@/components/ui/skeleton";

interface PostSkeletonProps {
  withImage?: boolean;
}

const PostSkeleton = ({ withImage = true }: PostSkeletonProps) => (
  <div className="bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border shadow-sm">
    {/* Header */}
    <div className="flex items-center gap-x-3">
      <Skeleton className="w-10 h-10 rounded-full bg-neutral-200" />
      <div className="-space-y-1">
        <Skeleton className="h-4 w-28 bg-neutral-200" />
        <Skeleton className="h-3 w-40 bg-neutral-100" />
      </div>
    </div>

    {/* Title & Description */}
    <Skeleton className="h-5 w-1/2 bg-neutral-200 rounded" />
    <Skeleton className="h-4 w-full bg-neutral-100 rounded" />
    <Skeleton className="h-4 w-5/6 bg-neutral-100 rounded" />

    {/* Image Placeholder – only if withImage is true */}
    {withImage && (
      <div className="w-full aspect-video bg-neutral-100 rounded-xl my-3 overflow-hidden">
        <Skeleton className="w-full h-full bg-neutral-200" />
      </div>
    )}

    {/* Buttons */}
    <div className="flex gap-x-4">
      <Skeleton className="w-16 h-8 rounded-md bg-neutral-200" />
      <Skeleton className="w-16 h-8 rounded-md bg-neutral-200" />
      <Skeleton className="w-16 h-8 rounded-md bg-neutral-200" />
    </div>
  </div>
);

export default PostSkeleton;
