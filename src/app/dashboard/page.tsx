"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, ClipboardList, KeyRound, Server } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { memberApi, checkUpApi, surveyApi, serviceCodeApi, serverApi } from "@/lib/api";
import type { Member, CheckUp } from "@/types";

interface DashboardStats {
  memberCount: number;
  checkUpCount: number;
  surveyCount: number;
  serviceCodeCount: number;
  serverStatus: string;
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    memberCount: 0,
    checkUpCount: 0,
    surveyCount: 0,
    serviceCodeCount: 0,
    serverStatus: "확인 중...",
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; members: number; checkUps: number }[]
  >([]);
  const [genderData, setGenderData] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [members, checkUps, surveys, serviceCodes, server] =
          await Promise.allSettled([
            memberApi.getAll(),
            checkUpApi.getAll(),
            surveyApi.getAll(),
            serviceCodeApi.getAll(),
            serverApi.getStatus(),
          ]);

        const memberList =
          members.status === "fulfilled" ? members.value : [];
        const checkUpList =
          checkUps.status === "fulfilled" ? checkUps.value : [];

        setStats({
          memberCount: memberList.length,
          checkUpCount: checkUpList.length,
          surveyCount:
            surveys.status === "fulfilled" ? surveys.value.length : 0,
          serviceCodeCount:
            serviceCodes.status === "fulfilled"
              ? serviceCodes.value.length
              : 0,
          serverStatus:
            server.status === "fulfilled" ? "정상" : "연결 실패",
        });

        // 월별 등록 현황 (최근 6개월)
        buildMonthlyChart(memberList, checkUpList);

        // 성별 분포
        buildGenderChart(memberList);
      } catch {
        setStats((prev) => ({ ...prev, serverStatus: "오류" }));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  function buildMonthlyChart(memberList: Member[], checkUpList: CheckUp[]) {
    const now = new Date();
    const months: { month: string; members: number; checkUps: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${d.getMonth() + 1}월`;

      const memberCount = memberList.filter((m) =>
        m.createdAt?.startsWith(yearMonth)
      ).length;
      const checkUpCount = checkUpList.filter((c) =>
        c.createdAt?.startsWith(yearMonth)
      ).length;

      months.push({ month: label, members: memberCount, checkUps: checkUpCount });
    }
    setMonthlyData(months);
  }

  function buildGenderChart(memberList: Member[]) {
    const male = memberList.filter((m) => m.gender === 1).length;
    const female = memberList.filter((m) => m.gender === 2).length;
    const unknown = memberList.length - male - female;

    const data = [
      { name: "남성", value: male },
      { name: "여성", value: female },
    ];
    if (unknown > 0) data.push({ name: "미지정", value: unknown });
    setGenderData(data);
  }

  const summaryCards = [
    {
      title: "전체 회원",
      value: stats.memberCount,
      icon: Users,
      description: "등록된 전체 회원 수",
    },
    {
      title: "건강검진",
      value: stats.checkUpCount,
      icon: FileCheck,
      description: "전체 검진 기록 수",
    },
    {
      title: "설문조사",
      value: stats.surveyCount,
      icon: ClipboardList,
      description: "전체 설문 응답 수",
    },
    {
      title: "서비스코드",
      value: stats.serviceCodeCount,
      icon: KeyRound,
      description: "발급된 서비스코드 수",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">HealthFit 관리자 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">
                  {card.value.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 그래프 영역 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 월별 등록 현황 바 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              월별 등록 현황 (최근 6개월)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-75 animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Bar
                    dataKey="members"
                    name="회원 등록"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="checkUps"
                    name="검진 등록"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 성별 분포 파이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">회원 성별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-75 animate-pulse rounded bg-muted" />
            ) : genderData.every((d) => d.value === 0) ? (
              <div className="flex h-75 items-center justify-center text-muted-foreground">
                데이터가 없습니다.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(props) =>
                      `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {genderData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 서버 상태 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">서버 상태</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                stats.serverStatus === "정상" ? "default" : "destructive"
              }
            >
              {stats.serverStatus}
            </Badge>
            <span className="text-sm text-muted-foreground">
              API 서버 (healthfit.autocallup.com)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
