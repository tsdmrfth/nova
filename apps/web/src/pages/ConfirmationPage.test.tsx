import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { grantDailyFree } from "@nova/shared";
import { App } from "../App";
import { ONBOARDING_COPY } from "../onboarding/onboardingCopy";
import { seedOnboarded } from "../onboarding/onboardingStorage";

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

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  if (!screen.queryByRole("link", { name: "Vote" })) {
    await user.click(screen.getByText("Menu"));
  }
}

describe("Confirmation + offline day loop", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("keeps a cold /confirmation deep link from inventing a cast", async () => {
    const user = userEvent.setup();
    renderAt("/confirmation");

    expect(
      screen.getByRole("heading", { name: "Nothing locked yet" }),
    ).toBeTruthy();
    expect(screen.getByTestId("confirmation-empty").textContent).toMatch(
      /Cast Influence/,
    );
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      /Not cast/,
    );
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      new RegExp(`${grantDailyFree()} remaining`),
    );
    expect(screen.getByTestId("confirmation-extra").textContent).toMatch(
      /Not cast/,
    );
    expect(screen.getByTestId("confirmation-close").textContent).toMatch(
      /^Voting closes \S/,
    );
    expect(screen.getByTestId("confirmation-publish").textContent).toContain(
      "Results publish",
    );
    expect(screen.queryByTestId("confirmation-results")).toBeNull();

    expect(screen.getByTestId("confirmation-home").textContent).toMatch(
      /^Back to Nova/,
    );
    await user.click(screen.getByTestId("confirmation-home"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
    expect(screen.getByTestId("hud-free-value").textContent).toBe(
      String(grantDailyFree()),
    );
    expect(screen.getByTestId("cast-status").textContent).not.toMatch(
      /Influence cast/i,
    );
  });

  it("plays Connect → Home → Vote → Buy → Confirmation → Results on one day", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    renderAt("/connect");

    await user.click(screen.getByTestId("connect-checkbox"));
    await user.click(screen.getByTestId("connect-continue"));

    expect(screen.getByTestId("grant-toast").textContent).toMatch(
      new RegExp(`\\+${grantDailyFree()} Free Influence`),
    );
    expect(screen.getByTestId("grant-toast").textContent).toMatch(
      /skip Extra/,
    );
    expect(screen.getByTestId("hud-free-value").textContent).toBe(
      String(grantDailyFree()),
    );

    await user.click(screen.getByTestId("grant-toast"));
    expect(screen.queryByTestId("grant-toast")).toBeNull();
    expect(screen.getByTestId("hud-free-value").textContent).toBe(
      String(grantDailyFree()),
    );
    await user.click(screen.getByTestId("tutorial-skip"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();

    await openMenu(user);
    await user.click(screen.getByRole("link", { name: "Vote" }));
    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("cast-influence"));
    expect(screen.getByTestId("cast-status").textContent).toMatch(
      /Influence cast/i,
    );

    await user.click(screen.getByTestId("buy-entry"));
    expect(screen.getByRole("heading", { name: "Extra Influence" })).toBeTruthy();
    await user.click(screen.getByTestId("buy-cta"));
    expect(screen.getByTestId("buy-extra-value").textContent).toBe("55");
    await user.click(screen.getByTestId("buy-confirm"));

    expect(screen.getByRole("heading", { name: "Vote locked" })).toBeTruthy();
    expect(screen.getByTestId("confirmation-choice").textContent).toMatch(
      /Expand · Say hello/,
    );
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      /10 on this pick/,
    );
    expect(screen.getByTestId("confirmation-free").textContent).toMatch(
      /0 remaining/,
    );
    expect(screen.getByTestId("confirmation-extra").textContent).toMatch(
      /55 on this pick/,
    );
    expect(screen.getByTestId("confirmation-extra").textContent).toMatch(
      /55 remaining/,
    );
    expect(screen.getByTestId("confirmation-close").textContent).toMatch(
      /Voting closes/,
    );
    expect(screen.getByTestId("confirmation-publish").textContent).toMatch(
      /Results publish/,
    );

    await user.click(screen.getByTestId("confirmation-results"));
    expect(screen.getByTestId("results-canon").textContent).toBe(
      "Canon today: Say hello",
    );

    await openMenu(user);
    await user.click(screen.getByRole("link", { name: "Vote" }));
    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("hud-free-value").textContent).toBe("0");
    expect(screen.getByTestId("hud-extra-value").textContent).toBe("55");
    expect(screen.getByTestId("cast-status").textContent).toMatch(
      /Influence cast/i,
    );

    await openMenu(user);
    await user.click(screen.getByRole("link", { name: "Confirmation" }));
    expect(screen.getByTestId("confirmation-choice").textContent).toMatch(
      /Say hello/,
    );

    await user.click(screen.getByTestId("confirmation-back"));
    expect(screen.getByTestId("choice-B").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("cast-influence")).toHaveProperty("disabled", true);
  });
});

describe("PlayGate still wraps Confirmation", () => {
  it("sends an unseen visitor to Connect", () => {
    renderAt("/confirmation");
    expect(
      screen.getByRole("heading", { name: ONBOARDING_COPY.headline }),
    ).toBeTruthy();
    expect(screen.queryByTestId("confirmation-title")).toBeNull();
  });
});
