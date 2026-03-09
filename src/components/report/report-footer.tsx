/* eslint-disable @next/next/no-img-element */

interface ReportFooterProps {
  variant?: "disease" | "cancer";
}

export default function ReportFooter({ variant = "cancer" }: ReportFooterProps) {
  const marginTop = variant === "disease" ? "1mm" : "2mm";

  return (
    <div
      style={{
        clear: "both",
        width: "100%",
        height: "1.7cm",
        backgroundColor: "#0a6aa1",
        marginTop,
        fontSize: "0.7em",
        color: "#93d398",
        lineHeight: "2cm",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <div style={{ width: "70%", lineHeight: "5mm", paddingLeft: "4mm" }}>
          정보수집처.<br />
          국민건강보험공단 / 보건복지부공공데이타(KOSIS) / 국제 SCI 논문 및 연구보고서 메타분석
        </div>
        <div style={{ width: "30%", paddingRight: "4mm", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <img src="/icon192.png" alt="Logo" style={{ height: "7mm" }} />
        </div>
      </div>
    </div>
  );
}
