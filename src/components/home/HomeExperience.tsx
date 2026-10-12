"use client";

import { useEffect, useRef, useState } from "react";
import { StoryController } from "@/lib/story";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { Stage } from "./Stage";
import { JourneyRail } from "./JourneyRail";
import { MonumentChapter } from "./chapters/MonumentChapter";
import { MarketChapter } from "./chapters/MarketChapter";
import { EngineChapter } from "./chapters/EngineChapter";
import { PassageChapter } from "./chapters/PassageChapter";
import { TerminalChapter } from "./chapters/TerminalChapter";
import { HorizonChapter } from "./chapters/HorizonChapter";

/**
 * The homepage journey. Content is ordinary, server-renderable HTML in reading
 * order; the story controller and the WebGL stage are layered on top.
 */
export function HomeExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [story, setStory] = useState<StoryController | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const s = new StoryController(rootRef.current, { reducedMotion: reduced });
    s.start();
    setStory(s);
    document.documentElement.classList.add("is-home");
    const snap = () => s.snap();
    window.addEventListener("strix:snap", snap);
    return () => {
      window.removeEventListener("strix:snap", snap);
      s.stop();
      document.documentElement.classList.remove("is-home");
      delete document.documentElement.dataset.world;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => story?.setReducedMotion(reduced), [story, reduced]);

  return (
    <div className="journey" ref={rootRef}>
      <Stage story={story} reducedMotion={reduced} />
      <JourneyRail story={story} />
      <div className="journey__content">
        <MonumentChapter />
        <MarketChapter />
        <EngineChapter />
        <PassageChapter />
        <TerminalChapter />
        <HorizonChapter />
      </div>
    </div>
  );
}
