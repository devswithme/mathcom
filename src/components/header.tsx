"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { LogOut, Menu, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/navbar";
import { useNavbar } from "@/context/NavbarContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import clsx from "clsx";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import LoginPopup from "./LoginPopup";
import LoginRequired from "./LoginRequired";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<null | { photoURL: string | null }>(null);
  const { isNavbarOpen, toggleNavbar } = useNavbar();
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState("/");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<{
    posts: any[];
    comments: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({ photoURL: user.photoURL || null });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleAskClick = () => {
    if (!user) {
      // Show login required modal
      setShowLoginAlert(true);
      setLoginRedirectPath("/ask");
    } else {
      let community = "";
      let fromParam = "home"; // Default to home

      if (pathname.startsWith("/community/")) {
        const pathParts = pathname.split("/");
        if (pathParts.length >= 3) {
          community = pathParts[2]; // Get the community slug
          fromParam = `community/${community}`;
        }
      } else if (pathname === "/") {
        fromParam = "home";
      } else {
        // For any other page, we might not know the exact context to return to,
        // so defaulting to redirecting to the home page after posting might be safest.
        // Or, we can use a generic 'unknown' and let the /ask page decide.
        fromParam = "home"; // Or consider 'unknown' or the current pathname if appropriate
      }

      const askPageUrl = community
        ? `/ask?community=${community}&from=${fromParam}`
        : `/ask?from=${fromParam}`;
      router.push(askPageUrl);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginAlert(false);
    setShowLoginPopup(true);
  };

  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Debounced instant search
  useEffect(() => {
    if (!searchValue.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setSearchLoading(true);
    setShowSearchDropdown(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      // --- Fetch posts ---
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );
      const postsSnap = await getDocs(postsQuery);
      const posts = postsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as { title?: string; description?: string }),
        }))
        .filter(
          (post) =>
            (typeof post.title === "string" &&
              post.title.toLowerCase().includes(searchValue.toLowerCase())) ||
            (typeof post.description === "string" &&
              post.description
                .toLowerCase()
                .includes(searchValue.toLowerCase()))
        )
        .slice(0, 5);

      // --- Fetch comments ---
      const commentsQuery = query(collection(db, "comments"));
      const commentsSnap = await getDocs(commentsQuery);
      const comments = [];
      for (const docSnap of commentsSnap.docs) {
        const comment = docSnap.data();
        if (comment.text?.toLowerCase().includes(searchValue.toLowerCase())) {
          // Fetch parent post
          const postRef = doc(db, "posts", comment.postId);
          const postSnap = await getDoc(postRef);
          if (postSnap.exists()) {
            comments.push({
              id: docSnap.id,
              text: comment.text,
              postId: comment.postId,
              postTitle: postSnap.data().title,
            });
          }
        }
        if (comments.length >= 5) break;
      }
      setSearchResults({ posts, comments });
      setSearchLoading(false);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchValue]);

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b-[0.1px] border-black py-2 flex justify-between items-center gap-x-4 sm:gap-x-10 bg-white px-8 h-[56px]">
        {/* Mobile menu button - shown only on small screens */}
        <Button
          onClick={toggleNavbar}
          variant="ghost"
          size="sm"
          className="p-1 mr-2 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Link href="/" className="ml-[-20px]">
          <Image
            src="/logo.png"
            alt="logo"
            width={85}
            height={85}
            priority
            className="my-[-12px]"
          />
        </Link>

        <form
          onSubmit={handleSearch}
          className="w-full lg:max-w-lg max-w-sm hidden md:flex"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(e);
              }}
              placeholder="Search MathCom"
              className="w-full rounded-full bg-gray-100 border border-gray-200 py-2 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#11244DB2]"
              onFocus={() => {
                if (searchValue.trim()) setShowSearchDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#11244DB2]"
              tabIndex={-1}
            >
              <Search className="w-5 h-5" />
            </button>
            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : searchResults &&
                  (searchResults.posts.length > 0 ||
                    searchResults.comments.length > 0) ? (
                  <div>
                    {searchResults.posts.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1 text-xs text-gray-500 font-semibold">
                          Posts
                        </div>
                        {searchResults.posts.map((post) => (
                          <div
                            key={post.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() => router.push(`/post/${post.id}`)}
                          >
                            <div className="font-medium text-sm truncate">
                              {typeof post.title === "string" ? post.title : ""}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {typeof post.description === "string"
                                ? post.description
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.comments.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1 text-xs text-gray-500 font-semibold">
                          Comments
                        </div>
                        {searchResults.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() =>
                              router.push(`/post/${comment.postId}`)
                            }
                          >
                            <div className="text-xs text-gray-700 truncate">
                              {comment.text}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              in: {comment.postTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex gap-x-3 sm:gap-x-5 items-center">
          {/* Mobile Ask button */}
          {!user ? (
            <Button
              onClick={handleAskClick}
              className="md:hidden bg-transparent hover:bg-[#11244DB2]/10 rounded-full aspect-square p-0 border border-black hover:border-[#11244DB2] transition-colors"
              size="icon"
              variant="ghost"
            >
              <Plus strokeWidth={2} className="text-black" />
            </Button>
          ) : (
            <Button
              onClick={handleAskClick}
              className="md:hidden bg-[#11244DB2] rounded-full aspect-square p-0"
              size="icon"
            >
              <Plus strokeWidth={2} />
            </Button>
          )}

          {/* Desktop Ask button - only shown for logged in users */}
          {user ? (
            <Button
              onClick={handleAskClick}
              className="bg-[#11244DB2] rounded-full uppercase hidden sm:flex font-bold transition-colors hover:bg-[#11244D]/90 hover:shadow-md"
              size="lg"
            >
              <Plus strokeWidth={4} />
              Ask
            </Button>
          ) : (
            <Button
              onClick={handleAskClick}
              className="hidden sm:flex bg-transparent hover:bg-[#11244DB2]/10 rounded-full aspect-square p-2 transition-colors border border-black hover:border-[#11244DB2]"
              size="icon"
              variant="ghost"
            >
              <Plus strokeWidth={2} className="text-black" />
            </Button>
          )}

          {user ? (
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-full aspect-square p-0 overflow-hidden transition-shadow hover:ring-2 hover:ring-[#11244DB2] hover:shadow-md"
                    size="lg"
                    variant="secondary"
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-200 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={5}
                  className="shadow-md border border-gray-200 w-48 overflow-hidden rounded-xl mt-1 p-0"
                >
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer"
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-300 rounded-full mr-3" />
                    )}
                    <span className="font-medium text-sm">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile/edit")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span className="font-medium text-sm">Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              onClick={() => {
                setLoginRedirectPath("/");
                setShowLoginPopup(true);
              }}
              className="rounded-full px-5 py-2 bg-[#11244DB2] text-white hover:bg-[#11244D]/90"
            >
              Log In
            </Button>
          )}

          {/* Mobile Drawer for navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
              >
                <Menu className="h-[1rem] w-[1rem]" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0">
              <SheetTitle className="flex flex-col gap-4">
                <Image src="/logo.png" alt="logo" width={85} height={85} />
              </SheetTitle>
              <Navbar className="pr-6" />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Login Alert Dialog */}
      {/* Replace existing login alert dialog with LoginRequired component */}
      <LoginRequired
        isOpen={showLoginAlert}
        onClose={() => setShowLoginAlert(false)}
      />

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        redirectTo={loginRedirectPath}
      />
    </>
  );
}
