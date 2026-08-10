import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/SocketProvider';
// 1. Primary Sans Font (Suisse Intl)
const suisseIntl = localFont({
  src: [
    {
      path: "../assets/fonts/SuisseIntl-Book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/SuisseIntl-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-suisse",
  display: "swap",
});

// 2. Display / Branding Font (PPAgrandir)
const ppAgrandir = localFont({
  src: [
    {
      path: "../assets/fonts/PPAgrandir-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-agrandir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velvet Mobility",
  description: "Secure Mobility Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${suisseIntl.variable} ${ppAgrandir.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              toastOptions={{
                duration: 5000,
                classNames: {
                  toast: 'font-display text-sm border-0 shadow-lg',
                  error: 'bg-red-50 text-red-800',
                  success: 'bg-green-50 text-green-800',
                  warning: 'bg-yellow-50 text-yellow-800',
                  info: 'bg-blue-50 text-blue-800',
                },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}