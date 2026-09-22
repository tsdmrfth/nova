import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { S1_COPY } from "../content/s1Copy";
import { seedOnboarded } from "../onboarding/onboardingStorage";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Confirmation copy", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  it("shows the open round and Cast Influence before a cast", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/confirmation?day=4"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("confirm-heading").textContent).toBe("Wrong answer");
    expect(screen.getByTestId("confirm-scene").textContent).toMatch(/wrong info yesterday/i);
    expect(screen.getByTestId("confirm-choice-A").textContent).toMatch(/Correct today/);
    expect(screen.getByTestId("confirm-choice-A").textContent).toMatch(/Stabilize/);
    expect(screen.getByTestId("confirm-choice-B").textContent).toMatch(/Find better sources/);
    expect(screen.getByTestId("confirm-choice-C").textContent).toMatch(/Learn, then fix/);
    expect(screen.getByTestId("confirm-kicker").textContent).toMatch(/MOST/);
    expect(screen.queryByText(S1_COPY.castSuccess)).toBeNull();
    expect(screen.queryByText(S1_COPY.pending)).toBeNull();

    await user.click(screen.getByTestId("confirm-vote"));
    expect(screen.getByRole("heading", { name: "Wrong answer" })).toBeTruthy();
    expect(screen.getByTestId("cast-influence")).toBeTruthy();
  });

  it("locks the cast choice with B5 copy and the Round 01 hook", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("cast-influence"));
    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Confirmation" }));

    expect(screen.getByTestId("confirm-heading").textContent).toBe("Influence cast");
    expect(screen.getByTestId("confirm-round").textContent).toBe("First light");
    expect(screen.getByTestId("confirm-scene").textContent).toMatch(/three paths glow/i);
    expect(screen.getByTestId("confirm-body").textContent).toMatch(
      /Locked until .+ Results publish around /,
    );
    expect(screen.getByTestId("confirm-leave").textContent).toBe(S1_COPY.pendingLeave);
    expect(screen.getByTestId("confirm-choice-B").textContent).toMatch(/Say hello/);
    expect(screen.getByTestId("confirm-choice-B").textContent).toMatch(/Expand/);
    expect(screen.getByTestId("confirm-hook").textContent).toBe("Neighbors notice a wave.");
    expect(screen.queryByTestId("confirm-choice-A")).toBeNull();
    expect(screen.queryByText(/ask_first/)).toBeNull();

    await user.click(screen.getByTestId("confirm-back"));
    expect(screen.getByRole("heading", { name: "First light" })).toBeTruthy();
  });
});
