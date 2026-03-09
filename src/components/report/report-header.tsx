import type { Analysis, Member } from "@/types";
import { removeSpecialChar } from "@/lib/report/disease-config";
/* eslint-disable @next/next/no-img-element */

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  analysis: Analysis;
  member: Member;
}

export default function ReportHeader({ title, subtitle, analysis, member }: ReportHeaderProps) {
  const registrationNo = `ST${removeSpecialChar(analysis.createdAt)}${analysis.idx}`;
  const genderStr = member.gender === 1 ? "남" : "여";
  const measureDate = analysis.createdAt.split(" ")[0] || analysis.createdAt.split("T")[0];

  return (
    <div style={{ width: "100%", height: "3cm", backgroundColor: "#ffffff" }}>
      {/* 로고 + 제목 */}
      <div style={{ float: "left", width: "60%", height: "3cm", paddingLeft: "5mm", fontWeight: "bold" }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: "5mm" }}>
          <img src="/icon192.png" alt="Logo" style={{ height: "1.2cm", marginRight: "5mm" }} />
          <span style={{ fontSize: "2em" }}>{title}</span>
        </div>
        <p style={{ fontSize: "1em", margin: 0, paddingLeft: "0mm" }}>{subtitle}</p>
      </div>
      {/* 회원 정보 */}
      <div style={{
        float: "left",
        width: "40%",
        height: "2.9cm",
        color: "#ffffff",
        backgroundColor: "#0f75ac",
        borderRadius: "5px",
        fontSize: "0.75em",
        fontWeight: "bold",
        padding: "3mm 5mm",
        boxSizing: "border-box",
      }}>
        <div style={{ fontSize: "1.3em", marginBottom: "2mm" }}>건강예보-Healthfit Medical</div>
        <div style={{ lineHeight: "1.6em" }}>
          <div style={{ display: "flex" }}>
            <span style={{ marginRight: "0.3em" }}>-</span>
            <span style={{ width: "6em" }}>등 록 번 호</span>
            <span>{registrationNo}</span>
          </div>
          <div style={{ display: "flex" }}>
            <span style={{ marginRight: "0.3em" }}>-</span>
            <span style={{ width: "6em" }}>이 름</span>
            <span>{member.name}</span>
          </div>
          <div style={{ display: "flex" }}>
            <span style={{ marginRight: "0.3em" }}>-</span>
            <span style={{ width: "6em" }}>성 별 / 나 이</span>
            <span>{genderStr} / {analysis.age}세</span>
            <span style={{ marginLeft: "1em" }}>측정일 {measureDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
