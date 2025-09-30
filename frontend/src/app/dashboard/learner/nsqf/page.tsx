"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import { Button } from "@/components/ui/button";
import { Card as AntCard, Row, Col, Space, Empty, Skeleton, ConfigProvider, theme as antdTheme, App, Progress, Badge, Tooltip, Avatar } from "antd";
import { TrendingUp, Target, Award, BookOpen, Trophy, Star, Zap, Crown, Users } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

// Import types
import { 
  NSQFProfile, 
  SkillDomain, 
  Recommendation, 
  LevelInfo, 
  SkillDetails 
} from "@/types/nsqf";

function NSQFProgressPageContent() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";

  // State
  const [profile, setProfile] = useState<NSQFProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillDetails, setSkillDetails] = useState<SkillDetails | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch NSQF profile
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get("/api/nsqf/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching NSQF profile:", error);
      message.error("Failed to load NSQF profile");
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get("/api/nsqf/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Fetch skill progress details
  const fetchSkillDetails = async (skillDomain: string) => {
    if (!skillDomain) return;
    
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get(`/api/nsqf/progress/${encodeURIComponent(skillDomain)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSkillDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching skill details:", error);
      message.error("Failed to load skill details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch level information
  const fetchLevelInfo = async () => {
    try {
      const levels = [];
      for (let i = 1; i <= 10; i++) {
        const response = await api.get(`/api/nsqf/levels/${i}`);
        if (response.data.success) {
          levels.push(response.data.data);
        }
      }
      setLevelInfo(levels);
    } catch (error) {
      console.error("Error fetching level info:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchRecommendations(),
        fetchLevelInfo(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      fetchSkillDetails(selectedSkill);
    }
  }, [selectedSkill]);

  // Helper functions
  const getLevelIcon = (level: number) => {
    if (level === 0) return <BookOpen className="w-5 h-5" />;
    if (level <= 2) return <Star className="w-5 h-5" />;
    if (level <= 4) return <Award className="w-5 h-5" />;
    if (level <= 6) return <Trophy className="w-5 h-5" />;
    if (level <= 8) return <Zap className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  const getLevelColor = (level: number) => {
    if (level === 0) return "#8c8c8c";
    if (level <= 2) return "#52c41a";
    if (level <= 4) return "#1890ff";
    if (level <= 6) return "#722ed1";
    if (level <= 8) return "#eb2f96";
    return "#f5222d";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    return "#52c41a";
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorLink: "var(--color-primary)",
          colorLinkHover: "var(--color-primary)",
          borderRadius: 12,
        },
        components: {
          Card: {
            colorBgContainer: "var(--color-card)",
            headerBg: "var(--color-card)",
          },
          Progress: {
            defaultColor: "var(--color-primary)",
          },
        },
      }}
    >
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                NSQF Progress Tracking
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your skill development journey across NSQF levels
              </p>
            </div>
            <Space>
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </Space>
          </div>

          {loading ? (
            <div className="space-y-6">
              <Skeleton active paragraph={{ rows: 4 }} />
              <Row gutter={[20, 20]}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Col xs={24} sm={12} lg={8} key={i}>
                    <AntCard className="border-0 shadow-lg bg-card/80">
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </AntCard>
                  </Col>
                ))}
              </Row>
            </div>
          ) : !profile ? (
            <AntCard className="py-12 border-0 shadow-lg bg-card/80">
              <Empty 
                description="No NSQF data found. Start by adding some credentials to build your skill profile!" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </AntCard>
          ) : (
            <div className="space-y-8">
              {/* Overall Stats */}
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={6}>
                  <AntCard className="border-0 shadow-lg bg-card/80 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalSkills}</div>
                    <div className="text-sm text-muted-foreground">Skill Domains</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-0 shadow-lg bg-card/80 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.highestLevel}</div>
                    <div className="text-sm text-muted-foreground">Highest Level</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-0 shadow-lg bg-card/80 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalCredentials}</div>
                    <div className="text-sm text-muted-foreground">Total Credentials</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-0 shadow-lg bg-card/80 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalPoints}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </AntCard>
                </Col>
              </Row>

              {/* Skill Domains Grid */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Your Skill Domains
                </h2>
                <Row gutter={[20, 20]}>
                  {profile.skills.map((skill) => (
                    <Col xs={24} sm={12} lg={8} key={skill.skillDomain}>
                      <AntCard
                        className={`border-0 shadow-lg bg-card/80 cursor-pointer transition-all hover:shadow-xl ${
                          selectedSkill === skill.skillDomain ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedSkill(skill.skillDomain)}
                        styles={{ body: { padding: "20px" } }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: `${getLevelColor(skill.currentLevel)}20`, color: getLevelColor(skill.currentLevel) }}
                            >
                              {getLevelIcon(skill.currentLevel)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{skill.skillDomain}</h3>
                              <p className="text-sm text-muted-foreground">
                                Level {skill.currentLevel} - {skill.levelName}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            count={skill.certificatesCount}
                            style={{ backgroundColor: getLevelColor(skill.currentLevel) }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress to Next Level</span>
                              <span>{skill.progress.progressPercentage}%</span>
                            </div>
                            <Progress
                              percent={skill.progress.progressPercentage}
                              showInfo={false}
                              strokeColor={getProgressColor(skill.progress.progressPercentage)}
                              trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                            />
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Points: {skill.totalPoints}</span>
                            {!skill.progress.isMaxLevel && (
                              <span className="text-muted-foreground">
                                Need: {skill.progress.pointsNeeded}
                              </span>
                            )}
                          </div>

                          {skill.progress.isMaxLevel ? (
                            <Badge color="gold" text="Max Level Achieved!" />
                          ) : (
                            <div className="text-sm text-primary">
                              Next: {skill.progress.nextLevelName}
                            </div>
                          )}
                        </div>
                      </AntCard>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Skill Details Modal-like section */}
              {selectedSkill && (
                <AntCard
                  title={
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-primary" />
                      {selectedSkill} - Detailed Progress
                    </div>
                  }
                  className="border-0 shadow-lg bg-card/80"
                  extra={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSkill(null)}
                    >
                      Close
                    </Button>
                  }
                >
                  {loadingDetails ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                  ) : skillDetails ? (
                    <div className="space-y-6">
                      {/* Level Progress Visual */}
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Current Level: {skillDetails.currentLevel}</h3>
                            <p className="text-muted-foreground">{skillDetails.levelName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{skillDetails.totalPoints}</div>
                            <div className="text-sm text-muted-foreground">Total Points</div>
                          </div>
                        </div>
                        
                        {!skillDetails.progress.isMaxLevel && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress to {skillDetails.progress.nextLevelName}</span>
                              <span>{skillDetails.progress.progressPercentage}% ({skillDetails.progress.pointsNeeded} points needed)</span>
                            </div>
                            <Progress
                              percent={skillDetails.progress.progressPercentage}
                              strokeColor={{
                                '0%': '#1890ff',
                                '100%': '#52c41a',
                              }}
                              trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                            />
                          </div>
                        )}
                      </div>

                      {/* Certificates */}
                      {skillDetails.certificates && skillDetails.certificates.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Certificates ({skillDetails.certificates.length})
                          </h4>
                          <Row gutter={[16, 16]}>
                            {skillDetails.certificates.slice(0, 6).map((cert: any) => (
                              <Col xs={24} sm={12} key={cert._id}>
                                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                                  <Avatar 
                                    size="small" 
                                    style={{ backgroundColor: getLevelColor(cert.nsqfLevel || 1) }}
                                  >
                                    {cert.nsqfLevel || '1'}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{cert.title}</div>
                                    <div className="text-xs text-muted-foreground">{cert.issuer}</div>
                                  </div>
                                  <Badge 
                                    count={`${cert.creditPoints || 0}pts`}
                                    style={{ fontSize: '10px', height: '16px', lineHeight: '16px' }}
                                  />
                                </div>
                              </Col>
                            ))}
                          </Row>
                          {skillDetails.certificates.length > 6 && (
                            <div className="text-center mt-3">
                              <Button variant="outline" size="sm">
                                View All {skillDetails.certificates.length} Certificates
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Level Up History */}
                      {skillDetails.levelUpHistory && skillDetails.levelUpHistory.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Level Up History
                          </h4>
                          <div className="space-y-2">
                            {skillDetails.levelUpHistory.slice(0, 3).map((levelUp: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                                <div className="p-2 bg-success/20 rounded-full">
                                  <TrendingUp className="w-4 h-4 text-success" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    Level {levelUp.fromLevel} → {levelUp.toLevel}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(levelUp.achievedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </AntCard>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Learning Recommendations
                  </h2>
                  <Row gutter={[20, 20]}>
                    {recommendations.slice(0, 6).map((rec) => (
                      <Col xs={24} sm={12} lg={8} key={rec.skillDomain}>
                        <AntCard
                          className="border-0 shadow-lg bg-card/80"
                          styles={{ body: { padding: "20px" } }}
                        >
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-foreground">{rec.skillDomain}</h3>
                              <p className="text-sm text-muted-foreground">
                                Level {rec.currentLevel} → {rec.targetLevel}
                              </p>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{rec.progressPercentage}%</span>
                              </div>
                              <Progress
                                percent={rec.progressPercentage}
                                showInfo={false}
                                strokeColor="#1890ff"
                                trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {rec.pointsNeeded} points needed
                              </div>
                            </div>

                            {rec.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Suggested Courses:</h4>
                                <div className="space-y-2">
                                  {rec.suggestions.slice(0, 2).map((suggestion, index) => (
                                    <div key={index} className="text-xs p-2 bg-muted/20 rounded">
                                      <div className="font-medium">{suggestion.title}</div>
                                      <div className="text-muted-foreground">
                                        {suggestion.platform} • {suggestion.points} points
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AntCard>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Learning Pathway & Achievement Timeline */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Learning Journey
                </h2>
                <Row gutter={[20, 20]}>
                  {/* Achievement Stats */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 h-full">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {profile?.skills?.filter(s => s.currentLevel >= 3).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Skills at Intermediate+ Level
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success mb-1">
                            {profile?.skills?.reduce((sum, s) => sum + s.currentLevel, 0) || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Levels Achieved
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-accent mb-1">
                            {Math.round(((profile?.totalPoints || 0) / Math.max(profile?.totalCredentials || 1, 1)) * 10) / 10}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Average Points per Credential
                          </div>
                        </div>
                      </div>
                    </AntCard>
                  </Col>

                  {/* Next Milestones */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-0 shadow-lg bg-card/80 h-full">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-center flex items-center justify-center gap-2">
                          <Target className="w-4 h-4" />
                          Next Milestones
                        </h3>
                        {profile?.skills?.filter(s => !s.progress.isMaxLevel).slice(0, 3).map((skill, index) => (
                          <div key={skill.skillDomain} className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: getLevelColor(skill.currentLevel + 1) }}
                            >
                              {skill.progress.nextLevel || (skill.currentLevel + 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{skill.skillDomain}</div>
                              <div className="text-xs text-muted-foreground">
                                {skill.progress.pointsNeeded} points to {skill.progress.nextLevelName}
                              </div>
                            </div>
                            <div className="text-xs text-primary font-medium">
                              {skill.progress.progressPercentage}%
                            </div>
                          </div>
                        )) || (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            Add credentials to see your milestones
                          </div>
                        )}
                      </div>
                    </AntCard>
                  </Col>

                  {/* Industry Insights */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-0 shadow-lg bg-card/80 h-full">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-center flex items-center justify-center gap-2">
                          <Users className="w-4 h-4" />
                          Industry Insights
                        </h3>
                        
                        {/* Most Valuable Skill */}
                        {profile?.skills?.length > 0 && (
                          <div className="text-center">
                            <div className="p-3 bg-success/10 rounded-lg mb-2">
                              <div className="text-sm font-medium text-success">Your Top Skill</div>
                              <div className="text-lg font-bold">
                                {profile.skills[0]?.skillDomain}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Level {profile.skills[0]?.currentLevel} • {profile.skills[0]?.totalPoints} points
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Industry Demand */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            High Demand Skills
                          </div>
                          <div className="space-y-1">
                            {[
                              { skill: "AI & Machine Learning", demand: "Very High" },
                              { skill: "Cloud Computing", demand: "High" },
                              { skill: "Cybersecurity", demand: "High" }
                            ].map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-xs">
                                <span>{item.skill}</span>
                                <Badge 
                                  color={item.demand === "Very High" ? "red" : "orange"}
                                  text={item.demand}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Career Level */}
                        <div className="text-center pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1">Career Level</div>
                          <div className="font-semibold">
                            {profile?.highestLevel >= 7 ? "Senior Professional" :
                             profile?.highestLevel >= 5 ? "Mid-Level Professional" :
                             profile?.highestLevel >= 3 ? "Junior Professional" : "Entry Level"}
                          </div>
                        </div>
                      </div>
                    </AntCard>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}

import RoleGuard from "@/components/auth/RoleGuard";

export default function NSQFProgressPage() {
  return (
    <RoleGuard allowedRole="learner">
      <App>
        <NSQFProgressPageContent />
      </App>
    </RoleGuard>
  );
}
