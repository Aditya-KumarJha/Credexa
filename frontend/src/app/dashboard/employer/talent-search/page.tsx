"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Select, Button, Tabs, Tag, Avatar, ConfigProvider, theme } from "antd";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import { useTheme } from "next-themes";
import { searchLearners as apiSearchLearners, fetchPublicProfile } from "@/lib/api/talent";

// Types
interface CandidateSkill {
  subject: string;
  A: number;
  fullMark: number;
}

interface VerifiedCredential {
  id: string;
  issuer: string;
  name: string;
  date: string;
}

interface Candidate {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  role: string;
  scores: {
    efficiency: number;
    social: number;
    performance: number;
  };
  skills: CandidateSkill[];
  topSkills: string[];
  email: string | null;
  phone: string | null;
  verifiedCredentials: VerifiedCredential[];
}

interface AnimatedSearchBarProps {
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;
  onSubmit: (query: string) => void;
}

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
}

interface CandidateProfileProps {
  candidate: Candidate | null;
  onBack: () => void;
}

// --- MOCK DATA ---
const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Johan Sundstein",
    username: "N0tail",
    avatarUrl: "https://i.pravatar.cc/150?u=johan",
    role: "Senior Frontend Developer",
    scores: {
      efficiency: 103,
      social: 79,
      performance: 94,
    },
    skills: [
      { subject: "React", A: 95, fullMark: 100 },
      { subject: "Next.js", A: 90, fullMark: 100 },
      { subject: "Teamwork", A: 85, fullMark: 100 },
      { subject: "Communication", A: 88, fullMark: 100 },
      { subject: "TypeScript", A: 92, fullMark: 100 },
      { subject: "Problem Solving", A: 80, fullMark: 100 },
    ],
    topSkills: ["React", "Next.js", "Web3"],
    email: "johan.sundstein@example.com",
    phone: "+1 234 567 890",
    verifiedCredentials: [
      { id: "vc1", issuer: "MIT", name: "Advanced TypeScript", date: "2023-05-15" },
      { id: "vc2", issuer: "Google", name: "Certified Cloud Architect", date: "2022-11-20" },
    ],
  },
  {
    id: "2",
    name: "Alexei Berezin",
    username: "Solo",
    avatarUrl: "https://i.pravatar.cc/150?u=alexei",
    role: "Lead Backend Engineer",
    scores: {
      efficiency: 100,
      social: 109,
      performance: 87,
    },
    skills: [
      { subject: "Node.js", A: 98, fullMark: 100 },
      { subject: "MongoDB", A: 92, fullMark: 100 },
      { subject: "Leadership", A: 90, fullMark: 100 },
      { subject: "System Design", A: 95, fullMark: 100 },
      { subject: "ethers.js", A: 85, fullMark: 100 },
      { subject: "DevOps", A: 88, fullMark: 100 },
    ],
    topSkills: ["Node.js", "MongoDB", "System Architecture"],
    email: "alexei.berezin@example.com",
    phone: "+1 987 654 321",
    verifiedCredentials: [
      { id: "vc3", issuer: "Chainlink", name: "Smart Contract Developer", date: "2023-01-10" },
    ],
  },
  {
    id: "3",
    name: "Sasha Hostyn",
    username: "Scarlett",
    avatarUrl: "https://i.pravatar.cc/150?u=sasha",
    role: "UI/UX Designer",
    scores: {
      efficiency: 95,
      social: 92,
      performance: 98,
    },
    skills: [
      { subject: "Figma", A: 99, fullMark: 100 },
      { subject: "User Research", A: 90, fullMark: 100 },
      { subject: "Prototyping", A: 92, fullMark: 100 },
      { subject: "Communication", A: 85, fullMark: 100 },
      { subject: "Design Systems", A: 94, fullMark: 100 },
      { subject: "Creativity", A: 96, fullMark: 100 },
    ],
    topSkills: ["Figma", "User Research", "Design Systems"],
    email: "sasha.hostyn@example.com",
    phone: "+1 555 123 456",
    verifiedCredentials: [
      { id: "vc4", issuer: "Nielsen Norman Group", name: "UX Certified", date: "2022-08-01" },
    ],
  },
];

// --- SVG ICONS (self-contained) ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

// --- SUB-COMPONENTS ---
// Reusable SearchBar wrapped with shared layoutId for smooth morphing
const SearchBar: React.FC<{ onFocus: () => void; onSubmit: (q: string) => void }> = ({ onFocus, onSubmit }) => {
  const [query, setQuery] = useState("");
  return (
  <motion.div
    layoutId="talent-searchbar"
    layout
    transition={{ layout: { duration: 0.45, ease: "easeInOut" } }}
    className="w-full max-w-4xl bg-white dark:bg-gray-900/60 p-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center gap-2">
      <Tabs
        defaultActiveKey="role"
        className="custom-tabs flex-shrink-0"
        items={[
          {
            key: "role",
            label: (
              <span className="flex items-center gap-2 px-2">
                <BriefcaseIcon className="h-4 w-4" /> Roles
              </span>
            ),
          },
          {
            key: "user",
            label: (
              <span className="flex items-center gap-2 px-2">
                <UserIcon className="h-4 w-4" /> Users
              </span>
            ),
          },
        ]}
      />
      <input
        type="text"
        placeholder="Search for 'React Developer' or 'Johan'..."
        className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg px-4 py-2"
        onFocus={onFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit(query);
        }}
      />
      <button
        className="bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
        onClick={() => onSubmit(query)}
      >
        <SearchIcon className="h-6 w-6" />
      </button>
    </div>
  </motion.div>
);
};

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({ isSearching, setIsSearching, onSubmit }) => {
  return (
    <>
      <AnimatePresence initial={false}>
        {!isSearching && (
          <motion.div
            key="hero"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full z-20 flex flex-col items-center justify-center h-[70vh]"
            onClick={() => setIsSearching(true)}
          >
            <motion.div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100">Find The Talent You Need.</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-2xl">
                Search by skill, role, or name to connect with verified professionals.
              </p>
            </motion.div>
            <SearchBar onFocus={() => setIsSearching(true)} onSubmit={onSubmit} />
          </motion.div>
        )}
      </AnimatePresence>

      {isSearching && (
        <motion.div
          key="sticky"
          layout
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="sticky top-0 z-30 bg-gradient-to-b from-white/80 dark:from-gray-950/80 to-transparent px-4 md:px-8 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
        >
          <div className="flex justify-center">
            <SearchBar onFocus={() => {}} onSubmit={onSubmit} />
          </div>
        </motion.div>
      )}
    </>
  );
};

// Horizontal filter bar shown below the search bar
const FilterBar: React.FC<{
  roles: string[];
  onRolesChange: (r: string[]) => void;
  skills: string[];
  onSkillsChange: (s: string[]) => void;
  experience?: string | null;
  onExperienceChange: (e: string | null) => void;
  onApply: () => void;
  onReset: () => void;
}> = ({ roles, onRolesChange, skills, onSkillsChange, experience, onExperienceChange, onApply, onReset }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-7xl mx-auto px-4 md:px-8"
    >
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Role */}
        <div className="w-full md:w-1/3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</div>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="e.g., React Developer, Backend Engineer"
            value={roles}
            onChange={(vals) => onRolesChange(vals as string[])}
          />
        </div>
        {/* Skill */}
        <div className="w-full md:w-1/3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill</div>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="e.g., React, Node.js"
            value={skills}
            onChange={(vals) => onSkillsChange(vals as string[])}
          />
        </div>
        {/* Experience */}
        <div className="w-full md:w-1/4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience</div>
          <Select
            allowClear
            placeholder="Select"
            style={{ width: "100%" }}
            value={experience ?? undefined}
            onChange={(val) => onExperienceChange((val as string) || null)}
            options={[
              { label: "Intern", value: "intern" },
              { label: "Junior", value: "junior" },
              { label: "Mid-Level", value: "mid" },
              { label: "Senior", value: "senior" },
            ]}
          />
        </div>
        {/* Actions */}
        <div className="flex gap-2 md:ml-auto">
          <Button onClick={onReset}>Reset</Button>
          <Button type="primary" onClick={onApply}>Apply</Button>
        </div>
      </div>
    </motion.div>
  );
};

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onSelect }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onSelect(candidate)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Avatar src={candidate.avatarUrl} size={64} />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">@{candidate.username}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.efficiency}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Efficiency</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.social}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Social Score</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.performance}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {candidate.topSkills.map((skill) => (
          <Tag key={skill}>{skill}</Tag>
        ))}
      </div>
    </motion.div>
  );
};

const CandidateProfile: React.FC<CandidateProfileProps> = ({ candidate, onBack }) => {
  if (!candidate) return null;

  const { token } = theme.useToken();
  const tabItems = [
    {
      key: "1",
      label: "Verified Credentials",
      children: (
        <div className="space-y-4">
          {candidate.verifiedCredentials.map((cred) => (
            <div key={cred.id} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-gray-100">{cred.name}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Issued by: {cred.issuer}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Date: {cred.date}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "2",
      label: "Projects & Experience",
      children: <p className="text-foreground/70">Project and experience details would be displayed here.</p>,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-foreground/80 hover:text-foreground">
        <ArrowLeftIcon className="h-5 w-5" /> Back to Search
      </button>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full lg:w-2/3 space-y-8">
          <div className="bg-white dark:bg-gray-900/60 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-gray-200 dark:border-gray-700">
            <Avatar src={candidate.avatarUrl} size={128} />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h1>
              <p className="text-xl text-blue-600 dark:text-blue-400">@{candidate.username}</p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">{candidate.role}</p>
              <div className="flex gap-2 mt-4">
                <Button type="primary">Contact</Button>
                <Button>Download Resume</Button>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Tabs defaultActiveKey="1" items={tabItems} />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-foreground mb-4">Skills Radar</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={candidate.skills}>
                  <PolarGrid stroke={token.colorSplit} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: token.colorText }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={candidate.name} dataKey="A" stroke={token.colorPrimary} fill={token.colorPrimary} fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Data</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Email:</strong> {candidate.email}
              </p>
              <p>
                <strong>Phone:</strong> {candidate.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- EXPLORE PAGE CONTENT ---
const ExploreContent: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState<string | null>(null);
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Memoize theme for Ant Design ConfigProvider
  const antTheme = useMemo(() => {
    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: "#3b82f6",
        colorBgBase: isDark ? "#0b0f1a" : "#ffffff",
        colorBgContainer: isDark ? "#0f172a" : "#ffffff",
        colorText: isDark ? "rgba(255,255,255,0.92)" : "#111827",
        colorBorder: isDark ? "#334155" : "#e5e7eb",
        borderRadius: 12,
      },
      components: {
        Tabs: {
          cardBg: "transparent",
          itemColor: isDark ? "rgba(255,255,255,0.65)" : "#374151",
          itemSelectedColor: "#3b82f6",
          inkBarColor: "#3b82f6",
        },
      },
    } as const;
  }, [isDark]);

  const handleSelectCandidate = (candidate: Candidate) => {
    // Fetch full profile from backend
    fetchPublicProfile(candidate.id)
      .then((res) => {
        if (res?.success && res.candidate) {
          setSelectedCandidate(res.candidate as any);
        } else {
          setSelectedCandidate(candidate);
        }
      })
      .catch(() => setSelectedCandidate(candidate));
  };

  const handleBackToSearch = () => {
    setSelectedCandidate(null);
  };

  const performSearch = async (q: string) => {
    setIsSearching(true);
    setLoading(true);
    try {
      // Combine role tags with query for backend text search; skills go as dedicated param
      const combinedQ = [q, ...roles].filter(Boolean).join(" ").trim();
      const res = await apiSearchLearners({ q: combinedQ, skills });
      const list = (res?.candidates || []) as any[];
      // Convert to Candidate shape for list view (without radar/creds)
      const items: Candidate[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: c.role,
        scores: c.scores,
        topSkills: c.topSkills || [],
        // placeholders; full details fetched on click
        skills: [],
        email: "",
        phone: "",
        verifiedCredentials: [],
      }));
      setResults(items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={antTheme}>
      <style jsx global>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          border-bottom: none !important;
        }
        .custom-tabs .ant-tabs-tab {
          border: none !important;
          background: transparent !important;
        }
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: none !important;
        }
      `}</style>
      <main className="min-h-screen w-full transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <AnimatePresence mode="wait">
          {selectedCandidate ? (
            <CandidateProfile key="profile" candidate={selectedCandidate} onBack={handleBackToSearch} />
          ) : (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <div className={`relative ${isSearching ? "pt-8 px-4 md:px-8" : "h-screen"}`}>
                <AnimatedSearchBar isSearching={isSearching} setIsSearching={setIsSearching} onSubmit={performSearch} />
              </div>

              {isSearching && (
                <div className="w-full flex flex-col gap-4 pb-8">
                  {/* Horizontal Filter Bar */}
                  <FilterBar
                    roles={roles}
                    onRolesChange={setRoles}
                    skills={skills}
                    onSkillsChange={setSkills}
                    experience={experience}
                    onExperienceChange={setExperience}
                    onApply={() => performSearch("")}
                    onReset={() => {
                      setRoles([]);
                      setSkills([]);
                      setExperience(null);
                      performSearch("");
                    }}
                  />
                  {/* Results Grid */}
                  <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                    <motion.div
                      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                      {(loading ? [] : results).map((candidate) => (
                        <CandidateCard key={candidate.id} candidate={candidate} onSelect={handleSelectCandidate} />
                      ))}
                      {!loading && results.length === 0 && (
                        <div className="col-span-full text-center text-gray-600 dark:text-gray-300">
                          Start searching to see candidates.
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </ConfigProvider>
  );
};

// --- PAGE WRAPPER WITH EMPLOYER LAYOUT ---
export default function EmployerTalentSearchPage() {
  return (
    <RoleGuard allowedRole="employer">
      <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">
        <EmployerSidebar />
        <div className="flex-1 overflow-y-auto relative">
          {/* Top Bar */}
          <div className="flex items-center justify-end p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>

          {/* Content */}
          <ExploreContent />
        </div>
      </div>
    </RoleGuard>
  );
}
