# 병동 약어 단어장 · 퀴즈 (OS / GS / NS / OR)

간호대 학생용 의학 약어 암기 웹앱입니다. 과목(단원)별로 따로 공부하고 시험 볼 수 있습니다.

| 과목 | 개수 | 출처 | 바로가기 |
|---|---|---|---|
| 정형외과(OS) | 167 | `병동별 약어.pdf` 「정형외과 약어」(9–11쪽) | `#ortho` |
| 외과(GS) | 30 | 「Essential Medical Abbreviations for GS Wards」 | `#gs` |
| 신경외과(NS) | 40 | 「2025-2학기 성인간호학 실습2 (NS 용어)」 | `#ns` |
| 수술장(OR) | 37 | 성인간호학2 실습 「수술장 약어」 | `#or` |

- **과목 전환**: 상단의 `OS | GS | NS | OR` 버튼. 진행 상황(Leitner 박스, 외웠어요/헷갈려요)·필터·분류 태그는 과목마다 따로 저장되고, "진행 상황 초기화"도 현재 과목만 지웁니다. 주소 끝에 `#gs`, `#ns`, `#or`를 붙이면 그 과목으로 바로 열립니다.

- **단어장(플래시카드)**: 앞면 약어 / 뒷면 풀네임·설명·한글 뜻. "외웠어요 / 헷갈려요" 표시, 셔플
- **주관식 퀴즈**: 약어를 보고 영어 풀네임 입력. 관대한 채점, 철자 실수 정답 처리, 틀린 문제만 다시
- **학습 관리**: Leitner 박스(1~5) — 틀리거나 헷갈린 카드가 더 자주 나옴. 진행 상황은 브라우저 localStorage에 저장
- **필터**: 전체 / 틀린 것·헷갈리는 것만 / 안 본 것만, 알파벳 구간, 분류 태그
- 반응형(폰 폭 400px), 다크 모드(시스템 설정 따름 + 수동 전환), 키보드만으로 사용 가능

## 키보드

| 화면 | 키 | 동작 |
|---|---|---|
| 단어장 | `Space` / `Enter` | 카드 뒤집기 |
| | `←` `→` | 이전 / 다음 카드 |
| | `1` / `2` | 외웠어요 / 헷갈려요 |
| 퀴즈 | `Enter` | 제출 → 한 번 더 누르면 다음 문제 |
| | `Esc` | 모르겠어요 |
| | `Tab` | "철자만 틀렸어요, 정답 처리" 버튼으로 이동 |

## 채점 규칙

- 대소문자, 공백, 하이픈, 마침표, 아포스트로피, 괄호, 악센트(é) 무시
- `&` 와 `and` 동일
- `alt`에 있는 원문 표기·대체 표기도 정답
- 동음 약어(PF, RP, TA)는 뜻 중 하나만 맞으면 정답, 정답 공개 시 모든 뜻 표시
- 12글자당 1자 이내 차이는 "아깝다! 철자가 조금 달라요"로 안내. 오답일 때는 언제나 "철자만 틀렸어요, 정답 처리" 버튼으로 정답 처리 가능

## 폴더 구조

```
index.html
css/style.css
js/app.js        화면·상태 관리
js/grade.js      채점(정규화, 편집 거리)
js/leitner.js    Leitner 박스, 가중치 셔플
js/store.js      localStorage 래퍼(실패해도 앱은 동작)
data/ortho.json  정형외과 약어 데이터 167개
data/gs.json     외과(GS) 약어 데이터 30개
data/ns.json     신경외과(NS) 약어 데이터 40개
data/or.json     수술장(OR) 약어 데이터 37개
data/review.md   원문 오타 의심·한글 뜻 검수 필요 목록
tests/           채점 함수 테스트(브라우저에서 실행)
tools/           PDF 추출·데이터 빌드 스크립트
```

빌드 도구 없이 HTML + CSS + ES modules만 사용합니다. 설치할 라이브러리나 번들링할 코드가 없어서 Vite 같은 빌드 단계가 필요하지 않습니다.

## 로컬 실행

ES modules와 `fetch('data/ortho.json')` 때문에 `index.html`을 더블클릭(file://)해서 열면 동작하지 않습니다. 간단한 정적 서버로 여세요.

```bash
cd ortho-abbr
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```

Node가 있다면 `npx serve .` 도 됩니다.

같은 Wi‑Fi의 휴대폰으로 보려면 `python3 -m http.server 8000 --bind 0.0.0.0` 후 `http://<컴퓨터 IP>:8000`.

### 테스트

서버를 켠 상태에서 `http://localhost:8000/tests/` 를 열면 채점 테스트 결과가 표시됩니다(탭 제목 `ALL PASS`).

## 무료 배포

### GitHub Pages
1. GitHub에 새 저장소를 만들고 이 폴더 내용을 push
   ```bash
   git init && git add . && git commit -m "정형외과 약어 앱"
   git branch -M main
   git remote add origin https://github.com/<아이디>/<저장소>.git
   git push -u origin main
   ```
2. 저장소 **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main` / `/ (root)` 저장
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소>/` 에서 열림

모든 경로가 상대 경로라 하위 경로(`/<저장소>/`)에서도 그대로 동작합니다.

### Vercel
1. https://vercel.com 에 GitHub로 로그인 → **Add New → Project** → 저장소 선택
2. Framework Preset: **Other**, Build Command 비움, Output Directory 비움(루트) → Deploy

또는 CLI: `npx vercel --prod` (폴더에서 실행).

## 데이터 수정

`data/gs.json`·`ns.json`·`or.json`은 `tools/build_subjects.py`의 `GS`/`NS`/`OR` 표를 고친 뒤 `python3 tools/build_subjects.py`로 다시 만듭니다. 새 과목을 추가하려면 같은 형식의 JSON을 만들고 `js/app.js`의 `SUBJECTS`와 `index.html`의 과목 버튼에 한 줄씩 추가하세요.

`data/ortho.json`은 `tools/build_data.py`가 생성합니다. 띄어쓰기 수정·note·태그·한글 뜻은 이 스크립트의 표(`OVERRIDES`, `TAGS`, `KO`)에서 고친 뒤 다시 실행하세요.

```bash
python3 tools/build_data.py
```

PDF에서 다시 추출하려면(pdfplumber 필요): `python3 tools/extract_pdf.py "<PDF 경로>" tools/raw_extract.json`

각 항목 형식:

```json
{ "id": "hto", "abbr": "HTO", "full": "High Tibial Osteotomy",
  "alt": ["HighTibialOsteotomy"], "note": "", "ko": "근위 경골 절골술",
  "tags": ["수술명"], "src": { "page": 10, "raw": "HighTibialOsteotomy" } }
```

`src`는 원문 대조용(PDF 쪽 번호와 원문 그대로의 표기)이며 앱은 사용하지 않습니다.
