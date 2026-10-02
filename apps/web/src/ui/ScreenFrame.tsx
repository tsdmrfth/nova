import { useLayoutEffect, useRef, type ReactNode } from "react";
import { getAssetUrl } from "@nova/assets";
import { useScreenSlide } from "./screenMotion";
import { useFrameFit } from "./useFrameFit";

export const PLATE_ID = "scene_nova_city";

/** City + Nova plate with the kit's two readability gradients. It stays put while screens slide. */
export function NovaScene() {
  const plate = getAssetUrl(PLATE_ID);
  return (
    <div className="nv-scene" aria-hidden="true" data-testid="nova-scene">
      {plate ? (
        <img className="nv-scene__plate" src={plate} alt="" draggable={false} />
      ) : null}
      <div className="nv-scene__shade" />
    </div>
  );
}

type ScreenFrameProps = {
  children: ReactNode;
  /** Rendered above the HUD, pinned to the frame (modals, toasts, sheets). */
  overlay?: ReactNode;
  dim?: boolean;
  /** Let the HUD scroll (long pages like /demo). Default: shrink to fit, never scroll. */
  scroll?: boolean;
  className?: string;
  testId?: string;
};

/**
 * Portrait phone frame. Full screen on phones; on desktop a centred 430px
 * column with a blurred copy of the plate behind it, so Nova stays on the
 * column's right edge. The HUD scales with the frame (`--u`, styles/scale.css).
 *
 * Everything that belongs to one screen (dim, HUD, overlay) sits in the stage,
 * which slides on route changes over the fixed plate (screenMotion.tsx).
 * `className` lands on the stage too, so a sliding copy keeps its screen styles.
 */
export function ScreenFrame({
  children,
  overlay,
  dim = false,
  scroll = false,
  className,
  testId,
}: ScreenFrameProps) {
  const plate = getAssetUrl(PLATE_ID);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  useFrameFit(frameRef, !scroll);
  useScreenSlide(frameRef, stageRef, slotRef);
  return (
    <section
      className={className ? `nv-screen ${className}` : "nv-screen"}
      data-testid={testId}
    >
      {plate ? (
        <img
          className="nv-screen__backdrop"
          src={plate}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ) : null}
      <div className="nv-screen__frame" ref={frameRef}>
        <NovaScene />
        <div
          className={className ? `nv-screen__stage ${className}` : "nv-screen__stage"}
          ref={stageRef}
        >
          {dim ? <div className="nv-scene__dim" data-testid="nova-scene-dim" /> : null}
          <div className="nv-screen__hud" data-nv-fit={scroll ? undefined : ""}>
            {children}
          </div>
          {overlay}
        </div>
        <div className="nv-screen__ghost" ref={slotRef} aria-hidden="true" />
      </div>
    </section>
  );
}

/** Exit for a `rise` overlay: the same path back down, quicker and ease-in (Menu's pull-back). */
const SINK = "translate3d(0, 100%, 0)";
const SINK_OUT = { duration: 260, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" as const };

/**
 * Centres a modal card over the frame. `fill` sheets (Menu) scroll; the others shrink to fit.
 * `scrim` covers the whole screen, HUD included (use it instead of ScreenFrame `dim`).
 * `rise` slides the card up from the bottom edge; pass it only when motion is allowed.
 * `leaving` slides a `rise` card back down, then calls `onLeft`; without `rise` it calls it at once.
 */
export function FrameOverlay({
  children,
  align = "center",
  scrim = false,
  rise = false,
  leaving = false,
  onLeft,
  testId,
}: {
  children: ReactNode;
  align?: "center" | "top" | "fill";
  scrim?: boolean;
  rise?: boolean;
  leaving?: boolean;
  onLeft?(): void;
  testId?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!leaving) return;
    const box = boxRef.current;
    if (!rise || !box || typeof box.animate !== "function") {
      onLeft?.();
      return;
    }
    const anim = box.animate([{ transform: "none" }, { transform: SINK }], SINK_OUT);
    anim.onfinish = () => onLeft?.();
    return () => {
      anim.onfinish = null;
    };
    // Only when `leaving` flips on; a new `onLeft` each render must not restart the exit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <>
      {scrim ? <div className="nv-overlay-scrim" data-testid="frame-overlay-scrim" /> : null}
      <div
        className={`nv-overlay nv-overlay--${align}${rise ? " nv-overlay--rise" : ""}${leaving ? " is-leaving" : ""}`}
        data-nv-fit={align === "fill" ? undefined : ""}
        data-testid={testId}
        ref={boxRef}
      >
        {children}
      </div>
    </>
  );
}
