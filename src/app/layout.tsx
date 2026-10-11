import type { ReactNode } from "react";
import "./globals.css";

// The <html> element lives in [locale]/layout.tsx so it can carry the lang attribute.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
