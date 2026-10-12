import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { ContactView } from "@/views/ContactView";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Strix Options support by email or Discord. Replies usually land within 8 hours.",
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Contact · Strix Options", description: "Contact Strix Options support by email or Discord. Replies usually land within 8 hours.", url: "/contact", images: OG_IMAGES },
};

export default function Page() {
  return <ContactView />;
}
