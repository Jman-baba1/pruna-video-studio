import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pruna Video Studio",
  description: "Create cinematic videos with P-Video-2-Pro",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
