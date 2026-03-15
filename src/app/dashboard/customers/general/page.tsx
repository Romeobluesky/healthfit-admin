"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, FileText, Search, Users, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Download, MapPin } from "lucide-react";
import { memberApi, surveyApi, memoCustomerApi } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/auth";
import { isAdmin } from "@/lib/permission";
import type { Member, Survey, MemoCustomer } from "@/types";
import { REGIONS, REGION_KEYS } from "@/lib/regions";
import * as XLSX from "xlsx";

type SelectedIdx = number | null;

const SMOKING_LABELS: Record<number, string> = {
  0: "비흡연",
  1: "과거 흡연 (금연 중)",
  2: "현재 흡연 (하루 10개비 미만)",
  4: "현재 흡연 (하루 10개비 이상)",
};

const DRINK_LABELS: Record<number, string> = {
  0: "마시지 않음",
  1: "주 1~2회",
  2: "주 3~4회",
  3: "주 5회 이상",
};

const EXERCISE_LABELS: Record<number, string> = {
  1: "거의 하지 않음",
  0: "주 1~2회",
  [-2]: "주 3~4회",
  [-3]: "주 5회 이상",
};

const LIFE_LABELS: Record<number, string> = {
  1: "거의 하지 않음",
  [-1]: "주 1~2회",
  [-2]: "주 3회 이상",
};

export default function GeneralCustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<SelectedIdx>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyData, setSurveyData] = useState<Survey[] | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyMemberName, setSurveyMemberName] = useState("");
  const [surveyMemberIdx, setSurveyMemberIdx] = useState<number | null>(null);
  const [memo, setMemo] = useState<MemoCustomer | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState("N");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [memoDeleteOpen, setMemoDeleteOpen] = useState(false);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region1, setRegion1] = useState("");
  const [region2, setRegion2] = useState("");
  const pageSize = 10;
  const user = useAuthStore((s) => s.user);

  const dialogPosRef = useRef(dialogPos);
  dialogPosRef.current = dialogPos;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const posX = dialogPosRef.current.x;
    const posY = dialogPosRef.current.y;
    const handleMove = (ev: MouseEvent) => {
      setDialogPos({
        x: posX + (ev.clientX - startX),
        y: posY + (ev.clientY - startY),
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    setIsDragging(true);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, []);

  const fetchMemo = async (memberIdx: number) => {
    setMemoLoading(true);
    try {
      const data = await memoCustomerApi.getByMember(memberIdx);
      const found = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setMemo(found);
      setMemoContent(found?.memoContent || "");
    } catch {
      setMemo(null);
      setMemoContent("");
    } finally {
      setMemoLoading(false);
    }
  };

  const handleSurveyView = async (member: Member) => {
    setSurveyModalOpen(true);
    setSurveyLoading(true);
    setSurveyMemberName(member.name);
    setSurveyMemberIdx(member.idx);
    setSurveyData(null);
    setMemo(null);
    setMemoContent("");
    setConsultationStatus(member.ConsultationStatus || "N");
    setRegion1(member.Region1 || "");
    setRegion2(member.Region2 || "");
    setRegionOpen(false);
    setDialogPos({ x: 0, y: 0 });
    try {
      const data = await surveyApi.getByMember(member.idx);
      setSurveyData(Array.isArray(data) && data.length > 0 ? [data[0]] : []);
    } catch {
      setSurveyData([]);
    } finally {
      setSurveyLoading(false);
    }
    fetchMemo(member.idx);
  };

  const saveRegion = async () => {
    if (!surveyMemberIdx) return;
    try {
      await memberApi.update(surveyMemberIdx, { Region1: region1 || null, Region2: region2 || null });
    } catch {
      // 지역 저장 실패 시 무시 (메모 저장은 계속 진행)
    }
  };

  const handleMemoCreate = async () => {
    if (!surveyMemberIdx || !memoContent.trim()) return;
    try {
      await memoCustomerApi.create({
        memberIdx: surveyMemberIdx,
        mb_id: user?.id || "",
        memoContent: memoContent.trim(),
      });
      fetchMemo(surveyMemberIdx);
    } catch {
      alert("메모 등록에 실패했습니다.");
    }
  };

  const handleMemoUpdate = async () => {
    if (!memo || !memoContent.trim() || !surveyMemberIdx) return;
    try {
      await saveRegion();
      await memoCustomerApi.update(memo.idx, { memoContent: memoContent.trim() });
      setMembers((prev) => prev.map((m) => m.idx === surveyMemberIdx ? { ...m, Region1: region1 || null, Region2: region2 || null } : m));
      fetchMemo(surveyMemberIdx);
    } catch {
      alert("메모 수정에 실패했습니다.");
    }
  };

  const STATUS_LABEL: Record<string, string> = { N: "대기중", W: "진행중", Y: "완료" };

  const handleConsultationStatusChange = (status: string) => {
    if (!surveyMemberIdx || status === consultationStatus) return;
    setPendingStatus(status);
  };

  const confirmConsultationStatusChange = async () => {
    if (!surveyMemberIdx || !pendingStatus) return;
    try {
      await memberApi.updateConsultationStatus(surveyMemberIdx, pendingStatus);
      setConsultationStatus(pendingStatus);
      setMembers((prev) =>
        prev.map((m) =>
          m.idx === surveyMemberIdx ? { ...m, ConsultationStatus: pendingStatus } : m
        )
      );
    } catch {
      alert("상담상태 변경에 실패했습니다.");
    } finally {
      setPendingStatus(null);
    }
  };

  const handleMemoDelete = async () => {
    if (!memo || !surveyMemberIdx) return;
    try {
      await memoCustomerApi.delete(memo.idx);
      setMemo(null);
      setMemoContent("");
    } catch {
      alert("메모 삭제에 실패했습니다.");
    } finally {
      setMemoDeleteOpen(false);
    }
  };

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

    const notDeleted = !m.deletedAt;

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = (m.ConsultationStatus || "N") === statusFilter;
    }

    return matchesSearch && matchesDate && notDeleted && matchesStatus;
  });

  // 일반고객: HealthExaminationHistory !== "Y"
  const generalMembers = filteredMembers.filter((m) => m.HealthExaminationHistory !== "Y");

  const totalPages = Math.max(1, Math.ceil(generalMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return generalMembers.slice(start, start + pageSize);
  }, [generalMembers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, statusFilter]);

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
    const excelData = generalMembers.map((member, index) => ({
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
    XLSX.utils.book_append_sheet(wb, ws, "일반고객");
    const dateRange = startDate || endDate
      ? `_${startDate || "시작"}~${endDate || "현재"}`
      : "";
    const statusLabel = statusFilter !== "all" ? `_${{ N: "대기중", W: "진행중", Y: "완료" }[statusFilter]}` : "";
    XLSX.writeFile(wb, `일반고객${dateRange}${statusLabel}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" />고객관리</h1>
        <p className="text-muted-foreground">일반 고객 관리</p>
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">상담상태</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상담상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="N">대기중</SelectItem>
              <SelectItem value="W">진행중</SelectItem>
              <SelectItem value="Y">완료</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleExcelDownload} disabled={generalMembers.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일반고객 리스트 ({generalMembers.length})</CardTitle>
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
                <TableHead className="text-white">지역</TableHead>
                <TableHead className="text-white">유입경로</TableHead>
                <TableHead className="text-white">상담상태</TableHead>
                <TableHead className="w-24 text-white">설문/상담</TableHead>
                {user && isAdmin(user.permission) && (
                  <TableHead className="w-16 text-white">삭제</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : generalMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, index) => (
                  <TableRow key={member.idx} className="cursor-pointer" data-state={selectedIdx === member.idx ? "selected" : undefined} onClick={() => setSelectedIdx(selectedIdx === member.idx ? null : member.idx)}>
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
                    <TableCell className="text-xs">
                      {member.Region1 ? `${member.Region1}${member.Region2 ? ` ${member.Region2}` : ""}` : "-"}
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
                      {(() => {
                        const status = member.ConsultationStatus || "N";
                        const cfg = { N: { label: "대기중", bg: "#6b7280" }, W: { label: "진행중", bg: "#38bdf8" }, Y: { label: "완료", bg: "#1e3a5f" } }[status] || { label: "대기중", bg: "#6b7280" };
                        return (
                          <span className="inline-flex w-15 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: cfg.bg }}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleSurveyView(member)}>
                        <FileText className="h-4 w-4" />
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

      {generalMembers.length > 0 && (
        <div className="-mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {generalMembers.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, generalMembers.length)}건
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

      <Dialog open={surveyModalOpen} onOpenChange={setSurveyModalOpen}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto translate-x-0! translate-y-0! ${isDragging ? "duration-0!" : ""}`} style={{ transform: `translate(calc(-50% + ${dialogPos.x}px), calc(-50% + ${dialogPos.y}px))` }} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="cursor-move select-none" onMouseDown={handleDragStart}>
            <DialogTitle>{surveyMemberName}님의 설문결과</DialogTitle>
            <div className="flex items-center justify-between">
              <DialogDescription>건강 설문조사 응답 내역입니다.</DialogDescription>
              {surveyData && surveyData.length > 0 && (
                <p className="text-sm text-muted-foreground shrink-0">
                  {surveyData.length > 1
                    ? `설문 1 — ${formatDate(surveyData[0].createdAt)}`
                    : `작성일: ${formatDate(surveyData[0].createdAt)}`}
                </p>
              )}
            </div>
          </DialogHeader>

          {surveyLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">불러오는 중...</p>
            </div>
          ) : !surveyData || surveyData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">설문 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {surveyData.map((survey, i) => {
                const diff = survey.healthage - survey.age;
                return (
                  <div key={survey.idx} className="space-y-4">

                    {/* 생체나이 요약 */}
                    <div className="rounded-lg border p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">실제 나이</p>
                          <p className="text-2xl font-bold">{survey.age}<span className="text-sm font-normal">세</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">생체 나이</p>
                          <p className="text-2xl font-bold text-blue-600">{survey.healthage}<span className="text-sm font-normal">세</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">나이 차이</p>
                          <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-red-500"}`}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}<span className="text-sm font-normal">세</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 신체 정보 */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">신체정보 / 생활습관</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <SurveyItem label="키" value={`${survey.height} cm`} />
                        <SurveyItem label="몸무게" value={`${survey.weight} kg`} />
                        <SurveyItem label="흡연" value={SMOKING_LABELS[survey.smoking] ?? `${survey.smoking}`} />
                        <SurveyItem label="음주" value={DRINK_LABELS[survey.drink] ?? `${survey.drink}`} />
                        <SurveyItem label="유산소운동" value={EXERCISE_LABELS[survey.exercise] ?? `${survey.exercise}`} />
                        <SurveyItem label="근력운동" value={LIFE_LABELS[survey.life] ?? `${survey.life}`} />
                      </div>
                    </div>

                    {i < surveyData.length - 1 && <hr />}
                  </div>
                );
              })}

              {/* 상담내용 (메모) */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  {surveyMemberName}님의 상담내용
                </h4>

                {memoLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">불러오는 중...</p>
                ) : (
                  <div className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{memo ? `${user?.name ?? memo.mb_id}(${memo.mb_id})` : user ? `${user.name}(${user.id})` : ""}</span>
                      {memo && (
                        <span>{formatDate(memo.updatedAt || memo.createdAt)}</span>
                      )}
                    </div>
                    {/* 지역 선택 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1"
                        onClick={() => setRegionOpen(!regionOpen)}
                      >
                        <MapPin className="size-4" />
                        지역선택
                      </Button>
                      {regionOpen ? (
                        <>
                          <Select
                            value={region1}
                            onValueChange={(v) => { setRegion1(v); setRegion2(""); }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="시/도 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {REGION_KEYS.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={region2}
                            onValueChange={setRegion2}
                            disabled={!region1}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="시/군/구 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {region1 && REGIONS[region1]?.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : region1 && (
                        <span className="text-sm font-medium">
                          {region1}{region2 ? ` ${region2}` : ""}
                        </span>
                      )}
                    </div>
                    <Textarea
                      className="min-h-32 max-h-32 overflow-y-auto resize-none"
                      placeholder="상담 내용을 입력하세요..."
                      value={memoContent}
                      onChange={(e) => setMemoContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">상담상태</span>
                        {[
                          { value: "N", label: "대기중", color: "text-gray-500" },
                          { value: "W", label: "진행중", color: "text-sky-400" },
                          { value: "Y", label: "완료", color: "text-blue-900" },
                        ].map((opt) => (
                          <label key={opt.value} className={`flex items-center gap-1 cursor-pointer ${opt.color}`}>
                            <input
                              type="radio"
                              name="consultationStatus"
                              value={opt.value}
                              checked={consultationStatus === opt.value}
                              onChange={() => handleConsultationStatusChange(opt.value)}
                              className="accent-current"
                            />
                            <span className="font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                      {memo ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-black/80"
                            onClick={() => setMemoContent(memo.memoContent)}
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={handleMemoUpdate}
                            disabled={!memoContent.trim()}
                          >
                            수정
                          </Button>
                          {user && isAdmin(user.permission) && (
                            <Button
                              size="sm"
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => setMemoDeleteOpen(true)}
                            >
                              삭제
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={handleMemoCreate}
                          disabled={!memoContent.trim()}
                        >
                          등록
                        </Button>
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상담상태 변경</AlertDialogTitle>
            <AlertDialogDescription>
              상담상태를 &apos;{STATUS_LABEL[pendingStatus || ""] || ""}&apos;(으)로 변경하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConsultationStatusChange}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={memoDeleteOpen} onOpenChange={setMemoDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상담내용 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              상담내용을 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleMemoDelete} className="bg-red-500 text-white hover:bg-red-600">
              삭제
            </AlertDialogAction>
            <AlertDialogCancel>취소</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SurveyItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
