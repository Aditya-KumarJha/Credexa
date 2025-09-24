"use client";
import React from "react";
import { Row, Col, Avatar, Empty } from "antd";
import { Crown, Medal, Award, Star, TrendingUp } from "lucide-react";
import type { LeaderItem } from "./types";

interface TopThreeCardsProps {
  list: LeaderItem[];
  sortType?: 'rank' | 'points' | 'credentials' | 'skills';
}

export default function TopThreeCards({ list, sortType = 'rank' }: TopThreeCardsProps) {
  const getSortTitle = () => {
    switch (sortType) {
      case 'points': return 'Top Points Leaders';
      case 'credentials': return 'Top Credential Holders';
      case 'skills': return 'Top Skill Masters';
      default: return 'Leaderboard Champions';
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold">{getSortTitle()}</h3>
      </div>
      <Row gutter={[16, 16]} className="mb-6">
        {list.slice(0, 3).map((rec, idx) => (
        <Col xs={24} md={8} key={rec.id}>
          <div
            className={"rounded-2xl p-6 border shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:scale-105 bg-card relative cursor-pointer"}
            style={{
              borderColor: idx === 0 ? "rgba(234,179,8,0.5)" : idx === 1 ? "rgba(59,130,246,0.4)" : "rgba(249,115,22,0.4)",
              boxShadow: idx === 0 ? "0 20px 40px -15px rgba(234,179,8,0.4)" : idx === 1 ? "0 20px 40px -15px rgba(59,130,246,0.3)" : "0 20px 40px -15px rgba(249,115,22,0.3)",
            }}
          >
            <div className="absolute top-4 right-4 flex flex-col items-center">
              {idx === 0 ? <Crown className="w-6 h-6 text-yellow-500" /> : idx === 1 ? <Medal className="w-6 h-6 text-blue-500" /> : <Award className="w-6 h-6 text-orange-500" />}
              <span className="text-xs font-bold mt-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                #{idx + 1}
              </span>
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
                  <Star className="w-4 h-4 text-yellow-500" /> 
                  <span className={sortType === 'points' ? 'text-green-500 font-bold' : ''}>
                    {rec.points.toLocaleString()} points
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <span className={sortType === 'credentials' ? 'text-green-500 font-semibold' : ''}>
                    🏅 {rec.credentials} credentials
                  </span>
                  <span className={sortType === 'skills' ? 'text-green-500 font-semibold' : ''}>
                    🔧 {rec.skills} skills
                  </span>
                </div>
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
    </div>
  );
}
