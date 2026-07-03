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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, FileText, MessageCircleMore, Search, Users, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Download, MapPin, Loader2, MousePointer2, MousePointer2Off, RefreshCw, Calendar, Building2, Route, ClipboardList } from "lucide-react";
import Link from "next/link";
import { memberApi, managerMemberApi, surveyApi, memoCustomerApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isAdmin } from "@/lib/permission";
import { PERMISSION } from "@/types";
import type { Member, ManagerMember, Survey, MemoCustomer } from "@/types";
import { REGIONS, REGION_KEYS } from "@/lib/regions";
import { SMOKING_LABELS, DRINK_LABELS, EXERCISE_LABELS, LIFE_LABELS } from "@/lib/survey-labels";
import SurveyManualEntry from "@/components/survey-manual-entry";
import * as XLSX from "xlsx";

type SelectedIdx = number | null;

export default function CustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<SelectedIdx>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [buttonCheckFilter, setButtonCheckFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchRegion1, setSearchRegion1] = useState("all");
  const [searchRegion2, setSearchRegion2] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyData, setSurveyData] = useState<Survey[] | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyMemberName, setSurveyMemberName] = useState("");
  const [surveyMemberIdx, setSurveyMemberIdx] = useState<number | null>(null);
  const [surveyMemberBirth, setSurveyMemberBirth] = useState<string>("");
  const [surveyEditing, setSurveyEditing] = useState(false);
  const [memo, setMemo] = useState<MemoCustomer | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState("N");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [memoDeleteOpen, setMemoDeleteOpen] = useState(false);
  const [memoCreateOpen, setMemoCreateOpen] = useState(false);
  const [memoUpdateOpen, setMemoUpdateOpen] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoMemberIdxSet, setMemoMemberIdxSet] = useState<Set<number>>(new Set());
  const [buttonCheckMap, setButtonCheckMap] = useState<Map<number, number>>(new Map());
  const [surveyButtonCheck, setSurveyButtonCheck] = useState<number>(0);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region1, setRegion1] = useState("");
  const [region2, setRegion2] = useState("");
  const [inflowPathFilter, setInflowPathFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [partnershipFilter, setPartnershipFilter] = useState("all");
  const [partners, setPartners] = useState<ManagerMember[]>([]);
  const [allManagers, setAllManagers] = useState<ManagerMember[]>([]);
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
    setSurveyMemberBirth(member.birthDate || "");
    setSurveyEditing(false);
    setSurveyData(null);
    setMemo(null);
    setMemoContent("");
    setConsultationStatus(member.ConsultationStatus || "N");
    setRegion1(member.Region1 || "");
    setRegion2(member.Region2 || "");
    setRegionOpen(false);
    setDialogPos({ x: 0, y: 0 });
    setSurveyButtonCheck(0);
    try {
      const data = await surveyApi.getByMember(member.idx);
      setSurveyData(Array.isArray(data) && data.length > 0 ? [data[0]] : []);
    } catch {
      setSurveyData([]);
    } finally {
      setSurveyLoading(false);
    }
    fetchMemo(member.idx);
    try {
      const bc = await memberApi.getButtonCheck(member.idx);
      setSurveyButtonCheck(bc?.buttonCheck ?? 0);
    } catch { setSurveyButtonCheck(0); }
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
    if (!surveyMemberIdx || (!memoContent.trim() && !region1)) return;
    setMemoSaving(true);
    try {
      await Promise.all([
        (async () => {
          await saveRegion();
          if (!memoContent.trim()) { setMembers((prev) => prev.map((m) => m.idx === surveyMemberIdx ? { ...m, Region1: region1 || null, Region2: region2 || null } : m)); return; }
          await memoCustomerApi.create({
            memberIdx: surveyMemberIdx,
            mb_id: user?.id || "",
            memoContent: memoContent.trim(),
          });
          setMembers((prev) => prev.map((m) => m.idx === surveyMemberIdx ? { ...m, Region1: region1 || null, Region2: region2 || null } : m));
          setMemoMemberIdxSet((prev) => new Set(prev).add(surveyMemberIdx));
          fetchMemo(surveyMemberIdx);
        })(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      alert("메모 등록에 실패했습니다.");
    } finally {
      setMemoSaving(false);
    }
  };

  const handleMemoUpdate = async () => {
    if (!memo || !memoContent.trim() || !surveyMemberIdx) return;
    setMemoSaving(true);
    try {
      await Promise.all([
        (async () => {
          await saveRegion();
          await memoCustomerApi.update(memo.idx, { memoContent: memoContent.trim() });
          setMembers((prev) => prev.map((m) => m.idx === surveyMemberIdx ? { ...m, Region1: region1 || null, Region2: region2 || null } : m));
          fetchMemo(surveyMemberIdx);
        })(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      alert("메모 수정에 실패했습니다.");
    } finally {
      setMemoSaving(false);
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
    setMemoDeleteOpen(false);
    setMemoSaving(true);
    try {
      await Promise.all([
        (async () => {
          await memoCustomerApi.delete(memo.idx);
          setMemo(null);
          setMemoContent("");
          if (surveyMemberIdx) setMemoMemberIdxSet((prev) => { const next = new Set(prev); next.delete(surveyMemberIdx); return next; });
        })(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      alert("메모 삭제에 실패했습니다.");
    } finally {
      setMemoSaving(false);
    }
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [data, partnerData] = await Promise.all([
        memberApi.getAll(),
        managerMemberApi.getAll(),
      ]);
      const sorted = data.sort((a: Member, b: Member) => b.idx - a.idx);
      setMembers(sorted);
      if (Array.isArray(partnerData)) {
        setAllManagers(partnerData);
        setPartners(partnerData.filter((p) => !p.deletedAt && p.permission === PERMISSION.PARTNER));
      }
      try {
        const idxList = sorted.map((m) => m.idx);
        if (idxList.length > 0) {
          const result = await memoCustomerApi.checkMembers(idxList);
          if (Array.isArray(result)) {
            setMemoMemberIdxSet(new Set(result.map((r) => r.memberIdx)));
          }
        }
      } catch { /* 메모 체크 실패 무시 */ }
      try {
        const results = await Promise.all(sorted.map((m) => memberApi.getButtonCheck(m.idx).catch(() => null)));
        const map = new Map<number, number>();
        results.forEach((r) => { if (r) map.set(r.idx, r.buttonCheck); });
        setButtonCheckMap(map);
      } catch { /* buttonCheck 조회 실패 무시 */ }
    } catch {
      console.error("회원 목록 조회 실패");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!surveyModalOpen) fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [surveyModalOpen]);

  const handleDelete = async (idx: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await memberApi.delete(idx);
      setMembers((prev) => prev.filter((m) => m.idx !== idx));
      setSelectedRows((prev) => { const next = new Set(prev); next.delete(idx); return next; });
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const toggleSelectRow = (idx: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(idx);
      else next.delete(idx);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const idxList = Array.from(selectedRows);
    if (idxList.length === 0) return;
    setBulkDeleteOpen(false);
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(idxList.map((idx) => memberApi.delete(idx)));
      const deleted = new Set<number>();
      results.forEach((r, i) => { if (r.status === "fulfilled") deleted.add(idxList[i]); });
      setMembers((prev) => prev.filter((m) => !deleted.has(m.idx)));
      setSelectedRows((prev) => { const next = new Set(prev); deleted.forEach((idx) => next.delete(idx)); return next; });
      if (deleted.size < idxList.length) {
        alert(`${idxList.length}건 중 ${deleted.size}건이 삭제되었습니다.`);
      }
    } catch {
      alert("선택 삭제에 실패했습니다.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const partnerMap = useMemo(() => {
    const map = new Map<string, string>();
    partners.forEach((p) => map.set(p.id, p.organization));
    return map;
  }, [partners]);

  // id → ManagerMember 조회 맵 (파트너/협력사 분리 표시용)
  const managerByIdMap = useMemo(() => {
    const map = new Map<string, ManagerMember>();
    allManagers.forEach((m) => map.set(m.id, m));
    return map;
  }, [allManagers]);

  // 협력사(7) 목록 — 관리자는 전체, 파트너는 본인 하부만
  const partnershipList = useMemo(() => {
    const all = allManagers.filter(
      (m) => !m.deletedAt && m.permission === PERMISSION.PARTNERSHIP,
    );
    if (user && user.permission === PERMISSION.PARTNER) {
      return all.filter((m) => m.partnerId === user.id);
    }
    if (partnerFilter !== "all") {
      return all.filter((m) => m.partnerId === partnerFilter);
    }
    return all;
  }, [allManagers, user, partnerFilter]);

  // partnerId 기준으로 파트너명 / 협력사명 분리 반환
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

  // 로그인 사용자가 파트너(8)인 경우 본인 하부 협력사(7) id 집합
  const subPartnershipIds = useMemo(() => {
    if (!user || user.permission !== PERMISSION.PARTNER) return new Set<string>();
    return new Set(
      allManagers
        .filter(
          (p) =>
            !p.deletedAt &&
            p.permission === PERMISSION.PARTNERSHIP &&
            p.partnerId === user.id,
        )
        .map((p) => p.id),
    );
  }, [user, allManagers]);

  const filteredMembers = members.filter((m) => {
    // 관리자(9/10)는 전체, 파트너(8)는 본인+하부 협력사, 협력사(7)는 본인만
    if (user && !isAdmin(user.permission)) {
      if (user.permission === PERMISSION.PARTNER) {
        const ownsDirectly = m.partnerId === user.id;
        const ownsViaSub = m.partnerId ? subPartnershipIds.has(m.partnerId) : false;
        if (!ownsDirectly && !ownsViaSub) return false;
      } else if (m.partnerId !== user.id) {
        return false;
      }
    }

    // 파트너 필터: 선택한 파트너 id + 그 하위 협력사 id 모두 포함
    if (partnerFilter !== "all") {
      if (!m.partnerId) return false;
      const selectedPartnerSubIds = allManagers
        .filter(
          (x) =>
            !x.deletedAt &&
            x.permission === PERMISSION.PARTNERSHIP &&
            x.partnerId === partnerFilter,
        )
        .map((x) => x.id);
      const validIds = new Set<string>([partnerFilter, ...selectedPartnerSubIds]);
      if (!validIds.has(m.partnerId)) return false;
    }

    // 협력사 필터: 선택한 협력사 id 만
    if (partnershipFilter !== "all") {
      if (m.partnerId !== partnershipFilter) return false;
    }

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

    let matchesRegion = true;
    if (searchRegion1 !== "all") {
      matchesRegion = m.Region1 === searchRegion1;
      if (matchesRegion && searchRegion2 !== "all") {
        matchesRegion = m.Region2 === searchRegion2;
      }
    }

    let matchesButtonCheck = true;
    if (buttonCheckFilter !== "all") {
      const bc = buttonCheckMap.get(m.idx) ?? 0;
      matchesButtonCheck = buttonCheckFilter === "1" ? bc === 1 : bc === 0;
    }

    let matchesInflowPath = true;
    if (inflowPathFilter !== "all") {
      matchesInflowPath = (m.inflowPath || "app") === inflowPathFilter;
    }

    return matchesSearch && matchesDate && notDeleted && matchesStatus && matchesRegion && matchesButtonCheck && matchesInflowPath;
  });

  // 건강검진고객: HealthExaminationHistory === "Y"
  const healthCheckMembers = filteredMembers.filter((m) => m.HealthExaminationHistory === "Y");

  const totalPages = Math.max(1, Math.ceil(healthCheckMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return healthCheckMembers.slice(start, start + pageSize);
  }, [healthCheckMembers, currentPage]);

  const isAdminUser = !!user && isAdmin(user.permission);
  const colCount = 14 + (isAdminUser ? 2 : 0);

  // 현재 페이지 전체선택 상태
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, statusFilter, searchRegion1, searchRegion2, buttonCheckFilter, partnerFilter, partnershipFilter, inflowPathFilter]);

  // 필터 변경 시 선택 초기화
  useEffect(() => {
    setSelectedRows(new Set());
  }, [search, startDate, endDate, statusFilter, searchRegion1, searchRegion2, buttonCheckFilter, partnerFilter, partnershipFilter, inflowPathFilter]);

  // 파트너 필터 변경 시 협력사 필터 초기화
  useEffect(() => {
    setPartnershipFilter("all");
  }, [partnerFilter]);

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
    const excelData = healthCheckMembers.map((member) => {
      const info = getPartnerInfo(member.partnerId);
      return {
        등록일: formatDate(member.createdAt),
        파트너: info.partnerName ?? "-",
        협력사: info.partnershipName ?? "-",
        이름: member.name,
        전화번호: formatPhone(member.phone),
        생년월일: member.birthDate || "-",
        성별: member.gender ? formatGender(member.gender) : "-",
        지역1: member.Region1 || "-",
        지역2: member.Region2 || "-",
        요청버튼: buttonCheckMap.get(member.idx) === 1 ? "클릭" : "미클릭",
        유입경로: member.inflowPath === "web" ? "WEB" : "APP",
        상담상태: { N: "대기중", W: "진행중", Y: "완료" }[member.ConsultationStatus || "N"] || "대기중",
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "건강검진고객");
    const partnerLabel = partnerFilter !== "all" ? `_${partnerMap.get(partnerFilter) || partnerFilter}` : "";
    const partnershipLabel = partnershipFilter !== "all"
      ? `_${managerByIdMap.get(partnershipFilter)?.organization || partnershipFilter}`
      : "";
    const dateRange = startDate || endDate
      ? `_${startDate || "시작"}~${endDate || "현재"}`
      : "";
    const statusLabel = statusFilter !== "all" ? `_${{ N: "대기중", W: "진행중", Y: "완료" }[statusFilter]}` : "";
    const regionLabel = searchRegion1 !== "all" ? `_${searchRegion1}${searchRegion2 !== "all" ? ` ${searchRegion2}` : ""}` : "";
    const buttonCheckLabel = buttonCheckFilter !== "all" ? `_${buttonCheckFilter === "1" ? "클릭" : "미클릭"}` : "";
    const inflowPathLabel = inflowPathFilter !== "all" ? `_${inflowPathFilter === "web" ? "WEB" : "APP"}` : "";
    XLSX.writeFile(wb, `건강검진고객${partnerLabel}${partnershipLabel}${dateRange}${regionLabel}${statusLabel}${buttonCheckLabel}${inflowPathLabel}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" />고객관리</h1>
        <p className="text-muted-foreground">건강검진이력이 있는 고객</p>
      </div>

      <div className="space-y-2">
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
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="시작일"
              className="w-34"
            />
            <span className="text-muted-foreground">~</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="종료일"
              className="w-34"
            />
          </div>
          {user && isAdmin(user.permission) && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">파트너</span>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="파트너" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.organization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {user && (isAdmin(user.permission) || user.permission === PERMISSION.PARTNER) && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">협력사</span>
              <Select value={partnershipFilter} onValueChange={setPartnershipFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="협력사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {partnershipList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.organization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">지역</span>
            <Select value={searchRegion1} onValueChange={(v) => { setSearchRegion1(v); setSearchRegion2("all"); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="시/도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {REGION_KEYS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={searchRegion2} onValueChange={setSearchRegion2} disabled={searchRegion1 === "all"}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="시/군/구" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {searchRegion1 !== "all" && REGIONS[searchRegion1]?.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <MousePointer2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">요청버튼</span>
            <Select value={buttonCheckFilter} onValueChange={setButtonCheckFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="요청버튼" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="1">클릭</SelectItem>
                <SelectItem value="0">미클릭</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">유입경로</span>
            <Select value={inflowPathFilter} onValueChange={setInflowPathFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="유입경로" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="web">WEB</SelectItem>
                <SelectItem value="app">APP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExcelDownload} disabled={healthCheckMembers.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>엑셀 다운로드</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={refreshing || surveyModalOpen}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>새로고침</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>건강검진고객 리스트 ({healthCheckMembers.length})</CardTitle>
            {isAdminUser && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={selectedRows.size === 0 || bulkDeleting}
              >
                {bulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                선택삭제{selectedRows.size > 0 ? ` (${selectedRows.size})` : ""}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                {isAdminUser && (
                  <TableHead className="w-10">
                    <Checkbox
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#4a7fb5] data-[state=checked]:border-white"
                      checked={allPageSelected}
                      onCheckedChange={(v) => toggleSelectAllPage(v === true)}
                      aria-label="현재 페이지 전체선택"
                    />
                  </TableHead>
                )}
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">등록일</TableHead>
                <TableHead className="text-white">파트너</TableHead>
                <TableHead className="text-white">협력사</TableHead>
                <TableHead className="text-white">이름</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                <TableHead className="text-white">생년월일</TableHead>
                <TableHead className="text-white">성별</TableHead>
                <TableHead className="text-white">지역</TableHead>
                <TableHead className="text-white">요청버튼</TableHead>
                <TableHead className="text-white">유입경로</TableHead>
                <TableHead className="text-white">상담상태</TableHead>
                <TableHead className="w-24 text-white">설문/상담</TableHead>
                <TableHead className="w-24 text-white">리포트</TableHead>
                {user && isAdmin(user.permission) && (
                  <TableHead className="w-16 text-white">삭제</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : healthCheckMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, index) => {
                  const info = getPartnerInfo(member.partnerId);
                  return (
                  <TableRow key={member.idx} className="cursor-default" data-state={selectedIdx === member.idx ? "selected" : undefined} onClick={() => setSelectedIdx(selectedIdx === member.idx ? null : member.idx)}>
                    {isAdminUser && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(member.idx)}
                          onCheckedChange={(v) => toggleSelectRow(member.idx, v === true)}
                          aria-label={`${member.name} 선택`}
                        />
                      </TableCell>
                    )}
                    <TableCell>{healthCheckMembers.length - ((currentPage - 1) * pageSize + index)}</TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
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
                    <TableCell className="text-xs">
                      {member.Region1 ? `${member.Region1}${member.Region2 ? ` ${member.Region2}` : ""}` : "-"}
                    </TableCell>
                    <TableCell>
                      {buttonCheckMap.get(member.idx) === 1 ? (
                        <MousePointer2 className="h-4 w-4 mx-auto" style={{ color: "#04C6F7" }} />
                      ) : (
                        <MousePointer2Off className="h-4 w-4 mx-auto" style={{ color: "#CCCCCC" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-xs px-2.5 py-0.5 text-[11px] font-normal text-white"
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
                        const cfg = { N: { label: "대기중", bg: "#6b7280", color: "#fff" }, W: { label: "진행중", bg: "#1e3a5f", color: "#fff" }, Y: { label: "완료", bg: "#38bdf8", color: "#000" } }[status] || { label: "대기중", bg: "#6b7280", color: "#fff" };
                        return (
                          <span className="inline-flex w-15 items-center justify-center rounded-xs px-2.5 py-0.5 text-[11px] font-normal" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => handleSurveyView(member)}>
                        <MessageCircleMore className={`h-4 w-4 ${memoMemberIdxSet.has(member.idx) ? "text-blue-500" : ""}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
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
                          className="cursor-pointer text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })
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

      <Dialog open={surveyModalOpen} onOpenChange={setSurveyModalOpen}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto translate-x-0! translate-y-0! ${isDragging ? "duration-0!" : ""}`} style={{ transform: `translate(calc(-50% + ${dialogPos.x}px), calc(-50% + ${dialogPos.y}px))` }} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          {memoSaving && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
          <DialogHeader className="cursor-move select-none" onMouseDown={handleDragStart}>
            <DialogTitle>
              {surveyMemberName}님의 설문결과
              {surveyData && surveyData[0]?.manualInput === 1 && (
                <span className="ml-2 text-sm font-normal text-orange-500">(수동입력)</span>
              )}
            </DialogTitle>
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

          <div className="h-155 overflow-y-auto">
          {surveyLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !surveyData || surveyData.length === 0 ? (
            <SurveyManualEntry
              key={surveyMemberIdx ?? "none"}
              memberIdx={surveyMemberIdx}
              memberName={surveyMemberName}
              defaultBirth={surveyMemberBirth}
              onSaved={async () => {
                if (surveyMemberIdx == null) return;
                setSurveyLoading(true);
                try {
                  const data = await surveyApi.getByMember(surveyMemberIdx);
                  setSurveyData(Array.isArray(data) && data.length > 0 ? [data[0]] : []);
                } catch {
                  setSurveyData([]);
                } finally {
                  setSurveyLoading(false);
                }
              }}
            />
          ) : surveyEditing ? (
            <SurveyManualEntry
              key={`edit-${surveyMemberIdx ?? "none"}`}
              memberIdx={surveyMemberIdx}
              memberName={surveyMemberName}
              editingSurvey={surveyData[0]}
              onCancel={() => setSurveyEditing(false)}
              onSaved={async () => {
                setSurveyEditing(false);
                if (surveyMemberIdx == null) return;
                setSurveyLoading(true);
                try {
                  const data = await surveyApi.getByMember(surveyMemberIdx);
                  setSurveyData(Array.isArray(data) && data.length > 0 ? [data[0]] : []);
                } catch {
                  setSurveyData([]);
                } finally {
                  setSurveyLoading(false);
                }
              }}
            />
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
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">신체정보 / 생활습관</h4>
                        {survey.manualInput === 1 && (
                          <Button size="sm" variant="outline" onClick={() => setSurveyEditing(true)}>
                            다시입력
                          </Button>
                        )}
                      </div>
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
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-semibold">
                    {surveyMemberName}님의 상담내용
                  </h4>
                  <span className="text-xs font-medium" style={{ color: surveyButtonCheck === 1 ? "#04C6F7" : "#CCCCCC" }}>
                    {surveyButtonCheck === 1 ? "분석요청 버튼을 클릭했습니다." : "분석요청 버튼을 클릭하지 않았습니다."}
                  </span>
                </div>

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
                          { value: "W", label: "진행중", color: "text-blue-900" },
                          { value: "Y", label: "완료", color: "text-sky-400" },
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
                          {user && isAdmin(user.permission) && (
                            <Button
                              size="sm"
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => setMemoDeleteOpen(true)}
                            >
                              삭제
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => setMemoUpdateOpen(true)}
                            disabled={!memoContent.trim()}
                          >
                            수정
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setMemoCreateOpen(true)}
                          disabled={!memoContent.trim() && !region1}
                        >
                          등록
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSurveyModalOpen(false)}
                      >
                        닫기
                      </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
          </div>
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택 고객 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedRows.size}건의 고객을 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 text-white hover:bg-red-600">
              삭제
            </AlertDialogAction>
            <AlertDialogCancel>취소</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={memoCreateOpen} onOpenChange={setMemoCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상담내용 등록</AlertDialogTitle>
            <AlertDialogDescription>
              상담내용을 등록하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setMemoCreateOpen(false); handleMemoCreate(); }}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={memoUpdateOpen} onOpenChange={setMemoUpdateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상담내용 수정</AlertDialogTitle>
            <AlertDialogDescription>
              상담내용을 수정하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setMemoUpdateOpen(false); handleMemoUpdate(); }}>
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
