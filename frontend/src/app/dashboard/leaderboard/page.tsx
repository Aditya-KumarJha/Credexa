"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });

import { ConfigProvider, theme as antdTheme, Tabs } from "antd";

import LeaderboardFilters from "@/components/leaderboard/LeaderboardFilters";
import TopThreeCards from "@/components/leaderboard/TopThreeCards";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import ProgressSummary from "@/components/leaderboard/ProgressSummary";
import { useCoursesOptions, useLeaderboardData, useMyProgress } from "@/components/leaderboard/hooks";

export default function LeaderboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // Access guard similar to other dashboard pages
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState<string>("month");
  const [category, setCategory] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");

  // Leaderboard data and filters
  const { data, loading: loadingLeaderboard, filtered } = useLeaderboardData({ query, timeframe, category, course });
  const courses = useCoursesOptions(data);
  // My progress
  const { progress, loading: loadingProgress } = useMyProgress();

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          zIndexPopupBase: 2000,
          borderRadius: 12,
        },
        // Fine-tune components
        components: isDark
          ? {
              Tabs: {
                itemSelectedColor: "var(--color-foreground)",
                itemHoverColor: "var(--color-foreground)",
                inkBarColor: "var(--color-primary)",
              },
              Pagination: {
                itemActiveBg: "var(--color-card)",
                colorText: "var(--color-foreground)",
                colorTextDisabled: "var(--color-muted-foreground)",
              },
            }
          : {
              Table: {
                headerBg: "#F8F9FA", // Very Light Gray / Off-White
                headerColor: "#212529", // Primary Text
                colorText: "#212529",
                colorTextSecondary: "#6C757D",
                borderColor: "#E9ECEF",
                rowHoverBg: "#F1F3F5",
                rowSelectedBg: "#E9ECEF",
                rowSelectedHoverBg: "#E9ECEF",
                // Light backgrounds for sorting states
                headerSortActiveBg: "#F1F3F5",
                headerSortHoverBg: "#F1F3F5",
                bodySortBg: "#F8F9FA",
              },
            },
      }}
      getPopupContainer={() => document.body}
    >
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">Top performers by points, credentials, and skills</p>
            </div>
            <ThemeToggleButton
              variant="gif"
              url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
            />
          </div>
          <Tabs
            defaultActiveKey="leaderboard"
            items={[
              {
                key: "leaderboard",
                label: "Leaderboard",
                children: (
                  <>
                    <LeaderboardFilters
                      query={query}
                      setQuery={setQuery}
                      timeframe={timeframe}
                      setTimeframe={setTimeframe}
                      category={category}
                      setCategory={setCategory}
                      course={course}
                      setCourse={setCourse}
                      courses={courses}
                    />

                    <TopThreeCards list={filtered} />

                    <LeaderboardTable list={filtered} loading={loadingLeaderboard} isDark={isDark} />
                  </>
                ),
              },
              {
                key: "progress",
                label: "My Progress",
                children: (
                  <>
                    <ProgressSummary progress={progress} loading={loadingProgress} />
                  </>
                ),
              },
            ]}
          />
        </main>
      </div>
    </ConfigProvider>
  );
}
