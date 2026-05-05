export function calculateFuelCost(
  totalKm: number,
  fuelEfficiencyKmPerL: number,
  gasPricePerLiter: number
): number {
  if (fuelEfficiencyKmPerL <= 0) return 0;
  const litersNeeded = totalKm / fuelEfficiencyKmPerL;
  return Math.round(litersNeeded * gasPricePerLiter);
}

export function calculateTollCost(segments: { amount: number }[]): number {
  return segments.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
}

export function sumDistances(distances: (number | undefined)[]): number {
  return distances.reduce((sum: number, d) => sum + (d ?? 0), 0);
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
