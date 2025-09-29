"use client";

import React, { useMemo } from "react";
import { ConfigProvider, theme, Card, Row, Col, Statistic, Segmented, Badge } from "antd";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

// Optional: If you have an EmployerSidebar component, you can include it
// import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";

const AnalyticsPage: React.FC = () => {
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

  // Sample analytics data; replace with API when backend is ready
  const kpis = {
    candidatesHired: 28,
    credentialsVerified: 312,
    profileSearches: 1587,
    interviewsScheduled: 64,
    offerAcceptance: 78, // %
  };

  const searchesOverTime = [
    { day: "Mon", searches: 210 },
    { day: "Tue", searches: 245 },
    { day: "Wed", searches: 260 },
    { day: "Thu", searches: 300 },
    { day: "Fri", searches: 310 },
    { day: "Sat", searches: 270 },
    { day: "Sun", searches: 240 },
  ];

  const credsByType = [
    { type: "Certificates", count: 180 },
    { type: "Degrees", count: 54 },
    { type: "Badges", count: 78 },
  ];

  const hireSources = [
    { name: "Search", value: 44 },
    { name: "Referral", value: 28 },
    { name: "Campaigns", value: 18 },
    { name: "Other", value: 10 },
  ];

  const pipeline = [
    { stage: "Applied", value: 420 },
    { stage: "Screened", value: 300 },
    { stage: "Interview", value: 160 },
    { stage: "Offer", value: 90 },
    { stage: "Hired", value: 28 },
  ];

  const colors = useMemo(() => {
    const seed = {
      primary: "#3b82f6",
      success: "#22c55e",
      warning: "#f59e0b",
      violet: "#8b5cf6",
      cyan: "#06b6d4",
      pink: "#ec4899",
    };
    return seed;
  }, []);

  const axisTick = { fill: isDark ? "#d1d5db" : "#475569" } as const;
  const gridStroke = isDark ? "#374151" : "#e5e7eb";

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          borderRadiusLG: 16,
          borderRadiusSM: 10,
        },
      }}
    >
      <RoleGuard allowedRole="employer">
      <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">
        <EmployerSidebar />
        <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">Employer Analytics</h2>
            <p className="text-sm text-foreground/60">Track hires, verifications, and searches</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggleButton />
          </div>
        </div>

        <div className="px-4 md:px-8 py-6">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Analytics Overview</h1>
            <p className="text-foreground/60 mt-1">Insightful charts to track your hiring performance</p>
          </div>
          <Segmented
            options={["7d", "30d", "90d"]}
            defaultValue="7d"
            onChange={() => {}}
          />
        </motion.div>

        {/* KPI Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="outlined" hoverable>
              <Statistic title="Candidates Hired" value={kpis.candidatesHired} suffix={<Badge color="green" />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="outlined" hoverable>
              <Statistic title="Credentials Verified" value={kpis.credentialsVerified} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="outlined" hoverable>
              <Statistic title="Profile Searches" value={kpis.profileSearches} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="outlined" hoverable>
              <Statistic title="Interviews Scheduled" value={kpis.interviewsScheduled} />
            </Card>
          </Col>
        </Row>

        {/* Charts Grid */}
        <Row gutter={[16, 16]} className="mt-2">
          {/* Line: Searches over time */}
          <Col xs={24} lg={12}>
            <Card title="Profile Searches (Last 7 days)" variant="outlined" hoverable>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={searchesOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="day" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip />
                    <Line type="monotone" dataKey="searches" stroke={colors.primary} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Bar: Credentials by type */}
          <Col xs={24} lg={12}>
            <Card title="Credentials Verified by Type" variant="outlined" hoverable>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={credsByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="type" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      <Cell key="cell-0" fill={colors.success} />
                      <Cell key="cell-1" fill={colors.violet} />
                      <Cell key="cell-2" fill={colors.cyan} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Area: Candidate pipeline */}
          <Col xs={24} lg={14}>
            <Card title="Candidate Pipeline" variant="outlined" hoverable>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pipeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="stage" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke={colors.primary} fill="url(#colorA)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Pie: Hire sources */}
          <Col xs={24} lg={10}>
            <Card title="Hire Sources" variant="outlined" hoverable>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={hireSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {hireSources.map((entry, idx) => (
                        <Cell key={`slice-${idx}`} fill={[colors.primary, colors.success, colors.violet, colors.pink][idx % 4]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Radial: Offer Acceptance */}
          <Col xs={24}>
            <Card title="Offer Acceptance Rate" variant="outlined" hoverable>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={18}
                    data={[{ name: "Acceptance", value: kpis.offerAcceptance }]}
                  >
                    <RadialBar dataKey="value" fill={colors.success} />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={() => `${kpis.offerAcceptance}%`}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
        </div>
        </div>
      </div>
      </RoleGuard>
    </ConfigProvider>
  );
};

export default AnalyticsPage;
