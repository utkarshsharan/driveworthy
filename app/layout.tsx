import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://driveworthy-bengaluru.creamy-hill-8809.chatgpt.site"),
  icons: { icon: "/favicon.svg" },
  title: "Driveworthy | The best pre-owned luxury car deals in Bengaluru",
  description: "Compare luxury used cars across Bengaluru, understand fair value, and discover the strongest deals with a transparent score.",
  openGraph: {
    title: "Driveworthy — Buy the car, not the sales pitch",
    description: "Independent, multi-source intelligence for pre-owned luxury cars in Bengaluru.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Driveworthy market intelligence for pre-owned luxury cars in Bengaluru" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Driveworthy — Buy the car, not the sales pitch",
    description: "Independent, multi-source intelligence for pre-owned luxury cars in Bengaluru.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        {/* The public site is delivered through Vercel, so load its first-party
            visitor script from that deployment rather than the marketplace API. */}
        <script defer src="https://driveworthy.vercel.app/_vercel/insights/script.js" />
      </body>
    </html>
  );
}
