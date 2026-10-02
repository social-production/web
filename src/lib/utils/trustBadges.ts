export function trustBadges(
  realR: number | null | undefined,
  bootstrapFloor?: boolean,
  extra: Array<string | null | undefined> = []
): string[] | undefined {
  const badges = extra.filter((item): item is string => Boolean(item));
  if (typeof realR === 'number' && Number.isFinite(realR)) {
    badges.push(`trust ${realR.toFixed(2)}`);
  }
  if (bootstrapFloor) {
    badges.push('Bootstrap');
  }
  return badges.length > 0 ? badges : undefined;
}
