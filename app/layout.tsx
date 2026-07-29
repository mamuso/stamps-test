import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Rubber Stamp Effect",
  description: "Interactive rubber stamp visual effect demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
