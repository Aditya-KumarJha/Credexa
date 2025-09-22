"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });

import {
  ConfigProvider,
  theme as antdTheme,
  Table,
  Input,
  Select,
  Card,
  Avatar,
  Space,
  Tag,
  Tooltip,
  Button as AntButton,
  Tabs,
  Row,
  Col,
  Progress,
  Statistic,
  Empty,
} from "antd";
import { Trophy, Medal, Star, Award, Crown } from "lucide-react";
import api from "@/utils/axios";

type LeaderItem = {
  id: string;
  rank: number;
  name: string;
  institute: string;
  avatar: string;
  points: number;
  credentials: number;
  skills: number;
  course?: string;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // Access guard similar to other dashboard pages
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) router.replace("/login");
  }, [router]);

  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState<string>("month");
  const [category, setCategory] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");
  const [courses, setCourses] = useState<{ label: string; value: string }[]>([
    { label: "All Courses", value: "all" },
  ]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Mock leaderboard data (frontend only)
  const [data, setData] = useState<LeaderItem[]>([...Array(20)].map((_, i) => ({
    id: String(i + 1),
    rank: i + 1,
    name: [
      "Aarav Sharma","Isha Verma","Rohan Gupta","Ananya Singh","Vihaan Mehta",
      "Advika Iyer","Kabir Nair","Mira Kapoor","Arjun Reddy","Sara Khan",
      "Riya Patel","Dev Malhotra","Anvi Joshi","Ishaan Bose","Diya Menon",
      "Arnav Jain","Zara Ali","Vivaan Desai","Meera Rao","Ayush Chandra",
    ][i],
    institute: [
      "IIT Delhi","IIT Bombay","NIT Trichy","IIM Ahmedabad","IISc Bangalore",
      "BITS Pilani","Delhi University","Mumbai University","IIT Madras","IIT Kanpur",
      "IIT Roorkee","IIT Kharagpur","JNU","IIT Hyderabad","AIIMS Delhi",
      "IIT BHU","IIT Indore","IIT Guwahati","IIM Bangalore","NIT Suratkal",
    ][i],
    avatar: `https://avatar.vercel.sh/leader${i + 1}.png`,
    points: Math.floor(9000 - i * 250 + (i % 3) * 57),
    credentials: Math.floor(20 - i * 0.6),
    skills: Math.floor(30 - i * 0.7),
    course: [
      "Cloud Computing","Data Science","Cybersecurity","Web Development","AI/ML",
      "Blockchain","DevOps","UI/UX","Mobile Apps","Data Engineering",
      "AR/VR","Product Management","Testing","Game Dev","IOT",
      "Big Data","Networks","Databases","Analytics","Maths",
    ][i],
  })));

  // Attempt to fetch leaderboard and course options from backend (graceful fallback to mock)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await api.get("/api/leaderboard", {
          params: { q: query || undefined, timeframe, category, course: course === "all" ? undefined : course },
        });
        if (Array.isArray(res.data)) {
          setData(res.data as LeaderItem[]);
        }
      } catch (e) {
        // Silently keep mock data
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeframe, category, course]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/api/courses");
        if (Array.isArray(res.data)) {
          setCourses([{ label: "All Courses", value: "all" }, ...res.data.map((c: any) => ({ label: c.name || c.title || String(c), value: c.slug || c.id || c.name || String(c) }))]);
        } else {
          // derive from data
          const unique = Array.from(new Set(data.map((d) => d.course).filter(Boolean))) as string[];
          setCourses([{ label: "All Courses", value: "all" }, ...unique.map((c) => ({ label: c, value: c }))]);
        }
      } catch {
        const unique = Array.from(new Set(data.map((d) => d.course).filter(Boolean))) as string[];
        setCourses([{ label: "All Courses", value: "all" }, ...unique.map((c) => ({ label: c, value: c }))]);
      }
    };
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((it) =>
        (!q || it.name.toLowerCase().includes(q) || it.institute.toLowerCase().includes(q)) &&
        (course === "all" || (it.course || "").toLowerCase() === course.toLowerCase())
      )
      .map((it) => ({ ...it }))
      .sort((a, b) => a.rank - b.rank);
  }, [data, query]);

  // ---- My Progress (per-user) ----
  type MyProgress = {
    total: number;
    verified: number;
    pending: number;
    expired: number;
    points: number;
    topSkills: { name: string; count: number }[];
  };

  const [progress, setProgress] = useState<MyProgress | null>(null);

  useEffect(() => {
    const fetchMyProgress = async () => {
      setLoadingProgress(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await api.get("/api/credentials", { headers: { Authorization: `Bearer ${token}` } });
        const creds = Array.isArray(res.data) ? res.data : [];
        const total = creds.length;
        const verified = creds.filter((c: any) => c.status === "verified").length;
        const pending = creds.filter((c: any) => c.status === "pending").length;
        const expired = creds.filter((c: any) => c.status === "expired").length;
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
        setProgress({ total, verified, pending, expired, points, topSkills });
      } catch (e) {
        setProgress(null);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetchMyProgress();
  }, []);

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
                    <Card className="mb-6 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur" styles={{ body: { background: "transparent" } }}>
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
                            options={[
                              { value: "all", label: "All Categories" },
                              { value: "credentials", label: "Credentials" },
                              { value: "skills", label: "Skills" },
                              { value: "points", label: "Points" },
                            ]}
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
                    <Row gutter={[16, 16]} className="mb-6">
                      {filtered.slice(0, 3).map((rec, idx) => (
                        <Col xs={24} md={8} key={rec.id}>
                          <div
                            className={
                              "rounded-2xl p-6 border shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl bg-card relative"
                            }
                            style={{
                              borderColor:
                                idx === 0 ? "rgba(234,179,8,0.4)" : idx === 1 ? "rgba(59,130,246,0.35)" : "rgba(249,115,22,0.35)",
                              boxShadow:
                                idx === 0
                                  ? "0 10px 30px -10px rgba(234,179,8,0.3)"
                                  : idx === 1
                                  ? "0 10px 30px -10px rgba(59,130,246,0.25)"
                                  : "0 10px 30px -10px rgba(249,115,22,0.25)",
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
                              <div className={`rounded-full p-1 ${idx === 0 ? "ring-4 ring-yellow-400/50" : idx === 1 ? "ring-4 ring-blue-400/40" : "ring-4 ring-orange-400/40"}`}>
                                <Avatar src={rec.avatar} size={96} />
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
                      ))}
                      {filtered.length === 0 && (
                        <Col span={24}>
                          <Empty description="No results" />
                        </Col>
                      )}
                    </Row>

                    {/* Full table */}
                    <Card className="border-0 shadow-xl overflow-hidden">
                      <Table
                        loading={loadingLeaderboard}
                        rowKey="id"
                        dataSource={filtered}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        scroll={{ x: 720 }}
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
                            sorter: (a, b) => a.rank - b.rank,
                            defaultSortOrder: "ascend",
                          },
                          {
                            title: "Participant",
                            dataIndex: "name",
                            className: "min-w-[220px]",
                            render: (_: any, rec: LeaderItem) => (
                              <Space size={12}>
                                <Avatar src={rec.avatar} size={40} />
                                <div>
                                  <div className="font-semibold">{rec.name}</div>
                                  <div className="text-xs text-muted-foreground">{rec.institute}</div>
                                </div>
                              </Space>
                            ),
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
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </>
                ),
              },
              {
                key: "progress",
                label: "My Progress",
                children: (
                  <>
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
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center">
                              <Progress type="circle" percent={progress ? Math.round(((progress.verified || 0) / Math.max(progress.total || 1, 1)) * 100) : 0} size={90} strokeColor="#10b981" />
                              <div className="mt-2 text-sm">Verified</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <Progress type="circle" percent={progress ? Math.round(((progress.pending || 0) / Math.max(progress.total || 1, 1)) * 100) : 0} size={90} strokeColor="#eab308" />
                              <div className="mt-2 text-sm">Pending</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <Progress type="circle" percent={progress ? Math.round(((progress.expired || 0) / Math.max(progress.total || 1, 1)) * 100) : 0} size={90} strokeColor="#ef4444" />
                              <div className="mt-2 text-sm">Expired</div>
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
