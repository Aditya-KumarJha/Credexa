import React from "react";
import { Input, Select, Row, Col } from "antd";
import { CredentialFilters, SortKey } from "@/types/credentials";

interface CredentialFiltersProps {
  filters: CredentialFilters;
  onFiltersChange: (filters: Partial<CredentialFilters>) => void;
  uniqueIssuers: string[];
}

export const CredentialFiltersComponent: React.FC<CredentialFiltersProps> = ({
  filters,
  onFiltersChange,
  uniqueIssuers,
}) => {
  return (
    <div className="mb-8 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur p-0 rounded-lg">
      <div className="p-5">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <div className="relative z-30">
              <Input
                placeholder="Search by title, issuer, or skill"
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                allowClear
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="relative z-30">
              <Select 
                value={filters.typeFilter} 
                onChange={(value) => onFiltersChange({ typeFilter: value })} 
                className="w-full" 
                options={[
                  { value: "all", label: "All Types" },
                  { value: "certificate", label: "Certificate" },
                  { value: "degree", label: "Degree" },
                  { value: "license", label: "License" },
                  { value: "badge", label: "Badge" },
                ]} 
              />
            </div>
          </Col>
          <Col xs={12} md={5}>
            <div className="relative z-30">
              <Select 
                value={filters.statusFilter} 
                onChange={(value) => onFiltersChange({ statusFilter: value })} 
                className="w-full" 
                options={[
                  { value: "all", label: "All Blockchain Status" },
                  { value: "anchored", label: "On-Chain Proof" },
                  { value: "not-anchored", label: "No On-Chain Proof" },
                ]} 
              />
            </div>
          </Col>
          <Col xs={12} md={5}>
            <div className="relative z-30">
              <Select
                value={filters.issuerFilter}
                onChange={(value) => onFiltersChange({ issuerFilter: value })}
                className="w-full"
                options={uniqueIssuers.map((u) => ({ value: u, label: u === "all" ? "All Issuers" : u }))}
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="relative z-30">
              <Select
                value={filters.sortKey}
                onChange={(value: SortKey) => onFiltersChange({ sortKey: value })}
                className="w-full"
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "az", label: "Title A→Z" },
                  { value: "za", label: "Title Z→A" },
                  { value: "pointsDesc", label: "Points High→Low" },
                  { value: "pointsAsc", label: "Points Low→High" },
                ]}
              />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
