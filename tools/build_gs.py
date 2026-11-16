"""GS(외과) 약어 데이터 생성: python3 tools/build_gs.py → data/gs.json
원문: 약어시험 PDF 「Essential Medical Abbreviations for GS Wards」 30개"""
import json, re, pathlib

# (약어, 풀네임, 한글 뜻, 태그, 대체 정답, note)
ROWS = [
  ("AGC", "Advanced Gastric Cancer", "진행성 위암", "암·종양", [], ""),
  ("EGC", "Early Gastric Cancer", "조기 위암", "암·종양", [], ""),
  ("HCC", "Hepatocellular Carcinoma", "간세포암", "암·종양", [], ""),
  ("LC", "Liver Cirrhosis", "간경변증", "질환·감염", [], ""),
  ("CHB", "Chronic Hepatitis B", "만성 B형 간염", "질환·감염", [], ""),
  ("HCV", "Hepatitis C Virus", "C형 간염 바이러스", "질환·감염", [], ""),
  ("GE reflux", "Gastroesophageal Reflux", "위식도 역류", "질환·감염", ["Gastro-esophageal Reflux"], ""),
  ("GIST", "Gastrointestinal Stromal Tumor", "위장관 기질 종양", "암·종양", ["Gastrointestinal Stromal Tumour"], ""),
  ("FAP", "Familial Adenomatous Polyposis", "가족성 선종성 용종증", "암·종양", [], ""),
  ("HNPCC", "Hereditary Nonpolyposis Colorectal Cancer", "유전성 비폴립성 대장암", "암·종양", [], ""),
  ("ERCP", "Endoscopic Retrograde Cholangio-Pancreatography", "내시경적 역행성 담췌관 조영술", "검사·시술", [], ""),
  ("PTBD", "Percutaneous Transhepatic Biliary Drainage", "경피적 간담즙 배액술", "검사·시술", [], ""),
  ("E-J", "Esophagojejunostomy", "식도공장문합술", "수술명", [], ""),
  ("G-J", "Gastrojejunostomy", "위공장문합술", "수술명", [], ""),
  ("TG", "Total Gastrectomy", "위 전절제술", "수술명", [], ""),
  ("STG", "Subtotal Gastrectomy", "위 아전절제술", "수술명", [], ""),
  ("RSG", "Radical Subtotal Gastrectomy", "근치적 위 아전절제술", "수술명", [], ""),
  ("TACE", "Transcatheter Arterial Chemoembolization", "간동맥 화학색전술", "검사·시술", [], ""),
  ("PPPD", "Pylorus Preserving Pancreaticoduodenectomy", "유문부 보존 췌장십이지장절제술", "수술명", ["Pylorus Preserving Pancreatoduodenectomy"], ""),
  ("CEA", "Carcinoembryonic Antigen", "종양표지자 (대장암 등)", "검사·시술", [], ""),
  ("CA", "Carbohydrate Antigen", "종양표지자 (췌장암, 담도암 등)", "검사·시술", [], "예: CA 19-9, CA 125"),
  ("CAPD", "Continuous Ambulatory Peritoneal Dialysis", "지속적 외래 복막투석", "검사·시술", [], ""),
  ("PCD", "Percutaneous Catheter Drainage", "경피적 배액술", "검사·시술", [], ""),
  ("IPMT", "Intraductal Papillary Mucinous Tumor", "췌장 점액성 종양", "암·종양", ["Intraductal Papillary Mucinous Tumour"], ""),
  ("DVT", "Deep Vein Thrombosis", "심부정맥혈전증", "질환·감염", ["Deep Venous Thrombosis"], ""),
  ("LT", "Liver Transplantation", "간이식", "수술명", ["Liver Transplant"], ""),
  ("CMV", "Cytomegalovirus Infection", "거대세포바이러스 감염", "질환·감염", ["Cytomegalovirus"], ""),
  ("MUO", "Metastasis of Unknown Origin", "원발 불명의 전이암", "암·종양", [], ""),
  ("URI", "Upper Respiratory Infection", "상기도 감염", "질환·감염", ["Upper Respiratory Tract Infection"], ""),
  ("CBD", "Common Bile Duct", "총담관", "기타", [], ""),
]

out = []
for abbr, full, ko, tag, alt, note in ROWS:
    out.append({"id": re.sub(r"[^a-z0-9]+", "-", abbr.lower()).strip("-"),
                "abbr": abbr, "full": full, "alt": alt, "note": note, "ko": ko, "tags": [tag],
                "src": {"page": 1, "raw": full}})
assert len({e["id"] for e in out}) == len(out)
p = pathlib.Path(__file__).resolve().parent.parent / "data" / "gs.json"
p.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(len(out), "entries →", p)
