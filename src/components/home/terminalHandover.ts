import type { SceneState } from "@/gl/camera";
import { evaluatePanels, NO_PANELS, type PanelUniforms, type ScreenRect } from "@/gl/panels";

/** Where the frames wait for the dashboard: their top edge holds at this fraction of the viewport. */
const ANCHOR = 0.36;
/** Scroll distance (fraction of the viewport) over which 3D hands over to the HTML. */
const FADE = 0.22;

/**
 * Couples the 3D glass frames to the HTML dashboard. The frames settle onto
 * the panels' on-screen rects (held at an anchor line until the dashboard
 * scrolls up to meet them), then the dashboard fades in through `--term-in`
 * as the frames fade out. With motion off it does nothing: the dashboard is
 * always fully visible.
 */
export function createTerminalHandover(enabled: boolean) {
  let terminal: HTMLElement | null = null;
  let cards: HTMLElement[] = [];
  let last = -1;
  // document-space layout, measured once and on resize, so a frame never forces a reflow
  let termTop = 0;
  let boxes: ScreenRect[] = [];
  let vw = 1, vh = 1;
  let dirty = true;
  const ro = new ResizeObserver(() => (dirty = true));
  ro.observe(document.body); // content above the terminal moving it down
  const onResize = () => (dirty = true);
  window.addEventListener("resize", onResize, { passive: true });

  // set on the dashboard itself, the only reader, so the rest of the page keeps its styles
  const setVar = (v: number) => {
    if (!terminal || Math.abs(v - last) < 0.005) return;
    last = v;
    terminal.style.setProperty("--term-in", v.toFixed(3));
  };

  const measure = () => {
    dirty = false;
    vw = window.innerWidth;
    vh = window.innerHeight;
    if (!terminal) return;
    const sy = window.scrollY;
    termTop = terminal.getBoundingClientRect().top + sy;
    boxes = cards.slice(0, 4).map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left, y: r.top + sy, w: r.width, h: r.height };
    });
  };

  return {
    update(T: number, scene: SceneState): PanelUniforms {
      if (!enabled) return NO_PANELS;
      if (T < 3.15 || T > 4.3 || scene.space !== 1) {
        setVar(1);
        return NO_PANELS;
      }
      if (!terminal?.isConnected) {
        if (terminal) ro.unobserve(terminal);
        terminal = document.querySelector<HTMLElement>(".chapter--terminal .terminal");
        cards = terminal ? Array.from(terminal.querySelectorAll<HTMLElement>(".terminal__grid > .panel")) : [];
        if (terminal) ro.observe(terminal); // panels change height as the visitor plays with them
        last = -1;
        dirty = true;
      }
      if (!terminal || !cards.length) return NO_PANELS;
      if (dirty) measure();
      const sy = window.scrollY;
      const top = termTop - sy;
      const anchor = vh * ANCHOR;
      const shift = Math.max(0, top - anchor);
      const handover = Math.min(1, Math.max(0, (anchor - top) / (vh * FADE)));
      setVar(handover);
      const rects: ScreenRect[] = boxes.map((b) => ({ x: b.x, y: b.y - sy - shift, w: b.w, h: b.h }));
      return evaluatePanels(T, scene.camPos, scene.camTgt, scene.fov, { w: vw, h: vh }, rects, handover);
    },
    dispose() {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      terminal?.style.removeProperty("--term-in");
    },
  };
}
