import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeContextProvider } from "@/context/theme";
import TailwindIndicator from "@/components/TailwindIndicator";

export const metadata: Metadata = {
  title: "ShaderHub",
  description: "3D Web Repository",
  icons: "/favicon.png",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <ThemeContextProvider>
        <html lang="en" className={`${geist.variable}`}>
          <body>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <TailwindIndicator />
          </body>
        </html>
      </ThemeContextProvider>
    </ClerkProvider>
  );
}
