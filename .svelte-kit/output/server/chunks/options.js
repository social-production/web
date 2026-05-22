const channelOptions = [
  { slug: "platform", label: "Platform" },
  { slug: "housing-build", label: "Housing & Build" },
  { slug: "mutual-aid", label: "Mutual Aid" },
  { slug: "energy-retrofit", label: "Energy Retrofit" }
];
const communityOptions = [
  { slug: "east-market-makers", label: "East Market Makers", visibility: "public" },
  { slug: "tool-library-crew", label: "Tool Library Crew", visibility: "public" },
  { slug: "retrofit-circle", label: "Retrofit Circle", visibility: "private" }
];
function splitCommaValues(value) {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}
function labelToSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function makeTagRef(label, kind) {
  return {
    slug: labelToSlug(label),
    label,
    kind
  };
}
export {
  communityOptions as a,
  channelOptions as c,
  makeTagRef as m,
  splitCommaValues as s
};
