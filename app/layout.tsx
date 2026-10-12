import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import "./interior.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileStartBar } from "@/components/layout/MobileStartBar";
import { RouteTransitions } from "@/components/layout/RouteTransitions";
import { SITE_URL } from "@/lib/config";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Strix Options — Beyond the market",
    template: "%s · Strix Options",
  },
  description:
    "Strix Options is the prop firm built around options trading. Pass one evaluation, unlock funded capital up to $1M, and keep 80% of what you earn.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Strix Options",
    title: "Strix Options — Trade options. Get paid.",
    description: "One evaluation, our capital, you keep 80%. Level 5 permissions, one trailing drawdown, payouts every 14 days.",
  },
  twitter: { card: "summary_large_image", site: "@StrixOptions" },
  icons: { icon: "/favicon.svg" },

  // Prevent search engines from indexing this public mockup
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#020817",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <MobileStartBar />
        <RouteTransitions />
      </body>
    </html>
  );
}
