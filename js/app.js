import { grade } from './grade.js';
import * as store from './store.js';
import { blank, weightOf, promote, demote, weightedShuffle, shuffle } from './leitner.js';

const $ = (id) => document.getElementById(id);

// 과목(단원). 과목마다 데이터·분류·진행 상황·필터가 따로 관리된다.
const SUBJECTS = {
  ortho: {
    name: '정형외과(OS)',
    file: 'data/ortho.json',
    tags: ['수술명', '골절·질환', '해부·근육', '검사·치료', '깁스·보조기', '기타'],
    source: '병동별 약어 자료 「정형외과 약어」',
  },
  gs: {
    name: '외과(GS)',
    file: 'data/gs.json',
    tags: ['암·종양', '질환·감염', '수술명', '검사·시술', '기타'],
    source: '「Essential Medical Abbreviations for GS Wards」',
  },
  ns: {
    name: '신경외과(NS)',
    file: 'data/ns.json',
    tags: ['뇌출혈·뇌혈관', '질환·종양', '검사·시술·약물', '해부·기타'],
    source: '「2025-2학기 성인간호학 실습2 (NS 용어)」',
  },
  or: {
    name: '수술장(OR)',
    file: 'data/or.json',
    tags: ['일반외과', '정형외과', '척추', '산부인과', '흉부외과', '신경외과', '기타'],
    source: '성인간호학2 실습 「수술장 약어」',
  },
  ts: {
    name: '흉부외과(TS)',
    file: 'data/ts.json',
    tags: ['심장·폐 질환', '판막·선천성', '부정맥', '수술·시술', '검사·수치', '해부·기타'],
    source: '「2025-2학기 성인간호학 실습2 (TS 용어)」',
  },
};
const SUBJECT_IDS = Object.keys(SUBJECTS);
const blankFilters = () => ({ status: 'all', range: 'all', tags: [] });
const RANGES = [
  { id: 'all', label: '전체', test: () => true },
  { id: 'a-c', label: 'A–C', test: (c) => c >= 'A' && c <= 'C' },
  { id: 'd-l', label: 'D–L', test: (c) => c >= 'D' && c <= 'L' },
  { id: 'm-r', label: 'M–R', test: (c) => c >= 'M' && c <= 'R' },
  { id: 's-z', label: 'S–Z', test: (c) => c >= 'S' && c <= 'Z' },
];
const STATUSES = [
  { id: 'all', label: '전체' },
  { id: 'wrong', label: '틀린 것·헷갈리는 것만' },
  { id: 'unseen', label: '안 본 것만' },
];
const QUIZ_LENS = [10, 20, 30, 0]; // 0 = 전체
const THEMES = ['auto', 'light', 'dark'];
const THEME_LABEL = { auto: '자동', light: '라이트', dark: '다크' };

const S = {
  subject: 'ortho',
  perSubject: {}, // { [과목]: { progress, filters } }
  cache: {},      // { [과목]: 불러온 데이터 }
  loadToken: 0,
  data: [],
  byAbbr: new Map(),
  progress: {},
  filters: blankFilters(),
  settings: { theme: 'auto', shuffle: false, quizLen: 20, subject: 'ortho' },
  view: 'cards',
  cards: { order: [], idx: 0, flipped: false },
  quiz: null,
};

/* ---------- 저장 ---------- */
function persist() {
  S.perSubject[S.subject] = { progress: S.progress, filters: S.filters };
  const ok = store.save({ subjects: S.perSubject, settings: S.settings });
  $('storage-warning').hidden = ok;
}
function prog(id) {
  return (S.progress[id] ||= blank());
}

/* ---------- 필터 ---------- */
function passes(e) {
  const f = S.filters;
  const p = S.progress[e.id];
  if (f.status === 'wrong' && !p?.flag) return false;
  if (f.status === 'unseen' && p?.seen) return false;
  const r = RANGES.find((x) => x.id === f.range) || RANGES[0];
  if (!r.test(e.abbr[0].toUpperCase())) return false;
  if (f.tags.length && !e.tags.some((t) => f.tags.includes(t))) return false;
  return true;
}
const filtered = () => S.data.filter(passes);

function chip(label, pressed, onClick, count) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.setAttribute('aria-pressed', String(pressed));
  b.textContent = label;
  if (count != null) {
    const c = document.createElement('span');
    c.className = 'count';
    c.textContent = ` ${count}`;
    b.append(c);
  }
  b.addEventListener('click', onClick);
  return b;
}

function renderFilters() {
  const f = S.filters;
  const countWith = (patch) => {
    const saved = { ...f };
    Object.assign(f, patch);
    const n = filtered().length;
    Object.assign(f, saved);
    return n;
  };
  $('f-status').replaceChildren(...STATUSES.map((s) =>
    chip(s.label, f.status === s.id, () => setFilter({ status: s.id }), countWith({ status: s.id }))));
  $('f-range').replaceChildren(...RANGES.map((r) =>
    chip(r.label, f.range === r.id, () => setFilter({ range: r.id }), countWith({ range: r.id }))));
  $('f-tags').replaceChildren(
    chip('전체', f.tags.length === 0, () => setFilter({ tags: [] })),
    ...SUBJECTS[S.subject].tags.map((t) => chip(t, f.tags.includes(t), () => {
      const tags = f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t];
      setFilter({ tags });
    }, S.data.filter((e) => e.tags.includes(t)).length)),
  );

  const parts = [];
  if (f.status !== 'all') parts.push(STATUSES.find((s) => s.id === f.status).label);
  if (f.range !== 'all') parts.push(RANGES.find((r) => r.id === f.range).label);
  if (f.tags.length) parts.push(f.tags.join(', '));
  $('filter-summary').textContent = `${parts.length ? parts.join(' · ') + ' — ' : ''}${filtered().length}개`;

  const seen = S.data.filter((e) => S.progress[e.id]?.seen).length;
  const learned = S.data.filter((e) => (S.progress[e.id]?.box || 1) >= 4).length;
  $('stats').textContent = `전체 ${S.data.length} · 본 것 ${seen} · 잘 아는 것(박스 4↑) ${learned}`;
}

function setFilter(patch) {
  Object.assign(S.filters, patch);
  persist();
  renderFilters();
  rebuildCards();
  if (S.quiz?.phase === 'setup' || !S.quiz) renderQuizSetup();
}

/* ---------- 단어장 ---------- */
function rebuildCards() {
  const keepId = S.cards.order[S.cards.idx]?.id;
  const list = filtered();
  S.cards.order = S.settings.shuffle ? weightedShuffle(list, (e) => weightOf(S.progress[e.id])) : list;
  const i = S.cards.order.findIndex((e) => e.id === keepId);
  S.cards.idx = !S.settings.shuffle && i >= 0 ? i : 0;
  S.cards.flipped = false;
  renderCard();
}

function renderCard() {
  const { order, idx, flipped } = S.cards;
  const e = order[idx];
  $('card').hidden = !e;
  $('card-empty').hidden = !!e;
  for (const id of ['prev', 'next', 'known', 'unsure']) $(id).disabled = !e;
  $('card-pos').textContent = e ? `${idx + 1} / ${order.length}` : '0 / 0';
  if (!e) { $('card-box').textContent = ''; return; }

  $('card').classList.toggle('flipped', flipped);
  $('card').setAttribute('aria-label', flipped ? `${e.abbr}: ${e.full}` : `${e.abbr} — 눌러서 뜻 보기`);
  $('card-tag').textContent = e.tags.join(', ');
  $('card-abbr').textContent = e.abbr;
  $('card-abbr2').textContent = e.abbr;
  $('card-full').textContent = e.full;
  $('card-note').textContent = e.note ? `※ ${e.note}` : '';
  $('card-ko').textContent = e.ko;
  const others = S.byAbbr.get(e.abbr).filter((x) => x !== e);
  $('card-others').textContent = others.length ? `같은 약어의 다른 뜻: ${others.map((x) => x.full).join(' / ')}` : '';
  const p = S.progress[e.id];
  const mark = p?.mark === 'known' ? ' · 외웠어요 ✓' : p?.mark === 'unsure' ? ' · 헷갈려요 ?' : '';
  $('card-box').textContent = ` · 박스 ${p?.box || 1}/5${mark}`;
}

function flip() {
  const e = S.cards.order[S.cards.idx];
  if (!e) return;
  S.cards.flipped = !S.cards.flipped;
  if (S.cards.flipped) {
    prog(e.id).seen++;
    persist();
    renderFilters();
  }
  renderCard();
}

function move(d) {
  const n = S.cards.order.length;
  if (!n) return;
  S.cards.idx = (S.cards.idx + d + n) % n;
  S.cards.flipped = false;
  renderCard();
}

function markCard(known) {
  const e = S.cards.order[S.cards.idx];
  if (!e) return;
  const p = prog(e.id);
  if (!p.seen) p.seen = 1;
  if (known) { promote(p); p.mark = 'known'; } else { demote(p); p.mark = 'unsure'; }
  persist();
  renderFilters();
  move(1);
}

/* ---------- 퀴즈 ---------- */
function quizPool() {
  // 문제 단위 = 약어(동음 약어는 한 문제로 묶음)
  const abbrs = [...new Set(filtered().map((e) => e.abbr))];
  return abbrs;
}
function groupWeight(abbr) {
  return Math.max(...S.byAbbr.get(abbr).map((e) => weightOf(S.progress[e.id])));
}

function renderQuizSetup() {
  if (S.quiz && S.quiz.phase !== 'setup') return;
  S.quiz = { phase: 'setup' };
  const pool = quizPool();
  $('quiz-pool').textContent = pool.length
    ? `현재 필터에 해당하는 약어 ${pool.length}개 중에서 출제돼요. 틀리거나 헷갈린 약어가 더 자주 나와요.`
    : '현재 필터에 해당하는 약어가 없어요. 위의 필터를 바꿔 보세요.';
  $('quiz-len').replaceChildren(...QUIZ_LENS.map((n) =>
    chip(n ? `${n}문제` : `전체(${pool.length})`, S.settings.quizLen === n, () => {
      S.settings.quizLen = n; persist(); renderQuizSetup();
    })));
  $('quiz-start').disabled = !pool.length;
  showQuizPart('setup');
}

function showQuizPart(part) {
  $('quiz-setup').hidden = part !== 'setup';
  $('quiz-play').hidden = part !== 'play';
  $('quiz-result').hidden = part !== 'result';
}

function startQuiz(abbrs) {
  if (!abbrs.length) return;
  S.quiz = { phase: 'ask', questions: abbrs, i: 0, score: 0, records: [] };
  showQuizPart('play');
  renderQuestion();
}

function startNewQuiz() {
  const pool = quizPool();
  const n = S.settings.quizLen || pool.length;
  startQuiz(weightedShuffle(pool, groupWeight).slice(0, n));
}

function renderQuestion() {
  const q = S.quiz;
  const abbr = q.questions[q.i];
  const total = q.questions.length;
  const done = q.i + (q.phase === 'answered' ? 1 : 0);
  $('quiz-pos').textContent = `문제 ${q.i + 1} / ${total}`;
  $('quiz-score').textContent = `점수 ${q.score} / ${done}`;
  $('quiz-progress').setAttribute('aria-valuemax', String(total));
  $('quiz-progress').setAttribute('aria-valuenow', String(done));
  $('quiz-progress-fill').style.width = `${(done / total) * 100}%`;
  $('quiz-abbr').textContent = abbr;

  const input = $('quiz-input');
  const answered = q.phase === 'answered';
  input.readOnly = answered;
  $('q-ask-actions').hidden = answered;
  $('quiz-feedback').hidden = !answered;
  input.classList.remove('is-correct', 'is-wrong');
  if (!answered) {
    input.value = '';
    $('quiz-hint').textContent = '';
    input.focus();
    return;
  }

  const rec = q.records[q.i];
  input.classList.add(rec.correct ? 'is-correct' : 'is-wrong');
  const v = $('quiz-verdict');
  if (rec.correct) {
    v.className = 'verdict good';
    v.textContent = rec.overridden ? '정답 처리했어요 (철자 확인!)' : '정답이에요!';
  } else if (rec.status === 'skip') {
    v.className = 'verdict bad';
    v.textContent = '정답은 이거예요';
  } else if (rec.status === 'close') {
    v.className = 'verdict close';
    v.textContent = '아깝다! 철자가 조금 달라요';
  } else {
    v.className = 'verdict bad';
    v.textContent = '틀렸어요';
  }
  const entries = S.byAbbr.get(abbr);
  $('quiz-answers').replaceChildren(...entries.map((e) => {
    const li = document.createElement('li');
    const full = document.createElement('div');
    full.className = 'a-full';
    full.textContent = (entries.length > 1 ? '• ' : '') + e.full;
    li.append(full);
    const sub = [e.ko, e.note && `※ ${e.note}`].filter(Boolean).join(' · ');
    if (sub) {
      const s = document.createElement('div');
      s.className = 'a-sub';
      s.textContent = sub;
      li.append(s);
    }
    return li;
  }));
  if (entries.length > 1) {
    const li = document.createElement('li');
    li.className = 'a-sub';
    li.textContent = `이 약어는 뜻이 ${entries.length}개예요. 하나만 맞혀도 정답이에요.`;
    $('quiz-answers').append(li);
  }
  $('quiz-override').hidden = rec.correct || rec.status === 'skip';
  $('quiz-next').innerHTML = q.i + 1 < total ? '다음 <kbd>Enter</kbd>' : '결과 보기 <kbd>Enter</kbd>';
}

function submitAnswer(skip = false) {
  const q = S.quiz;
  if (q?.phase !== 'ask') return;
  const abbr = q.questions[q.i];
  const input = $('quiz-input').value;
  let rec;
  if (skip) {
    rec = { abbr, input: '', correct: false, status: 'skip' };
  } else {
    const g = grade(input, S.byAbbr.get(abbr));
    if (g.status === 'empty') {
      $('quiz-hint').textContent = '답을 입력하거나, 모르면 Esc(모르겠어요)를 누르세요.';
      $('quiz-input').focus();
      return;
    }
    rec = { abbr, input, correct: g.status === 'correct', status: g.status };
  }
  q.records[q.i] = rec;
  if (rec.correct) q.score++;
  q.phase = 'answered';
  renderQuestion();
  $('quiz-input').focus();
}

function overrideAnswer() {
  const q = S.quiz;
  const rec = q?.records[q.i];
  if (!rec || rec.correct) return;
  rec.correct = true;
  rec.overridden = true;
  q.score++;
  renderQuestion();
  $('quiz-input').focus();
}

function commitRecord(rec) {
  for (const e of S.byAbbr.get(rec.abbr)) {
    const p = prog(e.id);
    p.seen++;
    if (rec.correct) { p.right++; promote(p); } else { p.wrong++; demote(p); }
  }
  persist();
}

function nextQuestion() {
  const q = S.quiz;
  if (q?.phase !== 'answered') return;
  commitRecord(q.records[q.i]);
  if (q.i + 1 >= q.questions.length) return showResult();
  q.i++;
  q.phase = 'ask';
  renderQuestion();
}

function showResult() {
  const q = S.quiz;
  q.phase = 'result';
  const total = q.questions.length;
  const wrong = q.records.filter((r) => !r.correct);
  $('result-score').textContent = `${q.score} / ${total} (${Math.round((q.score / total) * 100)}%)`;
  $('result-wrong-title').textContent = wrong.length ? `틀린 문제 ${wrong.length}개` : '모두 맞혔어요! 🎉';
  $('result-wrong').replaceChildren(...wrong.map((r) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = r.abbr;
    li.append(b, S.byAbbr.get(r.abbr).map((e) => e.full).join(' / '));
    if (r.input) {
      const y = document.createElement('div');
      y.className = 'yours';
      y.textContent = `내 답: ${r.input}`;
      li.append(y);
    }
    return li;
  }));
  $('result-retry').hidden = !wrong.length;
  showQuizPart('result');
  renderFilters();
  ($('result-retry').hidden ? $('result-new') : $('result-retry')).focus();
}

/* ---------- 탭 / 테마 ---------- */
function setView(v) {
  S.view = v;
  for (const [tab, panel, name] of [['tab-cards', 'view-cards', 'cards'], ['tab-quiz', 'view-quiz', 'quiz']]) {
    $(tab).setAttribute('aria-selected', String(v === name));
    $(tab).tabIndex = v === name ? 0 : -1;
    $(panel).hidden = v !== name;
  }
  if (v === 'quiz') {
    if (!S.quiz || S.quiz.phase === 'setup') renderQuizSetup();
    else if (S.quiz.phase !== 'result') $('quiz-input').focus();
  }
}

function applyTheme() {
  const t = S.settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  $('theme').textContent = `테마: ${THEME_LABEL[t]}`;
}

/* ---------- 이벤트 ---------- */
function bind() {
  $('tab-cards').addEventListener('click', () => setView('cards'));
  $('tab-quiz').addEventListener('click', () => setView('quiz'));
  document.querySelector('.tabs').addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      const next = S.view === 'cards' ? 'quiz' : 'cards';
      setView(next);
      $(`tab-${next}`).focus();
      ev.preventDefault();
      ev.stopPropagation();
    }
  });
  $('theme').addEventListener('click', () => {
    S.settings.theme = THEMES[(THEMES.indexOf(S.settings.theme) + 1) % THEMES.length];
    applyTheme();
    persist();
  });
  $('reset').addEventListener('click', () => {
    if (!confirm(`${SUBJECTS[S.subject].name}의 외웠어요/헷갈려요 표시와 퀴즈 기록을 모두 지울까요?`)) return;
    S.progress = {};
    persist();
    renderFilters();
    rebuildCards();
  });

  $('card').addEventListener('click', flip);
  $('prev').addEventListener('click', () => move(-1));
  $('next').addEventListener('click', () => move(1));
  $('known').addEventListener('click', () => markCard(true));
  $('unsure').addEventListener('click', () => markCard(false));
  $('shuffle').addEventListener('change', (ev) => {
    S.settings.shuffle = ev.target.checked;
    persist();
    rebuildCards();
  });

  $('quiz-start').addEventListener('click', startNewQuiz);
  $('quiz-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (S.quiz?.phase === 'answered') nextQuestion();
    else submitAnswer(false);
  });
  $('quiz-skip').addEventListener('click', () => submitAnswer(true));
  $('quiz-override').addEventListener('click', overrideAnswer);
  $('quiz-next').addEventListener('click', nextQuestion);
  $('result-retry').addEventListener('click', () => {
    const wrong = S.quiz.records.filter((r) => !r.correct).map((r) => r.abbr);
    startQuiz(shuffle(wrong));
  });
  $('result-new').addEventListener('click', () => { S.quiz = null; renderQuizSetup(); $('quiz-start').focus(); });

  document.addEventListener('keydown', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    const inField = t instanceof HTMLInputElement && t.type === 'text';
    const onButton = t instanceof HTMLButtonElement || (t instanceof HTMLInputElement && t.type === 'checkbox');

    if (S.view === 'quiz') {
      if (ev.key === 'Escape' && S.quiz?.phase === 'ask') { ev.preventDefault(); submitAnswer(true); }
      // 답 공개 상태: 입력창 밖(예: 진행 막대 클릭 후)에서 Enter → 다음 문제
      else if (ev.key === 'Enter' && S.quiz?.phase === 'answered' && !inField && !onButton) { ev.preventDefault(); nextQuestion(); }
      return;
    }
    if (inField || t.closest?.('summary, .filters')) return;
    // 카드에 포커스가 있으면 Space/Enter는 버튼 기본 동작(click → flip)에 맡김
    if ((ev.key === ' ' || ev.key === 'Enter') && !onButton) { ev.preventDefault(); flip(); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); move(1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); move(-1); }
    else if (ev.key === '1') markCard(true);
    else if (ev.key === '2') markCard(false);
  });
}

/* ---------- 과목 ---------- */
function renderSubjects() {
  for (const b of document.querySelectorAll('#subjects button')) {
    b.setAttribute('aria-pressed', String(b.dataset.subject === S.subject));
  }
  const sub = SUBJECTS[S.subject];
  document.title = `성2실습 단어시험 · ${sub.name}`;
  $('source').textContent = `출처: ${sub.source} ${S.data.length || ''}개 · 진행 상황은 이 브라우저에만 저장돼요.`;
}

function quizInProgress() {
  const q = S.quiz;
  return q && (q.phase === 'ask' || q.phase === 'answered') && (q.i > 0 || q.phase === 'answered');
}

async function setSubject(id, { force = false } = {}) {
  if (!SUBJECTS[id]) id = 'ortho';
  if (id === S.subject && !force) return;
  if (!force && quizInProgress() && !confirm('진행 중인 퀴즈가 있어요. 과목을 바꾸면 이 퀴즈는 끝나요. 바꿀까요?')) return;

  S.subject = id;
  S.settings.subject = id;
  const saved = S.perSubject[id] || {};
  S.progress = saved.progress || {};
  S.filters = { ...blankFilters(), ...(saved.filters || {}) };
  const tags = SUBJECTS[id].tags;
  S.filters.tags = S.filters.tags.filter((t) => tags.includes(t));
  S.quiz = null;
  S.cards = { order: [], idx: 0, flipped: false };
  S.data = [];
  S.byAbbr = new Map();
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  renderSubjects();
  persist();

  const token = ++S.loadToken;
  let data = S.cache[id];
  if (!data) {
    try {
      const res = await fetch(SUBJECTS[id].file);
      if (!res.ok) throw new Error(res.status);
      data = S.cache[id] = await res.json();
    } catch (err) {
      if (token !== S.loadToken) return;
      const el = $('load-error');
      el.hidden = false;
      el.textContent = `데이터(${SUBJECTS[id].file})를 불러오지 못했어요. index.html을 파일로 직접 열면 브라우저가 막습니다. README의 "로컬 실행" 방법대로 간단한 서버로 열어 주세요.`;
      $('view-cards').hidden = true;
      $('view-quiz').hidden = true;
      return;
    }
  }
  if (token !== S.loadToken) return; // 그 사이 다른 과목으로 바뀜
  $('load-error').hidden = true;
  S.data = data;
  for (const e of S.data) {
    if (!S.byAbbr.has(e.abbr)) S.byAbbr.set(e.abbr, []);
    S.byAbbr.get(e.abbr).push(e);
  }
  renderSubjects();
  renderFilters();
  rebuildCards();
  setView(S.view);
}

/* ---------- 시작 ---------- */
async function init() {
  const saved = store.load();
  if (saved) {
    if (saved.subjects) S.perSubject = saved.subjects;
    else if (saved.progress || saved.filters) {
      // 예전(정형외과만 있던) 저장 형식 → 정형외과 기록으로 옮김
      S.perSubject = { ortho: { progress: saved.progress || {}, filters: saved.filters || blankFilters() } };
    }
    Object.assign(S.settings, saved.settings || {});
  }
  applyTheme();
  $('shuffle').checked = S.settings.shuffle;
  bind();
  for (const b of document.querySelectorAll('#subjects button')) {
    b.addEventListener('click', () => setSubject(b.dataset.subject));
  }
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (SUBJECTS[h] && h !== S.subject) setSubject(h);
  });

  const fromHash = location.hash.slice(1);
  const first = SUBJECTS[fromHash] ? fromHash : (SUBJECTS[S.settings.subject] ? S.settings.subject : 'ortho');
  await setSubject(first, { force: true });
}

init();
