// localStorage 래퍼: 사생활 보호 모드 등에서 실패해도 앱은 메모리 상태로 계속 동작
const KEY = 'ortho-abbr:v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return obj && obj.v === 1 ? obj : null;
  } catch {
    return null;
  }
}

export function save(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...obj, v: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
}
