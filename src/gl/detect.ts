/** Cheap capability probe — real failures are still caught when the renderer starts. */
export function hasWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const ok = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export function isCompactDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1024px)").matches;
}
