import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1d4ed8 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            opacity: 0.85,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Professional Networking
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.3,
              maxWidth: 900,
              color: "#cbd5e1",
            }}
          >
            Publish ideas, grow your reputation, and connect with people shaping
            the future of work.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#bfdbfe",
          }}
        >
          <span>theconst.com</span>
          <span>Insights • Profiles • Community</span>
        </div>
      </div>
    ),
    size,
  );
}
