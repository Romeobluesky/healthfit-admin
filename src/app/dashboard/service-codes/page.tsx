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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, KeyRound, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Download } from "lucide-react";
import { serviceCodeApi, managerMemberApi } from "@/lib/api";
import type { ServiceCode, ManagerMember } from "@/types";
import * as XLSX from "xlsx";

export default function ServiceCodesPage() {
  const [codes, setCodes] = useState<ServiceCode[]>([]);
  const [managers, setManagers] = useState<ManagerMember[]>([]);
  const [managerMap, setManagerMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const [codesData, managersData] = await Promise.all([
          serviceCodeApi.getAll(),
          managerMemberApi.getAll(),
        ]);
        setCodes(codesData);
        setManagers(managersData.filter((m) => !m.deletedAt));
        const map: Record<string, string> = {};
        managersData.forEach((m) => {
          map[m.id] = m.name;
        });
        setManagerMap(map);
      } catch {
        console.error("데이터 조회 실패");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getCodeFull = (c: ServiceCode) =>
    c.serviceCodeFull || `${c.serviceCodeOne}-${c.serviceCodeTwo}-${c.serviceCodeThree}`;

  const filteredCodes = codes.filter((c) => {
    if (selectedPartnerId !== "all" && c.mb_id !== selectedPartnerId) return false;
    if (!search) return true;
    return (
      getCodeFull(c).includes(search) ||
      c.mb_id?.includes(search)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / pageSize));
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCodes.slice(start, start + pageSize);
  }, [filteredCodes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedPartnerId]);

  const handleExcelDownload = () => {
    const today = formatDate(new Date().toISOString());
    const rows = filteredCodes.map((code) => ({
      "코드": getCodeFull(code),
      "아이디": code.mb_id || "-",
      "파트너명": code.mb_id ? (managerMap[code.mb_id] || "-") : "-",
      "상태": getStatusInfo(code).label,
      "등록일": today,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "서비스코드");
    const partnerName = selectedPartnerId !== "all"
      ? `_${managerMap[selectedPartnerId] || selectedPartnerId}`
      : "";
    XLSX.writeFile(wb, `서비스코드${partnerName}_${today}.xlsx`);
  };

  const getStatusInfo = (code: ServiceCode) => {
    if (code.deletedAt) return { label: "미활성", bg: "bg-gray-400 text-white" };
    if (code.mb_id && code.service_check === "Y")
      return { label: "사용중", bg: "bg-blue-500 text-white" };
    if (code.service_check === "Y")
      return { label: "활성", bg: "bg-green-500 text-white" };
    return { label: "미사용", bg: "bg-orange-400 text-white" };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><KeyRound className="h-6 w-6" />서비스코드관리</h1>
        <p className="text-muted-foreground">서비스코드 발급 및 관리</p>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          className="max-w-50"
          placeholder="코드, 회원 ID 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="파트너 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 파트너</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.idx} value={m.id}>
                {m.name} ({m.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleExcelDownload}
          disabled={filteredCodes.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
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
                <TableHead className="text-white">파트너아이디</TableHead>
                <TableHead className="text-white">파트너명</TableHead>
                <TableHead className="text-white">상태</TableHead>
                <TableHead className="text-white">생성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCodes.map((code, index) => {
                  const status = getStatusInfo(code);
                  return (
                    <TableRow key={code.idx}>
                      <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {code.serviceCodeFull ||
                          `${code.serviceCodeOne}-${code.serviceCodeTwo}-${code.serviceCodeThree}`}
                      </TableCell>
                      <TableCell>{code.mb_id || "-"}</TableCell>
                      <TableCell>{code.mb_id ? (managerMap[code.mb_id] || "-") : "-"}</TableCell>
                      <TableCell>
                        <Badge className={`w-15 justify-center ${status.bg}`}>{status.label}</Badge>
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

      {filteredCodes.length > 0 && (
        <div className="-mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {filteredCodes.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCodes.length)}건
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {(() => {
              const pageGroup = Math.floor((currentPage - 1) / 10);
              const startPage = pageGroup * 10 + 1;
              const endPage = Math.min(startPage + 9, totalPages);
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ));
            })()}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
