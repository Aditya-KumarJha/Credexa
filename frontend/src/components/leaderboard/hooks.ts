"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/utils/axios";
import type { LeaderItem, MyProgress } from "./types";

export function useLeaderboardData(params: {
  query: string;
  timeframe: string;
  category: string;
  course: string;
}) {
  const { query, timeframe, category, course } = params;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/leaderboard", {
          params: { q: query || undefined, timeframe, category, course: course === "all" ? undefined : course },
        });
        if (Array.isArray(res.data)) setData(res.data as LeaderItem[]);
      } catch {
        // keep mock
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [query, timeframe, category, course]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((it) => (!q || it.name.toLowerCase().includes(q) || it.institute.toLowerCase().includes(q)) && (course === "all" || (it.course || "").toLowerCase() === course.toLowerCase()))
      .map((it) => ({ ...it }))
      .sort((a, b) => a.rank - b.rank);
  }, [data, query, course]);

  return { data, loading, filtered };
}

export function useCoursesOptions(source: LeaderItem[]) {
  const [courses, setCourses] = useState<{ label: string; value: string }[]>([
    { label: "All Courses", value: "all" },
  ]);
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/api/courses");
        if (Array.isArray(res.data)) {
          setCourses([{ label: "All Courses", value: "all" }, ...res.data.map((c: any) => ({ label: c.name || c.title || String(c), value: c.slug || c.id || c.name || String(c) }))]);
          return;
        }
      } catch {}
      // fallback to derive from current data
      const unique = Array.from(new Set(source.map((d) => d.course).filter(Boolean))) as string[];
      setCourses([{ label: "All Courses", value: "all" }, ...unique.map((c) => ({ label: c, value: c }))]);
    };
    fetchCourses();
  }, [source]);
  return courses;
}

export function useMyProgress() {
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyProgress = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await api.get("/api/credentials", { headers: { Authorization: `Bearer ${token}` } });
        const creds = Array.isArray(res.data) ? res.data : [];
        const total = creds.length;
        const verified = creds.filter((c: any) => c.transactionHash && c.transactionHash.trim() !== "").length;
        const pending = creds.filter((c: any) => !c.transactionHash || c.transactionHash.trim() === "").length;
        const expired = 0; // We don't track expired status anymore
        const points = creds.reduce((sum: number, c: any) => sum + (Number(c.creditPoints) || 10), 0);
        const skillCounts: Record<string, number> = {};
        creds.forEach((c: any) => {
          const arr: string[] = Array.isArray(c.skills)
            ? (c.skills as string[])
            : String(c.skills || "").split(",").map((s: string) => s.trim());
          arr.filter(Boolean).forEach((s: string) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        });
        const topSkills = Object.entries(skillCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setProgress({ total, verified, pending, expired, points, topSkills });
      } catch {
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProgress();
  }, []);

  return { progress, loading };
}
