"use client";

import type { StoryController } from "@/lib/story";

const STOPS = [
  { t: 0.0, label: "Strix" },
  { t: 1.05, label: "Markets" },
  { t: 2.05, label: "Risk engine" },
  { t: 3.6, label: "Desk" },
  { t: 4.6, label: "Get funded" },
];

/**
 * Right-edge altimeter: five stops, a fill that tracks story time,
 * and jump links (each is a real button for keyboard users).
 */
export function JourneyRail({ story }: { story: StoryController | null }) {
  return (
    <nav className="rail" aria-label="Journey">
      <div className="rail__track" aria-hidden="true">
        <span className="rail__fill" />
      </div>
      <ol>
        {STOPS.map((s, i) => (
          <li key={s.label} data-i={i}>
            <button type="button" onClick={() => story?.scrollToT(s.t)}>
              <span className="rail__num" aria-hidden="true">
                {["I", "II", "III", "IV", "V"][i]}
              </span>
              <span className="rail__label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
