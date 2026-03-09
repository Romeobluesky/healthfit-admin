// 권한 레벨
export const PERMISSION = {
  SUPER_ADMIN: 10,
  ADMIN: 9,
  PARTNER: 8,
} as const;

export type PermissionLevel = (typeof PERMISSION)[keyof typeof PERMISSION];

// 관리자/파트너 상태
export type ManagerStatus = "승인" | "미승인" | "보류";

// 서비스코드 상태
export type ServiceCodeStatus =
  | "Inactive"
  | "Activation"
  | "Use"
  | "Notused";

// 건강 등급
export type HealthGrade = "SAFE" | "CAUTION" | "WARNING" | "DANGER";

// 성별
export type Gender = 1 | 2; // 1: 남, 2: 여

// SQL 응답
export interface SqlResult {
  fieldCount?: number;
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
  info?: string;
  serverStatus?: number;
  warningStatus?: number;
}

export interface SqlError {
  code?: string;
  errno?: number;
  message?: string;
  sqlState?: string;
  sqlMessage?: string;
}

// 관리자/파트너
export interface ManagerMember {
  idx: number;
  id: string;
  password?: string;
  name: string;
  phone: string;
  organization: string;
  permission: PermissionLevel;
  status: ManagerStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 일반 회원
export interface Member {
  idx: number;
  id: string;
  password?: string;
  name: string;
  gender: Gender;
  phone: string;
  permission: number;
  socialLogin: string | null;
  birthDate: string;
  clauseTotal: number;
  clauseSensitive: number;
  clausePrivate: number;
  clauseMarketing: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  HealthExaminationHistory: string | null;
  inflowPath: string | null;
}

// 건강검진
export interface CheckUp {
  idx: number;
  memberIdx: number;
  date: string;
  institution: string;
  code: string;
  height: number;
  weight: number;
  waistline: number;
  bmi: number;
  visionLeft: number;
  visionRight: number;
  hearingLeft: string;
  hearingRight: string;
  bloodPressureHigh: number;
  bloodPressureLow: number;
  proteinuria: string;
  hemoglobin: number;
  bloodSugar: number;
  totalCholesterol: number;
  hdlCholesterol: number;
  triglycerides: number;
  ldlCholesterol: number;
  creatinine: number;
  gfr: number;
  ast: number;
  alt: number;
  yGtp: number;
  tuberculosis: string;
  osteoporosis: number;
  analysisIdx: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 건강분석
export interface Analysis {
  idx: number;
  memberIdx: number;
  checkUpIdx: number;
  serviceCodeIdx: number;
  surveyIdx: number;
  age: number;
  biologicalAge: number;
  obesityGrade: HealthGrade;
  obesity: number;
  hyperlipidemiaGrade: HealthGrade;
  hyperlipidemia: number;
  highBloodPressureGrade: HealthGrade;
  highBloodPressure: number;
  diabetesGrade: HealthGrade;
  diabetes: number;
  heartDiseaseGrade: HealthGrade;
  heartDisease: number;
  strokeGrade: HealthGrade;
  stroke: number;
  cancerGrade: HealthGrade;
  cancer: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 설문조사
export interface Survey {
  idx: number;
  memberIdx: number;
  height: number;
  weight: number;
  birth: number;
  smoking: number;
  life: number;
  meat: number;
  vegetable: number;
  sleep: number;
  drink: number;
  bloodpressure: number;
  exercise: number;
  diabetes: number;
  cold: number;
  anger: number;
  nerve: number;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  score6: number;
  score7: number;
  score8: number;
  score9: number;
  score10: number;
  score11: number;
  score12: number;
  diff: number;
  age: number;
  healthage: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 서비스코드
export interface ServiceCode {
  idx: number;
  serviceCodeOne: string;
  serviceCodeTwo: string;
  serviceCodeThree: string;
  serviceCodeFull: string;
  service_check: string;
  mb_id: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 챗봇
export interface ChatBot {
  idx: number;
  title: string;
  content: string;
  next: string;
  intro: number;
}

// 약관
export interface Clause {
  idx: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 공지사항
export interface Notice {
  idx: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 질병 설명
export interface DiseaseDescription {
  idx: number;
  title: string;
  description: string;
  factor: string;
  symptom: string;
  prevention: string;
}

// 암 질병 설명
export interface CancerDescription {
  idx: number;
  title: string;
  description: string;
  factor: string;
  symptom: string;
  prevention: string;
}

// 암 발생자 수 (연령대별)
export interface CancerIncidence {
  idx: number;
  title: string;
  total: number;
  teenager: number;
  twenties: number;
  thirties: number;
  forties: number;
  fifties: number;
  sixties: number;
  seventies: number;
  eighties: number;
}

// 암 발생률 (성별별)
export interface CancerIncidenceRate {
  idx: number;
  title: string;
  gender: Gender;
  total: number;
  teenager: number;
  twenties: number;
  thirties: number;
  forties: number;
  fifties: number;
  sixties: number;
  seventies: number;
  eighties: number;
}
