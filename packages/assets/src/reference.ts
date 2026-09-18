import reference from "../reference.json" with { type: "json" };

export type AssetReference = {
  active: "canon" | "drafts";
  canon: string;
  drafts: string;
};

export const assetReference: AssetReference = {
  active: reference.active === "drafts" ? "drafts" : "canon",
  canon: reference.canon,
  drafts: reference.drafts,
};
