// 간단한 Leitner 박스(1~5). 박스가 낮을수록(틀리거나 헷갈린 카드) 더 자주 출제된다.
export const MAX_BOX = 5;
const WEIGHT = { 1: 8, 2: 4, 3: 2, 4: 1, 5: 0.5 };

export function blank() {
  return { box: 1, seen: 0, right: 0, wrong: 0, flag: false, mark: null };
}

export function weightOf(p) {
  // 처음 보는 카드는 박스1과 같은 비중
  return WEIGHT[p?.box ?? 1] ?? 1;
}

/** 정답/외웠어요 → 한 칸 위로, 오답/헷갈려요 → 박스 1로 */
export function promote(p) {
  p.box = Math.min(MAX_BOX, (p.box || 1) + 1);
  p.flag = false;
}
export function demote(p) {
  p.box = 1;
  p.flag = true;
}

/** 가중치 순서로 섞기(Efraimidis–Spirakis). 무거운 항목이 앞쪽에 올 확률이 높다. */
export function weightedShuffle(items, weightFn, rand = Math.random) {
  return items
    .map((it) => ({ it, k: Math.pow(rand() || 1e-9, 1 / Math.max(weightFn(it), 1e-6)) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.it);
}

export function shuffle(items, rand = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
