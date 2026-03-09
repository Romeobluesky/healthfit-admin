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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Search, Users, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { memberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isSuperAdmin } from "@/lib/permission";
import type { Member } from "@/types";

export default function CustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await memberApi.getAll();
        setMembers(data);
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

  const filteredMembers = members.filter(
    (m) =>
      m.name?.includes(search) ||
      m.phone?.includes(search) ||
      m.birthDate?.includes(search)
  );

  // 건강검진고객: HealthExaminationHistory === "Y"
  const healthCheckMembers = filteredMembers.filter((m) => m.HealthExaminationHistory === "Y");

  const totalPages = Math.max(1, Math.ceil(healthCheckMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return healthCheckMembers.slice(start, start + pageSize);
  }, [healthCheckMembers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const formatGender = (gender: number) => (gender === 1 ? "남" : "여");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" />고객관리</h1>
        <p className="text-muted-foreground">간편인증 및 일반 고객 관리</p>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름, 전화번호, 생년월일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                <TableHead className="text-white">이름</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                <TableHead className="text-white">생년월일</TableHead>
                <TableHead className="text-white">성별</TableHead>
                <TableHead className="text-white">등록일</TableHead>
                <TableHead className="w-24 text-white">리포트보기</TableHead>
                {user && isSuperAdmin(user.permission) && (
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
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.birthDate || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.gender ? formatGender(member.gender) : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/customers/${member.idx}/report`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                    {user && isSuperAdmin(user.permission) && (
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
