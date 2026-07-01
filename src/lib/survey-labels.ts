// 설문(생활습관) 점수 → 한글 라벨 역매핑
//
// 2026-07-01 개편: 흡연/음주/유산소 보기가 4개 → 3개로 통합됨.
// - 신규 제출은 통합된 최상위 보기 점수(smoking 4 / drink 3 / exercise -3)만 생성.
// - 과거 데이터 점수(smoking 2 / drink 2 / exercise -2)는 신규 통합 라벨로 함께 표시.
// - 근력운동(life)은 기존부터 3개 보기라 변경 없음.

export const SMOKING_LABELS: Record<number, string> = {
  0: "비흡연",
  1: "과거 흡연 (금연 중)",
  2: "현재 흡연", // 과거 데이터 → 통합 라벨
  4: "현재 흡연",
};

export const DRINK_LABELS: Record<number, string> = {
  0: "마시지 않음",
  1: "주 1~2회",
  2: "주 3회 이상", // 과거 데이터 → 통합 라벨
  3: "주 3회 이상",
};

export const EXERCISE_LABELS: Record<number, string> = {
  1: "거의 하지 않음",
  0: "주 1~2회",
  [-2]: "주 3회 이상", // 과거 데이터 → 통합 라벨
  [-3]: "주 3회 이상",
};

// 근력운동 — 변경 없음
export const LIFE_LABELS: Record<number, string> = {
  1: "거의 하지 않음",
  [-1]: "주 1~2회",
  [-2]: "주 3회 이상",
};
