import type { Metadata } from "next";
import { RouteLoadingOverlay } from "../components/route-loading-overlay";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><RouteLoadingOverlay />{children}</body></html>;
}
