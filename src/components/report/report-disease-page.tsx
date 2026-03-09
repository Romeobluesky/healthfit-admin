/* eslint-disable @next/next/no-img-element */
import type { Analysis, Member, DiseaseDescription } from "@/types";
import { gradeToKorean, getGradeFromAnalysis, getRiskFromAnalysis } from "@/lib/report/disease-config";
import ReportHeader from "./report-header";
import ReportFooter from "./report-footer";

interface ReportDiseasePageProps {
  analysis: Analysis;
  member: Member;
  diseaseTitle: string;
  gradeKey: string;
  riskKey: string;
  riskPercent: string;
  diseaseDescription: DiseaseDescription | null;
}

const GRADES = [
  { label: "정상", image: "/report/circle1.png", bgColor: "#4bf127" },
  { label: "주의", image: "/report/circle2.png", bgColor: "#f8cf09" },
  { label: "경고", image: "/report/circle3.png", bgColor: "#ffa619" },
  { label: "위험", image: "/report/circle4.png", bgColor: "#ff0528" },
] as const;

export default function ReportDiseasePage({
  analysis,
  member,
  diseaseTitle,
  gradeKey,
  riskKey,
  riskPercent,
  diseaseDescription,
}: ReportDiseasePageProps) {
  const grade = gradeToKorean(getGradeFromAnalysis(analysis, gradeKey));
  const riskValue = getRiskFromAnalysis(analysis, riskKey);
  const genderStr = member.gender === 1 ? "남성" : "여성";
  const ageDecade = `${String(analysis.age).charAt(0)}0대`;

  return (
    <div style={{ width: "21cm", margin: "0 auto", color: "#000" }}>
      <div style={{ width: "21cm", minHeight: "29.7cm", backgroundColor: "#fff", padding: "0.5cm" }}>
        {/* 헤더 */}
        <ReportHeader title={diseaseTitle} subtitle={riskKey} analysis={analysis} member={member} />

        {/* 섹션 제목 */}
        <div style={{ clear: "both", width: "100%", height: "1.5cm", textAlign: "left", backgroundColor: "#fff", borderBottom: "1mm solid #000", paddingTop: "5mm" }}>
          <span style={{ fontSize: "1.3em", fontWeight: "bold", paddingLeft: "5mm" }}>위험도 분석 및 관련 통계</span>
          <span style={{ fontSize: "1.2em", paddingLeft: "5mm" }}>Risk Analysis &amp; Related Statistics</span>
        </div>

        {/* 위험도 원형 표시 */}
        <div style={{ width: "100%", height: "auto", backgroundColor: "#fff" }}>
          {/* 원형 아이콘 행 */}
          <div style={{ textAlign: "center", paddingTop: "4mm" }}>
            {GRADES.map((g) => (
              <div key={g.label} style={{ float: "left", width: "25%" }}>
                <img
                  src={g.image}
                  alt={g.label}
                  style={{ height: "140px", opacity: grade === g.label ? 1 : 0.3 }}
                />
              </div>
            ))}
          </div>
          <div style={{ clear: "both" }} />

          {/* 등급별 퍼센트 + 텍스트 행 */}
          <div style={{ textAlign: "center", paddingTop: "4mm" }}>
            {GRADES.map((g) => (
              <div key={g.label} style={{ float: "left", width: "25%" }}>
                <p style={{ fontSize: "1.2em", fontWeight: "bold", marginBottom: "2mm", backgroundColor: g.bgColor }}>
                  {grade === g.label ? `${riskValue}%` : "\u00A0"}
                </p>
                {grade === g.label ? (
                  <p>
                    {ageDecade} {genderStr} 대비<br />
                    {diseaseTitle} 발생 위험도
                  </p>
                ) : (
                  <p>{"\u00A0"}</p>
                )}
              </div>
            ))}
          </div>
          <div style={{ clear: "both" }} />
        </div>

        {/* 구분선 */}
        <div style={{ border: "2px solid #4eb937" }} />
        <div style={{ border: "1px solid #0a6aa1" }} />

        {/* 통계 + 설명 영역 */}
        <div style={{ clear: "both", width: "100%", height: "15cm", marginTop: "0" }}>
          <div style={{ height: "15cm" }}>
            {/* 발생률 통계 바 */}
            <div style={{ width: "100%", height: "1.5cm", background: "#0dcaf0" }}>
              <div style={{
                float: "left", width: "20%", textAlign: "center", fontWeight: "bold",
                fontSize: "1.8em", color: "#fff", lineHeight: "2em", backgroundColor: "#0a6aa1",
              }}>
                {riskPercent}
              </div>
              <div style={{ float: "left", width: "80%" }}>
                <div style={{ fontSize: "0.85em", fontWeight: "bold", lineHeight: "1em", display: "flex", alignItems: "center", paddingTop: "3mm", paddingLeft: "2mm" }}>
                  <img src="/report/info_black.png" alt="" style={{ height: "5mm", marginRight: "2mm" }} />
                  <span>발생률 통계</span>
                </div>
                <div style={{ paddingLeft: "9mm" }}>
                  국내 {genderStr} 전체의 10년 이내{" "}
                  <strong style={{ fontSize: "1em" }}>{diseaseTitle}</strong> 평균 발생률은 {riskPercent} 입니다.
                </div>
              </div>
            </div>
            <div style={{ clear: "both" }} />
            <div style={{ border: "1px solid #0a6aa1" }} />
            <div style={{ border: "2px solid #4eb937" }} />

            {/* 설명글 */}
            {diseaseDescription && (
              <div style={{ width: "100%", background: "#fff", marginTop: "3mm" }}>
                {/* ~이란 */}
                <div style={{ height: "auto" }}>
                  <div style={{ fontSize: "0.85em", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                    <img src="/report/hambuger_black.png" alt="" style={{ height: "4mm", marginRight: "2mm" }} />
                    <span>{diseaseTitle}이란</span>
                  </div>
                  <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#c9fed6", marginTop: "1mm", borderRadius: "1mm", padding: "3mm", whiteSpace: "pre-line" }}>
                    {diseaseDescription.description}
                  </div>
                </div>

                {/* 위험요인 + 증상 및 요인 (2열) */}
                <div style={{ height: "auto", display: "flex" }}>
                  <div style={{ float: "left", width: "50%", height: "auto", marginTop: "4mm", backgroundColor: "#9bd5fd" }}>
                    <div style={{ fontSize: "0.85em", fontWeight: "bold", backgroundColor: "#fff", display: "flex", alignItems: "center" }}>
                      <img src="/report/hambuger_black.png" alt="" style={{ height: "4mm", marginRight: "2mm" }} />
                      <span>위험요인</span>
                    </div>
                    <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", marginTop: "1mm", borderRadius: "1mm", padding: "3mm", whiteSpace: "pre-line" }}>
                      {diseaseDescription.factor}
                    </div>
                  </div>
                  <div style={{ float: "left", width: "50%", height: "auto", marginTop: "4mm", backgroundColor: "#c9fed6" }}>
                    <div style={{ fontSize: "0.85em", fontWeight: "bold", backgroundColor: "#fff", display: "flex", alignItems: "center" }}>
                      <img src="/report/hambuger_black.png" alt="" style={{ height: "4mm", marginRight: "2mm" }} />
                      <span>증상 및 요인</span>
                    </div>
                    <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", marginTop: "1mm", borderRadius: "1mm", padding: "3mm", whiteSpace: "pre-line" }}>
                      {diseaseDescription.symptom}
                    </div>
                  </div>
                </div>
                <div style={{ clear: "both" }} />

                {/* 예방 및 관리 */}
                <div style={{ height: "auto", marginTop: "4mm" }}>
                  <div style={{ fontSize: "0.85em", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                    <img src="/report/hambuger_black.png" alt="" style={{ height: "4mm", marginRight: "2mm" }} />
                    <span>예방 및 관리</span>
                  </div>
                  <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#c9fed6", marginTop: "1mm", borderRadius: "1mm", padding: "3mm", whiteSpace: "pre-line" }}>
                    {diseaseDescription.prevention}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <ReportFooter variant="disease" />
      </div>
    </div>
  );
}
