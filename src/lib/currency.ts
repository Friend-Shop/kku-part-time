export function formatTHB(value: number | string | null | undefined) {
  return `THB ${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
