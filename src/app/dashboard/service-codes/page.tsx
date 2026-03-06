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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, KeyRound } from "lucide-react";
import { serviceCodeApi } from "@/lib/api";
import type { ServiceCode } from "@/types";

export default function ServiceCodesPage() {
  const [codes, setCodes] = useState<ServiceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCodes() {
      try {
        const data = await serviceCodeApi.getAll();
        setCodes(data);
      } catch {
        console.error("서비스코드 조회 실패");
      } finally {
        setLoading(false);
      }
    }
    fetchCodes();
  }, []);

  const filteredCodes = codes.filter(
    (c) =>
      c.serviceCodeFull?.includes(search) ||
      c.mb_id?.includes(search)
  );

  const getStatusInfo = (code: ServiceCode) => {
    if (code.deletedAt) return { label: "미활성", variant: "outline" as const };
    if (code.mb_id && code.service_check === "Y")
      return { label: "사용중", variant: "default" as const };
    if (code.service_check === "Y")
      return { label: "활성", variant: "secondary" as const };
    return { label: "미사용", variant: "outline" as const };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><KeyRound className="h-6 w-6" />서비스코드관리</h1>
        <p className="text-muted-foreground">서비스코드 발급 및 관리</p>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="코드, 회원 ID 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>서비스코드 리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#4a7fb5]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-16 text-white">번호</TableHead>
                <TableHead className="text-white">코드</TableHead>
                <TableHead className="text-white">사용 회원</TableHead>
                <TableHead className="text-white">상태</TableHead>
                <TableHead className="text-white">생성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code, index) => {
                  const status = getStatusInfo(code);
                  return (
                    <TableRow key={code.idx}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {code.serviceCodeFull ||
                          `${code.serviceCodeOne}-${code.serviceCodeTwo}-${code.serviceCodeThree}`}
                      </TableCell>
                      <TableCell>{code.mb_id || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(code.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
