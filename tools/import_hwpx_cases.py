import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


WORKSPACE = Path(__file__).resolve().parents[1]
HWPX_PATH = Path.home() / "Desktop" / "케이스 설계.hwpx"
APP_PATH = WORKSPACE / "app.js"


def money(value):
    return int(str(value or "0").replace(",", "").replace(" ", "") or 0)


def value(pattern, text, default=""):
    match = re.search(pattern, text, re.S)
    return match.group(1).strip() if match else default


def yes(value):
    return str(value).strip().upper().startswith("Y")


def read_plain_text(path):
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("Contents/section0.xml")
    root = ET.fromstring(xml)
    texts = []
    for element in root.iter():
        if element.tag.endswith("}t") and element.text:
            text = element.text.strip()
            if text:
                texts.append(text)
    return " ".join(texts)


def split_statement(text):
    return [part.strip() for part in re.split(r"□", text) if part.strip()]


def parse_family(block):
    segment = value(r"순서\s+가족관계명\s+주민등록번호\s+성명\s+편입일자\s+변동일자\s+변경사유\s+(.+?)\s+진술 내용", block)
    rows = []
    for match in re.finditer(r"(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d{4}-\d{2}-##)\s+(\d{4}-\d{2}-##)\s+(\S+)", segment):
        relation = match.group(2)
        rows.append(
            {
                "no": int(match.group(1)),
                "relation": relation,
                "residentId": match.group(3),
                "name": match.group(4),
                "inDate": match.group(5),
                "changeDate": match.group(6),
                "reason": match.group(7),
                "dependent": relation not in ["친척", "동거인"],
            }
        )
    return rows


def parse_statement(block):
    text = value(r"진술 내용\s+(.+?)\s+신용정보 전체조회", block)
    card_debt = 0
    match = re.search(r"카드[^□]*?([\d,]+)천원", text)
    if match:
        card_debt = money(match.group(1))
    return text, {"items": split_statement(text), "cardDebtAmount": card_debt}


def parse_housing(statement):
    if "사택" in statement:
        return "사택"
    if "배우자 자가주택" in statement:
        return "배우자 자가"
    if "배우자 임차주택" in statement:
        return "임차(배우자)"
    if "무상거주" in statement:
        return "무상거주"
    if "기숙사" in statement:
        return "기숙사"
    if "임차" in statement:
        return "임차(본인)"
    return "임차(본인)"


def parse_assets(block, statement):
    assets = []
    if "배우자 임차주택" in statement:
        match = re.search(r"임차보증금\s*([\d,]+)천원", statement)
        if match:
            assets.append({"label": "배우자 임차보증금", "amount": money(match.group(1))})
    else:
        match = re.search(r"임차보증금\s*([\d,]+)천원", statement)
        if match and "사택" not in statement:
            assets.append({"label": "임차보증금", "amount": money(match.group(1))})

    match = re.search(r"자가주택.*?시세\s*([\d,]+)천원", statement)
    if match:
        assets.append({"label": "배우자 자가주택 시세", "amount": money(match.group(1))})

    match = re.search(r"대출잔액\s*([\d,]+)천원", statement)
    if match:
        assets.append({"label": "담보대출잔액", "amount": -money(match.group(1))})

    if "자동차" in block:
        if "차량 멸실" in statement:
            assets.append({"label": "차량", "amount": 0, "memo": "차량 멸실"})
        elif not any(asset["label"] == "차량" for asset in assets):
            assets.append({"label": "차량", "amount": 0})
    return assets


def parse_secured_payment(statement):
    total = sum(money(amount) for amount in re.findall(r"월리금\s+상환금액\s*([\d,]+)천원", statement))
    total += sum(money(amount) for amount in re.findall(r"월\s*([\d,]+)천원", statement))
    return total


def parse_debts(block):
    credit = value(r"신용정보 전체조회\s+(.+)", block)
    main_table = credit.split("(단위 : 천원)", 1)[0]
    row_pattern = re.compile(
        r"(?:(?:금융|대출)\s+)?"
        r"(신용카드|신용체크|햇살론카드|대출정보|카드론정보|현금서비스|대출)\s+"
        r"(\S+)\s+(\d{4})\s+(?:(\d{3})\s+)?"
        r"(\d{4}-\d{2}-\d{1,2})\s+([\d,]+)\s+([\d,]+)"
    )
    rows = []
    seen = set()
    for match in row_pattern.finditer(main_table):
        key = (match.group(1), match.group(2), match.group(3), match.group(4) or "", match.group(5), match.group(6))
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "type": match.group(1),
                "lender": match.group(2),
                "regCode": match.group(3),
                "loanCode": match.group(4) or "",
                "date": match.group(5),
                "amount": money(match.group(6)),
                "overdue": money(match.group(7)),
            }
        )
    return rows, credit.strip()


def parse_credit_info(credit):
    score = re.search(r"개인신용평점\s+구분\s+KCB\s+NICE\s+개인신용평점\s+(\d+)\s+(\d+)\s+하위누적구성비\s+(\S+)\s+(\S+)", credit)
    recent = re.search(r"최근1년이내\s+연체일수\s+(\d+)", credit)
    six_month = re.search(r"최근\s+6개월\s+이내\s+금융회사\s+5일\s+이상\s+연체횟수\s+(\d+)\s+(\d+)", credit)
    kcb = re.search(
        r"KCB\s+연체건수\s*:\s*(\d+)\s+최초연체금액\s*:\s*([\d,]+)\s+"
        r"최초연체일\s*:?\s*([\d-]*)\s+연체기산일\s*:?\s*([\d-]*)\s+연체일수:?\s*(\d*)",
        credit,
    )
    return {
        "reliefLoans": [],
        "rehabilitation": [],
        "scores": {
            "kcb": int(score.group(1)) if score else 0,
            "nice": int(score.group(2)) if score else 0,
            "kcbPercent": score.group(3) if score else "",
            "nicePercent": score.group(4) if score else "",
        },
        "recentOverdueDays": int(recent.group(1)) if recent else 0,
        "sixMonthOverdue": {
            "kcb": int(six_month.group(1)) if six_month else 0,
            "nice": int(six_month.group(2)) if six_month else 0,
        },
        "kcbOverdue": {
            "count": int(kcb.group(1)) if kcb else 0,
            "firstAmount": money(kcb.group(2)) if kcb else 0,
            "firstDate": kcb.group(3) if kcb else "",
            "startDate": kcb.group(4) if kcb else "",
            "days": kcb.group(5) if kcb else "",
        },
        "niceOverdue": {"count": 0, "firstAmount": 0, "firstDate": "", "startDate": "", "days": ""},
        "rawText": credit.strip(),
    }


def parse_cases(plain):
    starts = list(re.finditer(r"<CASE STUDY\s+(\d+)>", plain))
    cases = []
    for index, marker in enumerate(starts):
        start = marker.start()
        end = starts[index + 1].start() if index + 1 < len(starts) else len(plain)
        block = plain[start:end]
        no = int(marker.group(1))
        name = value(r"성명\s+(.*?)\s+주민등록번호", block)
        statement_text, statement = parse_statement(block)
        debts, credit_raw = parse_debts(block)
        credit_info = parse_credit_info(credit_raw)
        vulnerable_text = value(r"취약계층조회\s+(.+?)\s+가족현황", block)
        cases.append(
            {
                "id": f"case-{no}",
                "no": no,
                "title": f"CASE STUDY {no} - {name}",
                "basic": {
                    "name": name,
                    "residentId": value(r"주민등록번호\s+(\S+)\s+주소", block),
                    "address": value(r"주소\s+(.+?)\s+수급자", block),
                    "ageText": value(r"고령자\s+\S+\s+\(([^)]*)\)", block),
                    "eligibility": {
                        "welfare": yes(value(r"수급자\s+(\S+)", block)),
                        "disabled": yes(value(r"장애인\s+(\S+)", block)),
                        "older": yes(value(r"고령자\s+(\S+)", block)),
                        "lowerIncome": yes(value(r"법정\s+차상위\s+(\S+)", block)),
                        "vulnerable": bool(vulnerable_text and not vulnerable_text.startswith("N") and "소득초과" not in vulnerable_text),
                    },
                },
                "income": {
                    "jobType": "급여소득자",
                    "job": value(r"직장명\s+(.+?)\s+월소득", block),
                    "monthlyIncome": money(value(r"월소득\s+([\d,]+)원", block)) // 1000,
                },
                "housingType": parse_housing(statement_text),
                "assets": parse_assets(block, statement_text),
                "family": parse_family(block),
                "statement": statement,
                "debts": debts,
                "securedPayment": parse_secured_payment(statement_text),
                "delinquencyDays": credit_info["recentOverdueDays"],
                "creditInfo": credit_info,
            }
        )
    return cases


def update_app(cases):
    app = APP_PATH.read_text(encoding="utf-8")
    app = app.replace("debt-adjustment-training-cases-v6", "debt-adjustment-training-cases-v7")
    app = app.replace("debt-adjustment-training-selected-case-v6", "debt-adjustment-training-selected-case-v7")
    app = app.replace("debt-adjustment-training-state-v6", "debt-adjustment-training-state-v7")
    literal = "const DEFAULT_CASES = " + json.dumps(cases, ensure_ascii=False, indent=2) + ";"
    app = re.sub(r"const DEFAULT_CASES = \[[\s\S]*?\];\n\nconst STEPS =", literal + "\n\nconst STEPS =", app, count=1)
    APP_PATH.write_text(app, encoding="utf-8")


def main():
    cases = parse_cases(read_plain_text(HWPX_PATH))
    update_app(cases)
    print(json.dumps({"cases": len(cases), "titles": [case["title"] for case in cases], "debts": [len(case["debts"]) for case in cases]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
