import type { Metadata, Viewport } from "next";
import { RouteLoadingOverlay } from "../components/route-loading-overlay";
import { ScrollProgress } from "../components/scroll-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nche — Risk intelligence for every sensitive action",
  description: "Measured, explainable account-takeover risk intelligence for Nigerian financial institutions.",
  icons: {
    icon: "/Nche-Icon.png",
    shortcut: "/Nche-Icon.png",
    apple: "/Nche-Icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ScrollProgress /><RouteLoadingOverlay />{children}</body></html>;
}
