import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";

vi.mock("../scene/HomeSceneHost", () => ({
  HomeSceneHost: () => <div data-testid="scene-stage" />,
}));

describe("Home route chrome", () => {
  it("keeps the user on Home when Cast Influence is pressed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("cast-influence"));
    expect(screen.getByRole("heading", { name: /economy/i })).toBeTruthy();
    expect(screen.getByTestId("scene-stage")).toBeTruthy();
  });

  it("opens other product routes from the compact menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByRole("link", { name: "Vote" }));
    expect(screen.getByRole("heading", { name: "Vote" })).toBeTruthy();
  });
});
