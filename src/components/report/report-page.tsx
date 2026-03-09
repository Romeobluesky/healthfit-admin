"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Member, Analysis, CheckUp, DiseaseDescription, CancerDescription, CancerIncidence, CancerIncidenceRate } from "@/types";
import {
  memberApi,
  analysisApi,
  checkUpApi,
  diseaseDescriptionApi,
  cancerDescriptionApi,
  cancerIncidenceApi,
  cancerIncidenceRateApi,
} from "@/lib/api";
import { DISEASE_LIST, getCancerList } from "@/lib/report/disease-config";
import { calculateCancerRisks, type CancerRiskResult } from "@/lib/report/cancer-risk";
import ReportCoverDisease from "./report-cover-disease";
import ReportDiseasePage from "./report-disease-page";
import ReportCoverCancer from "./report-cover-cancer";
import ReportCancerPage from "./report-cancer-page";

interface ReportPageProps {
  memberIdx: number;
}

export default function ReportPage({ memberIdx }: ReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [member, setMember] = useState<Member | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [checkUp, setCheckUp] = useState<CheckUp | null>(null);
  const [diseaseDescriptions, setDiseaseDescriptions] = useState<Record<string, DiseaseDescription>>({});
  const [cancerDescriptions, setCancerDescriptions] = useState<Record<string, CancerDescription>>({});
  const [cancerIncidences, setCancerIncidences] = useState<Record<string, CancerIncidence>>({});
  const [cancerIncidenceRates, setCancerIncidenceRates] = useState<Record<string, CancerIncidenceRate>>({});
  const [cancerRisks, setCancerRisks] = useState<CancerRiskResult[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. 회원 + 분석 데이터 가져오기
        const [memberData, analyses] = await Promise.all([
          memberApi.getById(memberIdx),
          analysisApi.getByMember(memberIdx),
        ]);

        if (!memberData) throw new Error("회원 정보를 찾을 수 없습니다.");
        if (!analyses || analyses.length === 0) throw new Error("분석 데이터가 없습니다.");

        setMember(memberData);

        // 가장 최근 분석 사용
        const latestAnalysis = analyses[analyses.length - 1];
        setAnalysis(latestAnalysis);

        // 2. 검진 데이터 (height/weight) 가져오기
        if (latestAnalysis.checkUpIdx) {
          const checkUpData = await checkUpApi.getById(latestAnalysis.checkUpIdx);
          setCheckUp(checkUpData);
        }

        // 3. biologicalAge는 analysis에서 직접 사용
        const bioAge = latestAnalysis.biologicalAge;
        const realAge = latestAnalysis.age;

        // 4. 질병 설명 병렬 페칭
        const diseaseDescPromises = DISEASE_LIST.map((d) =>
          diseaseDescriptionApi.getByTitle(d.title).catch(() => null)
        );

        // 5. 암 관련 데이터 병렬 페칭
        const cancerList = getCancerList(memberData.gender);
        const cancerTitles = cancerList.map((c) => c.title);

        const cancerDescPromises = cancerTitles.map((t) =>
          cancerDescriptionApi.getByTitle(t).catch(() => null)
        );
        const cancerIncPromises = cancerTitles.map((t) =>
          cancerIncidenceApi.getByTitle(t).catch(() => null)
        );
        const cancerRatePromises = cancerTitles.map((t) =>
          cancerIncidenceRateApi.getByTitle(t).catch(() => null)
        );

        const [diseaseDescs, cancerDescs, cancerIncs, cancerRates] = await Promise.all([
          Promise.all(diseaseDescPromises),
          Promise.all(cancerDescPromises),
          Promise.all(cancerIncPromises),
          Promise.all(cancerRatePromises),
        ]);

        // 질병 설명 맵
        const ddMap: Record<string, DiseaseDescription> = {};
        DISEASE_LIST.forEach((d, i) => {
          if (diseaseDescs[i]) ddMap[d.title] = diseaseDescs[i]!;
        });
        setDiseaseDescriptions(ddMap);

        // 암 설명 맵
        const cdMap: Record<string, CancerDescription> = {};
        const ciMap: Record<string, CancerIncidence> = {};
        const crMap: Record<string, CancerIncidenceRate> = {};
        cancerTitles.forEach((t, i) => {
          if (cancerDescs[i]) cdMap[t] = cancerDescs[i]!;
          if (cancerIncs[i]) ciMap[t] = cancerIncs[i]!;
          if (cancerRates[i]) crMap[t] = cancerRates[i]!;
        });
        setCancerDescriptions(cdMap);
        setCancerIncidences(ciMap);
        setCancerIncidenceRates(crMap);

        // 6. 암 위험도 계산
        const risks = calculateCancerRisks(
          latestAnalysis,
          bioAge,
          realAge,
          memberData.gender,
          cancerTitles
        );
        setCancerRisks(risks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [memberIdx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">리포트 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !member || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-destructive">{error || "데이터를 불러올 수 없습니다."}</p>
        <Button asChild>
          <Link href="/dashboard/customers">돌아가기</Link>
        </Button>
      </div>
    );
  }

  const cancerList = getCancerList(member.gender);

  return (
    <div>
      {/* 컨트롤 바 (인쇄 시 숨김) */}
      <div className="no-print sticky top-0 z-50 flex items-center gap-4 bg-background p-4 border-b">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Link>
        </Button>
        <Button size="sm" onClick={() => {
          const originalTitle = document.title;
          const date = (analysis.createdAt.split(" ")[0] || analysis.createdAt.split("T")[0]).replace(/-/g, "");
          document.title = `${member.name}_건강리포트_${date}`;
          window.print();
          document.title = originalTitle;
        }}>
          <Printer className="h-4 w-4 mr-2" />
          인쇄 / PDF 저장
        </Button>
        <span className="text-sm text-muted-foreground">
          {member.name} 님의 건강분석 리포트
        </span>
      </div>

      {/* 리포트 본문 */}
      <div className="report-container">
        {/* 섹션 1: 질병 위험도 분석 */}
        <ReportCoverDisease
          memberName={member.name}
          biologicalAge={analysis.biologicalAge}
        />

        {DISEASE_LIST.map((disease) => (
          <ReportDiseasePage
            key={disease.title}
            analysis={analysis}
            member={member}
            diseaseTitle={disease.title}
            gradeKey={disease.gradeKey}
            riskKey={disease.riskKey}
            riskPercent={disease.riskPercent}
            diseaseDescription={diseaseDescriptions[disease.title] || null}
          />
        ))}

        {/* 섹션 2: 암 위험도 분석 */}
        <ReportCoverCancer
          memberName={member.name}
          metabolicAge={analysis.biologicalAge}
          cancerListTitles={cancerList.map((c) => c.title)}
        />

        {cancerList.map((cancer) => {
          const riskResult = cancerRisks.find((r) => r.title === cancer.title);
          if (!riskResult) return null;

          return (
            <ReportCancerPage
              key={cancer.title}
              analysis={analysis}
              member={member}
              cancerTitle={cancer.title}
              cancerEngTitle={cancer.engTitle}
              riskResult={riskResult}
              cancerDescription={cancerDescriptions[cancer.title] || null}
              cancerIncidence={cancerIncidences[cancer.title] || null}
              cancerIncidenceRate={cancerIncidenceRates[cancer.title] || null}
            />
          );
        })}
      </div>
    </div>
  );
}
