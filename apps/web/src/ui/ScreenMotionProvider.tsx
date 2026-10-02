import { useMemo, type ReactNode } from "react";
import { ScreenMotionContext, type ScreenMotionResolver } from "./screenMotion";

/** Gives every ScreenFrame the current route and the app's screen-to-screen relationships. */
export function ScreenMotionProvider({
  path,
  resolve,
  children,
}: {
  path: string;
  resolve: ScreenMotionResolver;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ path, resolve }), [path, resolve]);
  return <ScreenMotionContext.Provider value={value}>{children}</ScreenMotionContext.Provider>;
}
