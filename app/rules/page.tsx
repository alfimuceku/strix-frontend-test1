import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { RulesView } from "@/views/RulesView";

export const metadata: Metadata = {
  title: "Trading rules",
  description: "Evaluation, Funded and Live rules for every Strix Options plan: targets, trailing drawdowns, payout caps and more.",
  alternates: { canonical: "/rules" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Trading rules · Strix Options", description: "Evaluation, Funded and Live rules for every Strix Options plan: targets, trailing drawdowns, payout caps and more.", url: "/rules", images: OG_IMAGES },
};

export default function Page() {
  return <RulesView />;
}
