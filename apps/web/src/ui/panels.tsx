import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, CloseIcon, ExternalIcon, InfoIcon, TrophyIcon } from "./icons";

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

type SheetProps = {
  children: ReactNode;
  /** "modal" = centred card with the blue edge; "toast" = slim top banner. */
  variant?: "sheet" | "modal" | "toast";
  /** Status orb overlapping the top edge. */
  orb?: ReactNode;
  className?: string;
  testId?: string;
  role?: string;
  ariaModal?: boolean;
  labelledBy?: string;
};

export function GlassSheet({
  children,
  variant = "sheet",
  orb,
  className,
  testId,
  role,
  ariaModal,
  labelledBy,
}: SheetProps) {
  return (
    <section
      className={cx(
        "nv-sheet",
        `nv-sheet--${variant}`,
        orb ? "nv-sheet--orb" : null,
        className,
      )}
      data-testid={testId}
      role={role}
      aria-modal={ariaModal || undefined}
      aria-labelledby={labelledBy}
    >
      {orb ? <div className="nv-sheet__orb">{orb}</div> : null}
      {children}
    </section>
  );
}

export type OrbKind = "check" | "x" | "trophy" | "spinner";

export function StatusOrb({
  kind,
  calm = false,
  glow = false,
  testId,
}: {
  kind: OrbKind;
  /** Calm motion: the spinner holds still. */
  calm?: boolean;
  /** Matched results ease a glow in once. */
  glow?: boolean;
  testId?: string;
}) {
  if (kind === "spinner") {
    return (
      <span
        className={calm ? "nv-spinner nv-spinner--calm" : "nv-spinner"}
        role="progressbar"
        aria-label="Waiting for confirmation"
        data-testid={testId}
      />
    );
  }
  return (
    <span
      className={glow ? "nv-orb nv-orb--glow" : "nv-orb"}
      data-testid={testId}
      data-orb={kind}
    >
      {kind === "check" ? <CheckIcon size={34} strokeWidth={2} /> : null}
      {kind === "x" ? <CloseIcon size={30} /> : null}
      {kind === "trophy" ? <TrophyIcon size={32} /> : null}
    </span>
  );
}

/** Kicker label (CHAPTER 07, FIRST LIGHT, SIGN IN). */
export function Kicker({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "muted";
}) {
  return <p className={`nv-kicker nv-kicker--${tone}`}>{children}</p>;
}

export function StoryTitle({
  children,
  size = "md",
  id,
  testId,
  as: Tag = "h1",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  id?: string;
  testId?: string;
  as?: "h1" | "h2" | "p";
}) {
  return (
    <Tag className={`nv-story-title nv-story-title--${size}`} id={id} data-testid={testId}>
      {children}
    </Tag>
  );
}

/** Centred title + muted subline used by every status sheet. */
export function SheetHeading({
  title,
  sub,
  titleTestId,
}: {
  title: string;
  sub?: string;
  titleTestId?: string;
}) {
  return (
    <header className="nv-sheet-heading">
      <StoryTitle testId={titleTestId}>{title}</StoryTitle>
      {sub ? <p className="nv-sheet-heading__sub">{sub}</p> : null}
    </header>
  );
}

export function Receipt({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="nv-receipt" data-testid={testId}>
      {children}
    </div>
  );
}

export function ReceiptRow({
  label,
  value,
  icon,
  mutedLabel = false,
  mutedValue = false,
  strong = false,
  testId,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  mutedLabel?: boolean;
  mutedValue?: boolean;
  strong?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={cx("nv-receipt__row", strong && "nv-receipt__row--strong")}
      data-testid={testId}
    >
      {icon}
      <span className={cx("nv-receipt__label", mutedLabel && "nv-muted")}>{label}</span>
      <span className={cx("nv-receipt__value", mutedValue && "nv-muted")}>{value}</span>
    </div>
  );
}

export function ReceiptDivider() {
  return <div className="nv-divider" role="presentation" />;
}

/** Icon + small muted copy. */
export function InfoLine({
  children,
  boxed = false,
  testId,
}: {
  children: ReactNode;
  boxed?: boolean;
  testId?: string;
}) {
  return (
    <p className={boxed ? "nv-info nv-info--boxed" : "nv-info"} data-testid={testId}>
      <InfoIcon size={16} className="nv-icon-accent nv-info__icon" />
      <span>{children}</span>
    </p>
  );
}

/** Centred 12px muted footnote. */
export function Note({
  children,
  testId,
  id,
}: {
  children: ReactNode;
  testId?: string;
  id?: string;
}) {
  return (
    <p className="nv-note" data-testid={testId} id={id}>
      {children}
    </p>
  );
}

export type NoticeTone = "pending" | "success" | "error" | "info";

/**
 * Tinted status row for transaction outcomes and blocked actions, so they never
 * read like a footnote. Errors are announced assertively, the rest politely.
 */
export function StatusNotice({
  tone,
  title,
  detail,
  link,
  announce = true,
  testId,
}: {
  tone: NoticeTone;
  title: ReactNode;
  detail?: ReactNode;
  link?: { href: string; label: string; testId?: string } | null;
  /** False for standing copy that never changes, so it isn't a live region. */
  announce?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={`nv-notice nv-notice--${tone}`}
      role={announce ? (tone === "error" ? "alert" : "status") : undefined}
      data-testid={testId}
      data-tone={tone}
    >
      <span className="nv-notice__icon" aria-hidden="true">
        {tone === "pending" ? <span className="nv-notice__spinner" /> : null}
        {tone === "success" ? <CheckIcon size={14} /> : null}
        {tone === "error" ? <AlertIcon size={18} /> : null}
        {tone === "info" ? <InfoIcon size={18} /> : null}
      </span>
      <div className="nv-notice__body">
        <p className="nv-notice__title">{title}</p>
        {detail ? <p className="nv-notice__detail">{detail}</p> : null}
        {link ? (
          <a
            className="nv-notice__link"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            data-testid={link.testId}
          >
            {link.label}
            <ExternalIcon size={12} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function TraitBars({
  traits,
  testId,
}: {
  traits: readonly { id: string; label: string; value: number; max: number }[];
  testId?: string;
}) {
  return (
    <div className="nv-rank" data-testid={testId}>
      <div className="nv-rank__head">
        <span>Nova</span>
      </div>
      <div className="nv-traits">
        {traits.map((trait) => {
          const ratio = trait.max === 0 ? 0 : Math.min(1, trait.value / trait.max);
          return (
            <div key={trait.id} className="nv-trait" data-testid={`hud-bar-${trait.id}`}>
              <span>{trait.label}</span>
              <span
                className="nv-trait__track"
                role="progressbar"
                aria-label={`${trait.label} ${trait.value} of ${trait.max}`}
                aria-valuemin={0}
                aria-valuemax={trait.max}
                aria-valuenow={trait.value}
              >
                <span className="nv-trait__fill" style={{ width: `${ratio * 100}%` }} />
              </span>
              <span className="nv-muted nv-num">{trait.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RankBar({
  title,
  current,
  next,
  testId,
}: {
  title: string;
  current: number;
  next: number;
  testId?: string;
}) {
  const ratio = next === 0 ? 0 : Math.min(1, current / next);
  return (
    <div className="nv-rank" data-testid={testId}>
      <div className="nv-rank__head">
        <span>{title}</span>
        <span className="nv-muted nv-num">
          {current.toLocaleString("en-US")} / {next.toLocaleString("en-US")}
        </span>
      </div>
      <span
        className="nv-rank__track"
        role="progressbar"
        aria-label="Influence rank progress"
        aria-valuemin={0}
        aria-valuemax={next}
        aria-valuenow={current}
      >
        <span className="nv-rank__fill" style={{ width: `${ratio * 100}%` }} />
      </span>
    </div>
  );
}
