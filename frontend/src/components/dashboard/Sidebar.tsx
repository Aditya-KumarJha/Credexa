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
  Home,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function SidebarComponent() {
  const [open, setOpen] = useState(true); // Default to expanded
  const [isLocked, setIsLocked] = useState(true); // Default to locked (expanded)
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const toggleLock = () => {
    if (isLocked) {
      // Currently locked (expanded) -> unlock and collapse
      setIsLocked(false);
      setOpen(false);
    } else {
      // Currently unlocked (collapsed or hover-expanded) -> lock and expand  
      setIsLocked(true);
      setOpen(true);
    }
  };

  const getSelectedKey = () => {
    if (!pathname) return "home";
    if (pathname === "/") return "home";
    if (pathname.startsWith("/dashboard/profile")) return "update-profile";
    if (pathname.startsWith("/dashboard/credentials")) return "my-credentials";
    if (pathname.startsWith("/dashboard/skills")) return "skill-tracker";
    if (pathname.startsWith("/dashboard/learning-path")) return "learning-path";
    if (pathname.startsWith("/dashboard/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname === "/dashboard") return "dashboard";
    return "dashboard";
  };

  const links = [
    {
      label: "Home",
      href: "#",
      icon: (
        <Home className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/"),
    },
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard"),
    },
    {
      label: "Update Profile",
      href: "#",
      icon: (
        <UserRound className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/profile"),
    },
    {
      label: "My Credentials",
      href: "#",
      icon: (
        <Award className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/credentials"),
    },
    {
      label: "Skill Tracker",
      href: "#",
      icon: (
        <Activity className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/skills"),
    },
    {
      label: "Learning Path",
      href: "#",
      icon: (
        <BarChart2 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/learning-path"),
    },
    {
      label: "Leaderboard",
      href: "#",
      icon: (
        <Trophy className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/leaderboard"),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: () => handleNavigate("/dashboard/settings"),
    },
  ];

  return (
    <div className="relative sticky top-0 h-screen">
      {/* Toggle button */}
      <button
        onClick={toggleLock}
        className={cn(
          "absolute top-6 z-20 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm border border-gray-300 dark:border-gray-600",
          open 
            ? "right-4" // When expanded, position at extreme right
            : "left-1/2 transform -translate-x-1/2" // When collapsed, center it
        )}
        title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
      >
        {isLocked ? (
          <ChevronsLeft 
            className="h-6 w-6 text-cyan-500" 
          />
        ) : (
          <ChevronsRight 
            className="h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
          />
        )}
      </button>

      <Sidebar open={open} setOpen={() => {}} animate={true}>
        <SidebarBody className="justify-between gap-10 h-screen bg-gray-100 dark:bg-black border-r border-gray-200 dark:border-gray-800">
          <div className="flex flex-1 flex-col">
            {/* Logo area - Static, no hover */}
            <div className="px-2 py-6 mt-8">
              {open ? <Logo /> : <LogoIcon />}
            </div>
            
            {/* Menu area - WITH hover effect only when not locked */}
            <div 
              className="mt-4 flex flex-col gap-1 flex-1"
              onMouseEnter={() => {
                if (!isLocked) {
                  setOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (!isLocked) {
                  setOpen(false);
                }
              }}
            >
              {links.map((link, idx) => (
                <div
                  key={idx}
                  onClick={link.onClick}
                  className={cn(
                    "cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative",
                    getSelectedKey() === link.label.toLowerCase().replace(/\s+/g, "-") 
                      ? open 
                        ? "bg-cyan-500 text-white mx-2" 
                        : "bg-cyan-500 text-white border-l-4 border-cyan-500"
                      : "mx-2",
                    open ? "p-2" : "p-2 flex justify-center"
                  )}
                >
                  <SidebarLink link={link} className={cn(!open && "justify-center")} />
                </div>
              ))}
              
              {/* Logout within the hover area */}
              <div className="mt-auto pb-4 px-2">
                <div
                  onClick={handleLogout}
                  className={cn(
                    "cursor-pointer rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors",
                    open ? "p-2" : "p-2 flex justify-center"
                  )}
                >
                  <SidebarLink
                    link={{
                      label: "Logout",
                      href: "#",
                      icon: (
                        <LogOut className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      ),
                    }}
                    className={cn(!open && "justify-center")}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <div
      className="relative z-20 flex items-center space-x-3 py-2 text-sm font-normal text-black cursor-pointer"
      onClick={() => window.location.href = "/dashboard"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg">CX</span>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold whitespace-pre text-black dark:text-white text-xl"
      >
        Credexa
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div
      className="relative z-20 flex items-center justify-center py-2 text-sm font-normal text-black cursor-pointer w-full"
      onClick={() => window.location.href = "/dashboard"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg">CX</span>
      </div>
    </div>
  );
};
