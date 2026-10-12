import type { Metadata } from "next";
import { OG_IMAGES } from "@/lib/ogImage";
import { PayoutsView } from "@/views/PayoutsView";

export const metadata: Metadata = {
  title: "Payouts",
  description: "How Strix payouts work: 80/20 split, 8 winning days per cycle, caps that rise with every payout and no caps in Live.",
  alternates: { canonical: "/payouts" },
  openGraph: { type: "website", siteName: "Strix Options", title: "Payouts · Strix Options", description: "How Strix payouts work: 80/20 split, 8 winning days per cycle, caps that rise with every payout and no caps in Live.", url: "/payouts", images: OG_IMAGES },
};

export default function Page() {
  return <PayoutsView />;
}
