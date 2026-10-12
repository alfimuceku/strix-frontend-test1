import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { PlansView } from "@/views/PlansView";

export const metadata: Metadata = {
  title: "Plans and pricing",
  description: "Strix and Express evaluation plans from $10K to $100K. One-time fee, profit targets, trailing drawdowns and activation fees.",
  alternates: { canonical: "/plans" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Plans and pricing · Strix Options", description: "Strix and Express evaluation plans from $10K to $100K. One-time fee, profit targets, trailing drawdowns and activation fees.", url: "/plans", images: OG_IMAGES },
};

export default function Page() {
  return <PlansView />;
}
