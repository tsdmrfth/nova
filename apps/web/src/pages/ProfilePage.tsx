import { formatUsdc } from "@nova/shared";
import { useDayStore } from "../day/useDayStore";
import { PROFILE_COPY } from "../profile/profileCopy";
import "./ProfilePage.css";

export function ProfilePage() {
  const { state } = useDayStore();
  const empty = state.casts.length === 0;

  return (
    <section className="page profile-page">
      <h1>{PROFILE_COPY.title}</h1>
      {empty ? (
        <p data-testid="profile-empty">{PROFILE_COPY.empty}</p>
      ) : (
        <>
          <div className="profile-balances">
            <article className="profile-card" data-testid="profile-free">
              <p className="profile-label">{PROFILE_COPY.free}</p>
              <p className="profile-value">{state.freeInfluence}</p>
            </article>
            <article className="profile-card" data-testid="profile-extra">
              <p className="profile-label">{PROFILE_COPY.extra}</p>
              <p className="profile-value">{state.extraInfluence}</p>
            </article>
          </div>

          <section className="profile-section">
            <h2>{PROFILE_COPY.casts}</h2>
            <ol className="profile-list" data-testid="profile-casts">
              {state.casts.map((cast, index) => {
                const choice = state.choices.find(
                  (item) => item.id === cast.optionId,
                );
                return (
                  <li key={`${cast.optionId}-${index}`}>
                    Day {state.day} · {choice?.title ?? cast.optionId} · Free{" "}
                    {cast.free}
                    {cast.extra > 0 ? ` · Extra ${cast.extra}` : ""}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="profile-section">
            <h2>{PROFILE_COPY.claims}</h2>
            {state.claim ? (
              <ol className="profile-list" data-testid="profile-claims">
                <li>
                  Day {state.day} · {formatUsdc(state.claim.total)} USDC ·{" "}
                  {PROFILE_COPY.claimed}
                </li>
              </ol>
            ) : (
              <p data-testid="profile-claims-empty">{PROFILE_COPY.noClaims}</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
