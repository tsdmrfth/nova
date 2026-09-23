import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { ONBOARDING_COPY } from "../onboarding/onboardingCopy";
import {
  ONBOARDING_STORAGE_KEYS,
  seedOnboarded,
} from "../onboarding/onboardingStorage";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("P1-09 onboarding first-run", () => {
  it("lands first-run visitors on Connect and requires the disclaimer", async () => {
    const user = userEvent.setup();
    renderAt("/");

    expect(
      screen.getByRole("heading", { name: ONBOARDING_COPY.headline }),
    ).toBeTruthy();
    expect(screen.getByTestId("connect-disclaimer").textContent).toBe(
      ONBOARDING_COPY.disclaimer,
    );
    expect(screen.getByTestId("connect-cta")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("connect-continue")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByTestId("connect-footer").textContent).toBe(
      ONBOARDING_COPY.footerMicro,
    );

    await user.click(screen.getByTestId("connect-checkbox"));
    expect(screen.getByTestId("connect-cta")).toHaveProperty("disabled", false);
    expect(screen.getByTestId("connect-continue")).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("mock-connects, grants +10 Free, then skippable tutorial into Home Day 1", async () => {
    const user = userEvent.setup();
    renderAt("/connect");

    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("connect-cta"));

    expect(screen.getByTestId("grant-toast").textContent).toMatch(
      /\+10 Free Influence/,
    );
    expect(screen.getByTestId("grant-toast").textContent).toMatch(/skip Extra/);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.disclaimerAccepted)).toBe(
      "1",
    );
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.connected)).toBe("1");

    await user.click(screen.getByTestId("grant-toast"));
    expect(screen.getByTestId("tutorial-overlay").textContent).toMatch(
      /MOST, LEAST, or MIDDLE/,
    );
    expect(screen.getByTestId("tutorial-overlay").textContent).toMatch(
      /Free Influence is daily and free/,
    );

    await user.click(screen.getByTestId("tutorial-skip"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.getByTestId("hud-free-value").textContent).toBe("10");
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEYS.tutorialSeen)).toBe("1");
  });

  it("lets Continue skip a real wallet and remembers a returning player", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt("/connect");

    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("connect-continue"));
    await user.click(screen.getByTestId("grant-toast"));
    await user.click(screen.getByTestId("tutorial-got-it"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    unmount();

    renderAt("/");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("grant-toast")).toBeNull();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.queryByTestId("connect-cta")).toBeNull();
  });

  it("shows the locked geo-block copy and keeps Home closed", async () => {
    const user = userEvent.setup();
    renderAt("/connect?edge=geo");

    expect(screen.getByTestId("geo-block").textContent).toMatch(
      /Not available here yet/,
    );
    expect(screen.getByTestId("geo-block").textContent).toMatch(
      /Nova isn't available in your region yet/,
    );
    expect(screen.getByTestId("geo-ok").textContent).toMatch(/^OK/);
    await user.click(screen.getByTestId("geo-ok"));
    expect(screen.getByTestId("geo-block")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "First light" })).toBeNull();
  });

  it("shows Switch to Arc until the mock network is corrected", async () => {
    const user = userEvent.setup();
    renderAt("/connect?edge=network");

    expect(
      screen.getByRole("heading", { name: ONBOARDING_COPY.headline }),
    ).toBeTruthy();
    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("connect-cta"));

    expect(screen.getByTestId("network-block").textContent).toMatch(
      /Nova runs on Arc/,
    );
    await user.click(screen.getByTestId("network-retry"));
    expect(screen.getByTestId("network-block")).toBeTruthy();

    await user.click(screen.getByTestId("network-switch"));
    await user.click(screen.getByTestId("network-retry"));
    expect(screen.getByTestId("grant-toast")).toBeTruthy();
  });

  it("keeps seeded returning users on Home without the tutorial", () => {
    seedOnboarded();
    renderAt("/");
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.queryByTestId("tutorial-overlay")).toBeNull();
    expect(screen.queryByTestId("grant-toast")).toBeNull();
  });
});
