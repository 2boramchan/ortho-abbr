// 주관식 채점: 대소문자·공백·하이픈·마침표·아포스트로피·괄호 무시, & == and, 악센트 무시(Calvé == Calve)

const STRIP = /[\s\-‐-―.'’‘`´"“”()[\]{},/=:;]/g;

export function normalize(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(STRIP, '');
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 한 항목이 정답으로 인정하는 모든 표기 */
export function acceptedForms(entry) {
  return [entry.full, ...(entry.alt || [])];
}

/**
 * @param {string} input 사용자 입력
 * @param {Array} entries 같은 약어의 모든 항목(동음 약어면 여러 개)
 * @returns {{status:'empty'|'correct'|'close'|'wrong', entry?:object, distance?:number}}
 *   close = 철자가 조금 다름(정답 공개 + "철자만 틀렸어요" 버튼 대상)
 */
export function grade(input, entries) {
  const n = normalize(input);
  if (!n) return { status: 'empty' };
  let best = null;
  for (const entry of entries) {
    for (const form of acceptedForms(entry)) {
      const f = normalize(form);
      if (f === n) return { status: 'correct', entry, distance: 0 };
      const d = levenshtein(n, f);
      if (!best || d < best.distance) best = { entry, distance: d, len: f.length };
    }
  }
  // 12글자당 1자까지만 '철자 실수'로 본다. 더 느슨하면 Anterior↔Posterior,
  // Internal↔External 같은 뜻이 반대인 단어까지 '아깝다'로 잡힌다.
  const tolerance = Math.max(1, Math.floor(best.len / 12));
  return best.distance <= tolerance
    ? { status: 'close', entry: best.entry, distance: best.distance }
    : { status: 'wrong', entry: best.entry, distance: best.distance };
}
