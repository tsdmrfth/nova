import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import type { Application } from "pixi.js";
import type { HomeWorldHandle } from "./homeWorld";
import type { SceneStageHandle, SceneStageProps } from "./sceneTypes";
import { isUsableViewSize, LAYOUT_DEBOUNCE_MS } from "./viewSize";

export type { SceneStageHandle, SceneStageProps } from "./sceneTypes";

export const HomeSceneHost = forwardRef(function HomeSceneHost(
  {
    pack,
    selected,
    phase,
    reducedMotion,
    dpr,
    className,
    onReady,
  }: SceneStageProps,
  ref: Ref<SceneStageHandle>,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HomeWorldHandle | null>(null);
  const appRef = useRef<Application | null>(null);
  const mountGenRef = useRef(0);
  const selectedRef = useRef(selected);
  const phaseRef = useRef(phase);
  const reducedRef = useRef(reducedMotion);

  useEffect(() => {
    selectedRef.current = selected;
    worldRef.current?.setSelected(selected);
  }, [selected]);

  useEffect(() => {
    phaseRef.current = phase;
    worldRef.current?.setPhase(phase);
  }, [phase]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
    worldRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useImperativeHandle(ref, () => ({
    hibernate() {
      appRef.current?.ticker.stop();
    },
    resume() {
      appRef.current?.ticker.start();
    },
    destroy() {
      worldRef.current?.destroy();
      worldRef.current = null;
      appRef.current?.ticker.stop();
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      hostRef.current?.replaceChildren();
    },
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const resolution = Math.min(dpr, 2);
    const mountGen = mountGenRef.current;
    let cancelled = false;
    let tornDown = false;
    let instance: Application | undefined;
    let detachResize: (() => void) | undefined;

    const stale = () => cancelled || mountGen !== mountGenRef.current;

    const destroyInstance = (app: Application | undefined) => {
      if (!app) {
        return;
      }
      try {
        app.ticker.stop();
        app.destroy(true, { children: true });
      } catch {
        // Pixi throws if destroy runs twice during StrictMode races.
      }
    };

    const teardown = () => {
      if (tornDown) {
        return;
      }
      tornDown = true;
      detachResize?.();
      detachResize = undefined;
      worldRef.current?.destroy();
      worldRef.current = null;
      appRef.current = null;
      destroyInstance(instance);
      instance = undefined;
      if (host.isConnected) {
        host.replaceChildren();
      }
    };

    void (async () => {
      try {
        const [{ Application: PixiApplication }, { mountHomeWorld }] =
          await Promise.all([import("pixi.js"), import("./homeWorld")]);
        if (stale() || !host.isConnected) {
          return;
        }

        instance = new PixiApplication();
        appRef.current = instance;
        await instance.init({
          background: 0x07111c,
          antialias: true,
          autoDensity: true,
          resolution,
          resizeTo: host,
          preference: "webgl",
        });

        if (stale()) {
          teardown();
          return;
        }

        instance.stage.eventMode = "none";
        instance.stage.interactiveChildren = false;
        const world = await mountHomeWorld(instance, pack);
        if (stale()) {
          world.destroy();
          teardown();
          return;
        }

        world.setSelected(selectedRef.current);
        world.setPhase(phaseRef.current);
        world.setReducedMotion(reducedRef.current);
        world.layout(instance.renderer.width, instance.renderer.height);
        worldRef.current = world;
        const pixi = instance;

        const onTick = () => {
          if (stale()) {
            return;
          }
          world.tick(pixi.ticker.lastTime);
        };
        pixi.ticker.add(onTick);

        let resizeTimer: number | undefined;
        const observer = new ResizeObserver(() => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            if (stale() || tornDown) {
              return;
            }
            const width = pixi.renderer.width;
            const height = pixi.renderer.height;
            if (isUsableViewSize(width, height)) {
              world.layout(width, height);
            }
          }, LAYOUT_DEBOUNCE_MS);
        });
        observer.observe(host);
        detachResize = () => {
          window.clearTimeout(resizeTimer);
          observer.disconnect();
          pixi.ticker.remove(onTick);
        };

        if (stale()) {
          world.destroy();
          worldRef.current = null;
          teardown();
          return;
        }

        host.replaceChildren(instance.canvas);
        onReady?.();
      } catch (error) {
        console.error("[nova] Home scene failed to start", error);
        teardown();
      }
    })();

    return () => {
      cancelled = true;
      mountGenRef.current += 1;
      teardown();
    };
  }, [pack, dpr, onReady]);

  return (
    <div
      ref={hostRef}
      className={["scene-host", className].filter(Boolean).join(" ")}
      data-testid="scene-stage"
      role="img"
      aria-label="Nova Archipelago at sunset"
    />
  );
});
