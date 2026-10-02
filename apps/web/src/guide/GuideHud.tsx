import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DayGoal } from "@nova/shared";
import { BackBar } from "../hud/HomeView";
import {
  BookIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  ExtraIcon,
  FreeIcon,
  GlassSheet,
  InfoIcon,
  LetterBadge,
  NetworkIcon,
  StoryTitle,
  TrophyIcon,
  WalletIcon,
} from "../ui";
import { GUIDE_COPY, type GuideChapterId } from "./guideCopy";
import "./guide.css";

const { day, goal: goalCopy, extra, pool, nova } = GUIDE_COPY;

const TIMELINE_ICONS = {
  open: <BookIcon size={18} />,
  vote: <FreeIcon size={18} />,
  close: <ClockIcon size={18} />,
  results: <TrophyIcon size={18} />,
} as const;

const chapterDomId = (id: GuideChapterId) => `guide-${id}`;

function Chapter({
  id,
  icon,
  kicker,
  title,
  children,
}: {
  id: GuideChapterId;
  icon: ReactNode;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassSheet className="guide-chapter" testId={chapterDomId(id)}>
      <header className="guide-chapter__head" id={chapterDomId(id)}>
        <span className="guide-chapter__icon">{icon}</span>
        <span className="guide-chapter__titles">
          <span className="nv-kicker nv-kicker--accent">{kicker}</span>
          <h2 className="guide-chapter__title">{title}</h2>
        </span>
      </header>
      {children}
    </GlassSheet>
  );
}

function SubHead({ children }: { children: ReactNode }) {
  return <h3 className="guide-subhead">{children}</h3>;
}

function Callout({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <p className={`guide-callout guide-callout--${tone}`}>
      <InfoIcon size={16} className="guide-callout__icon" />
      <span>{children}</span>
    </p>
  );
}

function Timeline() {
  return (
    <ol className="guide-timeline" aria-label={GUIDE_COPY.timelineLabel}>
      {GUIDE_COPY.timeline.map((step) => (
        <li key={step.id} className="guide-timeline__step">
          <span className="guide-timeline__dot">{TIMELINE_ICONS[step.id]}</span>
          <span className="guide-timeline__when">{step.when}</span>
          <span className="guide-timeline__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

const CHAPTER_IDS = GUIDE_COPY.chapters.map((chapter) => chapter.id);
const FIRST_CHAPTER: GuideChapterId = "day";
const LAST_CHAPTER: GuideChapterId = "nova";

/**
 * Sticky chip bar. The chip for the chapter under the bar is selected while you
 * scroll; at the very bottom the last one wins, since it may never reach the bar.
 */
function JumpChips({ calm }: { calm: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<GuideChapterId>(FIRST_CHAPTER);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const host = barRef.current;
    const scroller = host?.closest<HTMLElement>(".nv-screen__hud");
    if (!host || !scroller) return;
    const update = () => {
      const bar = host.getBoundingClientRect();
      // No layout yet (or none at all, as in tests): every box reads 0, so leave the selection be.
      if (bar.height === 0) return;
      // Sticky pins `top` past the HUD's padding edge (a negative `top` pulls it into the padding).
      const pinAt =
        scroller.getBoundingClientRect().top +
        parseFloat(getComputedStyle(scroller).paddingTop) +
        parseFloat(getComputedStyle(host).top);
      setStuck(scroller.scrollTop > 0 && bar.top <= pinAt + 1);
      const atEnd =
        scroller.scrollTop > 0 && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      let current = FIRST_CHAPTER;
      for (const id of CHAPTER_IDS) {
        const head = document.getElementById(chapterDomId(id));
        if (head && head.getBoundingClientRect().top <= bar.bottom + bar.height) current = id;
      }
      setActive(atEnd ? LAST_CHAPTER : current);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, []);

  // Keep the selected chip visible in the row without moving the page.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !chip || typeof nav.scrollTo !== "function") return;
    nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2, behavior: calm ? "auto" : "smooth" });
  }, [active, calm]);

  const jump = (id: GuideChapterId) => {
    setActive(id);
    const target = document.getElementById(chapterDomId(id));
    if (typeof target?.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <div ref={barRef} className={stuck ? "guide-jump is-stuck" : "guide-jump"} data-testid="guide-jump">
      <nav ref={navRef} className="guide-jump__row" aria-label={GUIDE_COPY.jumpLabel}>
        {GUIDE_COPY.chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            className={active === chapter.id ? "guide-jump__chip guide-jump__chip--on" : "guide-jump__chip"}
            aria-current={active === chapter.id ? "true" : undefined}
            data-testid={`guide-jump-${chapter.id}`}
            onClick={() => jump(chapter.id)}
          >
            {chapter.jump}
          </button>
        ))}
      </nav>
    </div>
  );
}

function DayChapter() {
  return (
    <Chapter id="day" icon={<BookIcon size={20} />} kicker={day.kicker} title={day.title}>
      <p className="guide-body">{day.body}</p>
      <div className="guide-paths" aria-hidden="true">
        {day.paths.map((letter) => (
          <span key={letter} className="guide-path">
            <LetterBadge letter={letter} />
            <span className="guide-path__label">{`${day.pathLabel} ${letter}`}</span>
          </span>
        ))}
      </div>

      <SubHead>{day.votesTitle}</SubHead>
      <p className="guide-body">{day.votesBody}</p>
      <div className="guide-pips" role="img" aria-label={`${day.votes} ${day.votesUnit}`}>
        {Array.from({ length: day.votes }, (_, index) => (
          <span key={index} className="guide-pip">
            <FreeIcon size={14} />
          </span>
        ))}
      </div>
      <ul className="guide-facts">
        {day.facts.map((fact) => (
          <li key={fact}>
            <CheckIcon size={16} className="guide-facts__icon" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}

function GoalChapter({ today }: { today: DayGoal }) {
  const [goal, setGoal] = useState<DayGoal>(today);
  const winner = goalCopy.exampleWinner(goal);
  const top = Math.max(...goalCopy.example.map((row) => row.votes));
  return (
    <Chapter id="goal" icon={<TrophyIcon size={20} />} kicker={goalCopy.kicker} title={goalCopy.title}>
      <p className="guide-body">{goalCopy.body}</p>
      <div className="guide-tabs" role="tablist" aria-label="Day goals">
        {goalCopy.goals.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={goal === item}
            className={goal === item ? "guide-tab guide-tab--on" : "guide-tab"}
            data-testid={`guide-goal-${item}`}
            onClick={() => setGoal(item)}
          >
            {item}
            {item === today ? <span className="guide-tab__today">{goalCopy.todayTag}</span> : null}
          </button>
        ))}
      </div>
      <div className="guide-goal" role="tabpanel" data-testid="guide-goal-panel">
        <p className="guide-goal__rule">{goalCopy.rules[goal]}</p>
        <p className="nv-kicker nv-kicker--muted">{goalCopy.exampleLabel}</p>
        <ul className="guide-bars">
          {goalCopy.example.map((row) => {
            const won = row.id === winner;
            return (
              <li key={row.id} className={won ? "guide-bar guide-bar--won" : "guide-bar"}>
                <LetterBadge letter={row.id} />
                <span className="guide-bar__track">
                  <span className="guide-bar__fill" style={{ width: `${(row.votes / top) * 100}%` }} />
                </span>
                <span className="guide-bar__value">{row.votes}</span>
                {won ? <span className="guide-bar__tag">{goalCopy.winnerTag}</span> : null}
              </li>
            );
          })}
        </ul>
      </div>

      <SubHead>{goalCopy.guessTitle}</SubHead>
      <p className="guide-body">{goalCopy.guessBody}</p>
      <Callout>{goalCopy.tie}</Callout>
    </Chapter>
  );
}

function ExtraChapter() {
  return (
    <Chapter id="extra" icon={<ExtraIcon size={20} />} kicker={extra.kicker} title={extra.title}>
      <p className="guide-body">{extra.body}</p>
      <div className="guide-packs">
        {extra.packs.map((pack) => (
          <div key={pack.id} className="guide-pack">
            <span className="nv-kicker nv-kicker--accent">{pack.name}</span>
            <span className="guide-pack__price">
              {pack.price}
              <small>{extra.unit}</small>
            </span>
            <span className="guide-pack__extra">
              <ExtraIcon size={14} />
              {pack.extra}
            </span>
          </div>
        ))}
      </div>
      <ul className="guide-dos">
        <li className="guide-dos__row guide-dos__row--yes">
          <span className="guide-dos__mark">
            <CheckIcon size={16} strokeWidth={2.2} />
          </span>
          <span>{extra.does}</span>
        </li>
        <li className="guide-dos__row guide-dos__row--no">
          <span className="guide-dos__mark">
            <CloseIcon size={14} />
          </span>
          <span>{extra.doesnt}</span>
        </li>
      </ul>
      <div className="guide-caps">
        {extra.caps.map((cap) => (
          <span key={cap} className="guide-cap">
            {cap}
          </span>
        ))}
      </div>
    </Chapter>
  );
}

function PoolChapter() {
  return (
    <Chapter id="pool" icon={<WalletIcon size={20} />} kicker={pool.kicker} title={pool.title}>
      <div className="guide-flow">
        <div className="guide-flow__source">
          <span className="guide-coin">1</span>
          <span className="guide-flow__source-copy">
            <span className="guide-flow__source-label">{pool.buyLabel}</span>
            <span className="nv-muted">{pool.buyAmount}</span>
          </span>
        </div>
        <span className="guide-flow__arrow" aria-hidden="true" />
        <div className="guide-split" data-testid="guide-split">
          <div className="guide-split__bar" aria-hidden="true">
            {pool.split.map((part) => (
              <i key={part.id} className={`guide-split__seg guide-seg--${part.id}`} style={{ flex: part.pct }} />
            ))}
          </div>
          <dl className="guide-split__rows">
            {pool.split.map((part) => (
              <div key={part.id} className="guide-split__row">
                <dt>
                  <i className={`guide-split__dot guide-seg--${part.id}`} />
                  <span>{part.label}</span>
                </dt>
                <dd>
                  <b>{`${part.pct}%`}</b>
                  <span className="nv-muted">{part.amount}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="guide-note">{pool.splitNote}</p>
        </div>
        <span className="guide-flow__arrow" aria-hidden="true" />
        <div className="guide-pool">
          <SubHead>{pool.poolTitle}</SubHead>
          <p className="guide-body">{pool.poolBody}</p>
        </div>
        <span className="guide-flow__arrow guide-flow__arrow--fork" aria-hidden="true" />
        <p className="nv-kicker nv-kicker--muted guide-flow__fork-label">{pool.lanesLabel}</p>
        <div className="guide-lanes">
          {pool.lanes.map((lane) => (
            <div key={lane.id} className={`guide-lane guide-lane--${lane.id}`}>
              <span className="guide-lane__pct">{lane.pct}</span>
              <span className="guide-lane__title">
                {lane.id === "paid" ? <ExtraIcon size={14} /> : <FreeIcon size={14} />}
                {lane.title}
              </span>
              <span className="guide-lane__text">{lane.text}</span>
            </div>
          ))}
        </div>
      </div>

      <SubHead>{pool.shareTitle}</SubHead>
      <p className="guide-body">{pool.shareBody}</p>
      <div className="guide-share">
        <p className="nv-kicker nv-kicker--muted">{pool.shareExampleLabel}</p>
        {pool.shareExample.map((winner) => (
          <div key={winner.label} className="guide-share__row">
            <span className="guide-share__who">{winner.label}</span>
            <span className="guide-share__track">
              <span className="guide-share__fill" style={{ width: `${(winner.free / pool.shareMax) * 100}%` }} />
            </span>
            <span className="guide-share__free">{`${winner.free} ${pool.shareUnit}`}</span>
            <b className="guide-share__payout">{winner.payout}</b>
          </div>
        ))}
      </div>
      <Callout tone="warn">{pool.rollover}</Callout>

      <div className="guide-claim">
        <span className="guide-claim__icon">
          <TrophyIcon size={18} />
        </span>
        <span className="guide-claim__copy">
          <SubHead>{pool.claimTitle}</SubHead>
          <span className="guide-body">{pool.claimBody}</span>
        </span>
      </div>
    </Chapter>
  );
}

function NovaChapter() {
  return (
    <Chapter id="nova" icon={<NetworkIcon size={20} />} kicker={nova.kicker} title={nova.title}>
      <div className="guide-nova">
        <span className="guide-nova__orb">{nova.orb}</span>
        <p className="guide-body">{nova.body}</p>
      </div>
      <ul className="guide-facts">
        {nova.facts.map((fact) => (
          <li key={fact}>
            <CheckIcon size={16} className="guide-facts__icon" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}

/** Menu › Help › How Nova works. Scrolls with the HUD; opens the goal tabs on today's goal. */
export function GuideHud({ goal, calm, onBack }: { goal: DayGoal; calm: boolean; onBack(): void }) {
  return (
    <>
      <div className="nv-top">
        <BackBar label={GUIDE_COPY.backLabel} onBack={onBack} trailing={null} testId="guide-back" />
      </div>

      <header className="guide-head nv-text-plate">
        <StoryTitle size="lg">{GUIDE_COPY.title}</StoryTitle>
        <p className="guide-head__sub">{GUIDE_COPY.sub}</p>
      </header>

      <Timeline />
      <JumpChips calm={calm} />

      <DayChapter />
      <GoalChapter today={goal} />
      <ExtraChapter />
      <PoolChapter />
      <NovaChapter />

      <section className="guide-fine" data-testid="guide-fine-print">
        <h2 className="nv-kicker nv-kicker--muted">{GUIDE_COPY.finePrintTitle}</h2>
        {GUIDE_COPY.finePrint.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
    </>
  );
}
