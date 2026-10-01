import type { ReactNode } from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  ExtraIcon,
  FreeIcon,
  MinusIcon,
  PlusIcon,
} from "./icons";

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "tertiary";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Tertiary/secondary rows that sit under a primary CTA use the 40px height. */
  compact?: boolean;
  disabled?: boolean;
  /** Disabled look with pending copy ("Confirming…"). */
  pending?: boolean;
  onClick?(): void;
  testId?: string;
  ariaLabel?: string;
  describedBy?: string;
  title?: string;
  className?: string;
};

export function Button({
  children,
  variant = "primary",
  compact = false,
  disabled = false,
  pending = false,
  onClick,
  testId,
  ariaLabel,
  describedBy,
  title,
  className,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        "nv-btn",
        `nv-btn--${variant}`,
        compact && "nv-btn--compact",
        pending && "nv-btn--pending",
        className,
      )}
      data-testid={testId}
      disabled={disabled || pending}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-busy={pending || undefined}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "secondary",
  testId,
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  testId?: string;
}) {
  return (
    <a
      className={cx("nv-btn", `nv-btn--${variant}`)}
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
    >
      {children}
    </a>
  );
}

type ChipProps = {
  children: ReactNode;
  shape?: "square" | "pill";
  grow?: boolean;
  onClick?(): void;
  testId?: string;
  ariaLabel?: string;
  className?: string;
};

/** Square (12px) for data, pill for status. 44px min height. */
export function Chip({
  children,
  shape = "square",
  grow = false,
  onClick,
  testId,
  ariaLabel,
  className,
}: ChipProps) {
  const names = cx(
    "nv-chip",
    shape === "pill" && "nv-chip--pill",
    grow && "nv-chip--grow",
    className,
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={names}
        data-testid={testId}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={names} data-testid={testId} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

/** 28px label tag ("SOFT LAUNCH"). */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="nv-tag">{children}</span>;
}

type BalanceChipProps = {
  lane: "free" | "extra";
  value: number;
  onClick?(): void;
  testId?: string;
  valueTestId?: string;
  ariaLabel?: string;
  title?: string;
};

/** FREE / EXTRA balance. Always two separate chips. */
export function BalanceChip({
  lane,
  value,
  onClick,
  testId,
  valueTestId,
  ariaLabel,
  title,
}: BalanceChipProps) {
  const body = (
    <>
      {lane === "free" ? (
        <FreeIcon className="nv-icon-accent" />
      ) : (
        <ExtraIcon className="nv-icon-accent" />
      )}
      <span className="nv-balance__label">{lane === "free" ? "FREE" : "EXTRA"}</span>
      <span className="nv-balance__value" data-testid={valueTestId}>
        {value}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className="nv-balance"
        data-testid={testId}
        aria-label={ariaLabel}
        title={title}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }
  return (
    <div className="nv-balance" data-testid={testId} title={title}>
      {body}
    </div>
  );
}

export function LetterBadge({ letter }: { letter: string }) {
  return <span className="nv-letter">{letter}</span>;
}

type ChoiceCardProps = {
  letter: string;
  label: string;
  selected?: boolean;
  /** Right-edge affordance. "check" only renders while selected. */
  trailing?: "chevron" | "check" | "winner" | "none";
  compact?: boolean;
  disabled?: boolean;
  onClick?(): void;
  testId?: string;
};

export function ChoiceCard({
  letter,
  label,
  selected = false,
  trailing = "none",
  compact = false,
  disabled = false,
  onClick,
  testId,
}: ChoiceCardProps) {
  const names = cx(
    "nv-choice",
    selected && "nv-choice--selected",
    compact && "nv-choice--compact",
  );
  const body = (
    <>
      <LetterBadge letter={letter} />
      <span className="nv-choice__label">{label}</span>
      {trailing === "chevron" ? (
        <ChevronRightIcon size={18} className="nv-icon-accent" />
      ) : null}
      {trailing === "check" && selected ? (
        <span className="nv-check-dot" aria-hidden="true">
          <CheckIcon size={14} />
        </span>
      ) : null}
      {trailing === "winner" ? <span className="nv-choice__tag">WINNER</span> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={names}
        data-testid={testId}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={names} data-testid={testId}>
      {body}
    </div>
  );
}

type StepperProps = {
  lane: "free" | "extra";
  value: number;
  meta: string;
  onChange(next: number): void;
  canDecrease: boolean;
  canIncrease: boolean;
  testIds: { root: string; value: string; decrease: string; increase: string };
};

/** One lane, one stepper. Free and Extra never share a control. */
export function Stepper({
  lane,
  value,
  meta,
  onChange,
  canDecrease,
  canIncrease,
  testIds,
}: StepperProps) {
  const name = lane === "free" ? "Free" : "Extra";
  return (
    <div className="nv-stepper" data-testid={testIds.root}>
      <div className="nv-stepper__head">
        {lane === "free" ? (
          <FreeIcon className="nv-icon-accent" />
        ) : (
          <ExtraIcon className="nv-icon-accent" />
        )}
        <span className="nv-stepper__label">{`${name.toUpperCase()} TO CAST`}</span>
        <span className="nv-stepper__meta">{meta}</span>
      </div>
      <div className="nv-stepper__row">
        <button
          type="button"
          className="nv-step"
          data-testid={testIds.decrease}
          aria-label={`Decrease ${name} Influence`}
          disabled={!canDecrease}
          onClick={() => onChange(value - 1)}
        >
          <MinusIcon />
        </button>
        <span className="nv-stepper__value" data-testid={testIds.value} aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="nv-step"
          data-testid={testIds.increase}
          aria-label={`Increase ${name} Influence`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

/** 38×22 track inside a 44px tap target. */
export function Toggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange(next: boolean): void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="nv-toggle"
      data-testid={testId}
      onClick={() => onChange(!checked)}
    >
      <span className={checked ? "nv-toggle__track nv-toggle__track--on" : "nv-toggle__track"}>
        <span className="nv-toggle__thumb" />
      </span>
    </button>
  );
}

/** Real checkbox styled as the kit's 22px square. */
export function Checkbox({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange(next: boolean): void;
  testId?: string;
}) {
  return (
    <label className="nv-checkbox">
      <input
        type="checkbox"
        checked={checked}
        data-testid={testId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="nv-checkbox__box" aria-hidden="true">
        <CheckIcon size={14} />
      </span>
      <span>{label}</span>
    </label>
  );
}
