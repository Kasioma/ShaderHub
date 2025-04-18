import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeContextProvider } from "@/context/theme";
import TailwindIndicator from "@/components/TailwindIndicator";
import { ModalContextProvider } from "@/context/modal";
import { ClientProvider } from "@/context/clientProvider";

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
          <html lang="en" className={`${geist.variable}`}>
            <body>
              <ClientProvider>
                <TRPCReactProvider>{children}</TRPCReactProvider>
                <TailwindIndicator />
              </ClientProvider>
            </body>
          </html>
        </ModalContextProvider>
      </ThemeContextProvider>
    </ClerkProvider>
  );
}
