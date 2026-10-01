import { useState } from "react";
import { buySplitPercents, formatUsdc } from "@nova/shared";
import { useDayStore } from "../day/useDayStore";
import { HUD_COPY, padDay } from "../hud/homeHudModel";
import { SoftLaunchNotice } from "../onboarding/SoftLaunchNotice";
import { PROFILE_COPY } from "../profile/profileCopy";
import {
  Button,
  ChevronRightIcon,
  CloseIcon,
  GlassSheet,
  Kicker,
  Toggle,
} from "../ui";
import { usePref } from "./prefs";
import "./menu.css";

const split = buySplitPercents();

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

/** Screen 13. Opens from the MENU chip; absorbs the old Profile page. */
export function MenuSheet({ onClose, onHowTo, onPools, onDisconnect }: MenuSheetProps) {
  const { state } = useDayStore();
  const [reminder, setReminder] = usePref("dailyReminder");
  const [calm, setCalm] = usePref("calmMotion");
  const [showNotice, setShowNotice] = useState(false);

  if (showNotice) {
    return <SoftLaunchNotice mode="read" onClose={() => setShowNotice(false)} />;
  }

  return (
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
          onClick={onClose}
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
          <HelpRow label={MENU_COPY.howTo} onClick={onHowTo} testId="menu-help-tutorial" />
          <HelpRow label={MENU_COPY.pools} onClick={onPools} testId="menu-help-pools" />
          <HelpRow
            label={MENU_COPY.notice}
            onClick={() => setShowNotice(true)}
            testId="menu-help-notice"
          />
        </div>
      </section>

      <span className="nv-spacer" />
      <Button variant="tertiary" testId="menu-disconnect" onClick={onDisconnect}>
        {MENU_COPY.disconnect}
      </Button>
    </GlassSheet>
  );
}
