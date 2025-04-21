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
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useNavbar } from '@/context/NavbarContext';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<null | { photoURL: string | null }>(null);
  const { isNavbarOpen, toggleNavbar } = useNavbar();

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
    router.push("/login");
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b-[0.1px] border-black px-4 sm:px-10 py-2 flex justify-between items-center gap-x-4 sm:gap-x-10 bg-white">
      {/* Mobile menu button - shown only on small screens */}
      <Button 
        onClick={toggleNavbar}
        variant="ghost" 
        size="sm" 
        className="p-1 mr-2 md:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <Link href="/">
        <Image src="/logo.svg" alt="logo" width={50} height={50} priority />
      </Link>
      
      <Button
        className="justify-start w-full lg:max-w-lg max-w-sm rounded-full hidden md:flex"
        size="lg"
        variant="secondary"
      >
        <Search className="mr-2" />
        <p className="text-muted-foreground">Search MathCom</p>
      </Button>
      
      <div className="flex gap-x-3 sm:gap-x-5 items-center">
        {!user && (
          <Link
            href="/login"
            className={buttonVariants({
              className:
                "!bg-[#11244DB2] !rounded-full !hidden sm:!flex !font-bold",
              size: "lg",
            })}
          >
            Log In
          </Link>
        )}

        <Link
          href="/ask"
          className={buttonVariants({
            className:
              "!bg-[#11244DB2] !rounded-full uppercase !hidden sm:!flex !font-bold",
            size: "lg",
          })}
        >
          <Plus strokeWidth={4} />
          Ask
        </Link>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-full aspect-square p-0"
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
              className="shadow-none bg-neutral-50 border w-42"
            >
              <DropdownMenuLabel className="flex gap-x-2.5 items-center">
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
                <p>Profile</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex items-center gap-x-2">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <Image src="/logo.svg" alt="logo" width={50} height={50} />
            </SheetTitle>
            <Navbar className="pr-6" />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
