import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "Strix Options — Trade options. Get paid.";
/** A page that sets its own `openGraph` replaces the root one, file-based image included, so pages pass this back in. */
export const OG_IMAGES = [{ url: "/opengraph-image", ...OG_SIZE, alt: OG_ALT, type: "image/png" }];

/** Social card: the wordmark over a horizon line, in the site's midnight and ice. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(180deg, #020817 0%, #06142b 58%, #0b2a66 72%, #020817 100%)",
          color: "#f5f8ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: "#9ddcff", letterSpacing: 2 }}>
          <div style={{ width: 22, height: 22, border: "2px solid #9ddcff" }} />
          STRIX OPTIONS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Trade options. Get paid.</div>
          <div style={{ fontSize: 34, color: "rgba(226, 236, 255, 0.86)" }}>
            One evaluation, our capital, you keep 80%.
          </div>
        </div>
        <div style={{ height: 2, width: "100%", background: "linear-gradient(90deg, rgba(157,220,255,0), #9ddcff 50%, rgba(157,220,255,0))" }} />
      </div>
    ),
    OG_SIZE,
  );
}
