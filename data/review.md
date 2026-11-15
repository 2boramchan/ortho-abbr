# 확인 필요 목록 (data/review.md)

출처: `병동별 약어.pdf` 9–11쪽 「정형외과 약어」, 총 **167개** 항목.
추출 결과는 PDF를 이미지로 렌더링해 한 줄씩 눈으로 대조했으며, 누락·단 섞임은 없었습니다.
아래 항목들은 **원문을 고치지 않고** 그대로 두었습니다. 검수 후 `tools/build_data.py`의 `OVERRIDES`에 반영하고
`python3 tools/build_data.py`를 다시 실행하면 됩니다.

## 1. 원문 오타로 보이는 것 (수정하지 않음)

| 약어 | 원문 | 의심 내용 |
|---|---|---|
| seq | sequalae | 표준 철자는 **sequelae** |
| UMD | Umblicomaleolar Distance | 표준 철자는 **Umbilicomalleolar** (umbilicus + malleolus) |
| SMD | Spinomaleolar distance | 표준 철자는 **Spinomalleolar** |
| EPH | Extensor Proprius Hallucis | 일반적 표기는 **Extensor Hallucis Proprius** (어순) |
| TP transfer | TendonPeroneiTransfertodorsum | 띄어쓰기 누락. 또한 TP는 보통 **Tibialis Posterior** (tendon) transfer를 뜻하므로 원문 의미 자체를 확인 필요 |
| TTS | ThomasThomson(Strauber)operation | 띄어쓰기 누락 + 인명 철자 불확실(Thompson? Strauber?). 표시는 "Thomas Thomson operation", 원문은 note/alt에 보존 |
| ER | External rotation (=OR) | "(=OR)"의 OR가 이 목록의 OR(Open Reduction)와 혼동될 수 있음. Outward Rotation의 의미로 추정 |
| SIA(AIS), SII(IIS), SIJ(JIS) | Scoliosis Idiopathic Adolescent 등 | 원문 어순 그대로 둠. 괄호 약어에 맞는 영어 어순(Adolescent Idiopathic Scoliosis 등)은 alt로 정답 인정 |

> 오타 의심 항목은 채점 시 원문 표기가 정답이므로, 표준 철자로 입력하면 "철자만 틀렸어요, 정답 처리" 버튼으로 인정할 수 있습니다.
> 검수 후 표준 철자를 `alt`에 추가하면 바로 정답 처리됩니다.

## 2. 표시용으로 띄어쓰기만 고친 것 (원문은 alt에 보존)

| 약어 | 원문 | 표시용 full |
|---|---|---|
| HTO | HighTibialOsteotomy | High Tibial Osteotomy |
| CDI | Cotrel-Duboussetinstrumentation | Cotrel-Dubousset Instrumentation |
| TJ | Tricepsbrachiijerk | Triceps brachii jerk |
| TP transfer | TendonPeroneiTransfertodorsum | Tendon Peronei Transfer to dorsum |
| T-table | Tiltingtable | Tilting table |
| TTS | ThomasThomson(Strauber)operation | Thomas Thomson operation |
| SLAP, SLR, TENS | 원문에 이중 공백 | 공백 하나로 정리 |

## 3. 괄호 설명을 note로 분리한 것

| 약어 | full | note |
|---|---|---|
| ER | External rotation | (=OR) |
| OOP | Out of plaster | cast의 일부를 개방함 |
| KT2000 | arthrometry | KT2000을 이용한 arthrometry |
| LCL / MCL | Lateral / Medial collateral ligament | (of knee) |
| PC (of the knee) | Posterior Capsulotomy | (of the knee) |
| IDK | Internal Derangement of knee | 원문 표기: Internal Derangement(of knee) — 약어의 K가 Knee라서 full에 포함 |

모두 원문 표기 전체도 alt로 정답 인정합니다.

## 4. 동음 약어 (퀴즈에서 어느 뜻이든 정답)

- **PF**: Plantar Fasciotomy / Plantar flexion
- **RP**: Radiating pain / Residual Poliomyelitis
- **TA**: Traffic accident / Tibialis Anterior muscle

## 5. 한글 뜻 검수 필요

다음 15개는 한글 뜻(`ko`)을 확실히 채울 수 없어 **비워 두었습니다**:

A-M Prosthesis, BMS, CDI, CHS, DHR, DLC, EPH, FF, KT2000, SLC, SMD, TP transfer, TSRH, TTS, UMD

나머지 152개의 `ko`는 표준 의학용어(구 용어 위주, 일부 신용어 병기)로 채웠습니다.
교재·병원에서 쓰는 용어와 다를 수 있으니 한 번 훑어봐 주세요. 특히 다음은 표현 선택이 갈릴 수 있습니다:
HTO(근위 경골 절골술 / 고위 경골 절골술), EHL·EPL(장무지신근 — 발/손 구분), QSE(대퇴사두근 힘주기 운동),
W/A(휠체어 보행/이동), MCC·MTC(종아리/허벅지 중간 둘레).

## 6. 분류 태그

태그는 내용을 보고 하나씩 붙였습니다(수술명 41, 골절·질환 43, 검사·치료 35, 해부·근육 20, 깁스·보조기 11, 기타 17).
경계가 애매한 것: 반사·신체검사 소견(AJ, KJ, AC, MJLT 등)은 "검사·치료", 관절 운동 방향(DF, ER, IR, RD, UD)은 "기타",
목발·휠체어 보행(C/W, W/A)은 "깁스·보조기", 재활 운동(P-bar walking, QSE, PWB)은 "검사·치료"로 분류했습니다.
