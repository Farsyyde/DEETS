import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEETS - NFT Whitelist & Collaboration Platform",
  description: "Manage your NFT project whitelists, collaborations, and applications in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
