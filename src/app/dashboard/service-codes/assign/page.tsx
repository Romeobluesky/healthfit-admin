"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserPlus } from "lucide-react";
import { serviceCodeApi, managerMemberApi } from "@/lib/api";
import type { ManagerMember } from "@/types";

export default function ServiceCodeAssignPage() {
  const [managers, setManagers] = useState<ManagerMember[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assignCount, setAssignCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [managersData, codesData] = await Promise.all([
        managerMemberApi.getAll(),
        serviceCodeApi.getAll(),
      ]);
      setManagers(managersData.filter((m) => !m.deletedAt));
      const count = codesData.filter(
        (c) => c.service_check === "N" && (!c.mb_id || c.mb_id === "")
      ).length;
      setAvailableCount(count);
    } catch {
      console.error("데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedManagerId) {
      setMessage("파트너를 선택해주세요.");
      return;
    }
    if (assignCount < 1) {
      setMessage("지정 개수는 1 이상이어야 합니다.");
      return;
    }
    if (assignCount > availableCount) {
      setMessage(
        `할당 가능한 코드가 ${availableCount}개뿐입니다. 지정 개수를 줄여주세요.`
      );
      return;
    }

    setExecuting(true);
    setMessage("");

    try {
      const result = await serviceCodeApi.assignPartner(selectedManagerId, assignCount);

      const selectedManager = managers.find((m) => m.id === selectedManagerId);
      const partnerName = selectedManager
        ? `${selectedManager.name} (${selectedManager.id})`
        : selectedManagerId;

      const affected = result?.affectedRows ?? 0;
      setMessage(
        `${partnerName}에게 ${affected}개의 서비스코드가 할당되었습니다.`
      );

      setSelectedManagerId("");
      setAssignCount(1);
      await fetchData();
    } catch {
      setMessage("할당 처리 중 오류가 발생했습니다.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[50%]">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <UserPlus className="h-6 w-6" />
          서비스코드 파트너 할당
        </h1>
        <p className="text-muted-foreground">
          지정된 파트너에게 개수만큼 할당됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>파트너 지정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            할당 가능한 서비스코드: <strong>{availableCount}</strong>개
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>파트너 선택</Label>
              <Select
                value={selectedManagerId}
                onValueChange={setSelectedManagerId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="파트너를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.idx} value={m.id}>
                      {m.name} ({m.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>지정 개수</Label>
              <Input
                type="number"
                min={1}
                max={availableCount}
                value={assignCount}
                onChange={(e) => setAssignCount(Number(e.target.value))}
                placeholder="할당할 코드 개수"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAssign}
              disabled={executing || loading || availableCount === 0}
              className="bg-[#0BDFDF] hover:bg-[#09c5c5] text-black"
            >
              {executing ? "할당 중..." : "실행"}
            </Button>
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
