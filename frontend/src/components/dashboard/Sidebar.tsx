"use client";

import {
  LayoutDashboard,
  UserRound,
  LogOut,
  Award,
  Activity,
  BarChart2,
  Trophy,
  Settings,
} from "lucide-react";
import { Layout, Menu } from "antd";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const { Sider } = Layout;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const getSelectedKey = () => {
    if (!pathname) return "dashboard";
    if (pathname.startsWith("/dashboard/profile")) return "profile";
    if (pathname.startsWith("/dashboard/credentials")) return "credentials";
    if (pathname.startsWith("/dashboard/skills")) return "skills";
    if (pathname.startsWith("/dashboard/learning-path")) return "learning-path";
    if (pathname.startsWith("/dashboard/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/dashboard/analytics")) return "analytics";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    return "dashboard";
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={240}
      style={{ background: "transparent" }}
      className="h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
    >
      <div
        className="h-16 flex items-center justify-center font-bold text-xl text-gray-900 dark:text-gray-100 cursor-pointer"
        onClick={() => handleNavigate("/dashboard")}
      >
        {collapsed ? "CX" : "Credexa"}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        style={{ background: "transparent", borderRight: "none" }}
        className={`
          px-2
          [&_.ant-menu-item]:!my-2
          [&_.ant-menu-item]:!h-11
          [&_.ant-menu-item-selected]:!bg-cyan-50
          dark:[&_.ant-menu-item-selected]:!bg-cyan-900/50
          dark:[&_.ant-menu-item-selected]:!text-cyan-200
          [&_.ant-menu-item-selected_svg]:!text-cyan-600
          dark:[&_.ant-menu-item-selected_svg]:!text-cyan-200
          [&_.ant-menu-item]:rounded-lg 
          [&_.ant-menu-item]:hover:!bg-gray-100 
          dark:[&_.ant-menu-item]:hover:!bg-gray-800
          [&_.ant-menu-item]:!text-gray-800
          dark:[&_.ant-menu-item]:!text-gray-200
          [&_.ant-menu-item-icon]:!text-gray-600
          dark:[&_.ant-menu-item-icon]:!text-gray-300
          [&_.ant-menu-title-content]:!ml-4
        `}
        items={[
          { key: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", onClick: () => handleNavigate("/dashboard") },
          { key: "profile", icon: <UserRound size={18} />, label: "Update Profile", onClick: () => handleNavigate("/dashboard/profile") },
          { key: "credentials", icon: <Award size={18} />, label: "My Credentials", onClick: () => handleNavigate("/dashboard/credentials") },
          { key: "skills", icon: <Activity size={18} />, label: "Skill Tracker", onClick: () => handleNavigate("/dashboard/skills") },
          { key: "learning-path", icon: <BarChart2 size={18} />, label: "Learning Path", onClick: () => handleNavigate("/dashboard/learning-path") },
          { key: "leaderboard", icon: <Trophy size={18} />, label: "Leaderboard", onClick: () => handleNavigate("/dashboard/leaderboard") },
          { key: "analytics", icon: <BarChart2 size={18} />, label: "Analytics", onClick: () => handleNavigate("/dashboard/analytics") },
          { key: "settings", icon: <Settings size={18} />, label: "Settings", onClick: () => handleNavigate("/dashboard/settings") },
        ]}
      />

      <div className="mt-auto p-4">
        <Menu
          mode="inline"
          selectable={false}
          style={{ background: "transparent", borderRight: "none" }}
          className={`
            [&_.ant-menu-item]:!my-1 
            [&_.ant-menu-item]:rounded-lg 
            [&_.ant-menu-item]:hover:!bg-red-50
            dark:[&_.ant-menu-item]:hover:!bg-red-900/50
            [&_.ant-menu-item]:!text-red-600
            dark:[&_.ant-menu-item]:!text-red-400
            [&_.ant-menu-item-icon]:!text-red-600
            dark:[&_.ant-menu-item-icon]:!text-red-400
            [&_.ant-menu-title-content]:!ml-4
          `}
          items={[
            {
              key: "logout",
              icon: <LogOut size={16} />,
              label: !collapsed && "Logout",
              onClick: handleLogout,
            },
          ]}
        />
      </div>
    </Sider>
  );
}
