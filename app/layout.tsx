import type { Metadata } from "next";
// Note: Google Fonts are disabled for Docker builds due to network restrictions
// Using system fonts as fallback
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// // Configure fonts with fallbacks for environments without network access
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   fallback: ["system-ui", "sans-serif"],
//   display: "swap",
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   fallback: ["monospace"],
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "ACTUS Documentation",
  description: "Documentation for the ACTUS Projection Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
