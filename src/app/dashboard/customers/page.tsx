"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Search, Users, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Download } from "lucide-react";
import Link from "next/link";
import { memberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isAdmin } from "@/lib/permission";
import type { Member } from "@/types";
import * as XLSX from "xlsx";

export default function CustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await memberApi.getAll();
        setMembers(data.sort((a: Member, b: Member) => b.idx - a.idx));
      } catch {
        console.error("회원 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const handleDelete = async (idx: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await memberApi.delete(idx);
      setMembers((prev) => prev.filter((m) => m.idx !== idx));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name?.includes(search) ||
      m.phone?.includes(search) ||
      m.birthDate?.includes(search);

    let matchesDate = true;
    if (startDate || endDate) {
      const created = new Date(m.createdAt);
      if (startDate) {
        matchesDate = matchesDate && created >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && created <= end;
      }
    }

    return matchesSearch && matchesDate;
  });

  // 건강검진고객: HealthExaminationHistory === "Y"
  const healthCheckMembers = filteredMembers.filter((m) => m.HealthExaminationHistory === "Y");

  const totalPages = Math.max(1, Math.ceil(healthCheckMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return healthCheckMembers.slice(start, start + pageSize);
  }, [healthCheckMembers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const formatGender = (gender: number) => (gender === 1 ? "남" : "여");

  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  };

  const handleExcelDownload = () => {
    const excelData = healthCheckMembers.map((member, index) => ({
      번호: index + 1,
      이름: member.name,
      전화번호: formatPhone(member.phone),
      생년월일: member.birthDate || "-",
      성별: member.gender ? formatGender(member.gender) : "-",
      유입경로: member.inflowPath === "web" ? "WEB" : "APP",
      등록일: formatDate(member.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "건강검진고객");
    const dateRange = startDate || endDate
      ? `_${startDate || "시작"}~${endDate || "현재"}`
      : "";
    XLSX.writeFile(wb, `건강검진고객${dateRange}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" />고객관리</h1>
        <p className="text-muted-foreground">간편인증 및 일반 고객 관리</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 전화번호, 생년월일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground">~</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button variant="outline" onClick={handleExcelDownload} disabled={healthCheckMembers.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>건강검진고객 리스트 ({healthCheckMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">등록일</TableHead>
                <TableHead className="text-white">이름</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                <TableHead className="text-white">생년월일</TableHead>
                <TableHead className="text-white">성별</TableHead>
                <TableHead className="text-white">유입경로</TableHead>
                <TableHead className="w-24 text-white">리포트보기</TableHead>
                {user && isAdmin(user.permission) && (
                  <TableHead className="w-16 text-white">삭제</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : healthCheckMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, index) => (
                  <TableRow key={member.idx}>
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{formatPhone(member.phone)}</TableCell>
                    <TableCell>{member.birthDate || "-"}</TableCell>
                    <TableCell>
                      {member.gender ? (
                        <span
                          className="inline-flex w-10 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: member.gender === 1 ? "#1964dc" : "#D457D4" }}
                        >
                          {formatGender(member.gender)}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{
                          backgroundColor: member.inflowPath === "web" ? "#6C74E2" : "#9E4E93",
                        }}
                      >
                        {member.inflowPath === "web" ? "WEB" : "APP"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/customers/${member.idx}/report`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                    {user && isAdmin(user.permission) && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.idx)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {healthCheckMembers.length > 0 && (
        <div className="-mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {healthCheckMembers.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, healthCheckMembers.length)}건
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {(() => {
              const pageGroup = Math.floor((currentPage - 1) / 10);
              const startPage = pageGroup * 10 + 1;
              const endPage = Math.min(startPage + 9, totalPages);
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              ));
            })()}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
