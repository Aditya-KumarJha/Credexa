"use client";
import React from "react";
import { Card, Col, Progress, Row, Statistic, Tag } from "antd";
import type { MyProgress } from "./types";

export default function ProgressSummary({ progress, loading }: { progress: MyProgress | null; loading: boolean }) {
  if (!progress) {
    return <Card loading={loading} className="border-0 shadow-xl">No data</Card>;
  }

  const percentVerified = progress.total > 0 ? Math.round((progress.verified / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card className="border-0 shadow-xl" loading={loading}>
            <Statistic title="Total Credentials" value={progress.total} />
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Verified</span>
                <span className="font-medium">{progress.verified}</span>
              </div>
              <Progress percent={percentVerified} status="active" />
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Pending</span>
                <span className="font-medium">{progress.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span>Expired</span>
                <span className="font-medium">{progress.expired}</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card className="border-0 shadow-xl" loading={loading}>
            <Statistic title="Points" value={progress.points} suffix="pts" />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="border-0 shadow-xl" loading={loading}>
            <div className="font-semibold mb-3">Top Skills</div>
            <div className="flex flex-wrap gap-2">
              {progress.topSkills.length === 0 ? (
                <span className="text-sm text-muted-foreground">No skills found</span>
              ) : (
                progress.topSkills.map((s) => (
                  <Tag key={s.name} className="px-3 py-1 text-sm" color="purple">
                    {s.name}
                  </Tag>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
