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
import { FilePlus2, Trash2 } from "lucide-react";
import { serviceCodeApi, managerMemberApi } from "@/lib/api";
import type { ManagerMember } from "@/types";

interface GeneratedCode {
  serviceCodeOne: string;
  serviceCodeTwo: string;
  serviceCodeThree: string;
  serviceCodeFull: string;
}

function generateRandomCode(): GeneratedCode {
  const one = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const two = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const three = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return {
    serviceCodeOne: one,
    serviceCodeTwo: two,
    serviceCodeThree: three,
    serviceCodeFull: `${one}-${two}-${three}`,
  };
}

export default function ServiceCodeCreatePage() {
  const [managers, setManagers] = useState<ManagerMember[]>([]);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [codeCount, setCodeCount] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [managersData, codesData] = await Promise.all([
          managerMemberApi.getAll(),
          serviceCodeApi.getAll(),
        ]);
        setManagers(managersData.filter((m) => !m.deletedAt));
        setExistingCodes(new Set(codesData.map((c) =>
          c.serviceCodeFull || `${c.serviceCodeOne}-${c.serviceCodeTwo}-${c.serviceCodeThree}`
        )));
      } catch {
        console.error("데이터 조회 실패");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const generateUniqueCode = (usedCodes: Set<string>): GeneratedCode => {
    let code: GeneratedCode;
    let attempts = 0;
    do {
      code = generateRandomCode();
      attempts++;
      if (attempts > 1000) throw new Error("고유 코드 생성 실패");
    } while (usedCodes.has(code.serviceCodeFull));
    return code;
  };

  const handleGenerate = () => {
    if (codeCount < 1 || codeCount > 10000) {
      setMessage("생성 갯수는 1~10000 사이로 입력해주세요.");
      return;
    }
    setGenerating(true);
    try {
      const usedCodes = new Set(existingCodes);
      const codes: GeneratedCode[] = [];
      for (let i = 0; i < codeCount; i++) {
        const code = generateUniqueCode(usedCodes);
        usedCodes.add(code.serviceCodeFull);
        codes.push(code);
      }
      setGeneratedCodes(codes);
      setMessage(`${codeCount}개의 서비스코드가 생성되었습니다. 확인 후 저장해주세요.`);
    } catch {
      setMessage("코드 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveCode = (index: number) => {
    setGeneratedCodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (generatedCodes.length === 0) {
      setMessage("생성된 코드가 없습니다.");
      return;
    }
    setSaving(true);
    setSaveProgress(0);
    setMessage("");
    let successCount = 0;
    let duplicateCount = 0;
    const total = generatedCodes.length;
    const savedCodes: GeneratedCode[] = [];
    try {
      for (let i = 0; i < generatedCodes.length; i++) {
        const code = generatedCodes[i];
        try {
          await serviceCodeApi.create({
            serviceCodeOne: code.serviceCodeOne,
            serviceCodeTwo: code.serviceCodeTwo,
            serviceCodeThree: code.serviceCodeThree,
            service_check: "N",
            ...(selectedManagerId && selectedManagerId !== "none" ? { mb_id: selectedManagerId } : {}),
          });
          successCount++;
          savedCodes.push(code);
        } catch (err) {
          if (err instanceof Error && err.message.includes("409")) {
            duplicateCount++;
          } else {
            throw err;
          }
        }
        setSaveProgress(Math.round(((i + 1) / total) * 100));
      }
      setExistingCodes((prev) => {
        const next = new Set(prev);
        savedCodes.forEach((c) => next.add(c.serviceCodeFull));
        return next;
      });
      if (duplicateCount > 0) {
        setMessage(`${successCount}개 저장 완료, ${duplicateCount}개 중복으로 건너뜀`);
      } else {
        setMessage(`${successCount}개의 서비스코드가 저장되었습니다.`);
      }
      setGeneratedCodes([]);
    } catch {
      setMessage(`${successCount}개 저장 완료. 일부 코드 저장 중 오류가 발생했습니다.`);
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  };

  const selectedManager = managers.find((m) => m.id === selectedManagerId);

  return (
    <div className="space-y-4 max-w-[50%]">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FilePlus2 className="h-6 w-6" />
          서비스코드 생성
        </h1>
        <p className="text-muted-foreground">새로운 서비스코드를 생성합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>생성 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectItem value="none">미지정</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.idx} value={m.id}>
                      {m.name} ({m.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>생성 갯수</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={codeCount}
                onChange={(e) => setCodeCount(Number(e.target.value))}
                placeholder="생성할 코드 갯수"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || saving}
              className="bg-[#0BDFDF] hover:bg-[#09c5c5] text-black"
            >
              {generating ? "생성 중..." : "코드 생성"}
            </Button>
            {generatedCodes.length > 0 && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            )}
          </div>

          {saving && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>저장 중...</span>
                <span>{saveProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#0BDFDF] transition-all duration-150"
                  style={{ width: `${saveProgress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>

      {generatedCodes.length > 0 && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                생성된 코드 확인 ({generatedCodes.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-[#4a7fb5]">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-16 text-white">번호</TableHead>
                    <TableHead className="text-white">코드</TableHead>
                    <TableHead className="text-white">파트너</TableHead>
                    <TableHead className="text-white">상태</TableHead>
                    <TableHead className="w-16 text-white">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedCodes.map((code, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {code.serviceCodeFull}
                      </TableCell>
                      <TableCell>
                        {selectedManager
                          ? `${selectedManager.name} (${selectedManager.id})`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{selectedManagerId && selectedManagerId !== "none" ? "미사용" : "활성"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveCode(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
}
