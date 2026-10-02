import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screenMotion } from "../screenFlow";
import { ScreenFrame } from "./ScreenFrame";
import { ScreenMotionProvider } from "./ScreenMotionProvider";

type Call = {
  el: Element;
  from: string;
  to: string;
  anim: { onfinish: (() => void) | null; oncancel: (() => void) | null };
};

let calls: Call[] = [];

function Jump() {
  const navigate = useNavigate();
  return (
    <nav>
      {["/", "/vote", "/buy", "/neighborhood", "/profile"].map((path) => (
        <button key={path} type="button" onClick={() => navigate(path)}>
          {`go ${path}`}
        </button>
      ))}
    </nav>
  );
}

// Separate components, like the app's pages: a route change remounts the frame.
function Home() {
  return <ScreenFrame testId="home" className="home-screen--home">Home body</ScreenFrame>;
}
function Vote() {
  return <ScreenFrame testId="vote">Vote body</ScreenFrame>;
}
function Buy() {
  return <ScreenFrame testId="buy">Buy body</ScreenFrame>;
}
function Place() {
  return <ScreenFrame testId="neighborhood">Neighborhood body</ScreenFrame>;
}

function Shell() {
  const { pathname } = useLocation();
  return (
    <ScreenMotionProvider path={pathname} resolve={screenMotion}>
      <Jump />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/neighborhood" element={<Place />} />
        <Route path="/profile" element={<Navigate to="/" replace />} />
      </Routes>
    </ScreenMotionProvider>
  );
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Shell />
    </MemoryRouter>,
  );
  // The first frame may pick up a copy left by the previous test's unmount.
  calls = [];
}

function parts(testId: string) {
  const section = screen.getByTestId(testId);
  return {
    stage: section.querySelector(".nv-screen__stage")!,
    slot: section.querySelector(".nv-screen__ghost")!,
  };
}

describe("screen slide", () => {
  beforeEach(() => {
    HTMLElement.prototype.animate = function animate(this: HTMLElement, keyframes: Keyframe[]) {
      const anim = { onfinish: null, oncancel: null };
      calls.push({
        el: this,
        from: String(keyframes[0].transform),
        to: String(keyframes[1].transform),
        anim,
      });
      return anim as unknown as Animation;
    } as HTMLElement["animate"];
  });

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    delete document.documentElement.dataset.calm;
  });

  it("slides the next loop step in from the right and the old screen out left", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByText("go /vote"));

    const { stage, slot } = parts("vote");
    const ghost = slot.firstElementChild!;
    expect(ghost.textContent).toBe("Home body");
    expect(ghost.className).toBe("nv-screen__stage home-screen--home");
    expect(ghost.getAttribute("aria-hidden")).toBe("true");
    expect(ghost.querySelector("[data-nv-fit]")).toBeNull();

    expect(calls.map(({ el, from, to }) => [el, from, to])).toEqual([
      [stage, "translate3d(100%, 0, 0)", "none"],
      [ghost, "none", "translate3d(-100%, 0, 0)"],
    ]);

    calls[1].anim.onfinish?.();
    expect(slot.childElementCount).toBe(0);
  });

  it("slides back from the left, and side trips up and down", async () => {
    const user = userEvent.setup();
    renderAt("/vote");

    await user.click(screen.getByText("go /buy"));
    expect(calls.map((call) => call.from)).toEqual(["translate3d(0, 100%, 0)", "none"]);
    expect(calls[1].to).toBe("translate3d(0, -12%, 0)");
    expect(parts("buy").stage.style.zIndex).toBe("2");

    calls = [];
    await user.click(screen.getByText("go /"));
    expect(calls.map((call) => call.from)).toEqual(["translate3d(0, -12%, 0)", "none"]);
    expect(calls[1].to).toBe("translate3d(0, 100%, 0)");
    expect(parts("home").slot.style.zIndex).toBe("2");

    calls = [];
    await user.click(screen.getByText("go /neighborhood"));
    expect(calls.map((call) => [call.from, call.to])).toEqual([
      ["translate3d(0, -100%, 0)", "none"],
      ["none", "translate3d(0, 100%, 0)"],
    ]);

    calls = [];
    await user.click(screen.getByText("go /vote"));
    calls = [];
    await user.click(screen.getByText("go /"));
    expect(calls.map((call) => call.from)).toEqual(["translate3d(-100%, 0, 0)", "none"]);
    expect(calls[1].to).toBe("translate3d(100%, 0, 0)");
  });

  it("carries the old screen across a redirect", async () => {
    const user = userEvent.setup();
    renderAt("/vote");
    await user.click(screen.getByText("go /profile"));

    expect(screen.getByTestId("home")).toBeTruthy();
    expect(parts("home").slot.textContent).toBe("Vote body");
    expect(calls[0].from).toBe("translate3d(-100%, 0, 0)");
  });

  it("does not move under Calm motion", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.calm = "true";
    renderAt("/");
    await user.click(screen.getByText("go /vote"));

    expect(calls).toEqual([]);
    expect(parts("vote").slot.childElementCount).toBe(0);
  });
});
