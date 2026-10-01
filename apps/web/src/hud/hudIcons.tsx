import { getAssetUrl } from "@nova/assets";

type IconProps = {
  className?: string;
};

function CanonIcon({ id, className }: { id: string; className?: string }) {
  const url = getAssetUrl(id);
  if (!url) {
    return null;
  }
  return <img className={className} src={url} alt="" draggable={false} />;
}

export function DayIcon({ className }: IconProps) {
  return <CanonIcon id="icon_day" className={className} />;
}

export function FreeInfluenceIcon({ className }: IconProps) {
  return <CanonIcon id="icon_free_influence" className={className} />;
}

export function ExtraInfluenceIcon({ className }: IconProps) {
  return <CanonIcon id="icon_extra_influence" className={className} />;
}

export function UsdcIcon({ className }: IconProps) {
  return <CanonIcon id="icon_usdc" className={className} />;
}

export function CastInfluenceIcon({ className }: IconProps) {
  return <CanonIcon id="icon_cast_influence" className={className} />;
}

export function PlusIcon({ className }: IconProps) {
  return <CanonIcon id="icon_plus" className={className} />;
}

export function RankIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v8M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GoalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 19 6.5v6.2c0 4.2-2.8 7.4-7 8.8-4.2-1.4-7-4.6-7-8.8V6.5L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
