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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { memberApi, managerMemberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isAdmin } from "@/lib/permission";
import { PERMISSION } from "@/types";
import type { Member, ManagerMember } from "@/types";

export default function DeletedCustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allManagers, setAllManagers] = useState<ManagerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [singleDeleteIdx, setSingleDeleteIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;
  const user = useAuthStore((s) => s.user);
  const isAdminUser = !!user && isAdmin(user.permission);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [data, partnerData] = await Promise.all([
        memberApi.getAll(),
        managerMemberApi.getAll(),
      ]);
      const deleted = (Array.isArray(data) ? data : [])
        .filter((m) => !!m.deletedAt)
        .sort((a, b) => b.idx - a.idx);
      setMembers(deleted);
      if (Array.isArray(partnerData)) setAllManagers(partnerData);
    } catch {
      console.error("삭제회원 목록 조회 실패");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // id → ManagerMember 조회 맵 (파트너/협력사 분리 표시용)
  const managerByIdMap = useMemo(() => {
    const map = new Map<string, ManagerMember>();
    allManagers.forEach((m) => map.set(m.id, m));
    return map;
  }, [allManagers]);

  const getPartnerInfo = (
    partnerId: string | null,
  ): { partnerName: string | null; partnershipName: string | null } => {
    if (!partnerId) return { partnerName: null, partnershipName: null };
    const m = managerByIdMap.get(partnerId);
    if (!m) return { partnerName: partnerId, partnershipName: null };
    if (m.permission === PERMISSION.PARTNER) {
      return { partnerName: m.organization, partnershipName: null };
    }
    if (m.permission === PERMISSION.PARTNERSHIP) {
      const parent = m.partnerId ? managerByIdMap.get(m.partnerId) : null;
      return {
        partnerName: parent?.organization ?? null,
        partnershipName: m.organization,
      };
    }
    return { partnerName: null, partnershipName: null };
  };

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    return (
      m.name?.includes(search) ||
      m.phone?.includes(search) ||
      m.birthDate?.includes(search)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage]);

  const allPageSelected =
    paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedRows.has(m.idx));

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      paginatedMembers.forEach((m) => {
        if (checked) next.add(m.idx);
        else next.delete(m.idx);
      });
      return next;
    });
  };

  const toggleSelectRow = (idx: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(idx);
      else next.delete(idx);
      return next;
    });
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [search]);

  const formatGender = (gender: number) => (gender === 1 ? "남" : "여");

  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  };

  const runPermanentDelete = async (idxList: number[]) => {
    if (idxList.length === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        idxList.map((idx) => memberApi.permanentDelete(idx)),
      );
      const removed = new Set<number>();
      results.forEach((r, i) => {
        if (r.status === "fulfilled") removed.add(idxList[i]);
      });
      setMembers((prev) => prev.filter((m) => !removed.has(m.idx)));
      setSelectedRows((prev) => {
        const next = new Set(prev);
        removed.forEach((idx) => next.delete(idx));
        return next;
      });
      if (removed.size < idxList.length) {
        alert(`${idxList.length}건 중 ${removed.size}건이 완전삭제되었습니다.`);
      }
    } catch {
      alert("완전삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteOpen(false);
    await runPermanentDelete(Array.from(selectedRows));
  };

  const handleSingleDelete = async () => {
    const idx = singleDeleteIdx;
    setSingleDeleteIdx(null);
    if (idx != null) await runPermanentDelete([idx]);
  };

  if (user && !isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">접근 권한이 없습니다.</p>
      </div>
    );
  }

  const colCount = 11;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trash2 className="h-6 w-6" />삭제회원
        </h1>
        <p className="text-muted-foreground">삭제 처리된 회원 (건강검진고객 / 일반고객)</p>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>삭제한 데이타는 복구할 수 없습니다.</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="w-52"
            placeholder="이름, 전화번호, 생년월일..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>새로고침</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>삭제회원 리스트 ({filteredMembers.length})</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={selectedRows.size === 0 || deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              완전삭제{selectedRows.size > 0 ? ` (${selectedRows.size})` : ""}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#4a7fb5] data-[state=checked]:border-white"
                    checked={allPageSelected}
                    onCheckedChange={(v) => toggleSelectAllPage(v === true)}
                    aria-label="현재 페이지 전체선택"
                  />
                </TableHead>
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">삭제일</TableHead>
                <TableHead className="text-white">파트너</TableHead>
                <TableHead className="text-white">협력사</TableHead>
                <TableHead className="text-white">이름</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                <TableHead className="text-white">생년월일</TableHead>
                <TableHead className="text-white">성별</TableHead>
                <TableHead className="text-white">유형</TableHead>
                <TableHead className="w-20 text-white">완전삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8">
                    삭제된 회원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, index) => {
                  const info = getPartnerInfo(member.partnerId);
                  return (
                    <TableRow key={member.idx}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(member.idx)}
                          onCheckedChange={(v) => toggleSelectRow(member.idx, v === true)}
                          aria-label={`${member.name} 선택`}
                        />
                      </TableCell>
                      <TableCell>{filteredMembers.length - ((currentPage - 1) * pageSize + index)}</TableCell>
                      <TableCell>{formatDate(member.deletedAt)}</TableCell>
                      <TableCell style={{ color: "#04C6F7" }}>{info.partnerName ?? "-"}</TableCell>
                      <TableCell style={{ color: "#04C6F7" }}>{info.partnershipName ?? "-"}</TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{formatPhone(member.phone)}</TableCell>
                      <TableCell>{member.birthDate || "-"}</TableCell>
                      <TableCell>
                        {member.gender ? (
                          <span
                            className="inline-flex w-10 items-center justify-center rounded-xs px-2.5 py-0.5 text-[11px] font-normal text-white"
                            style={{ backgroundColor: member.gender === 1 ? "#1964dc" : "#D457D4" }}
                          >
                            {formatGender(member.gender)}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-xs px-2.5 py-0.5 text-[11px] font-normal text-white"
                          style={{ backgroundColor: member.HealthExaminationHistory === "Y" ? "#0f766e" : "#64748b" }}
                        >
                          {member.HealthExaminationHistory === "Y" ? "건강검진" : "일반"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSingleDeleteIdx(member.idx)}
                          disabled={deleting}
                          className="cursor-pointer text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredMembers.length > 0 && (
        <div className="-mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {filteredMembers.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredMembers.length)}건
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택 회원 완전삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedRows.size}건의 회원을 완전삭제하시겠습니까?<br />
              회원 정보와 건강검진·분석·설문 데이터가 모두 삭제되며, 삭제한 데이타는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 text-white hover:bg-red-600">
              완전삭제
            </AlertDialogAction>
            <AlertDialogCancel>취소</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={singleDeleteIdx != null} onOpenChange={(open) => !open && setSingleDeleteIdx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원 완전삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 회원을 완전삭제하시겠습니까?<br />
              회원 정보와 건강검진·분석·설문 데이터가 모두 삭제되며, 삭제한 데이타는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSingleDelete} className="bg-red-500 text-white hover:bg-red-600">
              완전삭제
            </AlertDialogAction>
            <AlertDialogCancel>취소</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
