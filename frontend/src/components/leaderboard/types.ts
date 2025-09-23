export type LeaderItem = {
  id: string;
  rank: number;
  name: string;
  institute: string;
  avatar: string;
  points: number;
  credentials: number;
  skills: number;
  course?: string;
};

export type MyProgress = {
  total: number;
  verified: number;
  pending: number;
  expired: number;
  points: number;
  topSkills: { name: string; count: number }[];
};
