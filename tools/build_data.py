"""raw_extract.json(PDF 9~11쪽 추출 결과) -> data/ortho.json

원문(raw)은 그대로 두고, 아래 OVERRIDES / TAGS / KO 표만 덧씌운다.
사용법: python3 tools/build_data.py
"""
import json, re, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
raw = json.load(open(ROOT / "tools" / "raw_extract.json", encoding="utf-8"))

# abbr 또는 (abbr, 원문 full) -> 수정 내용
# full: 표시용 풀네임 / alt: 정답으로 인정할 다른 표기 / note: 괄호 설명 등
OVERRIDES = {
    # 띄어쓰기 누락 -> 표시용은 띄어 쓰고, 원문은 alt 로
    "HTO": dict(full="High Tibial Osteotomy", alt=["HighTibialOsteotomy"]),
    "CDI": dict(full="Cotrel-Dubousset Instrumentation", alt=["Cotrel-Duboussetinstrumentation"]),
    "TJ": dict(full="Triceps brachii jerk", alt=["Tricepsbrachiijerk"]),
    "TP transfer": dict(full="Tendon Peronei Transfer to dorsum", alt=["TendonPeroneiTransfertodorsum"]),
    "T-table": dict(full="Tilting table", alt=["Tiltingtable"]),
    "TTS": dict(full="Thomas Thomson operation", note="원문: ThomasThomson(Strauber)operation",
                alt=["ThomasThomson(Strauber)operation", "Thomas Thomson (Strauber) operation"]),
    # 괄호 설명 -> note
    "ER": dict(full="External rotation", note="(=OR)", alt=["External rotation (=OR)"]),
    "OOP": dict(full="Out of plaster", note="cast의 일부를 개방함", alt=["Out of plaster(cast의 일부를 개방함)"]),
    "KT2000": dict(full="arthrometry", note="KT2000을 이용한 arthrometry",
                   alt=["KT2000 arthrometry", "(KT2000을 이용한) arthrometry"]),
    "IDK": dict(full="Internal Derangement of knee", note="원문 표기: Internal Derangement(of knee)",
                alt=["Internal Derangement(of knee)", "Internal Derangement"]),
    "LCL": dict(full="Lateral collateral ligament", note="(of knee)",
                alt=["Lateral collateral ligament (of knee)", "Lateral collateral ligament of knee"]),
    "MCL": dict(full="Medial collateral ligament", note="(of knee)",
                alt=["Medial collateral ligament (of knee)", "Medial collateral ligament of knee"]),
    "PC (of the knee)": dict(full="Posterior Capsulotomy", note="(of the knee)",
                             alt=["Posterior Capsulotomy (of the knee)", "Posterior Capsulotomy of the knee"]),
    # 약어 괄호 안 표기는 영어권 어순
    "SIA(AIS)": dict(note="AIS = Adolescent Idiopathic Scoliosis", alt=["Adolescent Idiopathic Scoliosis"]),
    "SII(IIS)": dict(note="IIS = Infantile Idiopathic Scoliosis", alt=["Infantile Idiopathic Scoliosis"]),
    "SIJ(JIS)": dict(note="JIS = Juvenile Idiopathic Scoliosis", alt=["Juvenile Idiopathic Scoliosis"]),
    # 원문 이중 공백 정리 (내용은 그대로)
    "SLAP": dict(full="Superior Labrum Anterior to Posterior"),
    "SLR": dict(full="Straight Leg Raising"),
    "TENS": dict(full="Transcutaneous Electric Nerve Stimulation"),
}

T_SURG, T_DX, T_ANAT, T_TEST, T_CAST, T_ETC = "수술명", "골절·질환", "해부·근육", "검사·치료", "깁스·보조기", "기타"
TAGS = {
    T_SURG: "A-K Amputation|A-M Prosthesis|Ant. Fusion|BG|B-K Amputation|C/R & I/F|CDI|CHS|CTR|DC|DCP|DHR|DLC|"
            "FBR|FL|FTSG|HTO|I & D|I/F|IM nail|O/R & E/F|O/R & I/F|OR|PC (of the knee)|PF#1|PLIF|Post. Fusion|"
            "Rev. THRA|Rev. TKRA|SCO|SLC|STSG|TERA|THRA|TKRA|TL|TP transfer|TSRA|TSRH|TT fusion|TTS",
    T_DX: "ABC|AVN|CDH|CMT's ds.|COM|CP|CRPS|CTS|DA|DDH|DJD|FC|FD|Fx|GCT|HIVD|IDK|LBP|LCP's ds|LLD|LOM|MFH|"
          "OA|OCD|OI|OPLL|OSA|PMD|PVNS|RA|RCT|RP#1|RP#2|RSD|SBC|SIA(AIS)|SII(IIS)|SIJ(JIS)|SLAP|SS|Tb Spine|Tm|VIC",
    T_ANAT: "ACL|DPA|EDL|EHL|EPH|EPL|FDL|FHL|L/E|LCL|LM|MCL|MM|MT|PB|PCL|SCM|TA#2|TP|U/E",
    T_TEST: "AC|AJ|BJ|BMS|BPB|Bx|CIC|CPM|DEXA|DTR|EUA|G-enema|IOA|KJ|KT2000|MCC|MJLT|MTC|P-bar walking|PCA|PCT|"
            "P-F crep|PTx|PWB|QSE|ROM|SLR|SMC|SMD|TENS|T-F crep|TJ|T-table|UDS|UMD",
    T_CAST: "C/D|C/W|EB|L/A cast|L/L cast|OOP|PTB cast|S/A cast|S/L cast|TLSO|W/A",
    T_ETC: "AK|BK|BMP|DF|EBL|ER|FF|H-vac|IR|JP drain|PF#2|POD|RD|seq|TA#1|UD|Wd",
}

# 한글 뜻: 확실한 것만. 빈 칸은 review.md 에 '한글 뜻 검수 필요'로 표시됨
KO = {
    "ABC": "동맥류성 골낭종", "AC": "발목 간대성 경련(발목 클로누스)", "ACL": "전방십자인대",
    "AJ": "발목 반사(아킬레스건 반사)", "AK": "무릎 위", "A-K Amputation": "무릎 위 절단(대퇴 절단)",
    "Ant. Fusion": "전방 유합술", "AVN": "무혈성 괴사", "BG": "골이식", "BJ": "이두근 반사",
    "BK": "무릎 아래", "B-K Amputation": "무릎 아래 절단(하퇴 절단)", "BMP": "골형성 단백질",
    "BPB": "상완신경총 차단", "Bx": "생검", "C/D": "압박 드레싱",
    "C/R & I/F": "비관혈적 정복 및 내고정술", "C/W": "목발 보행", "CDH": "선천성 고관절 탈구",
    "CIC": "청결 간헐적 도뇨", "CMT's ds.": "샤르코-마리-투스병", "COM": "만성 골수염", "CP": "뇌성마비",
    "CPM": "지속적 수동 운동", "CRPS": "복합부위 통증 증후군", "CTR": "수근관 유리술",
    "CTS": "수근관 증후군", "DA": "퇴행성 관절염", "DC": "변형 교정", "DCP": "동적 압박 금속판",
    "DDH": "발달성 고관절 이형성증", "DEXA": "이중에너지 X선 흡수계측법(골밀도 검사)", "DF": "배측굴곡",
    "DJD": "퇴행성 관절 질환", "DPA": "족배동맥", "DTR": "심부건 반사", "EB": "탄력붕대",
    "EBL": "추정 출혈량", "EDL": "장지신근(긴발가락폄근)", "EHL": "장무지신근(발)", "EPL": "장무지신근(손)",
    "ER": "외회전", "EUA": "마취하 검사", "FBR": "이물 제거", "FC": "굴곡 구축", "FD": "굴곡 변형",
    "FDL": "장지굴근(긴발가락굽힘근)", "FHL": "장무지굴근(발)", "FL": "대퇴골 연장술",
    "FTSG": "전층 피부이식", "Fx": "골절", "GCT": "거대세포종", "G-enema": "글리세린 관장",
    "HIVD": "추간판 탈출증", "HTO": "근위 경골 절골술", "H-vac": "헤모박(음압 배액관)",
    "I & D": "절개 및 배농", "I/F": "내고정", "IDK": "슬관절 내장증", "IM nail": "골수강내 금속정",
    "IOA": "수술 중 관절조영술", "IR": "내회전", "JP drain": "잭슨-프랫 배액관",
    "KJ": "무릎 반사(슬개건 반사)", "L/A cast": "장상지 석고붕대", "L/E": "하지",
    "L/L cast": "장하지 석고붕대", "LBP": "요통", "LCL": "외측 측부인대", "LCP's ds": "레그-칼베-페르테스병",
    "LLD": "하지 길이 차이", "LM": "외측 반월상연골", "LOM": "운동 제한", "MCC": "종아리 중간 둘레",
    "MCL": "내측 측부인대", "MFH": "악성 섬유성 조직구종", "MJLT": "내측 관절선 압통",
    "MM": "내측 반월상연골", "MT": "중족골", "MTC": "허벅지 중간 둘레",
    "O/R & E/F": "관혈적 정복 및 외고정술", "O/R & I/F": "관혈적 정복 및 내고정술", "OA": "골관절염",
    "OCD": "박리성 골연골염", "OI": "골형성 부전증", "OOP": "석고붕대 일부 개방",
    "OPLL": "후종인대 골화증", "OR": "관혈적 정복", "OSA": "골육종", "PB": "단비골근",
    "P-bar walking": "평행봉 보행", "PC (of the knee)": "(슬관절) 후방 관절낭 절개술",
    "PCA": "자가통증조절(PCA)", "PCL": "후방십자인대", "PCT": "슬개골 압박 검사",
    "PF#1": "족저근막 절개술", "PF#2": "족저굴곡", "P-F crep": "슬개대퇴 염발음",
    "PLIF": "후방 요추체간 유합술", "PMD": "진행성 근이영양증", "POD": "수술 후 일수",
    "Post. Fusion": "후방 유합술", "PTB cast": "슬개건 체중부하 석고붕대", "PTx": "물리치료",
    "PVNS": "색소 융모결절성 활막염", "PWB": "부분 체중부하", "QSE": "대퇴사두근 힘주기 운동",
    "RA": "류마티스 관절염", "RCT": "회전근개 파열", "RD": "요측 편위",
    "Rev. THRA": "고관절 전치환술 재수술", "Rev. TKRA": "슬관절 전치환술 재수술", "ROM": "관절가동범위",
    "RP#1": "방사통", "RP#2": "소아마비 후유증", "RSD": "반사성 교감신경 이영양증",
    "S/A cast": "단상지 석고붕대", "S/L cast": "단하지 석고붕대", "SBC": "단순(고립성) 골낭종",
    "SCM": "흉쇄유돌근", "SCO": "과상부 절골술", "seq": "후유증",
    "SIA(AIS)": "청소년기 특발성 척추측만증", "SII(IIS)": "영아기 특발성 척추측만증",
    "SIJ(JIS)": "소아기 특발성 척추측만증", "SLAP": "상부 관절와순 전후방 파열(SLAP 병변)", "SLR": "하지 직거상 검사", "SMC": "감각·운동·순환",
    "SS": "척추관 협착증", "STSG": "부분층 피부이식", "TA#1": "교통사고", "TA#2": "전경골근",
    "Tb Spine": "척추 결핵", "TENS": "경피적 전기신경자극", "TERA": "주관절 전치환술",
    "T-F crep": "경대퇴 염발음", "THRA": "고관절 전치환술", "TJ": "삼두근 반사",
    "TKRA": "슬관절 전치환술", "TL": "경골 연장술", "TLSO": "흉요천추 보조기", "Tm": "종양",
    "TP": "후경골근", "TSRA": "견관절 전치환술", "TT fusion": "경거관절 유합술",
    "T-table": "경사 테이블(기립 훈련대)", "U/E": "상지", "UD": "척측 편위", "UDS": "요역동학 검사",
    "VIC": "볼크만 허혈성 구축", "W/A": "휠체어 보행(이동)", "Wd": "상처",
}


def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-") or "x"


counts = collections.Counter(r["abbr"] for r in raw)
seen = collections.Counter()
tag_of = {k: t for t, keys in TAGS.items() for k in keys.split("|")}
items = []
for r in raw:
    a = r["abbr"]
    seen[a] += 1
    key = f"{a}#{seen[a]}" if counts[a] > 1 else a
    ov = OVERRIDES.get(a, {}) if counts[a] == 1 else {}
    full = re.sub(r"\s+", " ", ov.get("full", r["full"])).strip()
    alt = list(dict.fromkeys(x for x in ov.get("alt", []) if x != full))
    if r["full"] != full and r["full"] not in alt:
        alt.insert(0, r["full"])  # 원문 표기는 항상 정답으로 인정
    if key not in tag_of:
        raise SystemExit(f"태그 누락: {key}")
    items.append({
        "id": slug(a) + (f"-{seen[a]}" if counts[a] > 1 else ""),
        "abbr": a, "full": full, "alt": alt, "note": ov.get("note", ""),
        "ko": KO.get(key, ""), "tags": [tag_of[key]],
        "src": {"page": r["page"], "raw": r["full"]},
    })

unused = set(tag_of) - {(f"{i['abbr']}#{i['id'].rsplit('-',1)[1]}" if counts[i['abbr']] > 1 else i['abbr']) for i in items}
if unused:
    raise SystemExit(f"존재하지 않는 태그 키: {unused}")
ids = [i["id"] for i in items]
assert len(ids) == len(set(ids)), "id 중복"

# 채점 테스트용: 거르기 전 167개 전체(동음 약어·특수 표기 케이스가 많음)
(ROOT / "tests" / "fixture_ortho167.json").write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

# 실습 배부 「정형외과 약어 정리」 표(55개)에 있는 것만 남긴다. 값 = (화면 약어, 표 풀네임 표기)
KEEP = {
    "ACL": None, "AK": None, "Ant. Fusion": None, "AVN": None, "BG": None, "BK": None, "Bx": None,
    "C/R & I/F": ("C/R & I/F (CRIF)", None), "CIC": None, "COM": ("COM", "Chronic osteomyelitis"),
    "CPM": None, "CRPS": None, "CTS": None, "DA": None, "DDH": None, "DEXA": None, "DF": None,
    "DJD": None, "DPA": None, "DTR": None, "EB": ("EB", "Elastic Bandage"), "EBL": None, "EHL": None,
    "FBR": None, "Fx": None, "G-enema": ("G-enema", "Glycerin enema"), "H-vac": None, "I & D": None,
    "L/E": None, "LBP": None, "LCL": None, "LM": None, "MCL": None, "MM": None, "OA": None, "OCD": None,
    "O/R & I/F": ("O/R & I/F (ORIF)", None), "OSA": None, "PCA": ("PCA", "Patient Controlled Analgesia"),
    "PCL": None, "PLIF": None, "Post. Fusion": None, "PTx": None, "RA": None, "RCT": None, "ROM": None,
    "SMC": None, "SS": None, "TA#1": ("TA", "Traffic Accident"), "THRA": None, "TKRA": None, "TSRA": None,
    "U/E": ("U/E", "Upper Extremity"), "UDS": ("UDS", "Urodynamic Study"), "W/A": None,
}
RETAG = {"EB": "검사·치료", "W/A": "검사·치료"}  # 깁스·보조기 분류가 2개뿐이라 합침
kept = []
for i in items:
    key = f"{i['abbr']}#{i['id'].rsplit('-',1)[1]}" if counts[i["abbr"]] > 1 else i["abbr"]
    if key not in KEEP:
        continue
    if KEEP[key]:
        abbr, full = KEEP[key]
        i["abbr"] = abbr
        if full and full != i["full"]:
            i["alt"] = list(dict.fromkeys([i["full"], *i["alt"]]))
            i["full"] = full
    i["tags"] = [RETAG.get(i["abbr"], i["tags"][0])]
    kept.append(i)
assert len(kept) == len(KEEP), (len(kept), len(KEEP))
items = kept

out = ROOT / "data" / "ortho.json"
out.write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(len(items), "items ->", out)
print("동음 약어:", {k: v for k, v in counts.items() if v > 1})
print("태그 분포:", collections.Counter(i["tags"][0] for i in items))
print("ko 빈 칸:", [i["abbr"] for i in items if not i["ko"]])
