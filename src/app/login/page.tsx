"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Logged in as:", user.displayName);

      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <main className="px-6 sm:px-0 sm:pr-8 sm:pl-[28rem] pt-24 sm:pt-36 pb-8 flex flex-col md:flex-row items-start gap-5">
      <div className="bg-neutral-50 py-8 px-10 rounded-xl max-w-md w-full space-y-5 shadow-md border">
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-2xl">Log In</h1>
          <p className="text-muted-foreground text-sm font-semibold">
            Access your account to continue learning.
          </p>
        </div>
        <Button
          onClick={handleLogin}
          className="w-full border-black font-semibold"
          size="lg"
          variant="outline"
        >
          <Image 
            src="/google.svg" 
            alt="google" 
            width={25} 
            height={25}
            className="mr-2"
          />
          Continue with Google
        </Button>
        <p className="text-sm text-muted-foreground mt-3 font-semibold text-center">
          New to MathCom?{" "}
          <Link href="/signup" className="text-[#11244DB2]">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Page;
