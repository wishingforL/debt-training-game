import type { LevelData, ScreenName } from "../types";

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

type Field = LevelData["fields"][number];

function moneyField(key: string, label: string, screen: ScreenName, answer: number, clue: string): Field {
  return { key, label, screen, type: "number", unit: "천원", answer, clue };
}

function numberField(key: string, label: string, screen: ScreenName, answer: number, unit: string, clue: string): Field {
  return { key, label, screen, type: "number", unit, answer, clue };
}

function booleanField(key: string, label: string, screen: ScreenName, clue: string): Field {
  return { key, label, screen, type: "boolean", answer: true, clue, options: yesNoOptions };
}

function housingField(answer: string, clue: string): Field {
  return {
    key: "housingType",
    label: "주거형태",
    screen: "주거",
    type: "choice",
    answer,
    clue,
    options: housingOptions,
  };
}

function caseData(input: {
  badge: string;
  fields: Field[];
  goal: string;
  id: string;
  level: number;
  scenario: string[];
  supportType: string;
  systemScreens: ScreenName[];
  title: string;
}): LevelData {
  return {
    id: input.id,
    level: input.level,
    title: input.title,
    badge: input.badge,
    goal: input.goal,
    scenario: input.scenario,
    systemScreens: input.systemScreens,
    fields: input.fields,
    result: {
      disposableIncome: 0,
      formula: "최종미션에서 생활비와 월납부액을 조정해 계산합니다.",
    },
    mission: {
      supportType: input.supportType,
      monthlyPayment: 0,
      repaymentPeriod: 0,
    },
  };
}

const LEVEL_CASES: LevelData[] = [
  caseData({
    id: "level-1-1",
    level: 1,
    title: "기본상담 1-1",
    badge: "신속채무조정",
    goal: "소득, 가족, 채무, 연체일수 단서를 찾습니다.",
    scenario: [
      "월 2,400천원 벌고 있습니다.",
      "배우자와 초등학생 자녀 1명을 부양하고 있습니다.",
      "카드값 때문에 20일째 연체 중입니다.",
      "빚은 22,000천원입니다.",
    ],
    systemScreens: ["소득", "가족", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 240, "월 2,400천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 초등학생 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 20, "일", "카드값 때문에 20일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 2200, "빚은 22,000천원입니다."),
    ],
    supportType: "신속채무조정",
  }),
  caseData({
    id: "level-1-2",
    level: 1,
    title: "기본상담 1-2",
    badge: "사전채무조정",
    goal: "연체일수에 따라 사전채무조정을 판단합니다.",
    scenario: [
      "월 2,600천원 벌고 있습니다.",
      "배우자와 자녀 1명을 부양하고 있습니다.",
      "대출금 때문에 60일째 연체 중입니다.",
      "빚은 28,000천원입니다.",
    ],
    systemScreens: ["소득", "가족", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 260, "월 2,600천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 60, "일", "대출금 때문에 60일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 2800, "빚은 28,000천원입니다."),
    ],
    supportType: "사전채무조정",
  }),
  caseData({
    id: "level-1-3",
    level: 1,
    title: "기본상담 1-3",
    badge: "개인워크아웃",
    goal: "90일 이상 연체 사례의 지원구분을 판단합니다.",
    scenario: [
      "월 2,500천원 벌고 있습니다.",
      "배우자와 초등학생 자녀 1명을 부양하고 있습니다.",
      "카드값 때문에 120일째 연체 중입니다.",
      "빚은 24,000천원입니다.",
    ],
    systemScreens: ["소득", "가족", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 250, "월 2,500천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 초등학생 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 120, "일", "카드값 때문에 120일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 2400, "빚은 24,000천원입니다."),
    ],
    supportType: "개인워크아웃",
  }),
  caseData({
    id: "level-2-1",
    level: 2,
    title: "주거확인 2-1",
    badge: "신속 · 임차",
    goal: "주거형태, 보증금, 월세 단서를 함께 확인합니다.",
    scenario: [
      "월 2,700천원 벌고 있습니다.",
      "배우자와 자녀 1명을 부양하고 있습니다.",
      "카드값 때문에 25일째 연체 중입니다.",
      "빚은 30,000천원입니다.",
      "보증금 15,000천원에 월세 350천원으로 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 270, "월 2,700천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 25, "일", "카드값 때문에 25일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 3000, "빚은 30,000천원입니다."),
      housingField("임차", "보증금 15,000천원에 월세 350천원으로 살고 있습니다."),
      moneyField("deposit", "보증금", "주거", 1500, "보증금 15,000천원에 월세 350천원으로 살고 있습니다."),
      moneyField("monthlyRent", "월세", "주거", 35, "보증금 15,000천원에 월세 350천원으로 살고 있습니다."),
    ],
    supportType: "신속채무조정",
  }),
  caseData({
    id: "level-2-2",
    level: 2,
    title: "주거확인 2-2",
    badge: "사전 · 임차",
    goal: "중학생 자녀 2명과 월세 주거 정보를 확인합니다.",
    scenario: [
      "월 2,800천원 벌고 있습니다.",
      "배우자와 중학생 자녀 2명을 부양하고 있습니다.",
      "대출금 때문에 75일째 연체 중입니다.",
      "빚은 36,000천원입니다.",
      "보증금 20,000천원에 월세 400천원으로 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 280, "월 2,800천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 3, "명", "배우자와 중학생 자녀 2명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 75, "일", "대출금 때문에 75일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 3600, "빚은 36,000천원입니다."),
      housingField("임차", "보증금 20,000천원에 월세 400천원으로 살고 있습니다."),
      moneyField("deposit", "보증금", "주거", 2000, "보증금 20,000천원에 월세 400천원으로 살고 있습니다."),
      moneyField("monthlyRent", "월세", "주거", 40, "보증금 20,000천원에 월세 400천원으로 살고 있습니다."),
    ],
    supportType: "사전채무조정",
  }),
  caseData({
    id: "level-2-3",
    level: 2,
    title: "주거확인 2-3",
    badge: "개인 · 임차",
    goal: "월세 주거와 90일 이상 연체 사례를 함께 확인합니다.",
    scenario: [
      "월 3,000천원 벌고 있습니다.",
      "배우자와 자녀 2명을 부양하고 있습니다.",
      "생활비 부족으로 105일째 연체 중입니다.",
      "빚은 42,000천원입니다.",
      "보증금 25,000천원에 월세 500천원으로 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 300, "월 3,000천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 3, "명", "배우자와 자녀 2명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 105, "일", "생활비 부족으로 105일째 연체 중입니다."),
      moneyField("debt", "채무", "채무현황", 4200, "빚은 42,000천원입니다."),
      housingField("임차", "보증금 25,000천원에 월세 500천원으로 살고 있습니다."),
      moneyField("deposit", "보증금", "주거", 2500, "보증금 25,000천원에 월세 500천원으로 살고 있습니다."),
      moneyField("monthlyRent", "월세", "주거", 50, "보증금 25,000천원에 월세 500천원으로 살고 있습니다."),
    ],
    supportType: "개인워크아웃",
  }),
  caseData({
    id: "level-3-1",
    level: 3,
    title: "재산확인 3-1",
    badge: "신속 · 차량",
    goal: "차량 보유와 차량 시세를 재산 화면에서 확인합니다.",
    scenario: [
      "월 3,300천원 벌고 있습니다.",
      "배우자와 자녀 2명을 부양하고 있습니다.",
      "카드값 때문에 18일째 연체 중입니다.",
      "신용채무는 45,000천원, 담보채무는 없습니다.",
      "본인 명의 차량(시세 12,000천원) 한 대가 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 330, "월 3,300천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 3, "명", "배우자와 자녀 2명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 18, "일", "카드값 때문에 18일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 4500, "신용채무는 45,000천원, 담보채무는 없습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 0, "신용채무는 45,000천원, 담보채무는 없습니다."),
      booleanField("hasVehicle", "차량", "재산", "본인 명의 차량(시세 12,000천원) 한 대가 있습니다."),
      moneyField("vehicleValue", "차량 시세", "재산", 1200, "본인 명의 차량(시세 12,000천원) 한 대가 있습니다."),
    ],
    supportType: "신속채무조정",
  }),
  caseData({
    id: "level-3-2",
    level: 3,
    title: "재산확인 3-2",
    badge: "사전 · 차량",
    goal: "차량 보유와 생활비 부족 연체 사례를 확인합니다.",
    scenario: [
      "월 3,500천원 벌고 있습니다.",
      "배우자와 자녀 2명을 부양하고 있습니다.",
      "생활비 부족으로 65일째 연체 중입니다.",
      "신용채무는 50,000천원, 담보채무는 없습니다.",
      "본인 명의 차량(시세 18,000천원) 한 대가 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 350, "월 3,500천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 3, "명", "배우자와 자녀 2명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 65, "일", "생활비 부족으로 65일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 5000, "신용채무는 50,000천원, 담보채무는 없습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 0, "신용채무는 50,000천원, 담보채무는 없습니다."),
      booleanField("hasVehicle", "차량", "재산", "본인 명의 차량(시세 18,000천원) 한 대가 있습니다."),
      moneyField("vehicleValue", "차량 시세", "재산", 1800, "본인 명의 차량(시세 18,000천원) 한 대가 있습니다."),
    ],
    supportType: "사전채무조정",
  }),
  caseData({
    id: "level-3-3",
    level: 3,
    title: "재산확인 3-3",
    badge: "개인 · 전세",
    goal: "미혼 부양가족과 본인 계약 전세보증금을 함께 확인합니다.",
    scenario: [
      "월 3,700천원 벌고 있습니다.",
      "미혼이며 63세 부친과 모친을 부양하고 함께 거주하고 있습니다.",
      "대출금 때문에 110일째 연체 중입니다.",
      "신용채무는 48,000천원, 담보채무는 없습니다.",
      "본인이 계약한 전세보증금 40,000천원 집에 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 370, "월 3,700천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "미혼이며 63세 부친과 모친을 부양하고 함께 거주하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 110, "일", "대출금 때문에 110일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 4800, "신용채무는 48,000천원, 담보채무는 없습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 0, "신용채무는 48,000천원, 담보채무는 없습니다."),
      housingField("임차", "본인이 계약한 전세보증금 40,000천원 집에 살고 있습니다."),
      moneyField("jeonseDeposit", "전세보증금", "주거", 4000, "본인이 계약한 전세보증금 40,000천원 집에 살고 있습니다."),
    ],
    supportType: "개인워크아웃",
  }),
  caseData({
    id: "level-4-1",
    level: 4,
    title: "담보채무 4-1",
    badge: "신속 · 차량담보",
    goal: "신용채무와 차량담보대출을 구분합니다.",
    scenario: [
      "월 3,200천원 벌고 있습니다.",
      "배우자와 자녀 1명을 부양하고 있습니다.",
      "카드값 때문에 20일째 연체 중입니다.",
      "신용채무는 38,000천원, 차량담보대출은 12,000천원 남아 있습니다.",
      "차량 할부금으로 매월 350천원씩 내고 있습니다.",
      "본인 명의 차량(시세 16,000천원) 한 대가 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 320, "월 3,200천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 20, "일", "카드값 때문에 20일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 3800, "신용채무는 38,000천원, 차량담보대출은 12,000천원 남아 있습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 1200, "신용채무는 38,000천원, 차량담보대출은 12,000천원 남아 있습니다."),
      moneyField("securedPayment", "담보 원리금", "채무현황", 35, "차량 할부금으로 매월 350천원씩 내고 있습니다."),
      booleanField("hasVehicle", "차량", "재산", "본인 명의 차량(시세 16,000천원) 한 대가 있습니다."),
      moneyField("vehicleValue", "차량 시세", "재산", 1600, "본인 명의 차량(시세 16,000천원) 한 대가 있습니다."),
    ],
    supportType: "신속채무조정",
  }),
  caseData({
    id: "level-4-2",
    level: 4,
    title: "담보채무 4-2",
    badge: "사전 · 주택담보",
    goal: "신용채무와 주택담보대출을 구분합니다.",
    scenario: [
      "월 3,500천원 벌고 있습니다.",
      "배우자와 자녀 2명을 부양하고 있습니다.",
      "대출금 때문에 70일째 연체 중입니다.",
      "신용채무는 45,000천원, 주택담보대출은 55,000천원 남아 있습니다.",
      "주택담보대출 원리금으로 매월 500천원씩 내고 있습니다.",
      "본인 명의 집(시세 68,000천원)에 거주하고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 350, "월 3,500천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 3, "명", "배우자와 자녀 2명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 70, "일", "대출금 때문에 70일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 4500, "신용채무는 45,000천원, 주택담보대출은 55,000천원 남아 있습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 5500, "신용채무는 45,000천원, 주택담보대출은 55,000천원 남아 있습니다."),
      moneyField("securedPayment", "담보 원리금", "채무현황", 50, "주택담보대출 원리금으로 매월 500천원씩 내고 있습니다."),
      booleanField("homeOwned", "거주 주택", "재산", "본인 명의 집(시세 68,000천원)에 거주하고 있습니다."),
      moneyField("homeValue", "집 시세", "재산", 6800, "본인 명의 집(시세 68,000천원)에 거주하고 있습니다."),
    ],
    supportType: "사전채무조정",
  }),
  caseData({
    id: "level-4-3",
    level: 4,
    title: "담보채무 4-3",
    badge: "개인 · 주택담보",
    goal: "담보채무가 있어도 신용채무와 나누어 확인합니다.",
    scenario: [
      "월 3,200천원 벌고 있습니다.",
      "배우자와 자녀 1명을 부양하고 있습니다.",
      "사업 실패 후 140일째 연체 중입니다.",
      "신용채무는 40,000천원, 주택담보대출은 80,000천원 남아 있습니다.",
      "주택담보대출 원리금으로 매월 600천원씩 내고 있습니다.",
      "본인 명의 집(시세 65,000천원)에 거주하고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 320, "월 3,200천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 140, "일", "사업 실패 후 140일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 4000, "신용채무는 40,000천원, 주택담보대출은 80,000천원 남아 있습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 8000, "신용채무는 40,000천원, 주택담보대출은 80,000천원 남아 있습니다."),
      moneyField("securedPayment", "담보 원리금", "채무현황", 60, "주택담보대출 원리금으로 매월 600천원씩 내고 있습니다."),
      booleanField("homeOwned", "거주 주택", "재산", "본인 명의 집(시세 65,000천원)에 거주하고 있습니다."),
      moneyField("homeValue", "집 시세", "재산", 6500, "본인 명의 집(시세 65,000천원)에 거주하고 있습니다."),
    ],
    supportType: "개인워크아웃",
  }),
  caseData({
    id: "level-5-1",
    level: 5,
    title: "추가인정 생활비 5-1",
    badge: "대학생 자녀",
    goal: "대학생 자녀 부양, 주택담보대출, 거주 주택 시세를 함께 확인합니다.",
    scenario: [
      "월 5,300천원 벌고 있습니다.",
      "배우자와 대학생 자녀 1명을 부양하고 있습니다.",
      "대출금 때문에 95일째 연체 중입니다.",
      "신용채무는 55,000천원, 주택담보대출은 60,000천원 남아 있습니다.",
      "주택담보대출 원리금으로 매월 450천원씩 내고 있습니다.",
      "본인 명의 집(시세 65,000천원)에 거주하고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 530, "월 5,300천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 대학생 자녀 1명을 부양하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 95, "일", "대출금 때문에 95일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 5500, "신용채무는 55,000천원, 주택담보대출은 60,000천원 남아 있습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 6000, "신용채무는 55,000천원, 주택담보대출은 60,000천원 남아 있습니다."),
      moneyField("securedPayment", "담보 원리금", "채무현황", 45, "주택담보대출 원리금으로 매월 450천원씩 내고 있습니다."),
      booleanField("homeOwned", "거주 주택", "재산", "본인 명의 집(시세 65,000천원)에 거주하고 있습니다."),
      moneyField("homeValue", "집 시세", "재산", 6500, "본인 명의 집(시세 65,000천원)에 거주하고 있습니다."),
    ],
    supportType: "개인워크아웃",
  }),
  caseData({
    id: "level-5-2",
    level: 5,
    title: "추가인정 생활비 5-2",
    badge: "병원비 · 전세담보",
    goal: "70세 모친 부양, 병원비, 전세담보대출, 전세보증금을 함께 확인합니다.",
    scenario: [
      "월 5,600천원 벌고 있습니다.",
      "배우자와 70세 모친을 부양하고 있습니다.",
      "모친 병원비로 매월 500천원씩 지출하고 있습니다.",
      "생활비 부족으로 80일째 연체 중입니다.",
      "신용채무는 60,000천원, 전세담보대출은 90,000천원 남아 있습니다.",
      "전세담보대출 이자로 매월 250천원씩 내고 있습니다.",
      "전세보증금 100,000천원 집에 살고 있습니다.",
    ],
    systemScreens: ["소득", "가족", "특이사항", "주거", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 560, "월 5,600천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 2, "명", "배우자와 70세 모친을 부양하고 있습니다."),
      moneyField("medicalExpense", "병원비", "특이사항", 50, "모친 병원비로 매월 500천원씩 지출하고 있습니다."),
      numberField("overdueDays", "연체일수", "채무현황", 80, "일", "생활비 부족으로 80일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 6000, "신용채무는 60,000천원, 전세담보대출은 90,000천원 남아 있습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 9000, "신용채무는 60,000천원, 전세담보대출은 90,000천원 남아 있습니다."),
      moneyField("securedPayment", "담보 이자", "채무현황", 25, "전세담보대출 이자로 매월 250천원씩 내고 있습니다."),
      housingField("임차", "전세보증금 100,000천원 집에 살고 있습니다."),
      moneyField("jeonseDeposit", "전세보증금", "주거", 10000, "전세보증금 100,000천원 집에 살고 있습니다."),
    ],
    supportType: "사전채무조정",
  }),
  caseData({
    id: "level-5-3",
    level: 5,
    title: "추가인정 생활비 5-3",
    badge: "1인 가구 · 서울 월세",
    goal: "미혼 1인 가구, 서울 월세 주거, 차량 보유를 함께 확인합니다.",
    scenario: [
      "월 5,000천원 벌고 있습니다.",
      "미혼이며 혼자 살고 있습니다.",
      "카드값 때문에 35일째 연체 중입니다.",
      "신용채무는 45,000천원, 담보채무는 없습니다.",
      "서울에서 보증금 30,000천원, 월세 1,000천원으로 살고 있습니다.",
      "본인 명의 차량(시세 12,000천원) 한 대가 있습니다.",
    ],
    systemScreens: ["소득", "가족", "주거", "재산", "채무현황"],
    fields: [
      moneyField("income", "월 소득", "소득", 500, "월 5,000천원 벌고 있습니다."),
      numberField("dependents", "부양가족", "가족", 0, "명", "미혼이며 혼자 살고 있습니다."),
      {
        key: "residenceArea",
        label: "거주지역",
        screen: "주거",
        type: "choice",
        answer: "서울",
        clue: "서울에서 보증금 30,000천원, 월세 1,000천원으로 살고 있습니다.",
      },
      numberField("overdueDays", "연체일수", "채무현황", 35, "일", "카드값 때문에 35일째 연체 중입니다."),
      moneyField("unsecuredDebt", "신용채무", "채무현황", 4500, "신용채무는 45,000천원, 담보채무는 없습니다."),
      moneyField("securedDebt", "담보채무", "채무현황", 0, "신용채무는 45,000천원, 담보채무는 없습니다."),
      housingField("임차", "서울에서 보증금 30,000천원, 월세 1,000천원으로 살고 있습니다."),
      moneyField("deposit", "보증금", "주거", 3000, "서울에서 보증금 30,000천원, 월세 1,000천원으로 살고 있습니다."),
      moneyField("monthlyRent", "월세", "주거", 100, "서울에서 보증금 30,000천원, 월세 1,000천원으로 살고 있습니다."),
      booleanField("hasVehicle", "차량", "재산", "본인 명의 차량(시세 12,000천원) 한 대가 있습니다."),
      moneyField("vehicleValue", "차량 시세", "재산", 1200, "본인 명의 차량(시세 12,000천원) 한 대가 있습니다."),
    ],
    supportType: "사전채무조정",
  }),
];

export const LEVELS: LevelData[] = [...LEVEL_CASES];
