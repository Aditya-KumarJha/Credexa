"use client";

<<<<<<< Updated upstream
import { useEffect, useMemo, useState, useCallback } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  const [sortField, setSortField] = useState<string>("points");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [courses, setCourses] = useState<{ label: string; value: string }[]>([
    { label: "All Skills", value: "all" },
  ]);
  const [credentialTypes, setCredentialTypes] = useState<{ label: string; value: string }[]>([
    { label: "All Types", value: "all" },
  ]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Leaderboard data from backend
  const [data, setData] = useState<LeaderItem[]>([]);

  // Attempt to fetch leaderboard and skill categories from backend
  useEffect(() => {
    let isMounted = true;
    
    const fetchLeaderboard = async () => {
      if (!isMounted) return;
      setLoadingLeaderboard(true);
      const token = localStorage.getItem("authToken");
      try {
        const res = await api.get("/api/leaderboard", {
          params: { q: query || undefined, timeframe, category, course: course === "all" ? undefined : course },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(res.data) && isMounted) {
          console.log('Leaderboard data received:', res.data);
          console.log('First item structure:', res.data[0]);
          // Clean the data to ensure it matches our expected structure
          const cleanedData = res.data.map((item: any) => ({
            id: String(item.id),
            rank: Number(item.rank),
            name: String(item.name || 'Unknown'),
            institute: String(item.institute || 'Unknown'),
            avatar: String(item.avatar || ''),
            points: Number(item.points || 0),
            credentials: Number(item.credentials || 0),
            skills: Number(item.skills || 0),
            course: String(item.course || 'General')
          }));
          console.log('Cleaned data:', cleanedData[0]);
          setData(cleanedData as LeaderItem[]);
        } else if (isMounted) {
          setData([]);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard data:", e);
        if (isMounted) {
          setData([]);
        }
      } finally {
        if (isMounted) {
          setLoadingLeaderboard(false);
        }
      }
    };
    
    fetchLeaderboard();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeframe, category, course]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSkillCategories = async () => {
      if (!isMounted) return;
      const token = localStorage.getItem("authToken");
      try {
        const res = await api.get("/api/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) {
          if (res.data?.credentialTypes) {
            setCredentialTypes(res.data.credentialTypes);
          }
          if (res.data?.allSkills) {
            setCourses([
              { label: "All Skills", value: "all" },
              ...res.data.allSkills.map((skill: string) => ({
                label: skill,
                value: skill
              }))
            ]);
          }
        }
      } catch (e) {
        console.log("Using default skill categories:", e);
        // Keep default categories and courses
      }
    };
    
    fetchSkillCategories();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filteredData = data.filter((it) =>
      (!q || it.name.toLowerCase().includes(q) || it.institute.toLowerCase().includes(q)) &&
      (course === "all" || (it.course || "").toLowerCase() === course.toLowerCase())
    );

    // Apply sorting based on current sort field and order
    filteredData.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "points":
          aValue = a.points;
          bValue = b.points;
          break;
        case "credentials":
          aValue = a.credentials;
          bValue = b.credentials;
          break;
        case "skills":
          aValue = a.skills;
          bValue = b.skills;
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.points;
          bValue = b.points;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "ascend" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "ascend" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });
    
    // Assign dynamic ranks based on current filtered and sorted data
    return filteredData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [data, query, course, sortField, sortOrder]);

  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    if (sorter && !Array.isArray(sorter)) {
      setSortField(sorter.field as string || "points");
      setSortOrder(sorter.order || "descend");
    }
  }, []);

  // ---- My Progress (per-user) ----
  type MyProgress = {
    total: number;
    verified: number;
    pending: number;
    points: number;
    topSkills: { name: string; count: number }[];
  };

  const [progress, setProgress] = useState<MyProgress | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMyProgress = async () => {
      if (!isMounted) return;
      setLoadingProgress(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !isMounted) return;
        const res = await api.get("/api/credentials", { headers: { Authorization: `Bearer ${token}` } });
        if (!isMounted) return;
        
        const creds = Array.isArray(res.data) ? res.data : [];
        const total = creds.length;
        const verified = creds.filter((c: any) => c.status === "verified").length;
        const pending = creds.filter((c: any) => c.status === "pending").length;
        const points = creds.reduce((sum: number, c: any) => sum + (Number(c.creditPoints) || 10), 0);
        const skillCounts: Record<string, number> = {};
        creds.forEach((c: any) => {
          const arr: string[] = Array.isArray(c.skills)
            ? (c.skills as string[])
            : String(c.skills || "")
                .split(",")
                .map((s: string) => s.trim());
          arr.filter(Boolean).forEach((s: string) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        });
        const topSkills = Object.entries(skillCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        if (isMounted) {
          setProgress({ total, verified, pending, points, topSkills });
        }
      } catch (e) {
        if (isMounted) {
          setProgress(null);
        }
      } finally {
        if (isMounted) {
          setLoadingProgress(false);
        }
      }
    };
    
    fetchMyProgress();
    
    return () => {
      isMounted = false;
    };
  }, []);
=======
  // Leaderboard data and filters
  const { data, loading: loadingLeaderboard, filtered } = useLeaderboardData({ query, timeframe, category, course });
  const courses = useCoursesOptions(data);
  // My progress
  const { progress, loading: loadingProgress } = useMyProgress();
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
                    <Card className="mb-8 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur" styles={{ body: { background: "transparent" } }}>
                      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                        <Input
                          placeholder="Search by name or institute"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          allowClear
                          className="max-w-xl"
                        />
                        <div className="flex items-center gap-3 flex-wrap">
                          <Select
                            className="w-40"
                            value={timeframe}
                            onChange={setTimeframe}
                            options={[
                              { value: "week", label: "This Week" },
                              { value: "month", label: "This Month" },
                              { value: "all", label: "All Time" },
                            ]}
                          />
                          <Select
                            className="w-40"
                            value={category}
                            onChange={setCategory}
                            options={credentialTypes}
                          />
                          <Select
                            className="w-56"
                            value={course}
                            onChange={setCourse}
                            options={courses}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Top 3 cards */}
                    <div className="mt-8 mb-8 p-6 rounded-2xl bg-gradient-to-r from-card/30 to-card/10 border border-border/50">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                          🏆 Top Performers
                        </h2>
                        <p className="text-sm text-muted-foreground">Leading the way in points, credentials, and skills</p>
                      </div>
                      <Row gutter={[24, 24]} className="justify-center">
                      {filtered.slice(0, 3).map((rec, idx) => (
                        rec && rec.id ? (
                        <Col xs={24} sm={12} lg={8} key={rec.id}>
                          <div
                            className={
                              "rounded-2xl p-6 border shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-card relative overflow-hidden"
                            }
                            style={{
                              borderColor:
                                idx === 0 ? "rgba(234,179,8,0.5)" : idx === 1 ? "rgba(59,130,246,0.4)" : "rgba(249,115,22,0.4)",
                              boxShadow:
                                idx === 0
                                  ? "0 20px 40px -15px rgba(234,179,8,0.4)"
                                  : idx === 1
                                  ? "0 20px 40px -15px rgba(59,130,246,0.3)"
                                  : "0 20px 40px -15px rgba(249,115,22,0.3)",
                            }}
                          >
                            <div className="absolute top-4 right-4">
                              {idx === 0 ? (
                                <Crown className="w-6 h-6 text-yellow-500" />
                              ) : idx === 1 ? (
                                <Medal className="w-6 h-6 text-blue-500" />
                              ) : (
                                <Award className="w-6 h-6 text-orange-500" />
                              )}
                            </div>
                            <div className="flex flex-col items-center text-center gap-4">
                              <div className="relative">
                                <div className={`rounded-full p-1 ${idx === 0 ? "ring-4 ring-yellow-400/50" : idx === 1 ? "ring-4 ring-blue-400/40" : "ring-4 ring-orange-400/40"}`}>
                                  <Avatar src={rec.avatar || undefined} size={96} />
                                </div>
                                {/* Ranking badge */}
                                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-blue-500" : "bg-orange-500"
                                }`}>
                                  {idx + 1}
                                </div>
                              </div>
                              <div>
                                <div className="text-xl font-bold">{rec.name}</div>
                                <div className="text-xs text-muted-foreground">{rec.course || rec.institute}</div>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-lg font-semibold flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" /> {rec.points.toLocaleString()} points
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  🏅 {rec.credentials} credentials · 🔧 {rec.skills} skills
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ) : null
                      ))}
                      {filtered.length === 0 && (
                        <Col span={24}>
                          <Empty description="No results" />
                        </Col>
                      )}
                    </Row>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Complete Leaderboard</h3>
                      <Card className="border-0 shadow-xl overflow-hidden">
                      <Table
                        loading={loadingLeaderboard}
                        rowKey="id"
                        dataSource={filtered.filter(item => item && item.id)}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        scroll={{ x: 720 }}
                        onChange={handleTableChange}
                        columns={[
                          {
                            title: "Rank",
                            dataIndex: "rank",
                            width: 100,
                            render: (rank: number) => {
                              if (rank === 1) {
                                return (
                                  <Tag color="gold" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Trophy className="w-4 h-4" /> 1
                                  </Tag>
                                );
                              }
                              if (rank === 2) {
                                return (
                                  <Tag color="geekblue" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Medal className="w-4 h-4" /> 2
                                  </Tag>
                                );
                              }
                              if (rank === 3) {
                                return (
                                  <Tag color="purple" className="px-3 py-1 text-base flex items-center gap-2">
                                    <Medal className="w-4 h-4" /> 3
                                  </Tag>
                                );
                              }
                              return <span className="font-semibold">{rank}</span>;
                            },
                            sorter: false, // Disable sorting on rank as it's computed dynamically
                          },
                          {
                            title: "Participant",
                            dataIndex: "name",
                            className: "min-w-[220px]",
                            render: (_: any, rec: LeaderItem) => (
                              <Space size={12}>
                                <Avatar src={rec.avatar || undefined} size={40} />
                                <div>
                                  <div className="font-semibold">{rec.name}</div>
                                  <div className="text-xs text-muted-foreground">{rec.institute}</div>
                                </div>
                              </Space>
                            ),
                            sorter: (a, b) => a.name.localeCompare(b.name),
                          },
                          {
                            title: "Course",
                            dataIndex: "course",
                            width: 180,
                            render: (c: string) => c || "-",
                          },
                          {
                            title: "Points",
                            dataIndex: "points",
                            width: 140,
                            render: (p: number) => (
                              <div className="flex items-center gap-2 font-semibold">
                                <Star className="w-4 h-4 text-yellow-500" /> {p.toLocaleString()}
                              </div>
                            ),
                            sorter: (a, b) => a.points - b.points,
                          },
                          {
                            title: "Credentials",
                            dataIndex: "credentials",
                            width: 140,
                            sorter: (a, b) => a.credentials - b.credentials,
                          },
                          {
                            title: "Skills",
                            dataIndex: "skills",
                            width: 120,
                            sorter: (a, b) => a.skills - b.skills,
                          },
                          {
                            title: "Actions",
                            key: "actions",
                            fixed: "right",
                            width: 140,
                            render: (_: any, rec: LeaderItem) => (
                              rec && rec.id ? (
                              <Space>
                                <Tooltip title="View Profile">
                                  <AntButton
                                    type="link"
                                    size="small"
                                    style={{ color: isDark ? undefined : "#007BFF" }}
                                    onClick={() => router.push(`/dashboard/profile?user=${rec.id}`)}
                                  >
                                    View
                                  </AntButton>
                                </Tooltip>
                              </Space>
                              ) : null
                            ),
                          },
                        ]}
                      />
                    </Card>
                    </div>
=======
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
>>>>>>> Stashed changes
                  </>
                ),
              },
              {
                key: "progress",
                label: "My Progress",
                children: (
                  <>
<<<<<<< Updated upstream
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card className="border-0 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-lg font-semibold">Credentials Overview</div>
                              <div className="text-xs text-muted-foreground">Your verification status summary</div>
                            </div>
                            <Statistic title="Total" value={progress?.total ?? 0} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center">
                              <Progress type="circle" percent={progress ? Math.round(((progress.verified || 0) / Math.max(progress.total || 1, 1)) * 100) : 0} size={90} strokeColor="#10b981" />
                              <div className="mt-2 text-sm">Verified</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <Progress type="circle" percent={progress ? Math.round(((progress.pending || 0) / Math.max(progress.total || 1, 1)) * 100) : 0} size={90} strokeColor="#eab308" />
                              <div className="mt-2 text-sm">Pending</div>
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} md={12}>
                        <Card className="border-0 shadow-lg">
                          <div className="text-lg font-semibold mb-1">Points</div>
                          <div className="text-xs text-muted-foreground mb-4">Estimated based on your credentials</div>
                          <div className="flex items-center gap-3">
                            <Star className="w-6 h-6 text-yellow-500" />
                            <div className="text-3xl font-bold">{(progress?.points ?? 0).toLocaleString()}</div>
                          </div>
                          <div className="mt-6">
                            <div className="text-xs text-muted-foreground mb-2">Progress to next milestone</div>
                            <Progress percent={Math.min(100, Math.round(((progress?.points ?? 0) % 1000) / 10))} showInfo />
                          </div>
                        </Card>
                      </Col>
                      <Col span={24}>
                        <Card className="border-0 shadow-lg">
                          <div className="text-lg font-semibold mb-4">Top Skills</div>
                          {loadingProgress ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          ) : progress && progress.topSkills.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {progress.topSkills.map((s) => (
                                <div key={s.name} className="bg-card rounded-lg border p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-muted-foreground">{s.count} creds</div>
                                  </div>
                                  <div className="h-2 mt-3 rounded bg-[color:var(--color-border)]">
                                    <div
                                      className="h-2 rounded bg-[color:var(--color-primary)]"
                                      style={{ width: `${Math.min(100, (s.count / (progress.total || 1)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Empty description="No skills data" />
                          )}
                        </Card>
                      </Col>
                    </Row>
=======
                    <ProgressSummary progress={progress} loading={loadingProgress} />
>>>>>>> Stashed changes
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
