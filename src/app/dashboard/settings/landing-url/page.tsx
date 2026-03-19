"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function LandingUrlPage() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const getPartnerUrl = (): string | null => {
    if (!user || !user.id || user.id === "admin") return null;
    const isDev = process.env.NODE_ENV === "development";
    const base = isDev ? "http://localhost:3000" : "https://healthfit-web.autocallup.com";
    return `${base}/?partner=${user.id}`;
  };

  const url = getPartnerUrl();

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Link2 className="h-6 w-6" />
          랜딩페이지 URL
        </h1>
        <p className="text-muted-foreground">파트너 전용 랜딩페이지 URL을 확인하고 복사할 수 있습니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>내 랜딩페이지 URL</CardTitle>
        </CardHeader>
        <CardContent>
          {url ? (
            <div className="flex items-center gap-2">
              <Input value={url} readOnly className="flex-1" />
              <Button onClick={handleCopy} className="shrink-0 cursor-pointer">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    복사
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">URL을 생성할 수 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
