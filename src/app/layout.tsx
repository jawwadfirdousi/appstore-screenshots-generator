import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "appstore-screenshots-generator",
  description: "Generate localized iOS App Store marketing screenshots.",
  icons: {
    icon: "favicon.ico",
    shortcut: "favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
