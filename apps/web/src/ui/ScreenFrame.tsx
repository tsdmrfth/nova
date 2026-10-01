import { useRef, type ReactNode } from "react";
import { getAssetUrl } from "@nova/assets";
import { useFrameFit } from "./useFrameFit";

export const PLATE_ID = "scene_nova_city";

/** City + Nova plate with the kit's two readability gradients. */
export function NovaScene({ dim = false }: { dim?: boolean }) {
  const plate = getAssetUrl(PLATE_ID);
  return (
    <div className="nv-scene" aria-hidden="true" data-testid="nova-scene">
      {plate ? (
        <img className="nv-scene__plate" src={plate} alt="" draggable={false} />
      ) : null}
      <div className="nv-scene__shade" />
      {dim ? <div className="nv-scene__dim" data-testid="nova-scene-dim" /> : null}
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
  useFrameFit(frameRef, !scroll);
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
        <NovaScene dim={dim} />
        <div className="nv-screen__hud" data-nv-fit={scroll ? undefined : ""}>
          {children}
        </div>
        {overlay}
      </div>
    </section>
  );
}

/** Centres a modal card over the frame. `fill` sheets (Menu) scroll; the others shrink to fit. */
export function FrameOverlay({
  children,
  align = "center",
  testId,
}: {
  children: ReactNode;
  align?: "center" | "top" | "fill";
  testId?: string;
}) {
  return (
    <div
      className={`nv-overlay nv-overlay--${align}`}
      data-nv-fit={align === "fill" ? undefined : ""}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
