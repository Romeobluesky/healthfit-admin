/* eslint-disable @next/next/no-img-element */

interface ReportCoverCancerProps {
  memberName: string;
  metabolicAge: number;
  cancerListTitles: string[];
}

export default function ReportCoverCancer({ memberName, metabolicAge, cancerListTitles }: ReportCoverCancerProps) {
  return (
    <div style={{ width: "21cm", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute",
        top: "350px",
        left: "95px",
        textAlign: "left",
        color: "rgba(38, 213, 72)",
        fontSize: "1.2em",
        lineHeight: "2em",
      }}>
        {cancerListTitles.map((title) => (
          <p key={title} style={{ margin: 0 }}>+ {title}</p>
        ))}
      </div>
      <div style={{ position: "absolute", top: "460px", left: "349px", color: "#ffffff" }}>
        {memberName} 님의 대사나이는{" "}
        <span style={{ fontSize: "2em", fontWeight: "bold", color: "#d1f310" }}>{metabolicAge}</span>세 입니다.
      </div>
      <div>
        <img src="/report/page_index01.jpg" alt="암 위험도 분석" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
      </div>
    </div>
  );
}
