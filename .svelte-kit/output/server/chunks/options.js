const channelOptions = [
  { slug: "housing-build", label: "Housing & Build" },
  { slug: "mutual-aid", label: "Mutual Aid" },
  { slug: "energy-retrofit", label: "Energy Retrofit" }
];
const communityOptions = [
  { slug: "east-market-makers", label: "East Market Makers" },
  { slug: "tool-library-crew", label: "Tool Library Crew" },
  { slug: "retrofit-circle", label: "Retrofit Circle" }
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
function selectedTags(selectedSlugs, options, kind) {
  return selectedSlugs.map((slug) => options.find((option) => option.slug === slug)).filter((option) => Boolean(option)).map((option) => ({ slug: option.slug, label: option.label, kind }));
}
export {
  communityOptions as a,
  splitCommaValues as b,
  channelOptions as c,
  makeTagRef as m,
  selectedTags as s
};
