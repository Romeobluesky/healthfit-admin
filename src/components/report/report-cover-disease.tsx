/* eslint-disable @next/next/no-img-element */

interface ReportCoverDiseaseProps {
  memberName: string;
  biologicalAge: number;
}

export default function ReportCoverDisease({ memberName, biologicalAge }: ReportCoverDiseaseProps) {
  return (
    <div style={{ width: "21cm", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute",
        top: "650px",
        left: "95px",
        textAlign: "left",
        color: "rgba(38, 213, 72)",
        fontSize: "1.2em",
        lineHeight: "2em",
      }}>
        <p style={{ margin: 0 }}>+ 비만</p>
        <p style={{ margin: 0 }}>+ 고지혈증</p>
        <p style={{ margin: 0 }}>+ 고혈압</p>
        <p style={{ margin: 0 }}>+ 당뇨병</p>
        <p style={{ margin: 0 }}>+ 심장병</p>
        <p style={{ margin: 0 }}>+ 뇌졸중</p>
        <p style={{ margin: 0 }}>+ 치매</p>
      </div>
      <div style={{ position: "absolute", top: "440px", left: "99px", color: "#ffffff" }}>
        {memberName} 님의 생체나이는{" "}
        <span style={{ fontSize: "2em", fontWeight: "bold", color: "#d1f310" }}>{biologicalAge}</span>세 입니다.
      </div>
      <div>
        <img src="/report/page_index00.jpg" alt="질병 위험도 분석" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
      </div>
    </div>
  );
}
