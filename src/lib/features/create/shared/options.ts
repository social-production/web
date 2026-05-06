import type { TagKind, TagRef } from '$lib/types/feed';

export interface SelectOption {
  slug: string;
  label: string;
  visibility?: 'public' | 'private';
}

export const channelOptions: SelectOption[] = [
  { slug: 'housing-build', label: 'Housing & Build' },
  { slug: 'mutual-aid', label: 'Mutual Aid' },
  { slug: 'energy-retrofit', label: 'Energy Retrofit' }
];

export const communityOptions: SelectOption[] = [
  { slug: 'east-market-makers', label: 'East Market Makers', visibility: 'public' },
  { slug: 'tool-library-crew', label: 'Tool Library Crew', visibility: 'public' },
  { slug: 'retrofit-circle', label: 'Retrofit Circle', visibility: 'private' }
];

export const followingUsernames = ['anika-shaw', 'devon-lee', 'sarah-kim'];

export function splitCommaValues(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function labelToSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function makeTagRef(label: string, kind: TagKind): TagRef {
  return {
    slug: labelToSlug(label),
    label,
    kind
  };
}

export function selectedTags(
  selectedSlugs: string[],
  options: SelectOption[],
  kind: TagKind
): TagRef[] {
  return selectedSlugs
    .map((slug) => options.find((option) => option.slug === slug))
    .filter((option): option is SelectOption => Boolean(option))
    .map((option) => ({ slug: option.slug, label: option.label, kind }));
}

export function toggleSelection(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}