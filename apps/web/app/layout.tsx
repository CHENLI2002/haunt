import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Haunt", template: "%s · Haunt" },
  description:
    "The venues you haunt — their character, their history, and who plays next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
