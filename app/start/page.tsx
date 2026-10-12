import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { StartView } from "@/views/StartView";

export const metadata: Metadata = {
  title: "Start your evaluation",
  description: "One fee, paid once. Pick a Strix or Express plan and start your evaluation.",
  alternates: { canonical: "/start" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Start your evaluation · Strix Options", description: "One fee, paid once. Pick a Strix or Express plan and start your evaluation.", url: "/start", images: OG_IMAGES },
};

export default function Page() {
  return <StartView />;
}
