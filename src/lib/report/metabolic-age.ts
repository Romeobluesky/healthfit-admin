/**
 * MetabolicAge.class.php 포팅
 * Harris-Benedict 공식 기반 대사나이(생물학적 나이) 계산
 */

export interface MetabolicAgeResult {
  age: number; // 대사나이 (생물학적 나이)
  realAge: number; // 실제 나이
}

function calculateIdealWeight(height: number, gender: number): number {
  const heightInInches = height * 0.393700787;
  if (gender === 1) {
    return 50 + 2.3 * (heightInInches - 60);
  }
  return 45.5 + 2.3 * (heightInInches - 60);
}

function calculateIdealBMR(
  idealWeight: number,
  weight: number,
  height: number,
  age: number,
  gender: number
): number {
  const weightFactor = idealWeight + 0.75 * (weight - idealWeight);

  if (gender === 1) {
    return 66 + 13.7 * weightFactor + 5 * height - 6.8 * age;
  }
  return 655 + 9.6 * weightFactor + 1.8 * height - 4.7 * age;
}

export function calculateMetabolicAge(
  weight: number,
  height: number,
  age: number,
  gender: number
): MetabolicAgeResult {
  const idealWeight = calculateIdealWeight(height, gender);
  const idealBMR = calculateIdealBMR(idealWeight, weight, height, age, gender);

  let metabolicAge: number;
  if (gender === 1) {
    metabolicAge = Math.round(
      ((idealBMR - 66 - 13.7 * weight - 5 * height) / -6.8) * 10
    ) / 10;
  } else {
    metabolicAge = Math.round(
      ((idealBMR - 655 - 9.6 * weight - 1.8 * height) / -4.7) * 10
    ) / 10;
  }

  return {
    age: metabolicAge,
    realAge: age,
  };
}
