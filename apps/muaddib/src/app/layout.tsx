import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@arrakis/fremen/react/styles.css";
import "./globals.css";

import { TopBar } from "@/components/TopBar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Muaddib — Arrakis demo",
  description:
    "Progressive-enhancement Next.js demo of @arrakis/spice + @arrakis/fremen.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TopBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
