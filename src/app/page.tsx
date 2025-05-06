"use client";

import { BackgroundGradientAnimation } from "@/components/bg";
import { Hero } from "@/components/hero";

const Page = () => {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(250, 247, 245)"
      gradientBackgroundEnd="rgb(250, 247, 245)"
      firstColor="62, 75, 104"
      secondColor="127, 0, 0"
      thirdColor="255, 200, 87"
      fourthColor="250, 247, 245"
      fifthColor="180, 50, 50"
      size="100%"
      blendingValue="soft-light"
    >
      <Hero />
    </BackgroundGradientAnimation>
  );
};

export default Page;
