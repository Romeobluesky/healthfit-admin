"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Handshake,
  KeyRound,
  Settings,
  ChevronDown,
  User,
  FileText,
  HeartPulse,
  UserRound,
  List,
  FilePlus2,
  UserPlus,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "대시보드",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

const serviceCodeSubItems = [
  {
    title: "서비스코드리스트",
    url: "/dashboard/service-codes",
    icon: List,
  },
  {
    title: "서비스코드생성",
    url: "/dashboard/service-codes/create",
    icon: FilePlus2,
  },
  {
    title: "서비스코드파트너지정",
    url: "/dashboard/service-codes/assign",
    icon: UserPlus,
  },
];

const customerSubItems = [
  {
    title: "건강검진고객",
    url: "/dashboard/customers",
    icon: HeartPulse,
  },
  {
    title: "일반고객",
    url: "/dashboard/customers/general",
    icon: UserRound,
  },
];

const settingsSubItems = [
  {
    title: "내 정보",
    url: "/dashboard/settings",
    icon: User,
  },
  {
    title: "약관 관리",
    url: "/dashboard/settings/clauses",
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isServiceCodesActive = pathname.startsWith("/dashboard/service-codes");
  const isCustomersActive = pathname.startsWith("/dashboard/customers");
  const isSettingsActive = pathname.startsWith("/dashboard/settings");
  const [serviceCodesOpen, setServiceCodesOpen] = useState(isServiceCodesActive);
  const [customersOpen, setCustomersOpen] = useState(isCustomersActive);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

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

              <Collapsible
                open={customersOpen}
                onOpenChange={setCustomersOpen}
                asChild
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isCustomersActive}>
                      <Users className="h-4 w-4" />
                      <span>고객관리</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          customersOpen ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customerSubItems.map((item) => {
                        const isSubActive = pathname === item.url;
                        return (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive} size="sm">
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/partners")}>
                  <Link href="/dashboard/partners">
                    <Handshake className="h-4 w-4" />
                    <span>파트너관리</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                open={serviceCodesOpen}
                onOpenChange={setServiceCodesOpen}
                asChild
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isServiceCodesActive}>
                      <KeyRound className="h-4 w-4" />
                      <span>서비스코드관리</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          serviceCodesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {serviceCodeSubItems.map((item) => {
                        const isSubActive = pathname === item.url;
                        return (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive} size="sm">
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                asChild
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isSettingsActive}>
                      <Settings className="h-4 w-4" />
                      <span>환경설정</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          settingsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {settingsSubItems.map((item) => {
                        const isSubActive = pathname === item.url;
                        return (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive} size="sm">
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
