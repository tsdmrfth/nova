import { Link } from "react-router";
import { GlassSheet, ScreenFrame, StoryTitle } from "../ui";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <ScreenFrame dim>
      <div className="nv-bottom">
        <GlassSheet variant="modal">
          <StoryTitle size="sm">{title}</StoryTitle>
          <p className="nv-body nv-muted">Placeholder page. No wallet or on-chain in this slice.</p>
          <Link className="nv-btn nv-btn--primary" to="/">
            Back to Nova
          </Link>
        </GlassSheet>
      </div>
    </ScreenFrame>
  );
}
