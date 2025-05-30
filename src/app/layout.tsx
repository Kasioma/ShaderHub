import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeContextProvider } from "@/context/themeProvider";
import TailwindIndicator from "@/components/TailwindIndicator";
import { ModalContextProvider } from "@/context/searchProvider";
import { ClientProvider } from "@/context/clientProvider";
import { Toaster } from "@/components/toaster/toaster";
import { ObjectModalContextProvider } from "@/context/objectProvider";
import { CollectionContextProvider } from "@/context/collectionProvider";

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
        <ModalContextProvider>
          <ObjectModalContextProvider>
            <CollectionContextProvider>
              <html lang="en" className={`${geist.variable}`}>
                <body>
                  <ClientProvider>
                    <TRPCReactProvider>{children}</TRPCReactProvider>
                    <Toaster />
                    <TailwindIndicator />
                  </ClientProvider>
                </body>
              </html>
            </CollectionContextProvider>
          </ObjectModalContextProvider>
        </ModalContextProvider>
      </ThemeContextProvider>
    </ClerkProvider>
  );
}
