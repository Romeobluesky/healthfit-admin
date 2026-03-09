import type { Analysis, HealthGrade } from "@/types";

/** 질병 목록 설정 */
export const DISEASE_LIST = [
  { title: "비만", gradeKey: "obesityGrade", riskKey: "obesity", riskPercent: "19.9%" },
  { title: "고지혈증", gradeKey: "hyperlipidemiaGrade", riskKey: "hyperlipidemia", riskPercent: "39.9%" },
  { title: "고혈압", gradeKey: "highBloodPressureGrade", riskKey: "highBloodPressure", riskPercent: "22.9%" },
  { title: "당뇨병", gradeKey: "diabetesGrade", riskKey: "diabetes", riskPercent: "8.2%" },
  { title: "심장병", gradeKey: "heartDiseaseGrade", riskKey: "heartDisease", riskPercent: "7.0%" },
  { title: "뇌졸중", gradeKey: "strokeGrade", riskKey: "stroke", riskPercent: "1.1%" },
] as const;

/** 암종 목록 (공통) */
const CANCER_LIST_COMMON = [
  { title: "갑상선암", engTitle: "Thyroid" },
  { title: "위암", engTitle: "Stomach" },
  { title: "간암", engTitle: "Liver" },
  { title: "췌장암", engTitle: "Pancreatic" },
  { title: "대장암", engTitle: "Colorectal" },
];

/** 성별별 암종 목록 */
export function getCancerList(gender: number) {
  if (gender === 1) {
    return [
      ...CANCER_LIST_COMMON,
      { title: "방광암", engTitle: "Bladder" },
      { title: "전립선암", engTitle: "Prostate" },
    ];
  }
  return [
    ...CANCER_LIST_COMMON,
    { title: "유방암", engTitle: "Breast" },
    { title: "자궁경부암", engTitle: "Cervical" },
  ];
}

/** 등급 색상 */
export const GRADE_COLORS = {
  정상: "#4bf127",
  주의: "#f8cf09",
  경고: "#ffa619",
  위험: "#ff0528",
} as const;

export type GradeKorean = keyof typeof GRADE_COLORS;

/** 등급 → 포인트 매핑 (영문 HealthGrade) */
const GRADE_POINTS: Record<HealthGrade, number> = {
  SAFE: 0,
  CAUTION: 2,
  WARNING: 3,
  DANGER: 4,
};

/** 한글 등급 → 포인트 매핑 */
const GRADE_POINTS_KR: Record<string, number> = {
  정상: 0,
  주의: 2,
  경고: 3,
  위험: 4,
};

/** 영문 등급 → 한글 */
const GRADE_TO_KOREAN: Record<HealthGrade, GradeKorean> = {
  SAFE: "정상",
  CAUTION: "주의",
  WARNING: "경고",
  DANGER: "위험",
};

/** 등급을 한글로 변환 (영문/한글 모두 처리) */
export function gradeToKorean(grade: string): GradeKorean {
  if (grade in GRADE_TO_KOREAN) return GRADE_TO_KOREAN[grade as HealthGrade];
  if (grade in GRADE_COLORS) return grade as GradeKorean;
  return "정상";
}

/** 등급을 포인트로 변환 (영문/한글 모두 처리) */
export function gradeToPoints(grade: string): number {
  if (grade in GRADE_POINTS) return GRADE_POINTS[grade as HealthGrade];
  if (grade in GRADE_POINTS_KR) return GRADE_POINTS_KR[grade];
  return 0;
}

/** Analysis에서 등급 값 가져오기 */
export function getGradeFromAnalysis(analysis: Analysis, gradeKey: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((analysis as any)[gradeKey] as string) ?? "SAFE";
}

/** Analysis에서 위험도 수치 가져오기 */
export function getRiskFromAnalysis(analysis: Analysis, riskKey: string): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((analysis as any)[riskKey] as number) ?? 0;
}

/** 나이를 연령대 키로 변환 (PHP getAge 함수 포팅) */
export function getAgeGroup(age: number): string {
  if (age < 20) return "teenager";
  if (age < 30) return "twenties";
  if (age < 40) return "thirties";
  if (age < 50) return "forties";
  if (age < 60) return "fifties";
  if (age < 70) return "sixties";
  if (age < 80) return "seventies";
  return "eighties";
}

/** 나이에서 연령대 문자열 (예: "40대") */
export function getAgeDecade(age: number): string {
  return `${Math.floor(age / 10) * 10 || 10}대`;
}

/** 특수문자 제거 (등록번호 생성용, PHP removeSpecialChar 포팅) */
export function removeSpecialChar(str: string): string {
  return str.replace(/[ #&+\-%@=/\\:;,.'"^`~_|!?*$#<>()\[\]{}]/gi, "");
}
