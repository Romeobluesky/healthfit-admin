"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Handshake,
  KeyRound,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "대시보드",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "고객관리",
    url: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "파트너관리",
    url: "/dashboard/partners",
    icon: Handshake,
  },
  {
    title: "서비스코드관리",
    url: "/dashboard/service-codes",
    icon: KeyRound,
  },
  {
    title: "환경설정",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4 bg-[#1e3a5f] text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/icon.png" alt="HealthFit" width={28} height={28} />
          <span className="text-lg font-bold">HealthFit</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
