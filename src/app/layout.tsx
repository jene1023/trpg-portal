import type { Metadata } from "next";
import { Cinzel, Crimson_Text } from "next/font/google";
import "./globals.css";
import NavBar from "./_components/NavBar";
import ServiceWorkerRegistrar from "./_components/ServiceWorkerRegistrar";
import AuthProvider from "./_components/AuthProvider";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoC Portal",
  description: "クトゥルフ神話TRPG キャラクター管理ポータル",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoC Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${cinzel.variable} ${crimsonText.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#1a0f0a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-coc-bg text-coc-text">
        <AuthProvider>
          <ServiceWorkerRegistrar />
          <NavBar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
