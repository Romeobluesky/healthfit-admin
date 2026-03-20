"use client";

import { Info, Printer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const gradeInfo = [
  { grade: "정상 (SAFE)", points: 0, color: "#4bf127", bgClass: "bg-green-100 text-green-800" },
  { grade: "주의 (CAUTION)", points: 2, color: "#f8cf09", bgClass: "bg-yellow-100 text-yellow-800" },
  { grade: "경고 (WARNING)", points: 3, color: "#ffa619", bgClass: "bg-orange-100 text-orange-800" },
  { grade: "위험 (DANGER)", points: 4, color: "#ff0528", bgClass: "bg-red-100 text-red-800" },
];

const diseaseList = [
  { name: "비만", riskPercent: "19.9%" },
  { name: "고지혈증", riskPercent: "39.9%" },
  { name: "고혈압", riskPercent: "22.9%" },
  { name: "당뇨병", riskPercent: "8.2%" },
  { name: "심장병", riskPercent: "7.0%" },
  { name: "뇌졸중", riskPercent: "1.1%" },
];

const cancerFormulas = [
  { cancer: "갑상선암", gender: "공통", formula: "비만 포인트", note: "남성은 최종 점수를 3으로 나눔" },
  { cancer: "위암", gender: "공통", formula: "(비만 + 당뇨) / 2", note: "" },
  { cancer: "간암", gender: "공통", formula: "비만 포인트", note: "" },
  { cancer: "췌장암", gender: "공통", formula: "(비만 + 당뇨) / 2", note: "" },
  { cancer: "대장암", gender: "공통", formula: "(비만 + 고지혈증) / 2", note: "" },
  { cancer: "방광암", gender: "남성", formula: "비만 포인트", note: "" },
  { cancer: "전립선암", gender: "남성", formula: "(비만 + 고혈압 + 당뇨) / 3", note: "" },
  { cancer: "유방암", gender: "여성", formula: "(비만 + 고지혈증 + 고혈압 + 당뇨) / 4", note: "" },
  { cancer: "자궁경부암", gender: "여성", formula: "(비만 + 고지혈증 + 고혈압 + 당뇨) / 4", note: "" },
];

const cancerGradeThresholds = [
  { range: "0 ~ 2.9", grade: "정상", bgClass: "bg-green-100 text-green-800" },
  { range: "3.0 ~ 5.9", grade: "주의", bgClass: "bg-yellow-100 text-yellow-800" },
  { range: "6.0 ~ 9.9", grade: "경고", bgClass: "bg-orange-100 text-orange-800" },
  { range: "10.0 이상", grade: "위험", bgClass: "bg-red-100 text-red-800" },
];

export default function ReportGuidePage() {
  return (
    <div className="report-guide space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">건강리포트 안내</h2>
          <p className="text-muted-foreground mt-1">
            건강검진 리포트의 수치 및 위험도가 어떻게 산출되는지 안내합니다.
          </p>
        </div>
        <Button
          variant="outline"
          className="no-print"
          onClick={() => {
            const originalTitle = document.title;
            document.title = "건강리포트_안내";
            const html = document.documentElement;
            const wasDark = html.classList.contains("dark");
            if (wasDark) {
              html.classList.remove("dark");
              html.style.colorScheme = "light";
            }
            const restore = () => {
              if (wasDark) {
                html.classList.add("dark");
                html.style.colorScheme = "";
              }
              document.title = originalTitle;
              window.removeEventListener("afterprint", restore);
            };
            window.addEventListener("afterprint", restore);
            setTimeout(() => window.print(), 300);
          }}
        >
          <Printer className="h-4 w-4 mr-2" />
          인쇄 / PDF 저장
        </Button>
      </div>

      {/* 1. 6대 질병 등급 */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-lg">1. 6대 질병 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            건강검진 결과를 바탕으로 아래 6가지 질병에 대한 위험도를 분석합니다.
            각 질병은 4단계 등급으로 판정됩니다.
          </p>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-orange-500">
              질병 등급의 판정 기준은 <span className="font-semibold">국민건강보험공단 국가건강검진</span>의
              공식 참조 기준(정상(A), 정상(B), 질환의심)에 근거합니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">분석 대상 질병</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#4a7fb5]">
                    <TableHead className="text-white font-semibold">질병명</TableHead>
                    <TableHead className="text-white font-semibold">평균 발생률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diseaseList.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.riskPercent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">등급 체계</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#4a7fb5]">
                    <TableHead className="text-white font-semibold">등급</TableHead>
                    <TableHead className="text-white font-semibold">포인트</TableHead>
                    <TableHead className="text-white font-semibold text-center">색상</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeInfo.map((g) => (
                    <TableRow key={g.grade}>
                      <TableCell className="font-medium">{g.grade}</TableCell>
                      <TableCell>{g.points}점</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border"
                            style={{ backgroundColor: g.color }}
                          />
                          <Badge className={g.bgClass}>{g.grade.split(" ")[0]}</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            * 각 질병의 등급은 건강검진 분석 데이터(Analysis)에서 판정됩니다.
          </p>
        </CardContent>
      </Card>

      {/* 2. 생체나이 */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-lg">2. 생체나이 (대사나이) 계산</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Harris-Benedict 공식을 기반으로 기초대사량(BMR)을 계산한 뒤,
            역산하여 생체나이를 도출합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 bg-muted/30 md:min-h-40">
              <h4 className="font-semibold mb-2">입력 값</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                <li>체중 (kg)</li>
                <li>신장 (cm)</li>
                <li>실제 나이 (세)</li>
                <li>성별 (남성/여성)</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30 md:min-h-40">
              <h4 className="font-semibold mb-2">Step 1. 이상 체중 계산</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                <li>신장(인치) = 신장(cm) x 0.3937</li>
                <li>남성: 50 + 2.3 x (신장(인치) - 60)</li>
                <li>여성: 45.5 + 2.3 x (신장(인치) - 60)</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30 md:min-h-40">
              <h4 className="font-semibold mb-2">Step 2. 기초대사량 (BMR) 계산</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                <li>보정체중 = 이상체중 + 0.75 x (실제체중 - 이상체중)</li>
                <li>남성: 66 + 13.7 x 보정체중 + 5 x 신장 - 6.8 x 나이</li>
                <li>여성: 655 + 9.6 x 보정체중 + 1.8 x 신장 - 4.7 x 나이</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30 md:min-h-40">
              <h4 className="font-semibold mb-2">Step 3. 생체나이 역산</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                <li>남성: (BMR - 66 - 13.7 x 체중 - 5 x 신장) / -6.8</li>
                <li>여성: (BMR - 655 - 9.6 x 체중 - 1.8 x 신장) / -4.7</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                * 소수점 첫째 자리까지 반올림하여 표시합니다.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/30">
            <h4 className="font-semibold mb-1">해석</h4>
            <p className="text-sm text-muted-foreground">
              생체나이가 실제 나이보다 <span className="text-green-600 font-semibold">낮으면</span> 대사 건강이 양호하다는 의미이며,
              실제 나이보다 <span className="text-red-600 font-semibold">높으면</span> 대사 건강에 주의가 필요합니다.
              이 차이는 암 위험도 계산에도 반영됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. 암 위험도 */}
      <Card className="print:break-before-page print:break-inside-auto">
        <CardHeader>
          <CardTitle className="text-lg">3. 암 위험도 계산</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            4대 질병(비만, 고지혈증, 고혈압, 당뇨)의 등급 포인트와 생체나이 차이를 기반으로
            암종별 위험도를 산출합니다.
          </p>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-orange-800 dark:text-orange-500">
              암 위험도 점수는 건강검진 등급 데이터를 활용한 <span className="font-semibold">자체 분석 모델</span>로
              산출되며, 의학적 진단이 아닌 <span className="font-semibold">건강 경향 참고 지표</span>입니다.
              정확한 진단은 반드시 전문의 상담을 통해 받으시기 바랍니다.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 bg-muted/30 print:break-inside-avoid">
            <h4 className="font-semibold mb-2">계산 공식</h4>
            <div className="text-sm space-y-2 text-muted-foreground">
              <div className="font-mono space-y-1">
                <p>1) 기본 점수 = 암종별 관련 질병 포인트의 평균 (아래 표 참조)</p>
                <p>2) 나이 가중치 = (생체나이 - 실제나이) x 0.4</p>
                <p>3) <span className="font-semibold text-foreground">최종 점수 = 기본 점수 + 나이 가중치</span></p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="print:break-inside-avoid">
            <h4 className="font-semibold mb-2">암종별 기본 점수 산출 공식</h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#4a7fb5]">
                  <TableHead className="text-white font-semibold">암종</TableHead>
                  <TableHead className="text-white font-semibold">성별</TableHead>
                  <TableHead className="text-white font-semibold">산출 공식</TableHead>
                  <TableHead className="text-white font-semibold">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancerFormulas.map((c) => (
                  <TableRow key={c.cancer}>
                    <TableCell className="font-medium">{c.cancer}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.gender === "남성"
                            ? "border-blue-300 text-blue-700"
                            : c.gender === "여성"
                              ? "border-pink-300 text-pink-700"
                              : ""
                        }
                      >
                        {c.gender}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.formula}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground mt-2">
              * 포인트: 정상=0, 주의=2, 경고=3, 위험=4
            </p>
          </div>

          <Separator />

          <div className="print:break-inside-avoid">
            <h4 className="font-semibold mb-2">최종 점수에 따른 등급 판정</h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#4a7fb5]">
                  <TableHead className="text-white font-semibold">점수 범위</TableHead>
                  <TableHead className="text-white font-semibold">등급</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancerGradeThresholds.map((t) => (
                  <TableRow key={t.range}>
                    <TableCell className="font-mono">{t.range}</TableCell>
                    <TableCell>
                      <Badge className={t.bgClass}>{t.grade}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/30 print:break-inside-avoid">
            <h4 className="font-semibold mb-1">예시</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>비만 등급: 경고(3점), 당뇨 등급: 주의(2점), 생체나이: 48세, 실제나이: 45세</p>
              <p className="font-mono mt-2">
                위암 기본 점수 = (3 + 2) / 2 = 2.5
              </p>
              <p className="font-mono">
                나이 가중치 = (48 - 45) x 0.4 = 1.2
              </p>
              <p className="font-mono font-semibold text-foreground">
                최종 점수 = 2.5 + 1.2 = 3.7 → 주의
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 성별별 암종 */}
      <Card className="mt-4 print:break-before-page">
        <CardHeader>
          <CardTitle className="text-lg">4. 성별별 암 분석 항목</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grid-print-2">
            <div className="rounded-lg border p-4 print:break-inside-avoid">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="border-blue-300 text-blue-700">남성</Badge>
                분석 암종 (7개)
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>갑상선암</li>
                <li>위암</li>
                <li>간암</li>
                <li>췌장암</li>
                <li>대장암</li>
                <li>방광암</li>
                <li>전립선암</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4 print:break-inside-avoid">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline" className="border-pink-300 text-pink-700">여성</Badge>
                분석 암종 (7개)
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>갑상선암</li>
                <li>위암</li>
                <li>간암</li>
                <li>췌장암</li>
                <li>대장암</li>
                <li>유방암</li>
                <li>자궁경부암</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 데이터 출처 및 면책 */}
      <Card className="border-muted bg-muted/20 -mt-2 print:break-before-page">
        <CardContent className="pt-1">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">데이터 출처 및 안내</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>건강검진 원시 데이터: 국민건강보험공단 국가건강검진 API</li>
              <li>질병 등급 판정 기준: 국민건강보험공단 공식 참조 기준</li>
              <li>생체나이 계산: Harris-Benedict 기초대사량 공식 기반</li>
              <li>암 위험도 산출: 질병 등급 기반 자체 분석 모델</li>
            </ul>
            <Separator className="my-3" />
            <p className="text-xs text-orange-500">
              본 리포트의 암 위험도 분석은 의학적 진단을 대체하지 않으며, 건강 상태에 대한 참고 자료로만 활용하시기 바랍니다.
              정확한 건강 평가 및 진단은 의료 전문가와 상담하시기 바랍니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
