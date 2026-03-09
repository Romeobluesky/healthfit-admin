/**
 * main.php 428-492줄 암 위험도 계산 로직 포팅
 */

import type { Analysis } from "@/types";
import { gradeToPoints, getGradeFromAnalysis } from "./disease-config";

export interface CancerRiskResult {
  title: string;
  sumAverage: number; // 기본 점수
  riskScore: number; // 최종 점수 (나이 가중치 포함)
  circleImage: string; // circle1~4
  arrowImage: string; // state1~4
}

/** 4대 질병 등급 포인트 추출 (비만, 고지혈증, 고혈압, 당뇨병) */
function getConditionPoints(analysis: Analysis): number[] {
  const gradeKeys = [
    "obesityGrade",
    "hyperlipidemiaGrade",
    "highBloodPressureGrade",
    "diabetesGrade",
  ];
  return gradeKeys.map((key) => gradeToPoints(getGradeFromAnalysis(analysis, key)));
}

/** 위험도 점수 → 이미지 결정 */
function getRiskImages(score: number): { circleImage: string; arrowImage: string } {
  if (score <= 2.9) return { circleImage: "circle1", arrowImage: "state1" };
  if (score <= 5.9) return { circleImage: "circle2", arrowImage: "state2" };
  if (score <= 9.9) return { circleImage: "circle3", arrowImage: "state3" };
  return { circleImage: "circle4", arrowImage: "state4" };
}

/** 위험도 점수 → 한글 등급 */
export function riskScoreToGrade(score: number): string {
  if (score <= 2.9) return "정상";
  if (score <= 5.9) return "주의";
  if (score <= 9.9) return "경고";
  return "위험";
}

/** 암종별 위험도 계산 */
export function calculateCancerRisks(
  analysis: Analysis,
  metabolicAge: number,
  realAge: number,
  gender: number,
  cancerTitles: string[]
): CancerRiskResult[] {
  const points = getConditionPoints(analysis);
  const [obesity, hyperlipidemia, highBP, diabetes] = points;

  const ageGap = metabolicAge - realAge;
  const ageGapAddPer = Math.round(ageGap * 0.4 * 10) / 10;

  return cancerTitles.map((title) => {
    let sumAverage: number;

    switch (title) {
      case "갑상선암": {
        sumAverage = parseFloat((obesity / 1).toFixed(1));
        let riskScore = sumAverage + ageGapAddPer;
        if (gender === 1) {
          riskScore = parseFloat((riskScore / 3).toFixed(1));
        }
        const images = getRiskImages(riskScore);
        return { title, sumAverage, riskScore, ...images };
      }
      case "위암":
        sumAverage = parseFloat(((obesity + diabetes) / 2).toFixed(1));
        break;
      case "간암":
        sumAverage = parseFloat((obesity / 1).toFixed(1));
        break;
      case "췌장암":
        sumAverage = parseFloat(((obesity + diabetes) / 2).toFixed(1));
        break;
      case "대장암":
        sumAverage = parseFloat(((obesity + hyperlipidemia) / 2).toFixed(1));
        break;
      case "방광암":
        sumAverage = parseFloat((obesity / 1).toFixed(1));
        break;
      case "전립선암":
        sumAverage = parseFloat(((obesity + highBP + diabetes) / 3).toFixed(1));
        break;
      case "유방암":
        sumAverage = parseFloat(((obesity + hyperlipidemia + highBP + diabetes) / 4).toFixed(1));
        break;
      case "자궁경부암":
        sumAverage = parseFloat(((obesity + hyperlipidemia + highBP + diabetes) / 4).toFixed(1));
        break;
      default:
        sumAverage = 0;
    }

    const riskScore = sumAverage + ageGapAddPer;
    const images = getRiskImages(riskScore);
    return { title, sumAverage, riskScore, ...images };
  });
}
