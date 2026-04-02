"use client";

import { useState, useEffect } from "react";
import { LogOut, User, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { getPermissionLabel } from "@/lib/permission";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

function SystemClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const day = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
      const hh = String(now.getHours()).padStart(2, "0");
      const mi = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTime(`${yyyy}-${mm}-${dd} (${day}) ${hh}:${mi}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-white/80 font-mono">
      <Clock className="h-4 w-4" />
      <span>{time}</span>
    </div>
  );
}

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout, profileImage } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b px-4 bg-[#1e3a5f] text-white">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6 mx-2" />
      <SystemClock />
      <div className="flex-1" />
      {user && (
        <div className="flex items-center gap-3">
          {profileImage ? (
            <Avatar size="lg">
              <AvatarImage src={profileImage} alt={user.name} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-white/20">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 text-sm">
            <p className="font-medium truncate leading-tight">{user.name}</p>
            <p className="text-xs text-white/70 truncate leading-tight">
              {getPermissionLabel(user.permission)} · {user.organization}
            </p>
          </div>
        </div>
      )}
      <Separator orientation="vertical" className="h-6" />
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">로그아웃</span>
      </Button>
    </header>
  );
}
