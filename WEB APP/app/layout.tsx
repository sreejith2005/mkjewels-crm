import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "MK Jewels CRM",
  description: "MK Jewels in-house customer relationship management system",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
