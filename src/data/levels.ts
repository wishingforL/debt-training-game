import type { LevelData } from "../types";

export const SUPPORT_OPTIONS = ["신속채무조정", "사전채무조정", "개인워크아웃"] as const;

const yesNoOptions = [
  { label: "있음", value: true },
  { label: "없음", value: false },
];

const housingOptions = [
  { label: "자가", value: "자가" },
  { label: "임차", value: "임차" },
  { label: "무상거주", value: "무상거주" },
];

const LEVEL_CASES: LevelData[] = [
  {
    id: "level-1",
    level: 1,
    title: "기본상담",
    badge: "소득 · 가족 · 채무 · 연체",
    goal: "기본 상담 정보를 읽고 접수를 시작하세요.",
    scenario: [
      "월 2,500천원 벌고 있습니다.",
      "배우자와 초등학생 자녀 1명을 부양하고 있습니다.",
      "카드값 때문에 120일째 연체 중입니다.",
      "빚은 24,000천원입니다.",
    ],
    systemScreens: ["소득", "가족", "채무현황"],
    fields: [
      { key: "income", label: "월 소득", screen: "소득", type: "number", unit: "천원", answer: 250, clue: "월 2,500천원 벌고 있습니다." },
      { key: "dependents", label: "부양가족", screen: "가족", type: "number", unit: "명", answer: 2, clue: "배우자와 초등학생 자녀 1명을 부양하고 있습니다." },
      { key: "overdueDays", label: "연체일수", screen: "채무현황", type: "number", unit: "일", answer: 120, clue: "카드값 때문에 120일째 연체 중입니다." },
      { key: "debt", label: "채무", screen: "채무현황", type: "number", unit: "천원", answer: 2400, clue: "빚은 24,000천원입니다." },
    ],
    result: {
      disposableIncome: 25,
      formula: "250 - 조정생활비 225 = 25",
    },
    mission: {
      supportType: "개인워크아웃",
      monthlyPayment: 25,
      repaymentPeriod: 96,
    },
  },
  {
    id: "level-2",
    level: 2,
    title: "주거확인",
    badge: "주거형태 추가",
    goal: "월세와 보증금 정보를 접수 화면에 반영합니다.",
    scenario: [
      "월 2,800천원 벌고 있습니다.",
      "배우자와 중학생 자녀 2명을 부양하고 있습니다.",
      "대출금 때문에 75일째 연체 중입니다.",
      "빚은 36,000천원입니다.",
      "보증금 20,000천원에 월세 400천원으로 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      { key: "income", label: "월 소득", screen: "소득", type: "number", unit: "천원", answer: 280, clue: "월 2,800천원 벌고 있습니다." },
      { key: "dependents", label: "부양가족", screen: "가족", type: "number", unit: "명", answer: 3, clue: "배우자와 중학생 자녀 2명을 부양하고 있습니다." },
      { key: "overdueDays", label: "연체일수", screen: "채무현황", type: "number", unit: "일", answer: 75, clue: "대출금 때문에 75일째 연체 중입니다." },
      { key: "debt", label: "채무", screen: "채무현황", type: "number", unit: "천원", answer: 3600, clue: "빚은 36,000천원입니다." },
      {
        key: "housingType",
        label: "주거형태",
        screen: "주거",
        type: "choice",
        answer: "임차",
        clue: "보증금 20,000천원에 월세 400천원으로 살고 있습니다.",
        options: housingOptions,
      },
      { key: "deposit", label: "보증금", screen: "주거", type: "number", unit: "천원", answer: 2000, clue: "보증금 20,000천원에 월세 400천원으로 살고 있습니다." },
      { key: "monthlyRent", label: "월세", screen: "주거", type: "number", unit: "천원", answer: 40, clue: "보증금 20,000천원에 월세 400천원으로 살고 있습니다." },
    ],
    result: {
      disposableIncome: 40,
      formula: "280 - 생활비 240 = 40",
    },
    mission: {
      supportType: "사전채무조정",
      monthlyPayment: 40,
      repaymentPeriod: 120,
    },
  },
  {
    id: "level-3",
    level: 3,
    title: "재산확인",
    badge: "차량 · 예금 추가",
    goal: "재산 정보를 확인하고 채무현황과 함께 검토합니다.",
    scenario: [
      "월 3,500천원 벌고 있습니다.",
      "배우자와 자녀 2명을 부양하고 있습니다.",
      "생활비 부족으로 110일째 연체 중입니다.",
      "신용채무는 50,000천원입니다.",
      "담보채무는 없습니다.",
      "본인 명의 차량 한 대가 있습니다.",
      "예금 20,000천원이 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      { key: "income", label: "월 소득", screen: "소득", type: "number", unit: "천원", answer: 350, clue: "월 3,500천원 벌고 있습니다." },
      { key: "dependents", label: "부양가족", screen: "가족", type: "number", unit: "명", answer: 3, clue: "배우자와 자녀 2명을 부양하고 있습니다." },
      { key: "overdueDays", label: "연체일수", screen: "채무현황", type: "number", unit: "일", answer: 110, clue: "생활비 부족으로 110일째 연체 중입니다." },
      { key: "unsecuredDebt", label: "신용채무", screen: "채무현황", type: "number", unit: "천원", answer: 5000, clue: "신용채무는 50,000천원입니다." },
      { key: "securedDebt", label: "담보채무", screen: "채무현황", type: "number", unit: "천원", answer: 0, clue: "담보채무는 없습니다." },
      { key: "hasVehicle", label: "차량", screen: "재산", type: "boolean", answer: true, clue: "본인 명의 차량 한 대가 있습니다.", options: yesNoOptions },
      { key: "depositAsset", label: "예금", screen: "재산", type: "number", unit: "천원", answer: 2000, clue: "예금 20,000천원이 있습니다." },
    ],
    result: {
      disposableIncome: 52.1,
      formula: "350 - 조정생활비 297.9 = 52.1",
    },
    mission: {
      supportType: "개인워크아웃",
      monthlyPayment: 52.1,
      repaymentPeriod: 96,
    },
  },
  {
    id: "level-4",
    level: 4,
    title: "담보채무 등장",
    badge: "신용채무 · 담보채무 구분",
    goal: "신용채무와 담보채무를 분리해 채무현황에 입력합니다.",
    scenario: [
      "월 3,200천원 벌고 있습니다.",
      "배우자와 자녀 1명을 부양하고 있습니다.",
      "사업 실패 후 140일째 연체 중입니다.",
      "신용채무는 40,000천원입니다.",
      "주택담보대출은 80,000천원 남아 있습니다.",
      "전세보증금 60,000천원 집에 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      { key: "income", label: "월 소득", screen: "소득", type: "number", unit: "천원", answer: 320, clue: "월 3,200천원 벌고 있습니다." },
      { key: "dependents", label: "부양가족", screen: "가족", type: "number", unit: "명", answer: 2, clue: "배우자와 자녀 1명을 부양하고 있습니다." },
      { key: "overdueDays", label: "연체일수", screen: "채무현황", type: "number", unit: "일", answer: 140, clue: "사업 실패 후 140일째 연체 중입니다." },
      { key: "unsecuredDebt", label: "신용채무", screen: "채무현황", type: "number", unit: "천원", answer: 4000, clue: "신용채무는 40,000천원입니다." },
      { key: "securedDebt", label: "담보채무", screen: "채무현황", type: "number", unit: "천원", answer: 8000, clue: "주택담보대출은 80,000천원 남아 있습니다." },
      {
        key: "housingType",
        label: "주거형태",
        screen: "주거",
        type: "choice",
        answer: "임차",
        clue: "전세보증금 60,000천원 집에 살고 있습니다.",
        options: housingOptions,
      },
      { key: "jeonseDeposit", label: "전세보증금", screen: "주거", type: "number", unit: "천원", answer: 6000, clue: "전세보증금 60,000천원 집에 살고 있습니다." },
    ],
    result: {
      disposableIncome: 41.7,
      formula: "320 - 조정생활비 278.3 = 41.7",
    },
    mission: {
      supportType: "개인워크아웃",
      monthlyPayment: 41.7,
      repaymentPeriod: 96,
    },
  },
  {
    id: "level-5",
    level: 5,
    title: "보스 스테이지",
    badge: "실제 상담 수준",
    goal: "주거, 가족, 소득, 재산, 채무현황, 급여가압류 화면을 모두 사용합니다.",
    scenario: [
      "월 3,300천원 벌고 있습니다.",
      "배우자와 자녀 1명, 모친을 부양하고 있습니다.",
      "카드값과 대출금 때문에 85일째 연체 중입니다.",
      "신용채무는 45,000천원입니다.",
      "주택담보대출은 120,000천원 남아 있습니다.",
      "보증금 30,000천원에 월세 500천원으로 살고 있습니다.",
      "차량 한 대가 있습니다.",
      "급여가 압류되어 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "재산", "채무현황", "급여가압류"],
    fields: [
      { key: "income", label: "월 소득", screen: "소득", type: "number", unit: "천원", answer: 330, clue: "월 3,300천원 벌고 있습니다." },
      { key: "dependents", label: "부양가족", screen: "가족", type: "number", unit: "명", answer: 3, clue: "배우자와 자녀 1명, 모친을 부양하고 있습니다." },
      { key: "overdueDays", label: "연체일수", screen: "채무현황", type: "number", unit: "일", answer: 85, clue: "카드값과 대출금 때문에 85일째 연체 중입니다." },
      { key: "unsecuredDebt", label: "신용채무", screen: "채무현황", type: "number", unit: "천원", answer: 4500, clue: "신용채무는 45,000천원입니다." },
      { key: "securedDebt", label: "담보채무", screen: "채무현황", type: "number", unit: "천원", answer: 12000, clue: "주택담보대출은 120,000천원 남아 있습니다." },
      {
        key: "housingType",
        label: "주거형태",
        screen: "주거",
        type: "choice",
        answer: "임차",
        clue: "보증금 30,000천원에 월세 500천원으로 살고 있습니다.",
        options: housingOptions,
      },
      { key: "deposit", label: "보증금", screen: "주거", type: "number", unit: "천원", answer: 3000, clue: "보증금 30,000천원에 월세 500천원으로 살고 있습니다." },
      { key: "monthlyRent", label: "월세", screen: "주거", type: "number", unit: "천원", answer: 50, clue: "보증금 30,000천원에 월세 500천원으로 살고 있습니다." },
      { key: "hasVehicle", label: "차량", screen: "재산", type: "boolean", answer: true, clue: "차량 한 대가 있습니다.", options: yesNoOptions },
      { key: "wageGarnishment", label: "급여압류", screen: "급여가압류", type: "boolean", answer: true, clue: "급여가 압류되어 있습니다.", options: yesNoOptions },
    ],
    result: {
      disposableIncome: 50,
      formula: "330 - 생활비 280 = 50",
    },
    mission: {
      supportType: "사전채무조정",
      monthlyPayment: 50,
      repaymentPeriod: 120,
    },
  },
];

export const LEVELS: LevelData[] = [...LEVEL_CASES].sort((a, b) => a.level - b.level);
