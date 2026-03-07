"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  Save,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { clauseApi } from "@/lib/api";
import type { Clause } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    } catch {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" />
            약관 관리
          </h1>
          <p className="text-muted-foreground">
            서비스 약관을 관리합니다.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          약관 추가
        </Button>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            등록된 약관이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clauses.map((clause) => {
            const isOpen = openItems.has(clause.idx);
            const isEditing = editingIdx === clause.idx;

            return (
              <Collapsible
                key={clause.idx}
                open={isOpen}
                onOpenChange={() => toggleItem(clause.idx)}
              >
                <Card>
                  <CardHeader className="p-0">
                    <div className="flex items-center">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-3 px-6 py-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                          <CardTitle className="text-base font-medium">
                            {clause.title}
                          </CardTitle>
                        </button>
                      </CollapsibleTrigger>
                      {!isEditing && (
                        <div className="flex gap-1 mr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(clause);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(clause);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            삭제
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="px-6 pb-6 pt-0">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>제목</Label>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>내용</Label>
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={12}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSave}
                              disabled={saving}
                              size="sm"
                            >
                              {saving ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5 mr-1" />
                              )}
                              {saving ? "저장 중..." : "저장"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={saving}
                              size="sm"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed border rounded-md p-4 bg-muted/30 max-h-96 overflow-y-auto">
                          {clause.content}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>약관 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="약관 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="약관 내용을 입력하세요"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
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

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>약관 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteTarget?.title}</strong> 약관을 삭제하시겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
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
