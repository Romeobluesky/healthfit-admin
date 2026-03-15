"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, Handshake } from "lucide-react";
import { managerMemberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isAdmin } from "@/lib/permission";
import type { ManagerMember, ManagerStatus } from "@/types";

interface PartnerForm {
  id: string;
  password: string;
  name: string;
  phone: string;
  organization: string;
  permission: number;
  status: ManagerStatus;
}

const emptyForm: PartnerForm = {
  id: "",
  password: "",
  name: "",
  phone: "",
  organization: "",
  permission: 8,
  status: "미승인",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<ManagerMember[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);

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

  const openCreateDialog = () => {
    setForm(emptyForm);
    setEditingIdx(null);
    setDialogOpen(true);
  };

  const openEditDialog = (partner: ManagerMember) => {
    setForm({
      id: partner.id,
      password: "",
      name: partner.name,
      phone: partner.phone,
      organization: partner.organization,
      permission: partner.permission,
      status: partner.status,
    });
    setEditingIdx(partner.idx);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingIdx) {
        const updateData: Record<string, unknown> = { ...form };
        if (!form.password) delete updateData.password;
        await managerMemberApi.update(editingIdx, updateData as Partial<ManagerMember>);
      } else {
        await managerMemberApi.create(form as unknown as Partial<ManagerMember>);
      }
      setDialogOpen(false);
      fetchPartners();
    } catch {
      alert("저장에 실패했습니다.");
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
      alert("삭제에 실패했습니다.");
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Handshake className="h-6 w-6" />파트너관리</h1>
          <p className="text-muted-foreground">파트너 및 관리자 계정 관리</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>파트너 리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">파트너명</TableHead>
                <TableHead className="text-white">아이디</TableHead>
                <TableHead className="text-white">전화번호</TableHead>
                <TableHead className="text-white">소속</TableHead>
                <TableHead className="text-white">생성일</TableHead>
                <TableHead className="text-white">상태</TableHead>
                <TableHead className="w-24 text-white">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    등록된 파트너가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner, index) => (
                  <TableRow key={partner.idx} className="cursor-pointer" data-state={selectedIdx === partner.idx ? "selected" : undefined} onClick={() => setSelectedIdx(selectedIdx === partner.idx ? null : partner.idx)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {partner.name}
                    </TableCell>
                    <TableCell>{partner.id}</TableCell>
                    <TableCell>{partner.phone}</TableCell>
                    <TableCell>{partner.organization}</TableCell>
                    <TableCell>{formatDate(partner.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex w-15 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: statusBgColor(partner.status),
                          color: partner.status === "미승인" ? "#333" : "#fff",
                        }}
                      >
                        {partner.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(partner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user && isAdmin(user.permission) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(partner.idx)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIdx ? "파트너 수정" : "파트너 등록"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>아이디</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!!editingIdx}
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>권한</Label>
                <Select
                  value={String(form.permission)}
                  onValueChange={(v) =>
                    setForm({ ...form, permission: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">최고관리자</SelectItem>
                    <SelectItem value="9">관리자</SelectItem>
                    <SelectItem value="8">파트너</SelectItem>
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
    </div>
  );
}
