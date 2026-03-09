/* eslint-disable @next/next/no-img-element */
import type { Analysis, Member, CancerDescription, CancerIncidence, CancerIncidenceRate } from "@/types";
import type { CancerRiskResult } from "@/lib/report/cancer-risk";
import ReportHeader from "./report-header";
import ReportFooter from "./report-footer";

interface ReportCancerPageProps {
  analysis: Analysis;
  member: Member;
  cancerTitle: string;
  cancerEngTitle: string;
  riskResult: CancerRiskResult;
  cancerDescription: CancerDescription | null;
  cancerIncidence: CancerIncidence | null;
  cancerIncidenceRate: CancerIncidenceRate | null;
}

const AGE_GROUPS = [
  { key: "twenties", label: "20대", decade: 20 },
  { key: "thirties", label: "30대", decade: 30 },
  { key: "forties", label: "40대", decade: 40 },
  { key: "fifties", label: "50대", decade: 50 },
  { key: "sixties", label: "60대", decade: 60 },
  { key: "seventies", label: "70대", decade: 70 },
  { key: "eighties", label: "80대", decade: 80 },
] as const;

export default function ReportCancerPage({
  analysis,
  member,
  cancerTitle,
  cancerEngTitle,
  riskResult,
  cancerDescription,
  cancerIncidence,
  cancerIncidenceRate,
}: ReportCancerPageProps) {
  const genderStr = member.gender === 1 ? "남성" : "여성";
  const ageDecade = `${String(analysis.age).charAt(0)}0대`;
  const memberDecade = Math.floor(analysis.age / 10) * 10;

  // 발생분율 퍼센트 계산
  const incidenceValues = cancerIncidence
    ? AGE_GROUPS.map((ag) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = ((cancerIncidence as any)[ag.key] as number) || 0;
        const total = cancerIncidence.total || 1;
        return { ...ag, percent: Math.round((raw / total) * 1000) / 10 };
      })
    : [];

  return (
    <div style={{ width: "21cm", margin: "0 auto", color: "#000" }}>
      <div style={{ width: "21cm", minHeight: "29.7cm", backgroundColor: "#fff", padding: "0.5cm" }}>
        {/* 헤더 */}
        <ReportHeader title={cancerTitle} subtitle={`${cancerEngTitle} Cancer`} analysis={analysis} member={member} />

        {/* 섹션 제목 */}
        <div style={{ clear: "both", width: "100%", height: "1.5cm", textAlign: "left", backgroundColor: "#fff", borderBottom: "1mm solid #000", paddingTop: "5mm" }}>
          <span style={{ fontSize: "1.3em", fontWeight: "bold", paddingLeft: "5mm" }}>암 발생 위험 분석 및 관련 통계</span>
          <span style={{ fontSize: "1.2em", paddingLeft: "5mm" }}>Cancer Risk Analysis &amp; Related Statistics</span>
        </div>

        {/* 위험도 표시 영역 (3컬럼) */}
        <div style={{ width: "100%", height: "5cm", background: "#d8e2f6" }}>
          {/* 왼쪽: 원형 아이콘 */}
          <div style={{ float: "left", width: "34%", height: "5cm", padding: "1mm 10mm" }}>
            <img src={`/report/${riskResult.circleImage}.png`} alt={cancerTitle} style={{ height: "180px" }} />
          </div>

          {/* 가운데: 텍스트 */}
          <div style={{ float: "left", width: "36%", height: "5cm", textAlign: "left", lineHeight: "2em" }}>
            <p style={{ paddingTop: "1.2cm" }}>
              {ageDecade} {genderStr} 대비
            </p>
            <p style={{ fontWeight: "bold", fontSize: "1.5em" }}>{cancerTitle} 발생 위험도</p>
            <p style={{ fontWeight: "bold" }}>위험도 10.0p 기준 대비 {riskResult.riskScore}p 입니다.</p>
          </div>

          {/* 오른쪽: 화살표/상태 이미지 */}
          <div style={{ float: "left", width: "30%", height: "5cm" }}>
            <div style={{
              height: "5cm",
              backgroundImage: `url('/report/${riskResult.arrowImage}.png')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "70%",
              backgroundPosition: "center",
              paddingTop: riskResult.arrowImage === "state1" ? "1cm" : "2cm",
            }}>
              <div style={{ textAlign: "center", lineHeight: "1.3cm", fontWeight: "bold", color: "#000", fontSize: "1.4em" }}>
                {riskResult.riskScore}p
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 통계 + 설명 (2컬럼) */}
        <div style={{ clear: "both", width: "100%", height: "17cm", marginTop: "2mm" }}>
          {/* 왼쪽: 차트 영역 */}
          <div style={{ float: "left", width: "39%", height: "17cm" }}>
            {/* 연령대별 발생분율 */}
            <div style={{ fontSize: "0.85em", fontWeight: "bold", marginTop: "3mm" }}>
              】 연령대별 {cancerTitle} 발생분율 (단위:%)
            </div>
            <div style={{ marginTop: "3mm" }}>
              {incidenceValues.map((v) => (
                <div key={v.key} style={{ display: "flex", alignItems: "center", marginBottom: "2mm" }}>
                  <div style={{ width: "15%", textAlign: "right", fontSize: "0.75em", fontWeight: "bold", marginRight: "2mm", flexShrink: 0 }}>
                    {v.label}
                  </div>
                  <div style={{ flex: 1, height: "5mm", backgroundColor: "#e5e7eb", position: "relative", overflow: "visible" }}>
                    <div style={{
                      width: `${Math.min(v.percent * 2, 100)}%`,
                      height: "100%",
                      backgroundColor: "#1555d4",
                    }} />
                    {v.decade === memberDecade && (
                      <span style={{
                        position: "absolute",
                        left: `${Math.min(v.percent * 2, 100)}%`,
                        top: 0,
                        marginLeft: "2px",
                        fontSize: "0.7em",
                        fontWeight: "bold",
                        color: "#1555d4",
                        lineHeight: "5mm",
                        whiteSpace: "nowrap",
                      }}>
                        {v.percent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {/* 하단 축 */}
              <div style={{ display: "flex", paddingLeft: "calc(15% + 2mm)" }}>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "left" }}>0</div>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "center" }}>10</div>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "center" }}>20</div>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "center" }}>30</div>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "center" }}>40</div>
                <div style={{ flex: 1, fontSize: "0.75em", fontWeight: "bold", textAlign: "right" }}>50</div>
              </div>
            </div>

            <div style={{ clear: "both", height: "5mm", background: "#fff" }} />

            {/* 연간 인구 10만명당 발생 */}
            <div style={{ height: "5cm", marginTop: "3mm" }}>
              <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>
                】 연간 인구 10만명당 {cancerTitle} 발생 (단위:명)
              </div>
              <div style={{
                height: "7cm",
                backgroundImage: "url('/report/sample1.png')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "80%",
                backgroundPosition: "center",
                paddingTop: "1cm",
              }}>
                <div style={{ textAlign: "center", fontSize: "1.8em", fontWeight: "bold", lineHeight: "5cm" }}>
                  {cancerIncidenceRate?.total ?? "-"}
                </div>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ float: "left", width: "2%", height: "17cm", background: "#fff", borderRight: "1px solid #000" }} />

          {/* 오른쪽: 설명 영역 */}
          <div style={{ float: "left", width: "57%", height: "17cm", background: "#fff", marginLeft: "3mm", marginTop: "3mm" }}>
            {cancerDescription?.description && (
              <div style={{ height: "auto" }}>
                <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>】 {cancerTitle}이란</div>
                <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#c9fed6", marginTop: "1mm", borderRadius: "1mm", padding: "2mm", whiteSpace: "pre-line" }}>
                  {cancerDescription.description}
                </div>
              </div>
            )}

            {cancerDescription?.factor && (
              <div style={{ height: "auto", marginTop: "4mm" }}>
                <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>】 {cancerTitle} 요인</div>
                <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#9bd5fd", marginTop: "1mm", borderRadius: "1mm", padding: "2mm", whiteSpace: "pre-line" }}>
                  {cancerDescription.factor}
                </div>
              </div>
            )}

            {cancerDescription?.symptom && (
              <div style={{ height: "auto", marginTop: "4mm" }}>
                <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>】 증상 및 징후</div>
                <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#c9fed6", marginTop: "1mm", borderRadius: "1mm", padding: "2mm", whiteSpace: "pre-line" }}>
                  {cancerDescription.symptom}
                </div>
              </div>
            )}

            {cancerDescription?.prevention && (
              <div style={{ height: "auto", marginTop: "4mm" }}>
                <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>】 예방 및 관리</div>
                <div style={{ height: "auto", fontSize: "0.7em", lineHeight: "1.6em", fontWeight: "bold", backgroundColor: "#9bd5fd", marginTop: "1mm", borderRadius: "1mm", padding: "2mm", whiteSpace: "pre-line" }}>
                  {cancerDescription.prevention}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <ReportFooter variant="cancer" />
      </div>
    </div>
  );
}
