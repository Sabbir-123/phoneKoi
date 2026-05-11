import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Phone Koi | Community-Driven IMEI Verification",
  description: "Know the truth before you buy. Real-time IMEI risk scoring and theft reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col text-indigo-950`}>
        <QueryProvider>
          <Navbar />
          <main className="relative flex flex-col items-center justify-start flex-1 w-full">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
