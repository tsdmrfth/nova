import { createContext, useContext, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * How two screens pass. Translate only, no fade.
 *
 * `forward` / `back` — steps of the day, a full horizontal handoff.
 * `up` / `down` — a layer over the open screen (Buy, demo). The layer travels
 * the full height; the screen underneath only shifts, so it stays visible.
 * `aside` / `return` — another place (Neighborhood). A full vertical handoff,
 * arriving from the top, so it does not read as the next day step or as a layer.
 */
export type ScreenMotion = "forward" | "back" | "up" | "down" | "aside" | "return" | "none";

export type ScreenMotionResolver = (from: string, to: string) => ScreenMotion;

const SCREEN_SLIDE_MS = 420;
const SCREEN_SLIDE_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";

/** A copy older than this belongs to a screen nothing replaced in time. */
const GHOST_TTL_MS = 1000;

/**
 * `enter` is where the new screen starts, `exit` where the old one ends.
 * `cover` is which one stays on top when they overlap (layers only).
 */
const SLIDES: Record<
  Exclude<ScreenMotion, "none">,
  { enter: string; exit: string; cover: "enter" | "exit" | "none" }
> = {
  forward: { enter: "100%, 0", exit: "-100%, 0", cover: "none" },
  back: { enter: "-100%, 0", exit: "100%, 0", cover: "none" },
  up: { enter: "0, 100%", exit: "0, -12%", cover: "enter" },
  down: { enter: "0, -12%", exit: "0, 100%", cover: "exit" },
  aside: { enter: "0, -100%", exit: "0, 100%", cover: "none" },
  return: { enter: "0, 100%", exit: "0, -100%", cover: "none" },
};

type MotionContext = { path: string | null; resolve: ScreenMotionResolver };

/** Current route + the app's screen relationships. Without a provider nothing slides. */
export const ScreenMotionContext = createContext<MotionContext>({ path: null, resolve: () => "none" });

type Ghost = {
  node: HTMLElement;
  scroll: [Element, number][];
  from: string;
  owner: object;
  at: number;
};

/** The last screen that left, waiting for the next ScreenFrame to mount. */
let pending: Ghost | null = null;

function motionOff(): boolean {
  if (document.documentElement.dataset.calm) return true;
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Copies a leaving screen's stage while it is still in the document. The copy
 * is inert: no ids, no fit regions, form and scroll state carried over.
 */
function captureScreen(stage: HTMLElement, frame: HTMLElement, from: string, owner: object) {
  if (!stage.isConnected) return;
  const node = stage.cloneNode(true) as HTMLElement;
  const fit = frame.style.getPropertyValue("--nv-fit");
  if (fit) node.style.setProperty("--nv-fit", fit);
  node.setAttribute("aria-hidden", "true");
  node.inert = true;

  const live: Element[] = [stage, ...stage.querySelectorAll("*")];
  const copy: Element[] = [node, ...node.querySelectorAll("*")];
  const scroll: [Element, number][] = [];
  live.forEach((el, i) => {
    const twin = copy[i];
    if (!twin) return;
    if (el.scrollTop > 0) scroll.push([twin, el.scrollTop]);
    if (el instanceof HTMLInputElement && twin instanceof HTMLInputElement) {
      twin.checked = el.checked;
      twin.value = el.value;
    }
    twin.removeAttribute("id");
    twin.removeAttribute("data-testid");
    twin.removeAttribute("data-nv-fit");
  });

  pending = { node, scroll, from, owner, at: performance.now() };
}

/** Slides the pending copy out of `slot` and `stage` in, in the direction `resolve` picks. */
function enterScreen(
  stage: HTMLElement,
  slot: HTMLElement,
  to: string,
  owner: object,
  resolve: ScreenMotionResolver,
) {
  const ghost = pending;
  pending = null;
  // StrictMode remounts a frame in place; its own copy is not a previous screen.
  if (!ghost || ghost.owner === owner || performance.now() - ghost.at > GHOST_TTL_MS) return;
  const motion = resolve(ghost.from, to);
  if (motion === "none" || motionOff() || typeof stage.animate !== "function") return;

  slot.append(ghost.node);
  for (const [el, top] of ghost.scroll) el.scrollTop = top;

  const slide = SLIDES[motion];
  if (slide.cover === "enter") {
    stage.style.zIndex = "2";
    slot.style.zIndex = "1";
  } else if (slide.cover === "exit") {
    stage.style.zIndex = "1";
    slot.style.zIndex = "2";
  }
  const timing = { duration: SCREEN_SLIDE_MS, easing: SCREEN_SLIDE_EASING };
  stage.animate([{ transform: `translate3d(${slide.enter}, 0)` }, { transform: "none" }], timing);
  const exit = ghost.node.animate(
    [{ transform: "none" }, { transform: `translate3d(${slide.exit}, 0)` }],
    { ...timing, fill: "forwards" },
  );
  const drop = () => {
    stage.style.zIndex = "";
    slot.style.zIndex = "";
    ghost.node.remove();
  };
  exit.onfinish = drop;
  exit.oncancel = drop;
}

/**
 * Route transitions for one ScreenFrame. On unmount the stage is copied (the
 * DOM is still attached during React's layout cleanup); the next frame to
 * mount slides that copy out and itself in. The plate never moves.
 * Each route must render its own page component: a frame React reuses across
 * routes has no unmount, so that change does not slide.
 */
export function useScreenSlide(
  frameRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  slotRef: RefObject<HTMLElement | null>,
) {
  const { path, resolve } = useContext(ScreenMotionContext);
  const owner = useRef<object>({});
  const latest = useRef({ path, resolve });

  useLayoutEffect(() => {
    latest.current = { path, resolve };
  }, [path, resolve]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const slot = slotRef.current;
    const self = owner.current;
    const { path: to, resolve: pick } = latest.current;
    if (!frame || !stage || !slot || to === null) return;
    enterScreen(stage, slot, to, self, pick);
    return () => {
      const from = latest.current.path;
      if (from !== null) captureScreen(stage, frame, from, self);
    };
  }, [frameRef, stageRef, slotRef]);
}
