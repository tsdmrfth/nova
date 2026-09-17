import { useEffect, useRef } from "react";
import type { Application } from "pixi.js";

export function HomeSceneHost() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let cancelled = false;
    let app: Application | undefined;

    void (async () => {
      try {
        const { Application: PixiApplication } = await import("pixi.js");
        if (cancelled || !host.isConnected) {
          return;
        }

        const instance = new PixiApplication();
        await instance.init({
          background: 0x0b1a2e,
          antialias: true,
          autoDensity: true,
          resizeTo: host,
        });

        if (cancelled) {
          instance.destroy(true);
          return;
        }

        app = instance;
        host.replaceChildren(instance.canvas);
      } catch {
        // An empty host is enough for this stub if WebGL is unavailable.
      }
    })();

    return () => {
      cancelled = true;
      app?.destroy(true);
      app = undefined;
      host.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="scene-host"
      role="img"
      aria-label="Home scene"
    />
  );
}
