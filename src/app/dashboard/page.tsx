"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, ClipboardList, KeyRound, Server, TrendingUp, TrendingDown, LayoutDashboard } from "lucide-react";
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
  healthCheckMemberCount: number;
  surveyCount: number;
  serviceCodeCount: number;
  serverStatus: string;
}

const CHART_COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const PIE_COLORS = [CHART_COLORS.blue, CHART_COLORS.rose, CHART_COLORS.amber];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    memberCount: 0,
    healthCheckMemberCount: 0,
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
          healthCheckMemberCount: memberList.filter((m) => m.HealthExaminationHistory === "Y").length,
          surveyCount:
            surveys.status === "fulfilled" ? surveys.value.filter((s) => !s.deletedAt).length : 0,
          serviceCodeCount:
            serviceCodes.status === "fulfilled"
              ? serviceCodes.value.length
              : 0,
          serverStatus:
            server.status === "fulfilled" ? "정상" : "연결 실패",
        });

        buildMonthlyChart(memberList, checkUpList);
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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      cardBg: "bg-blue-50/60 dark:bg-blue-950",
    },
    {
      title: "건강검진고객",
      value: stats.healthCheckMemberCount,
      icon: FileCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      cardBg: "bg-emerald-50/60 dark:bg-emerald-950",
    },
    {
      title: "일반설문조사고객",
      value: stats.surveyCount,
      icon: ClipboardList,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      cardBg: "bg-violet-50/60 dark:bg-violet-950",
    },
    {
      title: "서비스코드",
      value: stats.serviceCodeCount,
      icon: KeyRound,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      cardBg: "bg-amber-50/60 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><LayoutDashboard className="h-6 w-6" />대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          HealthFit 서비스 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 서버 상태 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            stats.serverStatus === "정상"
              ? "bg-emerald-500 animate-pulse"
              : stats.serverStatus === "확인 중..."
                ? "bg-amber-500 animate-pulse"
                : "bg-red-500"
          }`} />
          <span className="text-sm text-muted-foreground">
            API 서버
          </span>
          <Badge
            variant={stats.serverStatus === "정상" ? "secondary" : "destructive"}
            className="text-xs font-normal"
          >
            {stats.serverStatus}
          </Badge>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`border-0 shadow-sm ${card.cardBg}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  {loading ? (
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight">
                      {card.value.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className={`rounded-xl p-3 ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 그래프 영역 */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* 월별 등록 현황 바 차트 */}
        <Card className="lg:col-span-4 border-0 shadow-sm bg-sky-50/50 dark:bg-sky-950/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              월별 등록 현황
            </CardTitle>
            <p className="text-xs text-muted-foreground">최근 6개월 회원 및 검진 등록 추이</p>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-70 animate-pulse rounded-lg bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barGap={4} barSize={20}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="members"
                    name="회원 등록"
                    fill={CHART_COLORS.blue}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="checkUps"
                    name="검진 등록"
                    fill={CHART_COLORS.emerald}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 성별 분포 파이 차트 */}
        <Card className="lg:col-span-3 border-0 shadow-sm bg-rose-50/50 dark:bg-rose-950/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">성별 분포</CardTitle>
            <p className="text-xs text-muted-foreground">전체 회원 성별 비율</p>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-70 animate-pulse rounded-lg bg-muted" />
            ) : genderData.every((d) => d.value === 0) ? (
              <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ name, percent, x, y }) => (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fill="var(--color-foreground)"
                      >
                        {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      </text>
                    )}
                    labelLine={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1 }}
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
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "13px",
                      color: "var(--color-foreground)",
                    }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                    labelStyle={{ color: "var(--color-foreground)" }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "13px", color: "var(--color-foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
