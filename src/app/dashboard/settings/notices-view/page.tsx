"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ChevronRight, Loader2, Clock } from "lucide-react";
import { noticeApi } from "@/lib/api";
import type { Notice } from "@/types";
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

export default function NoticesViewPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const fetchNotices = useCallback(async () => {
    try {
      const data = await noticeApi.getAll();
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Megaphone className="h-6 w-6" />
          공지사항
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          공지사항을 확인할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Megaphone className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y overflow-hidden">
          {notices.map((notice, index) => {
            const isOpen = openItems.has(notice.idx);

            return (
              <Collapsible
                key={notice.idx}
                open={isOpen}
                onOpenChange={() => toggleItem(notice.idx)}
              >
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
                          {notice.title}
                        </span>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center pr-3 shrink-0">
                    <span className="hidden sm:flex items-center text-[11px] text-muted-foreground/50">
                      <Clock className="h-3 w-3 mr-0.5" />
                      {formatDate(notice.createdAt)}
                    </span>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="border-t bg-background">
                    <div className="p-4">
                      <div className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed font-mono bg-muted/20 rounded-md p-3 max-h-80 overflow-y-auto">
                        {notice.content}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
