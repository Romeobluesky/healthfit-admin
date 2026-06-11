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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Handshake, Users, Copy, Check, ImagePlus, X, Loader2 } from "lucide-react";
import { managerMemberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isAdmin, getPermissionLabel } from "@/lib/permission";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PERMISSION } from "@/types";
import type { ManagerMember, ManagerStatus } from "@/types";

export type PartnerManagerType = "partner" | "partnership";

// 배너 이미지 설정
const BANNER_SLOTS = [1, 2, 3, 4, 5];
const ALLOWED_BANNER_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
// DB에는 경로(/uploads/...)만 저장되므로 미리보기 시 백엔드 도메인을 붙인다
const BANNER_HOST = process.env.NEXT_PUBLIC_API_URL || "https://healthfit.autocallup.com";
const toBannerSrc = (pathOrUrl: string) =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `${BANNER_HOST}${pathOrUrl}`;

interface PartnerForm {
  id: string;
  password: string;
  name: string;
  phone: string;
  organization: string;
  permission: number;
  status: ManagerStatus;
  description: string;
  partnerId: string | null;
}

const createEmptyForm = (type: PartnerManagerType): PartnerForm => ({
  id: "",
  password: "",
  name: "",
  phone: "",
  organization: "",
  permission: type === "partner" ? PERMISSION.PARTNER : PERMISSION.PARTNERSHIP,
  status: "미승인",
  description: "",
  partnerId: null,
});

export function PartnerManagerList({ type }: { type: PartnerManagerType }) {
  const isPartnershipMode = type === "partnership";
  const pageTitle = isPartnershipMode ? "협력사 관리" : "파트너 관리";
  const pageDescription = isPartnershipMode
    ? "협력사 계정 관리 — 파트너 하부 계정"
    : "파트너 및 관리자 계정 관리";
  const PageIcon = isPartnershipMode ? Users : Handshake;
  const emptyForm = useMemo(() => createEmptyForm(type), [type]);

  const [partners, setPartners] = useState<ManagerMember[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [idChecked, setIdChecked] = useState(false);
  const [idChecking, setIdChecking] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // 배너 이미지 슬롯(1~5)의 현재 URL. 수정 모드에서만 사용
  const [banners, setBanners] = useState<(string | null)[]>([null, null, null, null, null]);
  const [bannerBusySlot, setBannerBusySlot] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);

  const isAdminUser = user ? isAdmin(user.permission) : false;
  const isPartnerUser = user?.permission === PERMISSION.PARTNER;
  // 파트너 본인이 협력사 페이지를 볼 때는 등록/수정/삭제 불가 (관리자만 생성 가능 정책)
  const canManage = isAdminUser;

  const getPartnerUrl = (id: string): string | null => {
    if (id === "admin") return null;
    const isDev = process.env.NODE_ENV === "development";
    const base = isDev ? "http://localhost:3000" : "https://healthfit-web.autocallup.com";
    return `${base}/?partner=${id}`;
  };

  const handleCopyUrl = async (id: string) => {
    const url = getPartnerUrl(id);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const fetchPartners = async () => {
    try {
      const data = await managerMemberApi.getAll();
      setPartners(data);
    } catch {
      console.error("파트너 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // 페이지/유저 변경 시 폼 초기값 동기화
  useEffect(() => {
    setForm(emptyForm);
  }, [emptyForm]);

  // 현재 페이지에 표시할 목록 — permission 필터 + 파트너 로그인 시 제한
  const visiblePartners = useMemo(() => {
    return partners.filter((p) => {
      if (p.deletedAt) return false;
      if (isPartnershipMode) {
        // 협력사 페이지: 협력사(7)만, 파트너 로그인 시 본인 하부만
        if (p.permission !== PERMISSION.PARTNERSHIP) return false;
        if (isPartnerUser && user && p.partnerId !== user.id) return false;
      } else {
        // 파트너 페이지: 파트너(8)만, 파트너 로그인 시 본인만
        if (p.permission !== PERMISSION.PARTNER) return false;
        if (isPartnerUser && user && p.id !== user.id) return false;
      }
      return true;
    });
  }, [partners, isPartnershipMode, isPartnerUser, user]);

  const openCreateDialog = () => {
    const initialForm = createEmptyForm(type);
    // 협력사 페이지에서 파트너가 등록할 일은 없으나, 관리자가 협력사 등록 시 상위 파트너 미선택 상태
    setForm(initialForm);
    setEditingIdx(null);
    setIdChecked(false);
    setBanners([null, null, null, null, null]);
    setDialogOpen(true);
  };

  const openEditDialog = (partner: ManagerMember) => {
    setForm({
      id: partner.id ?? "",
      password: "",
      name: partner.name ?? "",
      phone: partner.phone ?? "",
      organization: partner.organization ?? "",
      permission: partner.permission,
      status: partner.status,
      description: partner.description ?? "",
      partnerId: partner.partnerId ?? null,
    });
    setBanners([
      partner.imageurl1,
      partner.imageurl2,
      partner.imageurl3,
      partner.imageurl4,
      partner.imageurl5,
    ]);
    setEditingIdx(partner.idx);
    setDialogOpen(true);
  };

  // 배너 슬롯(1~5) 선택 → 즉시 업로드
  const handleBannerSelect = async (slot: number, file: File) => {
    if (!editingIdx) return;
    if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
      showAlert("PNG, JPG, WEBP 형식만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BANNER_SIZE) {
      showAlert("이미지는 5MB 이하만 업로드할 수 있습니다.");
      return;
    }
    setBannerBusySlot(slot);
    try {
      const res = await managerMemberApi.uploadBanner(editingIdx, slot, file);
      setBanners((prev) => prev.map((b, i) => (i === slot - 1 ? res.url : b)));
      // 목록 데이터도 동기화 (재조회 없이 즉시 반영)
      setPartners((prev) =>
        prev.map((p) =>
          p.idx === editingIdx ? { ...p, [`imageurl${slot}`]: res.url } : p,
        ),
      );
    } catch {
      showAlert("이미지 업로드에 실패했습니다.");
    } finally {
      setBannerBusySlot(null);
    }
  };

  // 배너 슬롯(1~5) 삭제
  const handleBannerDelete = async (slot: number) => {
    if (!editingIdx) return;
    setBannerBusySlot(slot);
    try {
      await managerMemberApi.deleteBanner(editingIdx, slot);
      setBanners((prev) => prev.map((b, i) => (i === slot - 1 ? null : b)));
      setPartners((prev) =>
        prev.map((p) =>
          p.idx === editingIdx ? { ...p, [`imageurl${slot}`]: null } : p,
        ),
      );
    } catch {
      showAlert("이미지 삭제에 실패했습니다.");
    } finally {
      setBannerBusySlot(null);
    }
  };

  const handleCheckId = async () => {
    if (!form.id.trim()) {
      showAlert("아이디를 입력해주세요.");
      return;
    }
    setIdChecking(true);
    try {
      const result = await managerMemberApi.checkId(form.id.trim());
      if (result.duplicate) {
        showAlert("이미 사용 중인 아이디입니다.");
        setIdChecked(false);
      } else {
        showAlert("사용 가능한 아이디입니다.");
        setIdChecked(true);
      }
    } catch {
      showAlert("중복체크에 실패했습니다.");
    } finally {
      setIdChecking(false);
    }
  };

  const handleSave = async () => {
    if (!editingIdx && !idChecked) {
      showAlert("아이디 중복체크를 해주세요.");
      return;
    }
    if (form.permission === PERMISSION.PARTNERSHIP && !form.partnerId) {
      showAlert("협력사는 상위 파트너를 선택해주세요.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        partnerId:
          form.permission === PERMISSION.PARTNERSHIP ? form.partnerId : null,
      };
      if (editingIdx) {
        if (!form.password) delete payload.password;
        await managerMemberApi.update(editingIdx, payload as Partial<ManagerMember>);
      } else {
        await managerMemberApi.create(payload as Partial<ManagerMember>);
      }
      setDialogOpen(false);
      fetchPartners();
    } catch {
      showAlert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await managerMemberApi.delete(idx);
      fetchPartners();
    } catch {
      showAlert("삭제에 실패했습니다.");
    }
  };

  const statusBgColor = (status: ManagerStatus) => {
    switch (status) {
      case "승인":
        return "#1964dc";
      case "미승인":
        return "#CCFFFF";
      case "보류":
        return "#D457D4";
      default:
        return "#gray";
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    return phone;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  // 권한 Select 옵션 (모드별)
  const permissionOptions = isPartnershipMode
    ? [{ value: "7", label: "협력사" }]
    : [
        { value: "10", label: "최고관리자" },
        { value: "9", label: "관리자" },
        { value: "8", label: "파트너" },
      ];

  const colSpan = isPartnershipMode ? 11 : 10;
  const emptyMessage = isPartnershipMode
    ? "등록된 협력사가 없습니다."
    : "등록된 파트너가 없습니다.";
  const dialogTitle = editingIdx
    ? `${isPartnershipMode ? "협력사" : "파트너"} 수정`
    : `${isPartnershipMode ? "협력사" : "파트너"} 등록`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <PageIcon className="h-6 w-6" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            등록
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isPartnershipMode ? "협력사 리스트" : "파트너 리스트"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">권한</TableHead>
                <TableHead className="text-white">소속</TableHead>
                <TableHead className="text-white">아이디</TableHead>
                <TableHead className="text-white">담당자</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                {isPartnershipMode && (
                  <TableHead className="text-white">상위 파트너</TableHead>
                )}
                <TableHead className="text-white">랜딩페이지 URL</TableHead>
                <TableHead className="text-white">생성일</TableHead>
                <TableHead className="text-white">상태</TableHead>
                <TableHead className="w-24 text-white">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : visiblePartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-8">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                visiblePartners.map((partner, index) => {
                  const parentPartner =
                    partner.permission === PERMISSION.PARTNERSHIP && partner.partnerId
                      ? partners.find((p) => p.id === partner.partnerId)
                      : null;
                  return (
                    <TableRow
                      key={partner.idx}
                      className="cursor-default"
                      data-state={selectedIdx === partner.idx ? "selected" : undefined}
                      onClick={() => setSelectedIdx(selectedIdx === partner.idx ? null : partner.idx)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{getPermissionLabel(partner.permission)}</TableCell>
                      <TableCell>{partner.organization}</TableCell>
                      <TableCell>{partner.id}</TableCell>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{formatPhone(partner.phone)}</TableCell>
                      {isPartnershipMode && (
                        <TableCell>
                          {parentPartner ? (
                            <span className="text-xs">
                              {parentPartner.organization} ({parentPartner.id})
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {getPartnerUrl(partner.id) ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUrl(partner.id);
                              }}
                            >
                              {copiedId === partner.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getPartnerUrl(partner.id)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(partner.createdAt)}</TableCell>
                      <TableCell>
                        <span
                          className="inline-flex w-15 items-center justify-center rounded-xs px-2.5 py-0.5 text-[11px] font-normal"
                          style={{
                            backgroundColor: statusBgColor(partner.status),
                            color: partner.status === "미승인" ? "#333" : "#fff",
                          }}
                        >
                          {partner.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => openEditDialog(partner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(partner.idx)}
                              className="text-destructive hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingIdx ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>아이디</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.id}
                    onChange={(e) => {
                      setForm({ ...form, id: e.target.value });
                      setIdChecked(false);
                    }}
                    disabled={!!editingIdx}
                  />
                  {!editingIdx && (
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleCheckId}
                      disabled={idChecking || !form.id.trim()}
                    >
                      {idChecking ? "확인 중..." : "중복체크"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  비밀번호{editingIdx ? " (변경 시에만 입력)" : ""}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>전화번호</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>소속</Label>
                <Input
                  value={form.organization}
                  onChange={(e) =>
                    setForm({ ...form, organization: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>담당자</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>권한</Label>
                <Select
                  value={String(form.permission)}
                  onValueChange={(v) => {
                    const nextPermission = Number(v);
                    setForm({
                      ...form,
                      permission: nextPermission,
                      partnerId:
                        nextPermission === PERMISSION.PARTNERSHIP
                          ? form.partnerId
                          : null,
                    });
                  }}
                  disabled={isPartnershipMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as ManagerStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="승인">승인</SelectItem>
                    <SelectItem value="미승인">미승인</SelectItem>
                    <SelectItem value="보류">보류</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.permission === PERMISSION.PARTNERSHIP && (
              <div className="space-y-2">
                <Label>상위 파트너</Label>
                <Select
                  value={form.partnerId ?? ""}
                  onValueChange={(v) => setForm({ ...form, partnerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상위 파트너를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners
                      .filter(
                        (p) =>
                          p.permission === PERMISSION.PARTNER &&
                          !p.deletedAt,
                      )
                      .map((p) => (
                        <SelectItem key={p.idx} value={p.id}>
                          {p.organization} ({p.id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>랜딩페이지 하단 정보</Label>
              <RichTextEditor
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>랜딩페이지 배너 이미지 (최대 5개)</Label>
              {editingIdx ? (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    {BANNER_SLOTS.map((slot) => {
                      const url = banners[slot - 1];
                      const busy = bannerBusySlot === slot;
                      return (
                        <div
                          key={slot}
                          className="relative aspect-square overflow-hidden rounded border bg-muted"
                        >
                          {url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={toBannerSrc(url)}
                                alt={`배너 ${slot}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleBannerDelete(slot)}
                                disabled={busy}
                                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50 cursor-pointer"
                              >
                                {busy ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </button>
                            </>
                          ) : (
                            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-muted-foreground hover:bg-accent">
                              {busy ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <ImagePlus className="h-5 w-5" />
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                disabled={busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleBannerSelect(slot, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP / 각 이미지 최대 5MB · 선택 즉시 저장됩니다.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  배너 이미지는 저장 후 수정 화면에서 등록할 수 있습니다.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
