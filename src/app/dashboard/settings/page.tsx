"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Trash2, User, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { getPermissionLabel } from "@/lib/permission";
import { managerMemberApi } from "@/lib/api";

export default function SettingsPage() {
  const { user, login, profileImage, setProfileImage } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const cropToSquare = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = src;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("이미지는 2MB 이하만 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const cropped = await cropToSquare(result);
      setProfileImage(cropped);
      setMessage("프로필 사진이 변경되었습니다.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updateData: Record<string, string> = { name, phone, organization };
      if (password) updateData.password = password;
      await managerMemberApi.update(user.idx, updateData);
      login({ ...user, name, phone, organization });
      setPassword("");
      setMessage("저장되었습니다.");
    } catch {
      setMessage("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Settings className="h-6 w-6" />환경설정</h1>
        <p className="text-muted-foreground">내 정보 관리</p>
      </div>

      <div className="flex gap-6">
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle>프로필 사진</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                {profileImage ? (
                  <Avatar className="h-24 w-24 ring-2 ring-border">
                    <AvatarImage src={profileImage} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full ring-2 ring-border bg-muted">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (최대 2MB)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  사진 변경
                </Button>
                {profileImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfileImage(null);
                      setMessage("프로필 사진이 삭제되었습니다.");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    삭제
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 max-w-lg">
          <CardHeader>
            <CardTitle>내 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>아이디</Label>
              <Input value={user.id} disabled />
            </div>
            <div className="space-y-2">
              <Label>권한</Label>
              <div>
                <Badge>{getPermissionLabel(user.permission)}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>이름</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>소속</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>비밀번호 변경 (변경 시에만 입력)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새 비밀번호"
              />
            </div>
            <p className="text-sm text-muted-foreground h-5">
              {message || "\u00A0"}
            </p>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
