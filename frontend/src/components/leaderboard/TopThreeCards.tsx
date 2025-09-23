"use client";
import React from "react";
import { Row, Col, Avatar, Empty } from "antd";
import { Crown, Medal, Award, Star } from "lucide-react";
import type { LeaderItem } from "./types";

export default function TopThreeCards({ list }: { list: LeaderItem[] }) {
  return (
    <Row gutter={[16, 16]} className="mb-6">
      {list.slice(0, 3).map((rec, idx) => (
        <Col xs={24} md={8} key={rec.id}>
          <div
            className={"rounded-2xl p-6 border shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl bg-card relative"}
            style={{
              borderColor: idx === 0 ? "rgba(234,179,8,0.4)" : idx === 1 ? "rgba(59,130,246,0.35)" : "rgba(249,115,22,0.35)",
              boxShadow: idx === 0 ? "0 10px 30px -10px rgba(234,179,8,0.3)" : idx === 1 ? "0 10px 30px -10px rgba(59,130,246,0.25)" : "0 10px 30px -10px rgba(249,115,22,0.25)",
            }}
          >
            <div className="absolute top-4 right-4">
              {idx === 0 ? <Crown className="w-6 h-6 text-yellow-500" /> : idx === 1 ? <Medal className="w-6 h-6 text-blue-500" /> : <Award className="w-6 h-6 text-orange-500" />}
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
                <div className="text-sm text-muted-foreground">🏅 {rec.credentials} credentials · 🔧 {rec.skills} skills</div>
              </div>
            </div>
          </div>
        </Col>
      ))}
      {list.length === 0 && (
        <Col span={24}>
          <Empty description="No results" />
        </Col>
      )}
    </Row>
  );
}
