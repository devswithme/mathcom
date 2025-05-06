import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quickSand = Quicksand({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MathCom",
  description:
    "Your Personal Math Tutor, Reimagined - Built for students who want understanding, not just answers.",
  icons: {
    icon: "mathcom.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quickSand.className} antialiased`}>{children}</body>
    </html>
  );
}
