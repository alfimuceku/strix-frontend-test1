import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { FaqView } from "@/views/FaqView";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Strix Options evaluations, rules, payouts and support.",
  alternates: { canonical: "/faq" },
  openGraph: { type: "website", siteName: "Strix Options", title: "FAQ · Strix Options", description: "Answers to common questions about Strix Options evaluations, rules, payouts and support.", url: "/faq", images: OG_IMAGES },
};

export default function Page() {
  return <FaqView />;
}
