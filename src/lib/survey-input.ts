// 관리자 수동 설문 입력용 보기/점수 정의 및 생체나이 계산
//
// 간편인증 단계에서 고객 변심으로 survey 저장이 누락된 경우, 관리자가 직접
// 신체정보/생활습관을 입력하면 실제나이·생체나이를 계산해 저장한다.
//
// 기준: healthfit-web (실제 간편인증 웹 플로우)의 InlineSurvey + calculateBiologicalAge 와 100% 동일.
// - 저장값(smoking/drink/exercise/life)은 웹이 DB에 저장하는 반올림 점수와 동일.
// - 보기 라벨은 어드민 표시 맵(survey-labels.ts)과 일치하도록 맞춤.
// - healthage = 실제나이 + smoking + drink + exercise + life (검진 가중치 없음 = 경로 A)

export interface SurveyInputOption {
  label: string;
  value: number;
}

export interface SurveyInputField {
  key: "smoking" | "drink" | "exercise" | "life";
  label: string;
  options: SurveyInputOption[];
}

// value: 웹이 DB에 저장하는 값(점수) / label: survey-labels.ts 표시와 일치
export const SURVEY_INPUT_FIELDS: SurveyInputField[] = [
  {
    key: "smoking",
    label: "흡연",
    options: [
      { label: "비흡연", value: 0 },
      { label: "흡연", value: 1 },
      { label: "금연중", value: 4 },
    ],
  },
  {
    key: "drink",
    label: "음주",
    options: [
      { label: "안 함", value: 0 },
      { label: "주 1~2회", value: 1 },
      { label: "주 3회 이상", value: 3 },
    ],
  },
  {
    key: "exercise",
    label: "유산소운동",
    options: [
      { label: "안 함", value: 1 },
      { label: "주 1~2회", value: 0 },
      { label: "주 3회 이상", value: -3 },
    ],
  },
  {
    key: "life",
    label: "근력운동",
    options: [
      { label: "안 함", value: 1 },
      { label: "주 1~2회", value: -1 },
      { label: "주 3회 이상", value: -2 },
    ],
  },
];

// 생년월일(문자열) → 만 나이. 유효하지 않으면 null.
// YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss 등 지원 (healthfit-web calculateAge 동일 로직)
export function calculateAgeFromBirth(birth: string | null | undefined): number | null {
  if (!birth) return null;
  const digits = birth.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const year = parseInt(digits.substring(0, 4), 10);
  const month = parseInt(digits.substring(4, 6), 10);
  const day = parseInt(digits.substring(6, 8), 10);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }
  return age < 0 ? null : age;
}

// 생체나이(healthage) 미리보기 계산 — 서버 library/biologicalAge.js 의 경로 A(검진 없음) 로직과 동일.
//
//   lifestyleTotal = smoking + drink + exercise + life  (저장값을 그대로 가중치로 사용)
//   scaledDiff     = lifestyleTotal × 0.6
//   diff           = scaledDiff ≥ 0 ? min(scaledDiff, 10) : scaledDiff   (양수만 상한 10)
//   healthage      = 실제나이 + diff   (소수 2자리)
//
// 실제 저장값은 POST /survey 시 서버가 재계산해 덮어쓰므로, 이 값은 저장 전 미리보기 추정치이며
// 저장 후 재조회하면 서버 계산값으로 표시된다. (검진 이력이 있는 고객은 서버가 경로 B로 계산)
export function calculateHealthage(
  age: number,
  scores: { smoking: number; drink: number; exercise: number; life: number }
): number {
  const lifestyleTotal = scores.smoking + scores.drink + scores.exercise + scores.life;
  const scaledDiff = lifestyleTotal * 0.6;
  const diff = scaledDiff >= 0 ? Math.min(scaledDiff, 10) : scaledDiff;
  return Math.round((age + diff) * 100) / 100;
}

// "YYYY-MM-DD" 또는 유사 형식 → 8자리 숫자 (birth 필드 저장용). 실패 시 null.
export function birthToNumber(birth: string | null | undefined): number | null {
  if (!birth) return null;
  const digits = birth.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  return parseInt(digits.substring(0, 8), 10);
}

// member.birthDate(various) → <input type="date"> 값(YYYY-MM-DD). 유효하지 않으면 "".
export function toDateInputValue(birth: string | null | undefined): string {
  if (!birth) return "";
  const digits = birth.replace(/[^0-9]/g, "");
  if (digits.length < 8) return "";
  const y = digits.substring(0, 4);
  const m = digits.substring(4, 6);
  const d = digits.substring(6, 8);
  // YYYY0101 같은 일반경로 플레이스홀더도 그대로 노출 (관리자가 실제 생년월일로 수정)
  if (m === "00" || d === "00") return "";
  return `${y}-${m}-${d}`;
}
