import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { LegalView } from "@/views/LegalView";

export const metadata: Metadata = {
  title: "Terms and policies",
  description: "Terms of Service, Privacy Policy, SMS Terms and Rewards Terms for Strix Options.",
  alternates: { canonical: "/legal" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Terms and policies · Strix Options", description: "Terms of Service, Privacy Policy, SMS Terms and Rewards Terms for Strix Options.", url: "/legal", images: OG_IMAGES },
};

export default function Page() {
  return <LegalView />;
}
