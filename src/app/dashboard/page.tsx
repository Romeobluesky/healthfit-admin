"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, ClipboardList, Laptop, Smartphone, LayoutDashboard, CalendarRange, MapPin, PieChart as PieChartIcon } from "lucide-react";
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
import { memberApi, checkUpApi, serverApi } from "@/lib/api";
import { REGION_KEYS } from "@/lib/regions";
import { isAdmin } from "@/lib/permission";
import { useAuthStore } from "@/store/auth";
import type { Member, CheckUp } from "@/types";

interface DashboardStats {
  memberCount: number;
  healthCheckMemberCount: number;
  generalMemberCount: number;
  inflowWebCount: number;
  inflowAppCount: number;
  serverStatus: string;
}

const CHART_COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const PIE_COLORS = [CHART_COLORS.blue, CHART_COLORS.emerald, CHART_COLORS.violet, CHART_COLORS.amber, CHART_COLORS.rose, "#6366f1"];

function getYAxisUnit(maxValue: number) {
  if (maxValue >= 1000) return { divisor: 1000, label: "천" };
  return { divisor: 1, label: "" };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats>({
    memberCount: 0,
    healthCheckMemberCount: 0,
    generalMemberCount: 0,
    inflowWebCount: 0,
    inflowAppCount: 0,
    serverStatus: "확인 중...",
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; members: number; checkUps: number }[]
  >([]);
  const [ageData, setAgeData] = useState<
    { name: string; value: number }[]
  >([]);
  const [regionData, setRegionData] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [members, checkUps, server] =
          await Promise.allSettled([
            memberApi.getAll(),
            checkUpApi.getAll(),
            serverApi.getStatus(),
          ]);

        const allMembers =
          members.status === "fulfilled" ? members.value : [];
        const allCheckUps =
          checkUps.status === "fulfilled" ? checkUps.value : [];

        // 파트너 로그인 시 본인의 고객만 필터링
        const isPartner = user && !isAdmin(user.permission);
        const activeMembersOnly = allMembers.filter((m) => !m.deletedAt);
        const memberList = isPartner
          ? activeMembersOnly.filter((m) => m.partnerId === user.id)
          : activeMembersOnly;
        const memberIdxSet = new Set(memberList.map((m) => m.idx));
        const checkUpList = allCheckUps.filter((c) => memberIdxSet.has(c.memberIdx));

        setStats({
          memberCount: memberList.length,
          healthCheckMemberCount: memberList.filter((m) => m.HealthExaminationHistory === "Y").length,
          generalMemberCount: memberList.filter((m) => m.HealthExaminationHistory === "N").length,
          inflowWebCount: memberList.filter((m) => m.inflowPath === "web").length,
          inflowAppCount: memberList.filter((m) => m.inflowPath !== "web").length,
          serverStatus:
            server.status === "fulfilled" ? "정상" : "연결 실패",
        });

        buildMonthlyChart(memberList, checkUpList);
        buildAgeChart(memberList);
        buildRegionChart(memberList);
      } catch {
        setStats((prev) => ({ ...prev, serverStatus: "오류" }));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

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
      const checkUpCount = new Set(
        checkUpList
          .filter((c) => c.createdAt?.startsWith(yearMonth))
          .map((c) => c.memberIdx)
      ).size;

      months.push({ month: label, members: memberCount, checkUps: checkUpCount });
    }
    setMonthlyData(months);
  }

  function buildAgeChart(memberList: Member[]) {
    const now = new Date();
    const groups: Record<string, number> = {
      "10대": 0, "20대": 0, "30대": 0, "40대": 0, "50대": 0, "60대 이상": 0,
    };

    memberList.forEach((m) => {
      if (!m.birthDate) return;
      const birth = new Date(m.birthDate);
      const age = now.getFullYear() - birth.getFullYear();
      if (age < 20) groups["10대"]++;
      else if (age < 30) groups["20대"]++;
      else if (age < 40) groups["30대"]++;
      else if (age < 50) groups["40대"]++;
      else if (age < 60) groups["50대"]++;
      else groups["60대 이상"]++;
    });

    const data = Object.entries(groups)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
    setAgeData(data);
  }

  function buildRegionChart(memberList: Member[]) {
    const SHORT_NAME: Record<string, string> = {
      서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
      광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
      경기도: "경기", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남",
      전라북도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남",
      제주특별자치도: "제주",
    };
    const regionCount: Record<string, number> = {};
    REGION_KEYS.forEach((r) => (regionCount[r] = 0));
    memberList.forEach((m) => {
      const region = m.Region1?.trim();
      if (!region) return;
      if (regionCount[region] !== undefined) {
        regionCount[region]++;
      }
    });

    const data = Object.entries(regionCount)
      .map(([key, value]) => ({ name: SHORT_NAME[key] || key, value }))
      .sort((a, b) => b.value - a.value);
    setRegionData(data);
  }

  const summaryCards = [
    {
      title: "전체 회원",
      value: stats.memberCount,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      cardBg: "bg-blue-50 dark:bg-blue-500/40",
    },
    {
      title: "건강검진고객",
      value: stats.healthCheckMemberCount,
      icon: FileCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/40",
      cardBg: "bg-emerald-50 dark:bg-emerald-500/40",
    },
    {
      title: "일반고객",
      value: stats.generalMemberCount,
      icon: ClipboardList,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/40",
      cardBg: "bg-violet-50 dark:bg-violet-500/40",
    },
    {
      title: "WEB 유입",
      value: stats.inflowWebCount,
      icon: Laptop,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/40",
      cardBg: "bg-orange-50 dark:bg-orange-500/60",
    },
    {
      title: "APP 유입",
      value: stats.inflowAppCount,
      icon: Smartphone,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/40",
      cardBg: "bg-rose-50 dark:bg-rose-500/40",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><LayoutDashboard className="h-6 w-6" />대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          건강예보:HealthFit 서비스 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 서버 상태 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-xs ${
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`border-0 shadow-sm ${card.cardBg}`}>
            <CardContent className="p-5 py-3">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3.5 ${card.bg}`}>
                  <card.icon className={`h-9 w-9 ${card.color}`} />
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  {loading ? (
                    <div className="h-8 w-16 animate-pulse rounded bg-muted ml-auto" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight">
                      {card.value.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 그래프 영역 - 1행 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 월별 등록 현황 바 차트 */}
        <Card className="border-0 shadow-sm bg-sky-50/50 dark:bg-sky-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-base font-medium"><CalendarRange className="h-4 w-4" />월별 등록 현황</CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">최근 6개월 회원 및 검진 등록 추이</p>
              {(() => {
                const u = getYAxisUnit(Math.max(...monthlyData.map((d) => Math.max(d.members, d.checkUps)), 0));
                return u.label ? <span className="text-xs text-muted-foreground">(단위: {u.label})</span> : null;
              })()}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-70 animate-pulse rounded-lg bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(() => {
                    const u = getYAxisUnit(Math.max(...monthlyData.map((d) => Math.max(d.members, d.checkUps)), 0));
                    return u.divisor > 1
                      ? monthlyData.map((d) => ({ ...d, members: Math.round(d.members / u.divisor * 10) / 10, checkUps: Math.round(d.checkUps / u.divisor * 10) / 10 }))
                      : monthlyData;
                  })()}
                  barGap={4} barSize={20} margin={{ left: -20 }}
                >
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

        {/* 지역별 회원 분포 바 차트 */}
        <Card className="border-0 shadow-sm bg-teal-50/50 dark:bg-teal-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-base font-medium"><MapPin className="h-4 w-4" />지역별 회원 분포</CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">시/도 기준 회원 분포 현황</p>
              {(() => {
                const u = getYAxisUnit(Math.max(...regionData.map((d) => d.value), 0));
                return u.label ? <span className="text-xs text-muted-foreground">(단위: {u.label})</span> : null;
              })()}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-70 animate-pulse rounded-lg bg-muted" />
            ) : regionData.length === 0 ? (
              <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(() => {
                    const u = getYAxisUnit(Math.max(...regionData.map((d) => d.value), 0));
                    return u.divisor > 1
                      ? regionData.map((d) => ({ ...d, value: Math.round(d.value / u.divisor * 10) / 10 }))
                      : regionData;
                  })()}
                  barSize={14} margin={{ left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    interval={0}
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
                    dataKey="value"
                    name="회원 수"
                    fill={CHART_COLORS.emerald}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 나이대 분포 파이 차트 */}
        <Card className="border-0 shadow-sm bg-rose-50/50 dark:bg-rose-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-base font-medium"><PieChartIcon className="h-4 w-4" />나이대 분포</CardTitle>
            <p className="text-xs text-muted-foreground">전체 회원 나이대별 비율</p>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-70 animate-pulse rounded-lg bg-muted" />
            ) : ageData.every((d) => d.value === 0) ? (
              <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={ageData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                    label={({ name, percent, x, y, cx: centerX, cy: centerY }) => {
                      const dx = x - centerX;
                      const dy = y - centerY;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const offset = 18;
                      const nx = x + (dx / dist) * offset;
                      const ny = y + (dy / dist) * offset;
                      return (
                        <text
                          x={nx}
                          y={ny}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fill="var(--color-foreground)"
                        >
                          {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1 }}
                  >
                    {ageData.map((_, index) => (
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
