"use client";
import React from "react";
import { Card, Table, Space, Tooltip, Avatar, Tag, Button as AntButton } from "antd";
import { useRouter } from "next/navigation";
import { Medal, Star, Trophy } from "lucide-react";
import type { LeaderItem } from "./types";

export default function LeaderboardTable({ list, loading, isDark }: { list: LeaderItem[]; loading: boolean; isDark: boolean }) {
  const router = useRouter();
  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <Table
        loading={loading}
        rowKey="id"
        dataSource={list}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 720 }}
        columns={[
          {
            title: "Rank",
            dataIndex: "rank",
            width: 100,
            render: (rank: number) => {
              if (rank === 1) return (<Tag color="gold" className="px-3 py-1 text-base flex items-center gap-2"><Trophy className="w-4 h-4" /> 1</Tag>);
              if (rank === 2) return (<Tag color="geekblue" className="px-3 py-1 text-base flex items-center gap-2"><Medal className="w-4 h-4" /> 2</Tag>);
              if (rank === 3) return (<Tag color="purple" className="px-3 py-1 text-base flex items-center gap-2"><Medal className="w-4 h-4" /> 3</Tag>);
              return <span className="font-semibold">{rank}</span>;
            },
            sorter: (a: LeaderItem, b: LeaderItem) => a.rank - b.rank,
            defaultSortOrder: "ascend" as const,
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
          { title: "Course", dataIndex: "course", width: 180, render: (c: string) => c || "-" },
          {
            title: "Points",
            dataIndex: "points",
            width: 140,
            render: (p: number) => (
              <div className="flex items-center gap-2 font-semibold"><Star className="w-4 h-4 text-yellow-500" /> {p.toLocaleString()}</div>
            ),
            sorter: (a: LeaderItem, b: LeaderItem) => a.points - b.points,
          },
          { title: "Credentials", dataIndex: "credentials", width: 140, sorter: (a: LeaderItem, b: LeaderItem) => a.credentials - b.credentials },
          { title: "Skills", dataIndex: "skills", width: 120, sorter: (a: LeaderItem, b: LeaderItem) => a.skills - b.skills },
          {
            title: "Actions",
            key: "actions",
            fixed: "right" as const,
            width: 140,
            render: (_: any, rec: LeaderItem) => (
              <Space>
                <Tooltip title="View Profile">
                  <AntButton type="link" size="small" style={{ color: isDark ? undefined : "#007BFF" }} onClick={() => router.push(`/dashboard/profile?user=${rec.id}`)}>
                    View
                  </AntButton>
                </Tooltip>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
