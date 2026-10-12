import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { SignInView } from "@/views/SignInView";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Strix dashboard to trade, track your evaluation and request payouts.",
  alternates: { canonical: "/sign-in" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Sign in · Strix Options", description: "Sign in to your Strix dashboard to trade, track your evaluation and request payouts.", url: "/sign-in", images: OG_IMAGES },
  robots: { index: false },
};

export default function Page() {
  return <SignInView />;
}
