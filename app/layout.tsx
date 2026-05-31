import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiftLog - Workout Tracker",
  description: "Track your workouts with progressive overload",
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

// Made with Bob
