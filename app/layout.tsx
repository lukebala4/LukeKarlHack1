import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lightfern Champion Engine",
  description: "Evidence-based GTM champion discovery for Lightfern — on Unify + Zero + Scaile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
