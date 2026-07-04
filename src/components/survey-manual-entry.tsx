"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { surveyApi } from "@/lib/api";
import type { Survey } from "@/types";
import {
  SURVEY_INPUT_FIELDS,
  calculateAgeFromBirth,
  calculateHealthage,
  birthToNumber,
  toDateInputValue,
  type SurveyInputField,
} from "@/lib/survey-input";

type ScoreKey = SurveyInputField["key"];

interface SurveyManualEntryProps {
  memberIdx: number | null;
  memberName: string;
  defaultBirth?: string | null;
  /** 제공 시 "다시입력"(수정) 모드로 동작 — 기존 설문 행을 덮어쓴다 */
  editingSurvey?: Survey | null;
  onSaved: () => void;
  onCancel?: () => void;
}

/**
 * 간편인증 변심으로 survey 저장이 누락된 고객의 설문을 관리자가 직접 입력.
 * 신체정보/생활습관 입력 시 실제나이·생체나이를 즉시 계산하고, 저장하면 POST /survey.
 * editingSurvey 가 주어지면 기존 행을 PUT 으로 덮어써 잘못 입력을 정정한다.
 * 계산·저장 방식은 healthfit-web 간편인증 플로우(서버 재계산 경로 A)와 동일.
 */
export default function SurveyManualEntry({
  memberIdx,
  memberName,
  defaultBirth,
  editingSurvey,
  onSaved,
  onCancel,
}: SurveyManualEntryProps) {
  const isEditing = editingSurvey != null;

  const [birth, setBirth] = useState<string>(() =>
    isEditing ? toDateInputValue(String(editingSurvey!.birth ?? "")) : toDateInputValue(defaultBirth)
  );
  const [height, setHeight] = useState<string>(() =>
    isEditing && editingSurvey!.height != null ? String(editingSurvey!.height) : ""
  );
  const [weight, setWeight] = useState<string>(() =>
    isEditing && editingSurvey!.weight != null ? String(editingSurvey!.weight) : ""
  );
  const [scores, setScores] = useState<Partial<Record<ScoreKey, number>>>(() =>
    isEditing
      ? {
          smoking: editingSurvey!.smoking,
          drink: editingSurvey!.drink,
          exercise: editingSurvey!.exercise,
          life: editingSurvey!.life,
        }
      : {}
  );
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const age = useMemo(() => calculateAgeFromBirth(birth), [birth]);
  const allScoresSelected = SURVEY_INPUT_FIELDS.every((f) => scores[f.key] != null);

  const healthage = useMemo(() => {
    if (age == null || !allScoresSelected) return null;
    return calculateHealthage(age, {
      smoking: scores.smoking!,
      drink: scores.drink!,
      exercise: scores.exercise!,
      life: scores.life!,
    });
  }, [age, allScoresSelected, scores]);

  const diff = age != null && healthage != null ? healthage - age : null;

  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const canSave =
    memberIdx != null &&
    age != null &&
    healthage != null &&
    Number.isFinite(heightNum) &&
    heightNum > 0 &&
    Number.isFinite(weightNum) &&
    weightNum > 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSave || age == null || healthage == null || memberIdx == null) return;
    setSaving(true);
    try {
      const payload: Partial<Survey> = {
        memberIdx,
        height: heightNum,
        weight: weightNum,
        birth: birthToNumber(birth) ?? undefined,
        age,
        smoking: scores.smoking,
        drink: scores.drink,
        exercise: scores.exercise,
        life: scores.life,
        healthage,
        manualInput: 1, // 관리자 수동 입력 표시
      };
      if (isEditing) {
        await surveyApi.update(editingSurvey!.idx, payload);
      } else {
        await surveyApi.create(payload);
      }
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <p className="text-sm text-muted-foreground">
          입력한 설문 내용을 다시 입력해 수정합니다. 저장하면 기존 내용을 덮어씁니다.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          저장된 설문이 없습니다. (간편인증 단계에서 고객 변심으로 취소된 고객) 아래 정보를 입력하면
          실제나이·생체나이를 계산해 설문을 저장할 수 있습니다.
        </p>
      )}

      {/* 생체나이 요약 (입력값 기반 실시간 계산) */}
      <div className="rounded-lg border p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">실제 나이</p>
            <p className="text-2xl font-bold">
              {age != null ? age : "—"}
              {age != null && <span className="text-sm font-normal">세</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">생체 나이</p>
            <p className="text-2xl font-bold text-blue-600">
              {healthage != null ? healthage : "—"}
              {healthage != null && <span className="text-sm font-normal">세</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">나이 차이</p>
            {diff != null ? (
              <p
                className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {diff > 0 ? "+" : ""}
                {diff.toFixed(1)}
                <span className="text-sm font-normal">세</span>
              </p>
            ) : (
              <p className="text-2xl font-bold">—</p>
            )}
          </div>
        </div>
      </div>

      {/* 신체 정보 / 생활습관 입력 */}
      <div>
        <h4 className="text-sm font-semibold mb-2">신체정보 / 생활습관</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* 생년월일 */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground shrink-0">생년월일</span>
            <Input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="h-8 w-40 bg-background"
            />
          </div>
          {/* 키 */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground shrink-0">키 (cm)</span>
            <Input
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="예: 170"
              className="h-8 w-28 bg-background text-right"
            />
          </div>
          {/* 몸무게 */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground shrink-0">몸무게 (kg)</span>
            <Input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="예: 65"
              className="h-8 w-28 bg-background text-right"
            />
          </div>
          {/* 생활습관 셀렉트 */}
          {SURVEY_INPUT_FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
            >
              <span className="text-sm text-muted-foreground shrink-0">{field.label}</span>
              <Select
                value={scores[field.key] != null ? String(scores[field.key]) : undefined}
                onValueChange={(v) =>
                  setScores((prev) => ({ ...prev, [field.key]: Number(v) }))
                }
              >
                <SelectTrigger className="h-8 w-32 bg-background">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {/* 저장 / 취소 (8번째 셀) */}
          <div className="flex items-stretch gap-2">
            {isEditing && onCancel && (
              <Button size="sm" variant="outline" className="h-full! flex-1" onClick={onCancel} disabled={saving}>
                취소
              </Button>
            )}
            <Button
              size="sm"
              className="h-full! flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!canSave}
              onClick={() => setConfirmOpen(true)}
            >
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isEditing ? "수정 저장" : "설문 저장"}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditing ? "설문 수정" : "설문 저장"}</AlertDialogTitle>
            <AlertDialogDescription>
              {memberName}님의 설문을 입력한 내용으로 {isEditing ? "수정" : "저장"}하시겠습니까?
              (실제나이 {age}세 · 생체나이 {healthage}세)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                handleSave();
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
