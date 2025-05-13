"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Redirect to home page immediately
  useEffect(() => {
    router.push(redirectTo);
  }, [router, redirectTo]);

  return <LoadingPage message="Redirecting..." />;
};

export default Page;
