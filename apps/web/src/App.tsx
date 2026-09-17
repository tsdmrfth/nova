import { canonManifest } from "@nova/assets";
import { appConfig } from "@nova/config";
import { hello } from "@nova/shared";
import "./App.css";

const title = import.meta.env.VITE_APP_TITLE ?? appConfig.name;

export function App() {
  return (
    <main className="shell">
      <p className="phase">Phase {appConfig.phase}</p>
      <h1>{title}</h1>
      <p>{hello("Phase 0")}</p>
      <p className="meta">
        Canon bundles: {canonManifest.bundles.length} (empty stub)
      </p>
    </main>
  );
}
