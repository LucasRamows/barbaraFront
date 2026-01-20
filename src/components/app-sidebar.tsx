"use client";
import {
  Dumbbell,
  NotebookPen,
  PieChartIcon,
  Settings,
  Wallet,
  HeartPulse,
  Lock,
  AlarmClockCheck,
} from "lucide-react";
import * as React from "react";

import { NavProjects } from "../components/nav-projects";
import { NavUser } from "../components/nav-user";
import { TeamSwitcher } from "../components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "../components/ui/sidebar";
import { useData } from "../contexts/DataContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useData();

  const block = {
    user: {
      name: data?.name ? data.name : "Usuário",
      email: data?.email ? data.email : "Usuário",
      avatar: "/avatars/shadcn.jpg",
    },
    business: {
      name: "A Bárbara",
      logo: NotebookPen,
    },
    projects: [
      {
        name: "Financeiro",
        url: "/dashboard",
        icon: Wallet,
      },
      {
        name: "Projetos",
        url: "/projects",
        icon: PieChartIcon,
      },
      {
        name: "Tarefas",
        url: "/tasks",
        icon: AlarmClockCheck,
      },
      {
        name: "Cofre",
        url: "/bank",
        icon: Lock,
      },
      {
        name: "Treino",
        url: "/workout",
        icon: Dumbbell,
      },
      {
        name: "Saúde",
        url: "/health",
        icon: HeartPulse,
      },
      {
        name: "Configurações",
        url: "/settings",
        icon: Settings,
      },
    ],
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher business={block.business} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={block.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={block.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
