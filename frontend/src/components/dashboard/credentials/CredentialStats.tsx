import React from "react";
import { Row, Col } from "antd";
import { CheckCircle, Clock } from "lucide-react";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Credential } from "@/types/credentials";

interface CredentialStatsProps {
  items: Credential[];
}

export const CredentialStats: React.FC<CredentialStatsProps> = ({ items }) => {
  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <CardSpotlight className="mb-8 border-0 shadow bg-card/80 p-0 rounded-lg">
      <div className="p-5 pb-4">
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}>
            <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl font-semibold">{items.length}</div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified
              </div>
              <div className="text-xl font-semibold">{verifiedCount}</div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-yellow-500" /> Pending
              </div>
              <div className="text-xl font-semibold">{pendingCount}</div>
            </div>
          </Col>
        </Row>
      </div>
    </CardSpotlight>
  );
};
