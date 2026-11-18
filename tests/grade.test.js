// 채점 함수 테스트. tests/index.html 에서 실행(브라우저 또는 헤드리스 Chrome).
import { grade, normalize } from '../js/grade.js';

// 채점 케이스는 거르기 전 167개(fixture)로, 데이터 무결성은 실제 앱 데이터(55개)로 검사
const fixture = await (await fetch('fixture_ortho167.json')).json();
const data = await (await fetch('../data/ortho.json')).json();
const by = (abbr) => fixture.filter((e) => e.abbr === abbr);

const cases = [
  // [설명, 약어, 입력, 기대 status]
  ['대소문자 다름', 'ACL', 'anterior cruciate ligament', 'correct'],
  ['전부 대문자', 'ACL', 'ANTERIOR CRUCIATE LIGAMENT', 'correct'],
  ['섞인 대소문자 + 앞뒤 공백', 'DJD', '  dEgEnErAtIvE joint DISEASE ', 'correct'],
  ['& 입력, 원문은 and', 'C/R & I/F', 'Closed Reduction & Internal Fixation', 'correct'],
  ['and 입력, 원문은 &', 'I & D', 'Incision and Drainage', 'correct'],
  ['& 를 붙여 씀', 'O/R & I/F', 'open reduction&internal fixation', 'correct'],
  ['하이픈 없음', 'CMT\'s ds.', 'Charcot Marie Tooths disease', 'correct'],
  ['하이픈 있음(원문은 띄어씀)', 'DEXA', 'Dual-Energy X-ray Absorptiometry', 'correct'],
  ['하이픈·악센트·아포스트로피 없음', 'LCP\'s ds', 'Legg Calve Perthes Disease', 'correct'],
  ['띄어쓰기 없이 입력', 'HTO', 'hightibialosteotomy', 'correct'],
  ['원문(alt) 표기', 'TJ', 'Tricepsbrachiijerk', 'correct'],
  ['표시용(띄어 쓴) 표기', 'TJ', 'Triceps brachii jerk', 'correct'],
  ['괄호 note 없이', 'ER', 'External rotation', 'correct'],
  ['괄호 note 포함 원문', 'ER', 'External rotation (=OR)', 'correct'],
  ['alt: 영어 어순', 'SIA(AIS)', 'Adolescent Idiopathic Scoliosis', 'correct'],
  ['마침표 섞임', 'Rev. THRA', 'Revision of T.H.R.A.', 'correct'],
  ['중복 약어 RA (뜻 1개)', 'RA', 'rheumatoid arthritis', 'correct'],
  ['중복 약어 TA 첫째 뜻', 'TA', 'Traffic accident', 'correct'],
  ['중복 약어 TA 둘째 뜻', 'TA', 'tibialis anterior muscle', 'correct'],
  ['중복 약어 PF 첫째 뜻', 'PF', 'Plantar Fasciotomy', 'correct'],
  ['중복 약어 PF 둘째 뜻', 'PF', 'plantar flexion', 'correct'],
  ['중복 약어 RP 둘째 뜻', 'RP', 'Residual Poliomyelitis', 'correct'],
  ['중복 약어: 다른 약어의 뜻은 오답', 'TA', 'Tibialis posterior muscle', 'wrong'],
  ['빈 입력', 'ACL', '', 'empty'],
  ['공백만 입력', 'ACL', '    ', 'empty'],
  ['구두점만 입력', 'ACL', ' - . \' ', 'empty'],
  ['철자 1자 틀림 → close', 'ACL', 'Anterior Cruciate Ligamnet', 'close'],
  ['표준 철자(원문 오타) → close', 'seq', 'sequelae', 'close'],
  ['전혀 다른 답', 'ACL', 'Posterior Cruciate Ligament', 'wrong'],
  ['단어 일부만', 'TKRA', 'Total Knee', 'wrong'],
  ['반대 방향(Internal↔External)', 'ER', 'Internal rotation', 'wrong'],
  ['긴 이름 철자 2자 틀림 → close', 'TENS', 'Transcutanous Electric Nerve Stimulaton', 'close'],
];

const rows = [];
let fail = 0;
for (const [desc, abbr, input, want] of cases) {
  const entries = by(abbr);
  const got = entries.length ? grade(input, entries).status : `NO DATA(${abbr})`;
  const ok = got === want;
  if (!ok) fail++;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${desc.padEnd(26)} [${abbr}] "${input}" → ${got}${ok ? '' : ` (기대: ${want})`}`);
}
// normalize 단위 테스트
const nchecks = [
  [normalize('A & B'), normalize('a and b')],
  [normalize("Volkmann's"), normalize('volkmanns')],
  [normalize('X-ray'), normalize('x ray')],
];
nchecks.forEach(([a, b], i) => {
  const ok = a === b;
  if (!ok) fail++;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  normalize #${i + 1}: "${a}" === "${b}"`);
});
// 데이터 무결성
const dupes = Object.entries(data.reduce((m, e) => ((m[e.abbr] = (m[e.abbr] || 0) + 1), m), {})).filter(([, n]) => n > 1);
const integrity = [
  ['fixture 항목 수 167', fixture.length === 167],
  ['항목 수 55', data.length === 55],
  ['id 고유', new Set(data.map((e) => e.id)).size === data.length],
  ['모든 항목에 태그', data.every((e) => e.tags.length === 1)],
  ['동음 약어 없음', dupes.length === 0],
  ['CRIF·ORIF 표기', ['C/R & I/F (CRIF)', 'O/R & I/F (ORIF)'].every((a) => data.some((e) => e.abbr === a))],
];
for (const [d, ok] of integrity) { if (!ok) fail++; rows.push(`${ok ? 'PASS' : 'FAIL'}  데이터: ${d}`); }

const total = cases.length + nchecks.length + integrity.length;
rows.push('', `${total - fail} / ${total} 통과`);
document.getElementById('out').textContent = rows.join('\n');
document.title = fail ? `FAIL ${fail}` : 'ALL PASS';
