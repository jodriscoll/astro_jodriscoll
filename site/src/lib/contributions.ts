export const PUBLIC_TOTAL = 1068;
export const PRIVATE_TOTAL = 1183;
export const WEEKS = 53;
export const DAYS = 7;

export type Cell = {
  public: number;
  private: number;
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function allocate(weights: number[], total: number): number[] {
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0);
  const raw = weights.map((weight) => (weight / sum) * total);
  const counts = raw.map((value) => Math.floor(value));
  let left = total - counts.reduce((totalCount, count) => totalCount + count, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value), weight: weights[index] }))
    .sort((a, b) => b.fraction - a.fraction || b.weight - a.weight || a.index - b.index);
  for (const item of order) {
    if (left <= 0) break;
    if (item.weight <= 0) continue;
    counts[item.index] += 1;
    left -= 1;
  }
  if (left !== 0) throw new Error(`Could not place ${left} contributions`);
  return counts;
}

export function contributionCells(): Cell[] {
  const random = mulberry32(0x0d15c011);
  const dayWeight = [0.22, 0.84, 1, 0.96, 0.9, 0.74, 0.3];
  const weights: number[] = [];
  for (let week = 0; week < WEEKS; week++) {
    const wave = 0.62 + 0.38 * Math.sin((week / WEEKS) * Math.PI * 2 + 0.7);
    const quiet = week % 19 === 7 || week % 29 === 4 ? 0.15 : 1;
    for (let day = 0; day < DAYS; day++) {
      const shape = dayWeight[day] * wave * quiet;
      const active = random() < 0.42 + shape * 0.5;
      weights.push(active ? shape : 0);
    }
  }

  const privateCounts = allocate(weights, PRIVATE_TOTAL);
  const publicCounts = privateCounts.slice();
  let extra = PRIVATE_TOTAL - PUBLIC_TOTAL;
  const lightest = privateCounts
    .map((count, index) => ({ index, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => a.count - b.count || a.index - b.index);
  for (const item of lightest) {
    if (extra <= 0) break;
    const take = Math.min(publicCounts[item.index], extra);
    publicCounts[item.index] -= take;
    extra -= take;
  }
  if (extra !== 0) throw new Error(`Could not trim ${extra} public contributions`);

  return privateCounts.map((count, index) => ({
    private: count,
    public: publicCounts[index],
  }));
}

export function level(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}
