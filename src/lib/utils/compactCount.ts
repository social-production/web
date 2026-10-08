export function formatCompactCount(value: number) {
  const count = Math.max(0, Math.round(value));
  if (count < 1000) {
    return String(count);
  }
  if (count < 10_000) {
    const hundreds = Math.round(count / 100) * 100;
    const thousands = hundreds / 1000;
    return thousands % 1 === 0 ? `${thousands.toFixed(0)}k` : `${thousands.toFixed(1)}k`;
  }
  if (count < 1_000_000) {
    const thousands = Math.round(count / 1000);
    return thousands >= 1000 ? '1m' : `${thousands}k`;
  }
  const hundredThousands = Math.round(count / 100_000) * 100_000;
  const millions = hundredThousands / 1_000_000;
  return millions % 1 === 0 ? `${millions.toFixed(0)}m` : `${millions.toFixed(1)}m`;
}
