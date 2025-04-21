"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import PostSkeleton from "@/components/post/post-skeleton";

export default function Home() {
  interface Post {
    id: string;
    title: string;
    description: string;
    imageURL?: string;
    upvotes?: number;
    commentsCount?: number;
    username: string;
    avatar: string;
    community?: string;
    createdAt?: { seconds: number };
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const fetched = snapshot.docs.map((docSnap) => {
        const postData = docSnap.data();

        return {
          id: docSnap.id,
          title: postData.title || "Untitled",
          description: postData.description || "No description provided.",
          imageURL: postData.imageURL || "",
          upvotes: postData.upvotes || 0,
          commentsCount: postData.commentsCount || 0,
          username: postData.username || "Anonymous",
          avatar: postData.avatar || "",
          community: postData.community || "General",
          createdAt: postData.createdAt || { seconds: Date.now() / 1000 },
        };
      });

      setPosts(fetched);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <main className="px-6 sm:px-0 sm:pr-8 sm:pl-72 pt-24 pb-8 grid grid-cols-1 gap-y-5">
      {loading ? (
        <>
          <>
            <PostSkeleton withImage={false} />
            <PostSkeleton withImage={false} />
            <PostSkeleton withImage={false} />
          </>
        </>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm font-medium">
          No questions have been posted yet. Be the first to{" "}
          <Link href="/ask" className="underline text-[#11244DB2]">
            ask a question
          </Link>
          !
        </p>
      ) : (
        posts.map((post) => (
          <Link
            href={`/post/${post.id}`}
            key={post.id}
            className="bg-neutral-50 p-6 rounded-xl max-w-3xl space-y-3 hover:border"
          >
            {/* User Info */}
            <div className="flex items-center gap-x-3">
              {post.avatar ? (
                <Image
                  src={post.avatar}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover bg-neutral-100"
                />
              ) : (
                <div className="w-10 h-10 bg-neutral-100 rounded-full" />
              )}
              <div className="-space-y-1">
                <h1 className="font-semibold">
                  m/{post.community?.toLowerCase().replace(/\s/g, "_")}
                </h1>
                <span className="text-xs text-muted-foreground">
                  {post.username || "Unknown"} &bull;{" "}
                  {post.createdAt?.seconds
                    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                    : "Just now"}
                </span>
              </div>
            </div>

            {/* Post Content */}
            <h1 className="text-lg font-bold">{post.title}</h1>
            <p className="text-sm">{post.description}</p>

            {/* Uploaded Image */}
            {post.imageURL && (
              <div className="w-full aspect-video bg-neutral-100 rounded-xl my-5">
                <Image
                  src={post.imageURL}
                  alt="Uploaded image"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-x-4">
              <Button variant="secondary" size="sm">
                <ArrowUp /> {post.upvotes || 0}
              </Button>
              <Button variant="secondary" size="sm">
                <MessageCircle /> {post.commentsCount || 0}
              </Button>
              <Button variant="secondary" size="sm">
                <Share2 /> Share
              </Button>
            </div>
          </Link>
        ))
      )}
    </main>
  );
}
