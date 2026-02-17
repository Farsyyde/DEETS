import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEETS — Launch Infrastructure",
  description: "Everything your launch needs in one place. Structured whitelist management, verifiable process, and community trust.",
  icons: {
    icon: "/DEETS_logo.png",
    apple: "/DEETS_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
