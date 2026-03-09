"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Pencil,
  ChevronRight,
  Save,
  X,
  Loader2,
  Trash2,
  Clock,
} from "lucide-react";
import { clauseApi } from "@/lib/api";
import type { Clause } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ClausesPage() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Clause | null>(null);

  const fetchClauses = useCallback(async () => {
    try {
      const data = await clauseApi.getAll();
      setClauses(Array.isArray(data) ? data : []);
    } catch {
      setClauses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClauses();
  }, [fetchClauses]);

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const startEdit = (clause: Clause) => {
    setEditingIdx(clause.idx);
    setEditTitle(clause.title);
    setEditContent(clause.content);
    setMessage("");
    if (!openItems.has(clause.idx)) {
      toggleItem(clause.idx);
    }
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditTitle("");
    setEditContent("");
    setMessage("");
  };

  const handleSave = async () => {
    if (editingIdx === null) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await clauseApi.update(editingIdx, {
        title: editTitle,
        content: editContent,
      });
      setMessage("저장되었습니다.");
      setEditingIdx(null);
      fetchClauses();
    } catch (err) {
      console.error("약관 저장 실패:", err);
      setMessage("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setMessage("");
    try {
      await clauseApi.delete(deleteTarget.idx);
      setDeleteTarget(null);
      setMessage("약관이 삭제되었습니다.");
      fetchClauses();
    } catch {
      setMessage("삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setMessage("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await clauseApi.create({ title: newTitle, content: newContent });
      setNewTitle("");
      setNewContent("");
      setCreateOpen(false);
      setMessage("약관이 추가되었습니다.");
      fetchClauses();
    } catch {
      setMessage("추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" />
            약관 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            서비스 약관을 관리합니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          약관 추가
        </Button>
      </div>

      {message && (
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          {message}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : clauses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">등록된 약관이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y overflow-hidden">
          {clauses.map((clause, index) => {
            const isOpen = openItems.has(clause.idx);
            const isEditing = editingIdx === clause.idx;

            return (
              <Collapsible
                key={clause.idx}
                open={isOpen}
                onOpenChange={() => toggleItem(clause.idx)}
              >
                {/* Accordion Header */}
                <div
                  className={`flex items-center transition-colors ${
                    isOpen ? "bg-muted/40" : "hover:bg-muted/30"
                  }`}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 px-4 py-3 text-left min-w-0"
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant="outline"
                          className="shrink-0 font-mono text-[10px] px-1.5"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {clause.title}
                        </span>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    {!isEditing && (
                      <>
                        <span className="hidden sm:flex items-center text-[11px] text-muted-foreground/50 mr-1">
                          <Clock className="h-3 w-3 mr-0.5" />
                          {formatDate(clause.updatedAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(clause);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(clause);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                <CollapsibleContent>
                  <div className="border-t bg-background">
                    {isEditing ? (
                      <div className="p-4 space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">제목</Label>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">내용</Label>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={14}
                            className="font-mono text-xs leading-relaxed resize-y"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className="h-7 text-xs px-3"
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            {saving ? "저장 중..." : "저장"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={saving}
                            size="sm"
                            className="h-7 text-xs px-3"
                          >
                            <X className="h-3 w-3 mr-1" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed font-mono bg-muted/20 rounded-md p-3 max-h-80 overflow-y-auto">
                          {clause.content}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">약관 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">제목</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="약관 제목"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">내용</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="약관 내용을 입력하세요"
                rows={12}
                className="font-mono text-xs leading-relaxed resize-y"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              {saving ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">약관 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong> 약관을
            삭제하시겠습니까?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              {saving ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
