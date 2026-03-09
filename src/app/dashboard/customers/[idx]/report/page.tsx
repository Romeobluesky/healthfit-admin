"use client";

import { use } from "react";
import ReportPage from "@/components/report/report-page";

export default function CustomerReportPage({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = use(params);
  const memberIdx = parseInt(idx, 10);

  if (isNaN(memberIdx)) {
    return <div className="p-8 text-center text-destructive">잘못된 회원 번호입니다.</div>;
  }

  return <ReportPage memberIdx={memberIdx} />;
}
