const STORAGE = {
  cases: "debt-adjustment-training-cases-v8",
  selectedCase: "debt-adjustment-training-selected-case-v8",
  state: "debt-adjustment-training-state-v8",
};

const numberFormatter = new Intl.NumberFormat("ko-KR");
const formatNumber = (value) => numberFormatter.format(Math.round(Number(value) || 0));
const formatAmount = (value) => `${formatNumber(value)}천원`;

const ELIGIBILITY_OPTIONS = [
  { key: "welfare", label: "기초수급자" },
  { key: "disabled", label: "장애인" },
  { key: "older", label: "고령자" },
  { key: "lowerIncome", label: "법정 차상위" },
  { key: "vulnerable", label: "취약계층" },
];

const JOB_TYPES = ["급여소득자", "자영업자(사업소득)", "연금소득", "일용직", "무직"];
const HOUSING_TYPES = ["본인자가", "배우자 자가", "공동명의", "임차(본인)", "임차(배우자)", "사택", "기숙사", "무상거주"];
const MEDIAN_INCOME_2026 = {
  1: 2564238,
  2: 4199292,
  3: 5359036,
  4: 6494738,
  5: 7556719,
  6: 8555952,
  7: 9515150,
};

const DOCUMENTS = [
  { id: "overview", label: "묶음정보" },
  { id: "statement", label: "진술 내용" },
  { id: "credit1", label: "신용정보1" },
  { id: "credit2", label: "신용정보2" },
  { id: "summary", label: "작성완료한 조정안" },
];

const DEFAULT_CASES = [
  {
    "id": "case-1",
    "no": 1,
    "title": "CASE STUDY 1 - 석00",
    "basic": {
      "name": "석00",
      "residentId": "71####-1",
      "address": "경기도 김포시 봉화로29번길 10-2",
      "ageText": "만54세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "7###부대 - 시설관리원",
      "monthlyIncome": 2540
    },
    "housingType": "임차(본인)",
    "assets": [
      {
        "label": "임차보증금",
        "amount": 5000
      }
    ],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "71####-1",
        "name": "석00",
        "inDate": "2012-03-##",
        "changeDate": "2012-03-##",
        "reason": "세대주변경",
        "dependent": true
      }
    ],
    "statement": {
      "items": [
        "임차보증금 5,000천원, 월임차료 760천원",
        "채무발생사유 : 주식투자, 과도한 주식투자",
        "카드대금은 1,000천원 내외"
      ],
      "cardDebtAmount": 1000
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "국민카드",
        "regCode": "0083",
        "loanCode": "",
        "date": "2013-08-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "신한카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "1993-06-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2001-06-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "국민카드",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-12-01",
        "amount": 13000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "오케이저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2025-04-01",
        "amount": 4800,
        "overdue": 0
      },
      {
        "type": "카드론정보",
        "lender": "신한카드",
        "regCode": "0037",
        "loanCode": "100",
        "date": "2024-12-01",
        "amount": 5800,
        "overdue": 0
      },
      {
        "type": "카드론정보",
        "lender": "삼성카드",
        "regCode": "0037",
        "loanCode": "100",
        "date": "2024-12-01",
        "amount": 13400,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "신한카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2025-04-01",
        "amount": 3200,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "삼성카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2025-05-01",
        "amount": 600,
        "overdue": 0
      }
    ],
    "securedPayment": 0,
    "delinquencyDays": 0,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 592,
        "nice": 697,
        "kcbPercent": "6%",
        "nicePercent": "5.8%"
      },
      "recentOverdueDays": 0,
      "sixMonthOverdue": {
        "kcb": 0,
        "nice": 0
      },
      "kcbOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 신용카드 국민카드 0083 2013-08-01 0 0 신용카드 신한카드 0081 1993-06-01 0 0 신용카드 삼성카드 0081 2001-06-01 0 0 대출정보 국민카드 0031 100 2024-12-01 13,000 0 대출정보 오케이저축은행 0031 100 2025-04-01 4,800 0 카드론정보 신한카드 0037 100 2024-12-01 5,800 0 카드론정보 삼성카드 0037 100 2024-12-01 13,400 0 현금서비스 신한카드 0041 2025-04-01 3,200 0 현금서비스 삼성카드 0041 2025-05-01 600 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 (자체약정) 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 592 697 하위누적구성비 6% 5.8% 구분 KCB 최근1년이내 연체일수 0 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 0 0 ■ KCB 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 ■ 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 NICE"
    }
  },
  {
    "id": "case-2",
    "no": 2,
    "title": "CASE STUDY 2 - 원00",
    "basic": {
      "name": "원00",
      "residentId": "69####-1",
      "address": "인천광역시 부평구 원적로488번길 14, 101호(센트럴뷰1차아파트)",
      "ageText": "만56세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "주식회사 00식품",
      "monthlyIncome": 2130
    },
    "housingType": "무상거주",
    "assets": [
      {
        "label": "차량",
        "amount": 0,
        "memo": "차량 멸실"
      }
    ],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "69####-1",
        "name": "원00",
        "inDate": "2015-01-##",
        "changeDate": "2015-01-##",
        "reason": "세대분가",
        "dependent": true
      },
      {
        "no": 2,
        "relation": "친척",
        "residentId": "74####-1",
        "name": "원00",
        "inDate": "2015-01-##",
        "changeDate": "2015-01-##",
        "reason": "세대분가",
        "dependent": false
      }
    ],
    "statement": {
      "items": [
        "미혼",
        "친척 주택 무상거주",
        "차량 멸실",
        "채무발생사유 : 생활비 증대, 금융비용 증대",
        "카드대금 및 현금서비스 총 9,000천원 내외"
      ],
      "cardDebtAmount": 9000
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2022-11-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "현대카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2021-09-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "롯데카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2021-08-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "광주은행",
        "regCode": "0031",
        "loanCode": "240",
        "date": "2025-06-01",
        "amount": 9666,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "신한은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-04-01",
        "amount": 3500,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "하나저축은행",
        "regCode": "0031",
        "loanCode": "240",
        "date": "2024-10-01",
        "amount": 12250,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "하나저축은행",
        "regCode": "0037",
        "loanCode": "100",
        "date": "2025-04-01",
        "amount": 28158,
        "overdue": 0
      },
      {
        "type": "카드론정보",
        "lender": "현대카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2023-11-01",
        "amount": 458,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "삼성카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2025-09-01",
        "amount": 600,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "현대카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2025-09-01",
        "amount": 1130,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "롯데카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2025-08-31",
        "amount": 730,
        "overdue": 0
      }
    ],
    "securedPayment": 0,
    "delinquencyDays": 19,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 369,
        "nice": 414,
        "kcbPercent": "4%",
        "nicePercent": "4.1%"
      },
      "recentOverdueDays": 19,
      "sixMonthOverdue": {
        "kcb": 5,
        "nice": 5
      },
      "kcbOverdue": {
        "count": 5,
        "firstAmount": 400,
        "firstDate": "2026-01-03",
        "startDate": "2026-01-03",
        "days": "19"
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 신용카드 삼성카드 0081 2022-11-01 0 0 신용카드 현대카드 0081 2021-09-01 0 0 신용카드 롯데카드 0081 2021-08-01 0 0 대출정보 광주은행 0031 240 2025-06-01 9,666 0 대출정보 신한은행 0031 100 2024-04-01 3,500 0 대출정보 하나저축은행 0031 240 2024-10-01 12,250 0 대출정보 하나저축은행 0037 100 2025-04-01 28,158 0 카드론정보 현대카드 0041 2023-11-01 458 0 현금서비스 삼성카드 0041 2025-09-01 600 0 현금서비스 현대카드 0041 2025-09-01 1,130 0 현금서비스 롯데카드 0041 2025-08-31 730 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 (자체약정) 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 369 414 하위누적구성비 4% 4.1% 구분 KCB 최근1년이내 연체일수 19 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 5 5 ■ KCB 연체건수 : 5 최초연체금액 : 400 최초연체일 :2026-01-03 연체기산일 :2026-01-03 연체일수: 19 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 광주은행 2026-01-18 2026-01-18 9,600 200 4 하나저축은행 2026-01-17 2026-01-17 28,000 700 5 롯데카드 2026-01-16 2026-01-16 3,600 1,000 6 삼성카드 2026-01-17 2026-01-17 800 400 5 현대카드 2026-01-03 2026-01-03 1,000 1,800 19 ■ 연체건수 : 5 최초연체금액 : 400 최초연체일 :2026-01-03 연체기산일 :2026-01-03 연체일수: 19 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 광주은행 2026-01-18 2026-01-18 9,600 200 4 하나저축은행 2026-01-17 2026-01-17 28,000 700 5 롯데카드 2026-01-16 2026-01-16 3,600 1,000 6 삼성카드 2026-01-17 2026-01-17 800 400 5 현대카드 2026-01-03 2026-01-03 1,000 1,800 19 NICE"
    }
  },
  {
    "id": "case-3",
    "no": 3,
    "title": "CASE STUDY 3 - 석01",
    "basic": {
      "name": "석01",
      "residentId": "91####-1",
      "address": "경북 포항시 북구 두호로 65, 101동 101호(두호SK뷰푸르지오2단지아파트)",
      "ageText": "만35세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": true
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "00시청(환경관리원)",
      "monthlyIncome": 3900
    },
    "housingType": "임차(배우자)",
    "assets": [
      {
        "label": "배우자 임차보증금",
        "amount": 20000
      },
      {
        "label": "차량",
        "amount": 0
      }
    ],
    "family": [
      {
        "no": 1,
        "relation": "배우자",
        "residentId": "91####-2",
        "name": "하00",
        "inDate": "2022-11-##",
        "changeDate": "2022-11-##",
        "reason": "전입",
        "dependent": true
      },
      {
        "no": 2,
        "relation": "본인",
        "residentId": "93####-1",
        "name": "석01",
        "inDate": "2022-11-##",
        "changeDate": "2022-11-##",
        "reason": "전입",
        "dependent": true
      },
      {
        "no": 3,
        "relation": "자녀",
        "residentId": "22####-3",
        "name": "석00",
        "inDate": "2022-11-##",
        "changeDate": "2022-11-##",
        "reason": "출생",
        "dependent": true
      },
      {
        "no": 4,
        "relation": "자녀",
        "residentId": "25####-4",
        "name": "석00",
        "inDate": "2025-11-##",
        "changeDate": "2025-11-##",
        "reason": "출생",
        "dependent": true
      }
    ],
    "statement": {
      "items": [
        "배우자 임차주택, 임차보증금 20,000천원",
        "채무발생사유 : 생계비, 지출증가",
        "배우자 사무직 2,200천원 소득",
        "우리카드 1,000천원 대금 사용",
        "비엔케이저축은행 월리금 상환금액 360천원"
      ],
      "cardDebtAmount": 1000
    },
    "debts": [
      {
        "type": "햇살론카드",
        "lender": "우리카드",
        "regCode": "0085",
        "loanCode": "",
        "date": "2025-11-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "비엔케이저축은행",
        "regCode": "0031",
        "loanCode": "240",
        "date": "2025-08-01",
        "amount": 15000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "세람상호저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-02-01",
        "amount": 32000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "웰컴저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-12-01",
        "amount": 19000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "웰컴저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2025-05-01",
        "amount": 10000,
        "overdue": 0
      }
    ],
    "securedPayment": 360,
    "delinquencyDays": 10,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 620,
        "nice": 790,
        "kcbPercent": "6%",
        "nicePercent": "30%"
      },
      "recentOverdueDays": 10,
      "sixMonthOverdue": {
        "kcb": 2,
        "nice": 2
      },
      "kcbOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 햇살론카드 우리카드 0085 2025-11-01 0 0 대출정보 비엔케이저축은행 0031 240 2025-08-01 15,000 0 대출정보 세람상호저축은행 0031 100 2024-02-01 32,000 0 대출정보 웰컴저축은행 0031 100 2024-12-01 19,000 0 대출정보 웰컴저축은행 0031 100 2025-05-01 10,000 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 (자체약정) 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 620 790 하위누적구성비 6% 30% 구분 KCB 최근1년이내 연체일수 10 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 2 2 ■ KCB 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 ■ 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 NICE"
    }
  },
  {
    "id": "case-4",
    "no": 4,
    "title": "CASE STUDY 4 - 현00",
    "basic": {
      "name": "현00",
      "residentId": "64####-1",
      "address": "경기도 의정부시 호국로1183번길 40-18",
      "ageText": "만61세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": true,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "클로## ㈜",
      "monthlyIncome": 2600
    },
    "housingType": "무상거주",
    "assets": [],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "64####-1",
        "name": "현00",
        "inDate": "2024-11-##",
        "changeDate": "2024-11-##",
        "reason": "세대주변경",
        "dependent": true
      },
      {
        "no": 2,
        "relation": "배우자",
        "residentId": "68####-2",
        "name": "선00",
        "inDate": "2024-11-##",
        "changeDate": "2024-11-##",
        "reason": "세대주변경",
        "dependent": true
      },
      {
        "no": 3,
        "relation": "자녀",
        "residentId": "95####-2",
        "name": "현00",
        "inDate": "2024-11-##",
        "changeDate": "2024-11-##",
        "reason": "세대주변경",
        "dependent": true
      },
      {
        "no": 4,
        "relation": "자녀",
        "residentId": "02####-3",
        "name": "현00",
        "inDate": "2024-11-##",
        "changeDate": "2024-11-##",
        "reason": "세대주변경",
        "dependent": true
      }
    ],
    "statement": {
      "items": [
        "모친 주택 무상거주",
        "채무발생사유 : 생계비, 늘었음",
        "배우자 요양보호사 1,200천원 소득 / 첫째 개인사업체 직원 / 둘째 대학생",
        "카드사용대금 약 6,000천원 / 하나저축은행 월350천원, 전북은행 월350천원"
      ],
      "cardDebtAmount": 6000
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "국민카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2016-06-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용체크",
        "lender": "국민카드",
        "regCode": "0083",
        "loanCode": "",
        "date": "2013-06-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2014-05-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "현대카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2023-10-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "롯데카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2014-05-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "전북은행",
        "regCode": "0031",
        "loanCode": "240",
        "date": "2025-04-01",
        "amount": 14500,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "SBI저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2022-04-01",
        "amount": 16000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "다올저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-08-01",
        "amount": 19000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "하나저축은행",
        "regCode": "0031",
        "loanCode": "240",
        "date": "2024-04-01",
        "amount": 11000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "키움저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-10-01",
        "amount": 13800,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "오케이저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2021-03-01",
        "amount": 14800,
        "overdue": 0
      }
    ],
    "securedPayment": 700,
    "delinquencyDays": 0,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 655,
        "nice": 807,
        "kcbPercent": "8%",
        "nicePercent": "32.9%"
      },
      "recentOverdueDays": 0,
      "sixMonthOverdue": {
        "kcb": 0,
        "nice": 0
      },
      "kcbOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 신용카드 국민카드 0081 2016-06-01 0 0 신용체크 국민카드 0083 2013-06-01 0 0 신용카드 삼성카드 0081 2014-05-01 0 0 신용카드 현대카드 0081 2023-10-01 0 0 신용카드 롯데카드 0081 2014-05-01 0 0 대출정보 전북은행 0031 240 2025-04-01 14,500 0 대출정보 SBI저축은행 0031 100 2022-04-01 16,000 0 대출정보 다올저축은행 0031 100 2024-08-01 19,000 0 대출정보 하나저축은행 0031 240 2024-04-01 11,000 0 대출정보 키움저축은행 0031 100 2023-10-01 13,800 0 대출정보 오케이저축은행 0031 100 2021-03-01 14,800 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 (자체약정) 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 655 807 하위누적구성비 8% 32.9% 구분 KCB 최근1년이내 연체일수 0 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 0 0 ■ KCB 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 ■ 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 NICE"
    }
  },
  {
    "id": "case-5",
    "no": 5,
    "title": "CASE STUDY 5 - 석02",
    "basic": {
      "name": "석02",
      "residentId": "66####-1",
      "address": "광주 북구 설죽로389번길 70, 101동 101호(그린타운)",
      "ageText": "만59세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "00주민센터",
      "monthlyIncome": 4800
    },
    "housingType": "배우자 자가",
    "assets": [
      {
        "label": "배우자 자가주택 시세",
        "amount": 150000
      },
      {
        "label": "담보대출잔액",
        "amount": -60000
      },
      {
        "label": "차량",
        "amount": 0
      }
    ],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "68####-2",
        "name": "미00",
        "inDate": "2005-01-##",
        "changeDate": "2005-01-##",
        "reason": "전입",
        "dependent": true
      },
      {
        "no": 2,
        "relation": "배우자",
        "residentId": "66####-1",
        "name": "석02",
        "inDate": "2022-11-##",
        "changeDate": "2022-11-##",
        "reason": "전입",
        "dependent": true
      },
      {
        "no": 3,
        "relation": "자녀",
        "residentId": "93####-#",
        "name": "석00",
        "inDate": "2025-02-##",
        "changeDate": "2025-02-##",
        "reason": "전입",
        "dependent": true
      }
    ],
    "statement": {
      "items": [
        "배우자 자가주택 거주(59제곱미터, 시세 150,000천원, 대출잔액 60,000천원)",
        "채무발생사유 : 생활비, 보이스피싱",
        "배우자 배달 일용직, 월소득 약 500천원",
        "카드 잔여대금 1,000천원 미만"
      ],
      "cardDebtAmount": 1000
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "제주은행",
        "regCode": "0081",
        "loanCode": "",
        "date": "2020-03-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "신한카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2019-05-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2024-08-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출",
        "lender": "제주은행",
        "regCode": "0031",
        "loanCode": "",
        "date": "2024-09-01",
        "amount": 70500,
        "overdue": 0
      }
    ],
    "securedPayment": 0,
    "delinquencyDays": 210,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 150,
        "nice": 300,
        "kcbPercent": "0%",
        "nicePercent": "0%"
      },
      "recentOverdueDays": 210,
      "sixMonthOverdue": {
        "kcb": 1,
        "nice": 1
      },
      "kcbOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "구분 등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 해제사유 금융 신용카드 제주은행 0081 2020-03-01 0 0 금융 신용카드 신한카드 0081 2019-05-01 0 0 금융 신용카드 삼성카드 0081 2024-08-01 0 0 연체 대출원금, 이자 등을 3개월 이상 연체한 거래처 제주은행 70101 2025-02-01 70,500 70,500 미해제 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 제주은행 70104 2025-02-0 600 600 미해제 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 삼성카드 70104 2025-07-23 600 1 미해제 대출 대출 제주은행 0031 2024-09-01 70,500 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 150 300 하위누적구성비 0% 0% 구분 KCB 최근1년이내 연체일수 210 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 1 1 ■ KCB 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 ■ 연체건수 : 0 최초연체금액 : 0 최초연체일 : 연체기산일 : 연체일수: 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 해당사항 없음 NICE"
    }
  },
  {
    "id": "case-6",
    "no": 6,
    "title": "CASE STUDY 6 - 은00",
    "basic": {
      "name": "은00",
      "residentId": "97####-2",
      "address": "충청남도 논산시 중앙로322번길 7-14 101호",
      "ageText": "만29세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "00병원",
      "monthlyIncome": 4100
    },
    "housingType": "임차(본인)",
    "assets": [
      {
        "label": "임차보증금",
        "amount": 30000
      }
    ],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "97####-2",
        "name": "은00",
        "inDate": "2018-01-##",
        "changeDate": "2018-01-##",
        "reason": "전입",
        "dependent": true
      },
      {
        "no": 2,
        "relation": "동거인",
        "residentId": "94####-1",
        "name": "김00",
        "inDate": "2022-11-##",
        "changeDate": "2022-11-##",
        "reason": "전입",
        "dependent": false
      }
    ],
    "statement": {
      "items": [
        "미혼",
        "본인임차주택, 임차보증금 30,000천원, 임차료 500천원",
        "채무발생사유 : 대학생 동생 대학 등록금, 할머니 병원비 등",
        "넥스젠파이낸스, 엔씨파이낸스대부 대출금은 전세자금 임차보증금 대출이라 함",
        "카드 사용내용 잘 기억 안남"
      ],
      "cardDebtAmount": 0
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "하나카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2019-03-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "신한카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2017-07-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2019-10-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "하나은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-04-01",
        "amount": 22000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "카카오뱅크",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-03-01",
        "amount": 10000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "한국투자저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-10-01",
        "amount": 7200,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "예가람상호저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2024-01-01",
        "amount": 7800,
        "overdue": 0
      },
      {
        "type": "현금서비스",
        "lender": "신한카드",
        "regCode": "0041",
        "loanCode": "",
        "date": "2024-09-01",
        "amount": 1100,
        "overdue": 0
      }
    ],
    "securedPayment": 0,
    "delinquencyDays": 365,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 150,
        "nice": 220,
        "kcbPercent": "0%",
        "nicePercent": "0%"
      },
      "recentOverdueDays": 365,
      "sixMonthOverdue": {
        "kcb": 2,
        "nice": 3
      },
      "kcbOverdue": {
        "count": 2,
        "firstAmount": 10800,
        "firstDate": "2024-11-01",
        "startDate": "2024-11-01",
        "days": "395"
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "구분 등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 해제사유 금융 신용카드 하나카드 0081 2019-03-01 0 0 금융 신용카드 신한카드 0081 2017-07-01 0 0 금융 신용카드 삼성카드 0081 2019-10-01 0 0 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 신한카드 70104 2025-09-01 8,000 8,000 미해제 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 삼성카드 70104 2025-01-01 6,000 6,000 미해제 연체 대출원금, 이자 등을 3개월 이상 연체한 거래처 한국투자저축은행 00101 2025-02-01 7,200 7,200 미해제 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 참저축은행 00103 2025-09-01 2,800 2,800 미해제 연체 대출원금, 이자 등을 3개월 이상 연체한 거래처 예가람상호저축은행 00101 2025-03-01 7,800 7,800 미해제 대출 대부대출(통합) 28,600 0 대출 대출정보 하나은행 0031 100 2023-04-01 22,000 0 대출 대출정보 카카오뱅크 0031 100 2023-03-01 10,000 0 대출 대출정보 한국투자저축은행 0031 100 2023-10-01 7,200 0 대출 대출정보 예가람상호저축은행 0031 100 2024-01-01 7,800 0 대출 현금서비스 신한카드 0041 2024-09-01 1,100 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 해당사항 없음 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 150 220 하위누적구성비 0% 0% 구분 KCB 최근1년이내 연체일수 365 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 2 3 ■ KCB 연체건수 : 2 최초연체금액 : 10,800 최초연체일 :2024-11-01 연체기산일 :2024-11-01 연체일수: 395 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 예가람저축은행 2024-12-01 2024-12-01 7,800 3,300 354 한국투자저축은행 2024-11-01 2024-11-01 7,200 7,500 395 ■ 연체건수 : 3 최초연체금액 : 32,000 최초연체일 :2024-11-01 연체기산일 :2024-11-01 연체일수: 395 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 예가람저축은행 2024-12-01 2024-12-01 7,800 3,300 354 하나은행 2024-12-01 2024-12-01 22,000 22,000 367 한국투자저축은행 2024-11-01 2024-11-01 7,200 7,500 395 NICE 나머지 빈칸 표기 생략 채권자 변동표 ⓛ 채무 현황 구분 등록사유 기관명 대출발생일자 금액 개인대출정보 신용대출(100) 카카오뱅크 2023-03-01 10,000 개인대출정보 신용대출(100) 하나은행 2023-04-01 22,000 개인대출정보 신용대출(100) 베스턴자산운용[케이씨2506유동화전문] 2023-07-01 8,000 개인대출정보 신용대출(100) 한국투자저축은행 2023-10-01 7,200 개인대출정보 신용대출(100) 예가람상호저축은행 2024-01-01 7,800 개인대출정보 신용대출(100) 비케이자산관리대부 2024-02-01 9,000 개인대출정보 기타 담보(290) 넥스젠파이낸스대부 2024-06-01 9,800 개인대출정보 기타 담보(290) 엔씨파이낸스대부 2024-06-01 9,800 개인대출정보 신한카드 2024-09-05 1,100 합계 92,000 (단위 : 천원) ② 채권자 변동현황 순번 금융기관명 채권구분 등록사유 발생일자 변제예정금액 채무조정 유형 양도사유 (양도일자) 양도금액 (양수기관) 해제사유 기타 등등 원금 이자 1 신한카드 변제 2 한국투자저축은행 변제 3 삼성카드 4 예가람저축은행 변제 5 스마트저축은행 변제 6 신한카드 7 하나카드 변제 8 하나저축은행 매각 (25-06-01) 10,000 (비케이자산관리대부) 9 하나은행 변제 10 카카오뱅크 11 한국투자저축은행 12 예가람저축은행 변제 13 스마트저축은행 자산유동화 (25-06-01) 8,000 ( 케이씨2506유동화전문 ) 14 하나카드 변제 15 하나은행 16 예가람상호저축은행 17 비케이자산관리대부 양수채권 18 베스턴자산운용[케이씨2506유동화전문] 양수채권 (단위 : 천원)"
    }
  },
  {
    "id": "case-7",
    "no": 7,
    "title": "CASE STUDY 7 - 권00",
    "basic": {
      "name": "권00",
      "residentId": "75####-1",
      "address": "경기 시흥시 공단3대로 235",
      "ageText": "만50세",
      "eligibility": {
        "welfare": false,
        "disabled": false,
        "older": false,
        "lowerIncome": false,
        "vulnerable": false
      }
    },
    "income": {
      "jobType": "급여소득자",
      "job": "㈜대한산업##",
      "monthlyIncome": 3500
    },
    "housingType": "사택",
    "assets": [],
    "family": [
      {
        "no": 1,
        "relation": "본인",
        "residentId": "75####-1",
        "name": "권00",
        "inDate": "2020-11-##",
        "changeDate": "2020-11-##",
        "reason": "전입",
        "dependent": true
      }
    ],
    "statement": {
      "items": [
        "사택, 임차보증금 없음, 월임차료 500천원",
        "채무발생사유 : 사별한 배우자 23년 초 최장암 진단, 결혼 당시 대출 차입, 모친 심부전 병원비, 부친 위암 병원비 등, 개인회생 폐지 후 접수"
      ],
      "cardDebtAmount": 0
    },
    "debts": [
      {
        "type": "신용카드",
        "lender": "국민카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2019-11-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "신한카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2015-08-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "신용카드",
        "lender": "삼성카드",
        "regCode": "0081",
        "loanCode": "",
        "date": "2015-02-01",
        "amount": 0,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "케이뱅크",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-03-01",
        "amount": 42000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "제이티친애저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2025-01-01",
        "amount": 34000,
        "overdue": 0
      },
      {
        "type": "대출정보",
        "lender": "한국투자저축은행",
        "regCode": "0031",
        "loanCode": "100",
        "date": "2023-09-01",
        "amount": 16000,
        "overdue": 0
      }
    ],
    "securedPayment": 0,
    "delinquencyDays": 300,
    "creditInfo": {
      "reliefLoans": [],
      "rehabilitation": [],
      "scores": {
        "kcb": 150,
        "nice": 200,
        "kcbPercent": "0%",
        "nicePercent": "0%"
      },
      "recentOverdueDays": 300,
      "sixMonthOverdue": {
        "kcb": 1,
        "nice": 1
      },
      "kcbOverdue": {
        "count": 1,
        "firstAmount": 300,
        "firstDate": "2025-03-01",
        "startDate": "2025-03-01",
        "days": "300"
      },
      "niceOverdue": {
        "count": 0,
        "firstAmount": 0,
        "firstDate": "",
        "startDate": "",
        "days": ""
      },
      "rawText": "구분 등록사유 은행지점 등록 코드 대출 코드 발생일 해제일 등록액 연체액 해제사유 금융 신용카드 국민카드 0081 2019-11-01 0 0 금융 신용카드 신한카드 0081 2015-08-01 0 0 금융 신용카드 삼성카드 0081 2015-02-01 0 0 연체 5만원 이상의 신용카드대금을 3개월 이상 연체한 거래처 삼성카드 70104 2025-11-01 250 250 미해제 연체 대출원금, 이자 등을 3개월 이상 연체한 거래처 제이티친애저축은행 0031 2025-07-01 34,000 34,000 미해제 대출 대출정보 케이뱅크 0031 100 2023-03-01 42,000 0 대출 대출정보 제이티친애저축은행 0031 100 2025-01-01 34,000 0 대출 대출정보 한국투자저축은행 0031 100 2023-09-01 16,000 0 (단위 : 천원) ■ 미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황 기관 대출일자 대출금액 대출잔액 연체시작일 연체일수 계좌번호 진행상태 (자체약정) 해당사항 없음 (단위 : 천원) ■ 개인회생신청정보조회 금융기관 등록코드(1311) 발생일자 법원명 사건번호 업데이트일자 1311 2025-04-01 2025개회123## 2025-12-01 1311 2025-05-01 2025개회123## 2025-12-01 (단위 : 천원) ■ 개인신용평점 구분 KCB NICE 개인신용평점 150 200 하위누적구성비 0% 0% 구분 KCB 최근1년이내 연체일수 300 ■ 최근연체정보 ■ 최근 6개월 이내 금융회사 5일 이상 연체일수 구분 KCB NICE 최근 6개월 이내 금융회사 5일 이상 연체횟수 1 1 ■ KCB 연체건수 : 1 최초연체금액 : 300 최초연체일 :2025-03-01 연체기산일 :2025-03-01 연체일수: 300 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 한국투자저축은행 2025-03-01 2025-03-01 16,000 300 300 ■ 연체건수 : 1 최초연체금액 : 300 최초연체일 :2025-03-01 연체기산일 :2025-03-01 연체일수: 300 등록사유 은행지점 계좌번호 최초연체일 연체기산일 대출원금 최초연체 발생액 연체일수 한국투자저축은행 2025-03-01 2025-03-01 16,000 300 300 NICE 나머지 빈칸 표기 생략 채권자 변동표 ⓛ 채무 현황 구분 등록사유 기관명 대출발생일자 금액 개인대출정보 신용대출(100) 케이뱅크 2023-03-01 42,000 개인대출정보 신용대출(100) 한국투자저축은행 2023-09-01 16,000 개인대출정보 신용대출(100) 제이티친애저축은행 2025-01-01 34,000 합계 92,000 (단위 : 천원) ② 채권자 변동현황 순번 금융기관명 채권구분 등록사유 발생일자 변제예정금액 채무조정 유형 양도사유 (양도일자) 양도금액 (양수기관) 해제사유 기타 등등 원금 이자 1 한국투자저축은행 2 케이뱅크 3 삼성카드 4 국민카드 매각 (25-09-24) 2,900 (비케이자산관리대부) 비케이자산관리대부 양수채권 5 신한카드 매각 (25-09-29) 600 (바리움홀딩스대부) 바리움홀딩스대부 양수채권 6 제이티친애저축은행 7 바리움홀딩스대부 양수채권 (단위 : 천원)"
    }
  }
];

const STEPS = [
  {
    id: "personal",
    label: "인적사항",
    document: "overview",
    title: "인적사항 확인",
    guide: "성명과 주민등록번호는 조회값을 그대로 사용합니다. 주소는 직접 입력하되 시군구까지만 맞으면 통과합니다.",
    hint: "주소 전체를 외울 필요는 없습니다. 예: 경기도 김포시",
    answerHint: (item) => `정답 기준: ${extractCityDistrict(item.basic.address).full}`,
    render: renderPersonalStep,
    check: checkPersonalStep,
  },
  {
    id: "eligibility",
    label: "자격",
    document: "overview",
    title: "자격 및 취약계층 선택",
    guide: "기초수급자, 장애인, 고령자, 법정 차상위, 취약계층 여부를 한 화면에서 선택합니다.",
    hint: "요약표에서 Y로 표시된 항목만 선택합니다. 모두 N이면 아무것도 선택하지 않습니다.",
    answerHint: (item) => {
      const labels = eligibilityLabels(expectedEligibility(item));
      return `정답 기준: ${labels.length ? labels.join(", ") : "해당사항 없음"}`;
    },
    render: renderEligibilityStep,
    check: checkEligibilityStep,
  },
  {
    id: "job",
    label: "직업",
    document: "overview",
    title: "직업과 월소득 입력",
    guide: "직업분류를 선택하고 직장명을 적습니다. 직장명은 비어 있지만 않으면 통과하며, 월소득은 천원 단위로 입력합니다.",
    hint: "직업 상위분류만 고릅니다. 월소득은 원 단위가 아니라 천원 단위입니다.",
    answerHint: (item) => `정답 기준: ${item.income.jobType}, 월소득 ${formatAmount(item.income.monthlyIncome)}. 직장명은 아무 내용이나 적혀 있으면 됩니다.`,
    render: renderJobStep,
    check: checkJobStep,
  },
  {
    id: "housing",
    label: "주거형태",
    document: "statement",
    title: "주거형태 선택",
    guide: "진술 내용의 주거 정보를 보고 주거현황을 선택합니다.",
    hint: "임차보증금이나 월임차료가 본인 기준으로 적혀 있으면 보통 임차(본인)입니다.",
    answerHint: (item) => `정답 기준: ${item.housingType}`,
    render: renderHousingStep,
    check: checkHousingStep,
  },
  {
    id: "cause",
    label: "채무발생사유",
    document: "statement",
    title: "채무발생사유 입력",
    guide: "진술 내용에서 채무발생사유를 적습니다. 글만 적혀 있으면 통과합니다.",
    hint: "정확한 문장 복사가 아니어도 됩니다. 사유를 이해하고 한 줄로 적으면 됩니다.",
    answerHint: (item) => `예시: ${extractCauseText(item)}`,
    render: renderCauseStep,
    check: checkCauseStep,
  },
  {
    id: "asset",
    label: "재산",
    document: "statement",
    title: "재산 입력",
    guide: "진술과 소득·재산 화면에서 확인되는 재산 내용을 적고, 재산 합계를 천원 단위로 입력합니다.",
    hint: "임차보증금, 차량, 자가주택 시세처럼 금액 산정 가능한 항목을 확인합니다.",
    answerHint: (item) => `정답 기준: ${item.assets.map((asset) => `${asset.label} ${formatAmount(asset.amount)}`).join(", ") || "해당사항 없음"}, 합계 ${formatAmount(getAssetTotal(item))}`,
    render: renderAssetStep,
    check: checkAssetStep,
  },
  {
    id: "family",
    label: "가족",
    document: "overview",
    title: "부양가족 선택",
    guide: "업무처리기준에 맞는 부양기족을 선택해주시기 바랍니다.",
    hint: "성명 기준으로 체크하면 아래 체크 수가 즉시 바뀝니다.",
    answerHint: (item) => `정답 기준: ${expectedDependentRows(item).map((row) => row.name).join(", ")} (${expectedDependentRows(item).length}명)`,
    render: renderFamilyStep,
    check: checkFamilyStep,
  },
  {
    id: "debt",
    label: "채무",
    document: "credit1",
    title: "채무 분류와 금액 산정",
    guide: "각 채무를 신용채무 또는 담보채무로 판단해 체크하고, 신용채무와 담보채무 합계를 천원 단위로 입력합니다.",
    hint: "대출코드 100 또는 카드 관련 등록사유는 조정 가능한 신용채무입니다. 진술의 카드대금도 신용채무 합계 판단에 반영합니다.",
    answerHint: (item) => {
      const metrics = getDebtMetrics(item);
      return [
        `신용채무 합계: ${formatAmount(metrics.creditTotal)}`,
        `담보채무 합계: ${formatAmount(metrics.securedTotal)}`,
        item.statement.cardDebtAmount ? `진술 카드대금 포함: ${formatAmount(item.statement.cardDebtAmount)}` : "진술 카드대금 추가 없음",
        `분류: ${item.debts.map((row) => `${row.lender} ${isCreditDebt(row) ? "신용" : "담보"}`).join(" / ")}`,
      ].join(" · ");
    },
    render: renderDebtStep,
    check: checkDebtStep,
  },
  {
    id: "delinquency",
    label: "연체일수",
    document: "credit2",
    title: "연체정보 등록",
    guide: "신용정보 하단의 최근 연체정보를 보고 연체정보등록 여부와 연체일수를 입력합니다. 신용평점은 입력하지 않습니다.",
    hint: "최근 1년 이내 연체일수가 0이면 연체정보등록 없음으로 봅니다.",
    answerHint: (item) => `정답 기준: ${item.delinquencyDays > 0 ? "연체정보등록 있음" : "연체정보등록 없음"}, ${item.delinquencyDays}일`,
    render: renderDelinquencyStep,
    check: checkDelinquencyStep,
  },
  {
    id: "estimate",
    label: "조정예상금액",
    document: "credit1",
    title: "조정예상금액 계산",
    guide: "신용채무금액, 담보채무 상환금액, 가용소득, 신용채무 상환가능금액, 예상 상환기간을 계산합니다.",
    hint: "가용소득은 소득에서 생계비를 뺀 금액입니다. 신용채무 상환가능금액은 가용소득에서 담보채무 상환금액을 뺍니다.",
    answerHint: (item) => {
      const estimate = getEstimate(item);
      return `정답 기준: 신용채무 ${formatAmount(estimate.creditDebt)}, 담보상환 ${formatAmount(estimate.securedPayment)}, 가용소득 ${formatAmount(estimate.availableIncome)}, 상환가능 ${formatAmount(estimate.creditCapacity)}, 기간 ${estimate.months}개월`;
    },
    render: renderEstimateStep,
    check: checkEstimateStep,
  },
  {
    id: "summary",
    label: "작성완료한 조정안",
    document: "summary",
    title: "작성완료한 조정안 확인",
    guide: "전체 입력 결과는 조회항목의 작성완료한 조정안 화면에서 한 장으로 확인합니다.",
    hint: "이 단계는 제출 전 검산 화면입니다. 앞 단계가 모두 완료되어야 통과합니다.",
    answerHint: () => "조회항목의 작성완료한 조정안 탭에서 최종 표를 확인하세요.",
    render: renderSummaryStep,
    check: checkSummaryStep,
  },
];

let cases = loadCases();
let selectedCaseId = loadSelectedCaseId();
let state = loadState();

const elements = {
  caseSelect: document.getElementById("caseSelect"),
  documentTabs: document.getElementById("documentTabs"),
  documentTitle: document.getElementById("documentTitle"),
  caseDocument: document.getElementById("caseDocument"),
  stepRail: document.getElementById("stepRail"),
  stepEyebrow: document.getElementById("stepEyebrow"),
  stepTitle: document.getElementById("stepTitle"),
  stepGuide: document.getElementById("stepGuide"),
  stepStatus: document.getElementById("stepStatus"),
  stepForm: document.getElementById("stepForm"),
  feedback: document.getElementById("feedback"),
  prevStep: document.getElementById("prevStep"),
  nextStep: document.getElementById("nextStep"),
  checkAnswer: document.getElementById("checkAnswer"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  missCount: document.getElementById("missCount"),
  trainingModeBtn: document.getElementById("trainingModeBtn"),
  adminModeBtn: document.getElementById("adminModeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  adminCaseList: document.getElementById("adminCaseList"),
  caseJson: document.getElementById("caseJson"),
  applyCaseBtn: document.getElementById("applyCaseBtn"),
  duplicateCaseBtn: document.getElementById("duplicateCaseBtn"),
  exportCasesBtn: document.getElementById("exportCasesBtn"),
  importCasesInput: document.getElementById("importCasesInput"),
  resetCasesBtn: document.getElementById("resetCasesBtn"),
  adminStatus: document.getElementById("adminStatus"),
};

render();

elements.caseSelect.addEventListener("change", () => selectCase(elements.caseSelect.value));
elements.documentTabs.addEventListener("click", handleDocumentTabClick);
elements.stepRail.addEventListener("click", handleStepRailClick);
elements.stepForm.addEventListener("click", handleStepClick);
elements.stepForm.addEventListener("input", handleStepInput);
elements.prevStep.addEventListener("click", () => setActiveStep(Math.max(0, state.activeStep - 1)));
elements.nextStep.addEventListener("click", () => setActiveStep(Math.min(STEPS.length - 1, state.activeStep + 1)));
elements.checkAnswer.addEventListener("click", checkCurrentStep);
elements.resetBtn.addEventListener("click", resetTrainingState);
elements.trainingModeBtn.addEventListener("click", () => setView("training"));
elements.adminModeBtn.addEventListener("click", () => setView("admin"));
elements.applyCaseBtn.addEventListener("click", applyCaseJson);
elements.duplicateCaseBtn.addEventListener("click", duplicateCase);
elements.exportCasesBtn.addEventListener("click", exportCases);
elements.importCasesInput.addEventListener("change", importCases);
elements.resetCasesBtn.addEventListener("click", resetCases);

function debt(type, lender, regCode, loanCode, date, amount, overdue) {
  return { type, lender, regCode, loanCode, date, amount, overdue };
}

function loadCases() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.cases) || "null");
    return Array.isArray(saved) && saved.length ? saved : structuredClone(DEFAULT_CASES);
  } catch {
    return structuredClone(DEFAULT_CASES);
  }
}

function loadSelectedCaseId() {
  const saved = localStorage.getItem(STORAGE.selectedCase);
  return cases.some((item) => item.id === saved) ? saved : cases[0].id;
}

function defaultState(caseId = selectedCaseId) {
  return {
    caseId,
    activeStep: 0,
    activeDocument: "overview",
    completed: {},
    hints: {},
    answers: {
      address: "",
      eligibility: [],
      jobType: "",
      jobName: "",
      monthlyIncome: "",
      housingType: "",
      debtCause: "",
      assetText: "",
      assetTotal: "",
      dependents: [],
      debtKinds: {},
      creditTotal: "",
      securedTotal: "",
      delinquencyRegistered: "",
      delinquencyDays: "",
      creditDebt: "",
      securedPayment: "",
      availableIncome: "",
      creditCapacity: "",
      repaymentMonths: "",
    },
    feedback: null,
    misses: 0,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.state) || "null");
    if (saved?.caseId === selectedCaseId) return { ...defaultState(selectedCaseId), ...saved };
  } catch {
    return defaultState(selectedCaseId);
  }
  return defaultState(selectedCaseId);
}

function saveCases() {
  localStorage.setItem(STORAGE.cases, JSON.stringify(cases));
  localStorage.setItem(STORAGE.selectedCase, selectedCaseId);
}

function saveState() {
  localStorage.setItem(STORAGE.state, JSON.stringify(state));
  localStorage.setItem(STORAGE.selectedCase, selectedCaseId);
}

function currentCase() {
  return cases.find((item) => item.id === selectedCaseId) || cases[0];
}

function render() {
  renderCaseSelect();
  renderDocumentTabs();
  renderTraining();
  if (document.body.dataset.view === "admin") renderAdmin();
}

function renderCaseSelect() {
  elements.caseSelect.innerHTML = cases
    .map((item) => `<option value="${escapeAttr(item.id)}" ${item.id === selectedCaseId ? "selected" : ""}>${escapeHtml(item.title)}</option>`)
    .join("");
}

function renderTraining() {
  const item = currentCase();
  const step = STEPS[state.activeStep];
  const document = DOCUMENTS.find((entry) => entry.id === state.activeDocument) || DOCUMENTS[0];

  elements.documentTitle.textContent = `CASE STUDY ${item.no} - ${item.basic.name}`;
  elements.caseDocument.innerHTML = renderCaseDocument(item, document.id);
  renderDocumentTabs();
  renderStepRail();

  elements.stepEyebrow.textContent = `${String(state.activeStep + 1).padStart(2, "0")} / ${STEPS.length}`;
  elements.stepTitle.textContent = step.title;
  elements.stepGuide.textContent = step.guide;
  elements.stepStatus.textContent = state.completed[step.id] ? "완료" : "미완료";
  elements.stepStatus.className = state.completed[step.id] ? "is-complete" : "";
  elements.stepForm.innerHTML = `${renderHint(step, item)}${step.render(item)}`;
  elements.feedback.textContent =
    state.feedback?.stepId === step.id ? state.feedback.message : "조회 화면을 확인한 뒤 입력값을 선택하세요.";
  elements.feedback.className = `feedback ${state.feedback?.stepId === step.id ? state.feedback.tone : ""}`;
  elements.prevStep.disabled = state.activeStep === 0;
  elements.nextStep.disabled = state.activeStep === STEPS.length - 1 || !state.completed[step.id];

  const completedCount = STEPS.filter((entry) => state.completed[entry.id]).length;
  elements.progressText.textContent = `${completedCount} / ${STEPS.length}`;
  elements.progressFill.style.width = `${Math.round((completedCount / STEPS.length) * 100)}%`;
  elements.missCount.textContent = String(state.misses);
}

function renderHint(step, item) {
  const firstKey = `${step.id}:hint`;
  const secondKey = `${step.id}:answer`;
  const firstOpen = Boolean(state.hints[firstKey]);
  const secondOpen = Boolean(state.hints[secondKey]);
  const answer = typeof step.answerHint === "function" ? step.answerHint(item) : "";

  return `
    <div class="hint-row">
      <button class="hint-chip ${firstOpen ? "is-active" : ""}" type="button" data-hint-toggle="${firstKey}">힌트</button>
      <button class="hint-chip ${secondOpen ? "is-active" : ""}" type="button" data-hint-toggle="${secondKey}">2차 힌트</button>
      ${firstOpen ? `<p class="hint-text">${escapeHtml(step.hint)}</p>` : ""}
      ${secondOpen ? `<p class="hint-text">${escapeHtml(answer)}</p>` : ""}
    </div>
  `;
}

function renderDocumentTabs() {
  elements.documentTabs.innerHTML = DOCUMENTS.map(
    (doc) => `
      <button type="button" class="${doc.id === state.activeDocument ? "is-active" : ""}" data-doc="${doc.id}">
        ${escapeHtml(doc.label)}
      </button>
    `
  ).join("");
}

function renderStepRail() {
  elements.stepRail.innerHTML = STEPS.map((step, index) => {
    const active = index === state.activeStep;
    const complete = Boolean(state.completed[step.id]);
    const locked = index > 0 && !state.completed[STEPS[index - 1].id];
    return `
      <button type="button" class="${active ? "is-active" : ""} ${complete ? "is-complete" : ""}" data-step="${index}" ${locked ? "disabled" : ""}>
        <span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(step.label)}
      </button>
    `;
  }).join("");
}

function renderCaseDocument(item, section) {
  const renderers = {
    overview: renderOverviewDocument,
    statement: renderStatementDocument,
    credit1: renderCreditDocument1,
    credit2: renderCreditDocument2,
    summary: renderSummaryDocument,
  };

  return `
    <p class="paper-note">이 자료는 교육용 작성된 가상의 인물임</p>
    <h2>&lt;CASE STUDY ${item.no}&gt;</h2>
    ${renderers[section](item)}
    <p class="paper-note bottom-note">이 자료는 교육용 작성된 가상의 인물임</p>
  `;
}

function renderOverviewDocument(item) {
  const e = item.basic.eligibility;
  return `
    <section class="paper-section">
      <h3>마이데이터 기본 묶음정보 요약표</h3>
      <table class="hwp-table">
        <tbody>
          <tr>
            <th>성명</th><td>${escapeHtml(item.basic.name)}</td>
            <th>주민등록번호</th><td>${escapeHtml(item.basic.residentId)}</td>
            <th>주소</th><td colspan="3">${escapeHtml(item.basic.address)}</td>
          </tr>
          <tr>
            <th>수급자</th><td>${yesNo(e.welfare)}</td>
            <th>장애인</th><td>${yesNo(e.disabled)}</td>
            <th>고령자</th><td>${yesNo(e.older)}${item.basic.ageText ? `<br>(${escapeHtml(item.basic.ageText)})` : ""}</td>
            <th>법정<br>차상위</th><td>${yesNo(e.lowerIncome)}</td>
          </tr>
          <tr>
            <th colspan="2">취약계층</th><td colspan="2">${yesNo(e.vulnerable)}</td>
            <th colspan="2">가족현황 및<br>주소변경이력</th><td colspan="2"><span class="paper-button">상세보기</span></td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="paper-section">
      <h3>마이데이터 소득·재산 정보 요약표</h3>
      <table class="hwp-table compact-table">
        <tbody>
          <tr>
            <th>직업구분</th><td>${escapeHtml(item.income.jobType)}</td>
            <th>직장명</th><td>${escapeHtml(item.income.job)}</td>
            <th>월소득</th><td>${formatAmount(item.income.monthlyIncome)}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="paper-section">
      <h3>마이데이터 기본 묶음정보 가족현황</h3>
      <table class="hwp-table">
        <tbody>
          <tr><th>성명</th><td>${escapeHtml(item.basic.name)}</td><th>주민등록번호</th><td>${escapeHtml(item.basic.residentId)}</td><th>주소</th><td colspan="3">${escapeHtml(item.basic.address)}</td></tr>
          <tr><th>순서</th><th>가족관계명</th><th>주민등록번호</th><th>성명</th><th>편입일자</th><th>변동일자</th><th colspan="2">변경사유</th></tr>
          ${item.family
            .map((row) => `<tr><td>${row.no}</td><td>${escapeHtml(row.relation)}</td><td>${escapeHtml(row.residentId)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.inDate)}</td><td>${escapeHtml(row.changeDate)}</td><td colspan="2">${escapeHtml(row.reason)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function renderStatementDocument(item) {
  return `
    <section class="paper-section statement-box">
      <h3>진술 내용</h3>
      <ul>
        ${item.statement.items.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderCreditDocument1(item) {
  const info = item.creditInfo || {};
  return `
    <section class="paper-section credit-section">
      <h3>신용정보 전체조회</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table credit-table">
        <tbody>
          <tr><th>등록사유</th><th>은행지점</th><th>등록<br>코드</th><th>대출<br>코드</th><th>발생일</th><th>해제일</th><th>등록액</th><th>연체액</th></tr>
          ${item.debts
            .map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.lender)}</td><td>${escapeHtml(row.regCode)}</td><td>${escapeHtml(row.loanCode || "")}</td><td>${escapeHtml(row.date)}</td><td></td><td>${formatNumber(row.amount)}</td><td>${formatNumber(row.overdue)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>기관</th><th>대출일자</th><th>대출금액</th><th>대출잔액</th><th>연체시작일</th><th>연체일수</th><th>계좌번호</th><th>진행상태<br>(자체약정)</th></tr>
          ${renderEmptyOrRows(info.reliefLoans, (row) => `<tr><td>${escapeHtml(row.agency)}</td><td>${escapeHtml(row.date)}</td><td>${formatNumber(row.amount)}</td><td>${formatNumber(row.balance)}</td><td>${escapeHtml(row.startDate)}</td><td>${escapeHtml(row.days)}</td><td>${escapeHtml(row.account)}</td><td>${escapeHtml(row.status)}</td></tr>`, 8)}
        </tbody>
      </table>
    </section>
  `;
}

function renderCreditDocument2(item) {
  const info = item.creditInfo || {};
  return `
    <section class="paper-section mini-credit">
      <h3>개인회생신청정보조회</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>금융기관</th><th>등록코드(1311)</th><th>발생일자</th><th>법원명</th><th>사건번호</th><th>업데이트일자</th></tr>
          ${renderEmptyOrRows(info.rehabilitation, (row) => `<tr><td>${escapeHtml(row.agency)}</td><td>${escapeHtml(row.code)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.order)}</td><td>${escapeHtml(row.caseNo)}</td><td>${escapeHtml(row.updated)}</td></tr>`, 6)}
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>개인신용평점</h3>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>구분</th><th>KCB</th><th>NICE</th></tr>
          <tr><th>개인신용평점</th><td>${formatNumber(info.scores?.kcb)}</td><td>${formatNumber(info.scores?.nice)}</td></tr>
          <tr><th>하위누적구성비</th><td>${escapeHtml(info.scores?.kcbPercent || "")}</td><td>${escapeHtml(info.scores?.nicePercent || "")}</td></tr>
        </tbody>
      </table>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th colspan="2">최근연체정보</th></tr>
          <tr><th>최근1년이내 연체일수</th><td>${formatNumber(info.recentOverdueDays || 0)}</td></tr>
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>최근 6개월 이내 금융회사 5일 이상 연체일수</h3>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>구분</th><th>KCB</th><th>NICE</th></tr>
          <tr><th>최근 6개월 이내 금융회사 5일 이상 연체횟수</th><td>${formatNumber(info.sixMonthOverdue?.kcb || 0)}</td><td>${formatNumber(info.sixMonthOverdue?.nice || 0)}</td></tr>
        </tbody>
      </table>
    </section>
    ${renderOverdueAgencySection("KCB", info.kcbOverdue)}
    ${renderOverdueAgencySection("NICE", info.niceOverdue)}
  `;
}

function renderCreditDocument(item) {
  const info = item.creditInfo || {};
  return `
    <section class="paper-section credit-section">
      <h3>신용정보 전체조회</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table credit-table">
        <tbody>
          <tr><th>등록사유</th><th>은행지점</th><th>등록<br>코드</th><th>대출<br>코드</th><th>발생일</th><th>해제일</th><th>등록액</th><th>연체액</th></tr>
          ${item.debts
            .map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.lender)}</td><td>${escapeHtml(row.regCode)}</td><td>${escapeHtml(row.loanCode || "")}</td><td>${escapeHtml(row.date)}</td><td></td><td>${formatNumber(row.amount)}</td><td>${formatNumber(row.overdue)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>미소금융재단 및 국민행복기금(소액대부) 대출현황, 한국장학재단 대출현황</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>기관</th><th>대출일자</th><th>대출금액</th><th>대출잔액</th><th>연체시작일</th><th>연체일수</th><th>계좌번호</th><th>진행상태<br>(자체약정)</th></tr>
          ${renderEmptyOrRows(info.reliefLoans, (row) => `<tr><td>${escapeHtml(row.agency)}</td><td>${escapeHtml(row.date)}</td><td>${formatNumber(row.amount)}</td><td>${formatNumber(row.balance)}</td><td>${escapeHtml(row.startDate)}</td><td>${escapeHtml(row.days)}</td><td>${escapeHtml(row.account)}</td><td>${escapeHtml(row.status)}</td></tr>`, 8)}
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>개인회생신청정보조회</h3>
      <p class="unit-note">(단위 : 천원)</p>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>금융기관</th><th>등록코드(1311)</th><th>발생일자</th><th>발령명</th><th>사건번호</th><th>업데이트일자</th></tr>
          ${renderEmptyOrRows(info.rehabilitation, (row) => `<tr><td>${escapeHtml(row.agency)}</td><td>${escapeHtml(row.code)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.order)}</td><td>${escapeHtml(row.caseNo)}</td><td>${escapeHtml(row.updated)}</td></tr>`, 6)}
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>개인신용평점</h3>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>구분</th><th>KCB</th><th>NICE</th></tr>
          <tr><th>개인신용평점</th><td>${formatNumber(info.scores?.kcb)}</td><td>${formatNumber(info.scores?.nice)}</td></tr>
          <tr><th>하위누적구성비</th><td>${escapeHtml(info.scores?.kcbPercent || "")}</td><td>${escapeHtml(info.scores?.nicePercent || "")}</td></tr>
        </tbody>
      </table>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th colspan="2">최근연체정보</th></tr>
          <tr><th>최근1년이내 연체일수</th><td>${formatNumber(info.recentOverdueDays || 0)}</td></tr>
        </tbody>
      </table>
    </section>
    <section class="paper-section mini-credit">
      <h3>최근 6개월 이내 금융회사 5일 이상 연체일수</h3>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>구분</th><th>KCB</th><th>NICE</th></tr>
          <tr><th>최근 6개월 이내 금융회사 5일 이상 연체횟수</th><td>${formatNumber(info.sixMonthOverdue?.kcb || 0)}</td><td>${formatNumber(info.sixMonthOverdue?.nice || 0)}</td></tr>
        </tbody>
      </table>
    </section>
    ${renderOverdueAgencySection("KCB", info.kcbOverdue)}
    ${renderOverdueAgencySection("NICE", info.niceOverdue)}
  `;
}

function renderOverdueAgencySection(label, value = {}) {
  return `
    <section class="paper-section mini-credit">
      <h3>${escapeHtml(label)}</h3>
      <p class="unit-note">연체건수 : ${formatNumber(value.count || 0)} &nbsp;&nbsp; 최초연체금액 : ${formatNumber(value.firstAmount || 0)} &nbsp;&nbsp; 최초연체일 : ${escapeHtml(value.firstDate || "")} &nbsp;&nbsp; 연체기산일 : ${escapeHtml(value.startDate || "")} &nbsp;&nbsp; 연체일수 : ${escapeHtml(value.days || "")}</p>
      <table class="hwp-table compact-table">
        <tbody>
          <tr><th>등록사유</th><th>은행지점</th><th>계좌번호</th><th>최초연체일</th><th>연체기산일</th><th>대출원금</th><th>최초연체<br>발생액</th><th>연체일수</th></tr>
          <tr><td colspan="8">해당사항 없음</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderSummaryDocument(item) {
  const debt = getDebtMetrics(item);
  const estimate = getEstimate(item);
  return `
    <section class="paper-section">
      <h3>작성완료한 조정안</h3>
      <table class="hwp-table compact-table summary-table">
        <tbody>
          <tr><th>인적사항</th><td>${escapeHtml(item.basic.name)} / ${escapeHtml(item.basic.residentId)} / ${escapeHtml(item.basic.address)}</td></tr>
          <tr><th>자격</th><td>${eligibilityLabels(expectedEligibility(item)).join(", ") || "해당사항 없음"}</td></tr>
          <tr><th>직업</th><td>${escapeHtml(item.income.jobType)} / ${escapeHtml(item.income.job)} / ${formatAmount(item.income.monthlyIncome)}</td></tr>
          <tr><th>주거형태</th><td>${escapeHtml(item.housingType)}</td></tr>
          <tr><th>채무발생사유</th><td>${escapeHtml(extractCauseText(item))}</td></tr>
          <tr><th>재산</th><td>${item.assets.map((asset) => `${escapeHtml(asset.label)} ${formatAmount(asset.amount)}`).join(" / ") || "해당사항 없음"}</td></tr>
          <tr><th>부양가족</th><td>${expectedDependentRows(item).map((row) => escapeHtml(row.name)).join(", ")} (${expectedDependentRows(item).length}명)</td></tr>
          <tr><th>채무</th><td>신용 ${formatAmount(debt.creditTotal)} / 담보 ${formatAmount(debt.securedTotal)}</td></tr>
          <tr><th>연체일수</th><td>${item.delinquencyDays}일 / ${estimate.program}</td></tr>
          <tr><th>조정예상금액</th><td>신용채무 상환가능금액 ${formatAmount(estimate.creditCapacity)} / ${estimate.months}개월${estimate.capped ? ` (최장 ${estimate.capMonths}개월 적용)` : ""}</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderPersonalStep(item) {
  return `
    <div class="readonly-grid">
      <div><span>성명</span><strong>${escapeHtml(item.basic.name)}</strong></div>
      <div><span>주민등록번호</span><strong>${escapeHtml(item.basic.residentId)}</strong></div>
    </div>
    <label class="form-group">
      <span>주소</span>
      <input data-field="address" value="${escapeAttr(state.answers.address)}" placeholder="시군구까지만 입력해도 됩니다">
    </label>
  `;
}

function renderEligibilityStep() {
  const selected = new Set(state.answers.eligibility || []);
  return `
    <div class="option-grid">
      ${ELIGIBILITY_OPTIONS.map(
        (option) => `
          <label class="check-tile">
            <input type="checkbox" data-eligibility="${option.key}" ${selected.has(option.key) ? "checked" : ""}>
            <span>${escapeHtml(option.label)}</span>
          </label>
        `
      ).join("")}
    </div>
  `;
}

function renderJobStep() {
  return `
    <div class="form-grid">
      <label class="form-group">
        <span>직업분류</span>
        <select data-field="jobType">
          <option value="">선택</option>
          ${JOB_TYPES.map((type) => `<option value="${escapeAttr(type)}" ${state.answers.jobType === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </label>
      <label class="form-group">
        <span>직장명</span>
        <input data-field="jobName" value="${escapeAttr(state.answers.jobName)}" placeholder="직장명을 적어주세요">
      </label>
      <label class="form-group">
        <span>월소득(천원)</span>
        <input data-field="monthlyIncome" inputmode="numeric" value="${escapeAttr(state.answers.monthlyIncome)}" placeholder="천원 단위 예: 0,000">
      </label>
    </div>
  `;
}

function renderHousingStep() {
  return `
    <div class="option-grid">
      ${HOUSING_TYPES.map(
        (type) => `
          <label class="radio-tile">
            <input type="radio" name="housingType" data-field="housingType" value="${escapeAttr(type)}" ${state.answers.housingType === type ? "checked" : ""}>
            <span>${escapeHtml(type)}</span>
          </label>
        `
      ).join("")}
    </div>
  `;
}

function renderCauseStep() {
  return `
    <label class="form-group">
      <span>채무발생사유</span>
      <textarea data-field="debtCause" placeholder="진술 내용을 보고 적어주세요">${escapeHtml(state.answers.debtCause)}</textarea>
    </label>
  `;
}

function renderAssetStep() {
  return `
    <label class="form-group">
      <span>재산 내용</span>
      <textarea data-field="assetText" placeholder="재산으로 판단한 항목을 적어주세요">${escapeHtml(state.answers.assetText)}</textarea>
    </label>
    <label class="form-group">
      <span>재산 합계</span>
      <input data-field="assetTotal" inputmode="numeric" value="${escapeAttr(state.answers.assetTotal)}" placeholder="천원 단위">
    </label>
  `;
}

function renderFamilyStep(item) {
  const selected = new Set(state.answers.dependents || []);
  return `
    <div class="dependent-grid">
      ${item.family.map(
        (row) => `
          <label class="check-tile">
            <input type="checkbox" data-dependent="${row.no}" ${selected.has(String(row.no)) ? "checked" : ""}>
            <span>${escapeHtml(row.name)} <small>${escapeHtml(row.relation)}</small></span>
          </label>
        `
      ).join("")}
    </div>
    <div class="count-banner">현재 체크한 부양가족: <strong>${selected.size}</strong>명</div>
  `;
}

function renderDebtStep(item) {
  const kinds = state.answers.debtKinds || {};
  return `
    <div class="debt-list">
      ${item.debts.map((row, index) => {
        const key = String(index);
        return `
          <div class="debt-row">
            <div>
              <strong>${escapeHtml(row.type)} / ${escapeHtml(row.lender)}</strong>
              <span>대출코드 ${escapeHtml(row.loanCode || "-")} · 등록액 ${formatAmount(row.amount)}</span>
            </div>
            <label><input type="radio" name="debt-${index}" data-debt-kind="${index}" value="credit" ${kinds[key] === "credit" ? "checked" : ""}> 신용</label>
            <label><input type="radio" name="debt-${index}" data-debt-kind="${index}" value="secured" ${kinds[key] === "secured" ? "checked" : ""}> 담보</label>
          </div>
        `;
      }).join("")}
    </div>
    <div class="form-grid">
      <label class="form-group"><span>신용채무 합계</span><input data-field="creditTotal" inputmode="numeric" value="${escapeAttr(state.answers.creditTotal)}" placeholder="천원 단위"></label>
      <label class="form-group"><span>담보채무 합계</span><input data-field="securedTotal" inputmode="numeric" value="${escapeAttr(state.answers.securedTotal)}" placeholder="천원 단위"></label>
    </div>
  `;
}

function renderDelinquencyStep() {
  return `
    <div class="option-grid two">
      <label class="radio-tile"><input type="radio" name="delinquencyRegistered" data-field="delinquencyRegistered" value="yes" ${state.answers.delinquencyRegistered === "yes" ? "checked" : ""}><span>연체정보등록 있음</span></label>
      <label class="radio-tile"><input type="radio" name="delinquencyRegistered" data-field="delinquencyRegistered" value="no" ${state.answers.delinquencyRegistered === "no" ? "checked" : ""}><span>연체정보등록 없음</span></label>
    </div>
    <label class="form-group">
      <span>연체일수</span>
      <input data-field="delinquencyDays" inputmode="numeric" value="${escapeAttr(state.answers.delinquencyDays)}" placeholder="일수">
    </label>
  `;
}

function renderEstimateStep(item) {
  const estimate = getEstimate(item);
  return `
    <div class="readonly-grid">
      <div><span>조정제도</span><strong>${escapeHtml(estimate.program)}</strong></div>
      <div><span>부양가족</span><strong>${estimate.dependentCount}명</strong></div>
      <div><span>생계비 범위</span><strong>${formatAmount(estimate.minLivingExpense)} - ${formatAmount(estimate.maxLivingExpense)}</strong></div>
      <div><span>적용 생계비</span><strong>${formatAmount(estimate.livingExpense)}</strong></div>
    </div>
    <div class="form-grid">
      <label class="form-group"><span>신용채무금액</span><input data-field="creditDebt" inputmode="numeric" value="${escapeAttr(state.answers.creditDebt)}" placeholder="천원 단위"></label>
      <label class="form-group"><span>담보채무 상환금액</span><input data-field="securedPayment" inputmode="numeric" value="${escapeAttr(state.answers.securedPayment)}" placeholder="천원 단위"></label>
      <label class="form-group"><span>가용소득(소득 - 생계비)</span><input data-field="availableIncome" inputmode="numeric" value="${escapeAttr(state.answers.availableIncome)}" placeholder="천원 단위"></label>
      <label class="form-group"><span>신용채무 상환가능금액</span><input data-field="creditCapacity" inputmode="numeric" value="${escapeAttr(state.answers.creditCapacity)}" placeholder="천원 단위"></label>
      <label class="form-group"><span>예상 상환기간</span><input data-field="repaymentMonths" inputmode="numeric" value="${escapeAttr(state.answers.repaymentMonths)}" placeholder="개월"></label>
    </div>
  `;
}

function renderSummaryStep(item) {
  const estimate = getEstimate(item);
  return `
    <div class="review-box">
      <div><span>조회항목</span><strong>작성완료한 조정안</strong></div>
      <div><span>신청인</span><strong>${escapeHtml(item.basic.name)}</strong></div>
      <div><span>신용채무 상환가능금액</span><strong>${formatAmount(estimate.creditCapacity)}</strong></div>
      <div><span>예상 상환기간</span><strong>${estimate.months}개월</strong></div>
    </div>
  `;
}

function handleDocumentTabClick(event) {
  const button = event.target.closest("[data-doc]");
  if (!button) return;
  state.activeDocument = button.dataset.doc;
  renderTraining();
  saveState();
}

function handleStepRailClick(event) {
  const button = event.target.closest("[data-step]");
  if (!button || button.disabled) return;
  setActiveStep(Number(button.dataset.step));
}

function handleStepClick(event) {
  const hint = event.target.closest("[data-hint-toggle]");
  if (hint) {
    state.hints[hint.dataset.hintToggle] = !state.hints[hint.dataset.hintToggle];
    renderTraining();
    saveState();
    return;
  }

  const dependent = event.target.closest("[data-dependent]");
  if (dependent) {
    const selected = new Set(state.answers.dependents || []);
    const value = dependent.dataset.dependent;
    if (dependent.checked) selected.add(value);
    else selected.delete(value);
    state.answers.dependents = [...selected];
    state.feedback = null;
    renderTraining();
    saveState();
    return;
  }

  const eligibility = event.target.closest("[data-eligibility]");
  if (eligibility) {
    const selected = new Set(state.answers.eligibility || []);
    const value = eligibility.dataset.eligibility;
    if (eligibility.checked) selected.add(value);
    else selected.delete(value);
    state.answers.eligibility = [...selected];
    state.feedback = null;
    saveState();
  }
}

function handleStepInput(event) {
  const field = event.target.closest("[data-field]");
  const debtKind = event.target.closest("[data-debt-kind]");

  if (field) {
    state.answers[field.dataset.field] = field.value;
  }

  if (debtKind) {
    state.answers.debtKinds = {
      ...(state.answers.debtKinds || {}),
      [debtKind.dataset.debtKind]: debtKind.value,
    };
  }

  state.feedback = null;
  elements.feedback.textContent = "조회 화면을 확인한 뒤 입력값을 선택하세요.";
  elements.feedback.className = "feedback";
  saveState();
}

function checkCurrentStep() {
  const step = STEPS[state.activeStep];
  const result = step.check(currentCase());
  state.feedback = {
    stepId: step.id,
    message: result.message,
    tone: result.ok ? "is-good" : "is-bad",
  };

  if (result.ok) state.completed[step.id] = true;
  else state.misses += 1;

  renderTraining();
  saveState();
}

function checkPersonalStep(item) {
  const answer = normalizeAddress(state.answers.address);
  const expected = extractCityDistrict(item.basic.address);
  const ok = answer.includes(normalizeAddress(expected.full)) || answer.includes(normalizeAddress(expected.city));
  return result(ok, "주소 확인이 완료되었습니다.", "주소는 시군구까지만 정확히 입력해도 됩니다.");
}

function checkEligibilityStep(item) {
  const ok = sameSet(state.answers.eligibility || [], expectedEligibility(item));
  return result(ok, "자격 및 취약계층 선택이 맞습니다.", "표의 Y 항목만 선택하세요.");
}

function checkJobStep(item) {
  const ok =
    state.answers.jobType === item.income.jobType &&
    String(state.answers.jobName || "").trim().length > 0 &&
    amountMatchesThousand(state.answers.monthlyIncome, item.income.monthlyIncome, 0);
  return result(ok, "직업분류, 직장명, 월소득 입력이 완료되었습니다.", "직업분류와 월소득(천원 단위)을 다시 확인하세요. 직장명은 비어 있으면 안 됩니다.");
}

function checkHousingStep(item) {
  return result(state.answers.housingType === item.housingType, "주거형태 선택이 맞습니다.", "진술 내용의 주거 표현을 다시 확인하세요.");
}

function checkCauseStep() {
  return result(String(state.answers.debtCause || "").trim().length > 0, "채무발생사유 입력이 완료되었습니다.", "채무발생사유를 한 줄 이상 적어야 합니다.");
}

function checkAssetStep(item) {
  const hasText = String(state.answers.assetText || "").trim().length > 0 || getAssetTotal(item) === 0;
  const amountOk = amountMatchesThousand(state.answers.assetTotal, getAssetTotal(item), 0.1);
  return result(hasText && amountOk, "재산 입력이 완료되었습니다.", "재산 내용과 합계 금액을 천원 단위로 다시 확인하세요.");
}

function checkFamilyStep(item) {
  const selected = state.answers.dependents || [];
  const expected = expectedDependentRows(item).map((row) => String(row.no));
  return result(sameSet(selected, expected), "부양가족 선택이 맞습니다.", "업무처리기준에 맞는 부양가족 성명을 체크하세요.");
}

function checkDebtStep(item) {
  const kinds = state.answers.debtKinds || {};
  const allKindsOk = item.debts.every((row, index) => kinds[String(index)] === (isCreditDebt(row) ? "credit" : "secured"));
  const metrics = getDebtMetrics(item);
  const creditOk = amountMatchesThousand(state.answers.creditTotal, metrics.creditTotal, 0.1);
  const securedOk = amountMatchesThousand(state.answers.securedTotal, metrics.securedTotal, 0.1);
  return result(allKindsOk && creditOk && securedOk, "채무 분류와 금액 산정이 맞습니다.", "신용/담보 분류와 합계 금액을 다시 확인하세요. 총액은 10% 오차까지 허용합니다.");
}

function checkDelinquencyStep(item) {
  const expectedRegistered = item.delinquencyDays > 0 ? "yes" : "no";
  const ok =
    state.answers.delinquencyRegistered === expectedRegistered &&
    Number(parseLooseNumber(state.answers.delinquencyDays)) === item.delinquencyDays;
  return result(ok, "연체정보 등록 여부와 연체일수가 맞습니다.", "최근연체정보의 등록 여부와 연체일수를 다시 확인하세요.");
}

function checkEstimateStep(item) {
  const estimate = getEstimate(item);
  const creditDebtOk = amountMatchesThousand(state.answers.creditDebt, estimate.creditDebt, 0.1);
  const securedPaymentOk = amountMatchesThousand(state.answers.securedPayment, estimate.securedPayment, 0.1);
  const availableIncomeOk = amountMatchesThousand(state.answers.availableIncome, estimate.availableIncome, 0.1);
  const creditCapacityOk = amountMatchesThousand(state.answers.creditCapacity, estimate.creditCapacity, 0.1);
  const monthsOk = amountMatchesNumber(state.answers.repaymentMonths, estimate.months, 0.1);
  return result(
    creditDebtOk && securedPaymentOk && availableIncomeOk && creditCapacityOk && monthsOk,
    "조정예상금액 입력이 완료되었습니다.",
    "생계비, 가용소득, 담보채무 상환금액, 상환가능금액, 기간을 다시 확인하세요. 10% 오차까지 허용합니다."
  );
}

function checkSummaryStep() {
  const required = STEPS.filter((step) => step.id !== "summary");
  const ok = required.every((step) => state.completed[step.id]);
  return result(ok, "작성완료한 조정안 확인이 완료되었습니다.", "앞 단계 검증을 먼저 완료하세요.");
}

function result(ok, good, bad) {
  return { ok, message: ok ? good : bad };
}

function expectedEligibility(item) {
  return ELIGIBILITY_OPTIONS.filter((option) => item.basic.eligibility[option.key]).map((option) => option.key);
}

function eligibilityLabels(keys) {
  return keys.map((key) => ELIGIBILITY_OPTIONS.find((option) => option.key === key)?.label || key);
}

function expectedDependentRows(item) {
  return item.family.filter((row) => row.dependent);
}

function isCreditDebt(row) {
  return row.loanCode === "100" || ["신용카드", "카드론정보", "현금서비스"].includes(row.type);
}

function getDebtMetrics(item) {
  const rowCredit = item.debts.filter(isCreditDebt).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const securedTotal = item.debts.filter((row) => !isCreditDebt(row)).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return {
    creditTotal: rowCredit + Number(item.statement.cardDebtAmount || 0),
    securedTotal,
  };
}

function getAssetTotal(item) {
  return item.assets.reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
}

function getLivingExpense(dependentCount) {
  const count = Math.min(Math.max(Number(dependentCount) || 1, 1), 7);
  const medianWon = MEDIAN_INCOME_2026[count] || MEDIAN_INCOME_2026[7];
  const minimum = Math.round((medianWon * 0.4) / 1000);
  const maximum = Math.round(minimum * 1.5);
  return { count, minimum, maximum };
}

function getProgram(item) {
  const days = Number(item.delinquencyDays || 0);
  if (days >= 90) return { name: "개인워크아웃", capMonths: 96 };
  if (days > 30) return { name: "사전채무조정", capMonths: 120 };
  return { name: "신속채무조정", capMonths: 120 };
}

function getEstimate(item) {
  const metrics = getDebtMetrics(item);
  const dependentCount = Math.max(expectedDependentRows(item).length, 1);
  const living = getLivingExpense(dependentCount);
  const program = getProgram(item);
  const creditDebt = metrics.creditTotal;
  const securedPayment = Number(item.securedPayment || 0);
  const livingExpense = living.maximum;
  const availableIncome = Math.max(0, Number(item.income.monthlyIncome || 0) - livingExpense);
  const creditCapacity = Math.max(0, availableIncome - securedPayment);
  const rawMonths = creditCapacity > 0 ? Math.ceil(creditDebt / creditCapacity) : program.capMonths;
  const months = Math.min(rawMonths, program.capMonths);

  return {
    program: program.name,
    capMonths: program.capMonths,
    dependentCount,
    minLivingExpense: living.minimum,
    maxLivingExpense: living.maximum,
    livingExpense,
    creditDebt,
    securedPayment,
    availableIncome,
    creditCapacity,
    rawMonths,
    months,
    capped: rawMonths > program.capMonths,
  };
}

function extractCauseText(item) {
  const found = item.statement.items.find((text) => text.includes("채무발생사유"));
  return found ? found.replace("채무발생사유", "").replace(":", "").trim() : "";
}

function extractCityDistrict(address) {
  const tokens = String(address || "").trim().split(/\s+/);
  const full = tokens.slice(0, 2).join(" ");
  return {
    full,
    city: tokens[1] || tokens[0] || "",
  };
}

function normalizeAddress(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function sameSet(actual = [], expected = []) {
  if (actual.length !== expected.length) return false;
  return expected.every((item) => actual.includes(item));
}

function amountMatchesThousand(actual, expected, tolerance = 0) {
  const parsed = parseThousandAmount(actual);
  const expectedNumber = Number(expected || 0);
  if (Number.isNaN(parsed)) return false;
  if (tolerance > 0) return Math.abs(parsed - expectedNumber) <= Math.max(1, Math.abs(expectedNumber) * tolerance);
  return parsed === expectedNumber;
}

function amountMatchesNumber(actual, expected, tolerance = 0) {
  const parsed = parseLooseNumber(actual);
  const expectedNumber = Number(expected || 0);
  if (Number.isNaN(parsed)) return false;
  if (tolerance > 0) return Math.abs(parsed - expectedNumber) <= Math.max(1, Math.abs(expectedNumber) * tolerance);
  return parsed === expectedNumber;
}

function parseThousandAmount(value) {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;
  const number = parseLooseNumber(raw);
  if (Number.isNaN(number)) return Number.NaN;
  return raw.includes("원") && !raw.includes("천원") ? Math.round(number / 1000) : number;
}

function parseLooseNumber(value) {
  const normalized = String(value || "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

function renderEmptyOrRows(rows = [], renderRow, colspan) {
  if (!Array.isArray(rows) || rows.length === 0) return `<tr><td colspan="${colspan}">해당사항 없음</td></tr>`;
  return rows.map(renderRow).join("");
}

function yesNo(value) {
  return value ? "Y" : "N";
}

function setActiveStep(index) {
  if (index > 0 && !state.completed[STEPS[index - 1].id]) return;
  state.activeStep = index;
  state.activeDocument = STEPS[index].document;
  state.feedback = null;
  renderTraining();
  saveState();
}

function selectCase(caseId) {
  selectedCaseId = caseId;
  state = defaultState(caseId);
  saveCases();
  render();
}

function resetTrainingState() {
  state = defaultState(selectedCaseId);
  render();
  saveState();
}

function setView(view) {
  document.body.dataset.view = view;
  elements.trainingModeBtn.classList.toggle("is-active", view === "training");
  elements.adminModeBtn.classList.toggle("is-active", view === "admin");
  if (view === "admin") renderAdmin();
}

function renderAdmin() {
  renderAdminCaseList();
  elements.caseJson.value = JSON.stringify(currentCase(), null, 2);
}

function renderAdminCaseList() {
  elements.adminCaseList.innerHTML = cases
    .map(
      (item) => `
        <button class="case-list-item ${item.id === selectedCaseId ? "is-active" : ""}" type="button" data-admin-case="${escapeAttr(item.id)}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.basic.name)}</span>
        </button>
      `
    )
    .join("");

  elements.adminCaseList.querySelectorAll("[data-admin-case]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCaseId = button.dataset.adminCase;
      state = defaultState(selectedCaseId);
      render();
      saveCases();
    });
  });
}

function applyCaseJson() {
  try {
    const parsed = JSON.parse(elements.caseJson.value);
    validateCase(parsed);
    const index = cases.findIndex((item) => item.id === parsed.id);
    if (index >= 0) cases[index] = parsed;
    else cases.push(parsed);
    selectedCaseId = parsed.id;
    state = defaultState(selectedCaseId);
    saveCases();
    setAdminStatus("적용되었습니다.", "good");
    render();
  } catch (error) {
    setAdminStatus(error.message, "bad");
  }
}

function duplicateCase() {
  const copy = structuredClone(currentCase());
  copy.id = `${copy.id}-copy-${Date.now().toString(36)}`;
  copy.title = `${copy.title} 복사본`;
  cases.push(copy);
  selectedCaseId = copy.id;
  state = defaultState(selectedCaseId);
  saveCases();
  setAdminStatus("복제되었습니다.", "good");
  render();
}

function exportCases() {
  const blob = new Blob([JSON.stringify(cases, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "debt-adjustment-training-cases.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importCases(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const imported = Array.isArray(parsed) ? parsed : [parsed];
      imported.forEach(validateCase);
      cases = imported;
      selectedCaseId = cases[0].id;
      state = defaultState(selectedCaseId);
      saveCases();
      setAdminStatus("가져왔습니다.", "good");
      render();
    } catch (error) {
      setAdminStatus(error.message, "bad");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function resetCases() {
  if (!window.confirm("기본 케이스로 되돌릴까요?")) return;
  cases = structuredClone(DEFAULT_CASES);
  selectedCaseId = cases[0].id;
  state = defaultState(selectedCaseId);
  saveCases();
  setAdminStatus("기본값으로 복원되었습니다.", "good");
  render();
}

function validateCase(item) {
  if (!item || typeof item !== "object") throw new Error("케이스 JSON 형식이 올바르지 않습니다.");
  if (!item.id || !item.title || !item.basic || !item.income || !Array.isArray(item.family) || !Array.isArray(item.debts)) {
    throw new Error("id, title, basic, income, family, debts 항목이 필요합니다.");
  }
}

function setAdminStatus(message, tone) {
  elements.adminStatus.textContent = message;
  elements.adminStatus.className = tone === "bad" ? "is-bad" : "is-good";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
