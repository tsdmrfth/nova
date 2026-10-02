import { useLayoutEffect, useRef, useState } from "react";
import { buySplitPercents, formatUsdc } from "@nova/shared";
import { useDayStore } from "../day/useDayStore";
import { HUD_COPY, padDay } from "../hud/homeHudModel";
import { useCalmMotion } from "../hud/usePrefersReducedMotion";
import { SoftLaunchNotice } from "../onboarding/SoftLaunchNotice";
import { PROFILE_COPY } from "../profile/profileCopy";
import {
  Button,
  ChevronRightIcon,
  CloseIcon,
  FrameOverlay,
  GlassSheet,
  Kicker,
  Toggle,
} from "../ui";
import { usePref } from "./prefs";
import "./menu.css";

const split = buySplitPercents();

/** The drawer drops from the top edge and pulls back up the same way. Translate only. */
const DRAWER_IN = { duration: 360, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" };
const DRAWER_OUT = { duration: 260, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" as const };
const DRAWER_UP = "translate3d(0, -100%, 0)";

export const MENU_COPY = {
  title: "Menu",
  wallet: "Arc wallet",
  history: "Day history",
  settings: "Settings",
  reminder: "Daily reminder",
  calm: "Calm motion",
  walletRow: "Wallet",
  walletValue: "Arc",
  help: "Help",
  howTo: "How today works",
  pools: `Pools and the ${split.prizePool} / ${split.studioNet} / ${split.novaBudget} split`,
  notice: "Soft-launch notice",
  disconnect: "Disconnect",
  locked: "locked",
  claimed: "claimed",
} as const;

type MenuSheetProps = {
  onClose(): void;
  onHowTo(): void;
  onPools(): void;
  onDisconnect(): void;
};

function HelpRow({
  label,
  onClick,
  testId,
}: {
  label: string;
  onClick(): void;
  testId: string;
}) {
  return (
    <button type="button" className="nv-list__row" data-testid={testId} onClick={onClick}>
      <span className="nv-list__label">{label}</span>
      <ChevronRightIcon size={16} className="nv-list__chevron" />
    </button>
  );
}

/**
 * Screen 13. Opens from the MENU chip; absorbs the old Profile page. A
 * frame-wide drawer pinned to the top edge over an overlay on the rest of the
 * screen; tapping the overlay closes it.
 */
export function MenuSheet({ onClose, onHowTo, onPools, onDisconnect }: MenuSheetProps) {
  const { state } = useDayStore();
  const [reminder, setReminder] = usePref("dailyReminder");
  const [calm, setCalm] = usePref("calmMotion");
  const still = useCalmMotion();
  const [showNotice, setShowNotice] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || still || typeof drawer.animate !== "function") return;
    drawer.animate([{ transform: DRAWER_UP }, { transform: "none" }], DRAWER_IN);
    // Only on open (and on return from the notice); `still` changing mid-menu must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotice]);

  /** Pulls the drawer back up, then runs `done`. */
  const leave = (done: () => void) => {
    const drawer = drawerRef.current;
    if (!drawer || still || typeof drawer.animate !== "function") {
      done();
      return;
    }
    if (leaving.current) return;
    leaving.current = true;
    drawer.animate([{ transform: "none" }, { transform: DRAWER_UP }], DRAWER_OUT).onfinish = done;
  };

  if (showNotice) {
    return (
      <FrameOverlay align="center">
        <SoftLaunchNotice mode="read" onClose={() => setShowNotice(false)} />
      </FrameOverlay>
    );
  }

  return (
    <div className="menu-layer" data-testid="menu-overlay">
      <button
        type="button"
        className="menu-scrim"
        data-testid="menu-scrim"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => leave(onClose)}
      />
      <div className="menu-drawer" ref={drawerRef}>
        <GlassSheet
          variant="modal"
          className="menu-sheet"
          testId="menu-sheet"
          role="dialog"
          ariaModal
          labelledBy="menu-title"
        >
          <header className="menu-head">
            <div className="menu-head__copy">
              <h2 className="menu-head__title" id="menu-title">
                {MENU_COPY.title}
              </h2>
              <span className="menu-head__sub">{`${HUD_COPY.rankTitle} · ${MENU_COPY.wallet}`}</span>
            </div>
            <button
              type="button"
              className="menu-close"
              data-testid="menu-close"
              aria-label="Close menu"
              onClick={() => leave(onClose)}
            >
              <CloseIcon size={18} />
            </button>
          </header>

          <section className="nv-stack menu-section">
            <Kicker>{MENU_COPY.history}</Kicker>
            {state.casts.length === 0 ? (
              <p className="menu-empty" data-testid="profile-empty">
                {PROFILE_COPY.empty}
              </p>
            ) : (
              <ol className="menu-history" data-testid="profile-casts">
                {state.casts.map((cast, index) => (
                  <li key={`${cast.optionId}-${index}`} className="menu-history__row">
                    <span>{`Day ${padDay(state.day)}`}</span>
                    <span className="nv-muted">
                      {`Picked ${cast.optionId} · ${state.claim ? MENU_COPY.claimed : MENU_COPY.locked}`}
                    </span>
                    <span
                      className={state.claim ? "menu-history__gain" : "nv-muted"}
                      data-testid={state.claim ? "profile-claims" : undefined}
                    >
                      {state.claim ? `+${formatUsdc(state.claim.total)}` : `${cast.free + cast.extra}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="menu-section">
            <Kicker>{MENU_COPY.settings}</Kicker>
            <div className="nv-list">
              <div className="nv-list__row">
                <span className="nv-list__label">{MENU_COPY.reminder}</span>
                <Toggle
                  label={MENU_COPY.reminder}
                  checked={reminder}
                  onChange={setReminder}
                  testId="menu-reminder"
                />
              </div>
              <div className="nv-list__row">
                <span className="nv-list__label">{MENU_COPY.calm}</span>
                <Toggle
                  label={MENU_COPY.calm}
                  checked={calm}
                  onChange={setCalm}
                  testId="menu-calm"
                />
              </div>
              <div className="nv-list__row">
                <span className="nv-list__label">{MENU_COPY.walletRow}</span>
                <span className="nv-muted">{MENU_COPY.walletValue}</span>
              </div>
            </div>
          </section>

          <section className="menu-section">
            <Kicker>{MENU_COPY.help}</Kicker>
            <div className="nv-list">
              <HelpRow
                label={MENU_COPY.howTo}
                onClick={() => leave(onHowTo)}
                testId="menu-help-tutorial"
              />
              <HelpRow label={MENU_COPY.pools} onClick={onPools} testId="menu-help-pools" />
              <HelpRow
                label={MENU_COPY.notice}
                onClick={() => setShowNotice(true)}
                testId="menu-help-notice"
              />
            </div>
          </section>

          <Button variant="tertiary" testId="menu-disconnect" onClick={onDisconnect}>
            {MENU_COPY.disconnect}
          </Button>
        </GlassSheet>
      </div>
    </div>
  );
}
