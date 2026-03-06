"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Search } from "lucide-react";
import { memberApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isSuperAdmin } from "@/lib/permission";
import type { Member } from "@/types";

export default function CustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await memberApi.getAll();
        setMembers(data);
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

  const filteredMembers = members.filter(
    (m) =>
      m.name?.includes(search) ||
      m.phone?.includes(search) ||
      m.birthDate?.includes(search)
  );

  // 간편인증: socialLogin이 있는 회원, 일반: socialLogin이 없는 회원
  const simpleAuthMembers = filteredMembers.filter((m) => m.socialLogin);
  const generalMembers = filteredMembers.filter((m) => !m.socialLogin);

  const formatGender = (gender: number) => (gender === 1 ? "남" : "여");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  const MemberTable = ({
    data,
    type,
  }: {
    data: Member[];
    type: "simple" | "general";
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">번호</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>전화번호</TableHead>
          <TableHead>생년월일</TableHead>
          <TableHead>성별</TableHead>
          <TableHead>등록일</TableHead>
          <TableHead className="w-24">
            {type === "simple" ? "리포트보기" : "설문내역보기"}
          </TableHead>
          {user && isSuperAdmin(user.permission) && (
            <TableHead className="w-16">삭제</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              데이터를 불러오는 중...
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          data.map((member, index) => (
            <TableRow key={member.idx}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.phone}</TableCell>
              <TableCell>{member.birthDate || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {member.gender ? formatGender(member.gender) : "-"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(member.createdAt)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" disabled>
                  <FileText className="h-4 w-4" />
                </Button>
              </TableCell>
              {user && isSuperAdmin(user.permission) && (
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
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고객관리</h1>
        <p className="text-muted-foreground">간편인증 및 일반 고객 관리</p>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름, 전화번호, 생년월일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="simple-auth">
        <TabsList>
          <TabsTrigger value="simple-auth">
            간편인증고객 ({simpleAuthMembers.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            일반고객 ({generalMembers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="simple-auth">
          <Card>
            <CardHeader>
              <CardTitle>간편인증고객 리스트</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberTable data={simpleAuthMembers} type="simple" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>일반고객 리스트</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberTable data={generalMembers} type="general" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
