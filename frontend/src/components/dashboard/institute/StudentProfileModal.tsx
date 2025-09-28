"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Download, Mail, Phone, MapPin, Calendar, Award, Star, ExternalLink } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface StudentCredential {
  _id: string;
  title: string;
  issuer: string;
  type: string;
  issueDate: string;
  description?: string;
  skills?: string[];
  nsqfLevel?: number;
  status: 'verified' | 'pending' | 'rejected';
}

interface Student {
  _id: string;
  fullName: {
    firstName: string;
    lastName: string;
  };
  email: string;
  profilePic?: string;
  institute: {
    name: string;
    aishe_code: string;
  };
  role: string;
  createdAt: string;
  isVerified: boolean;
  credentialsCount: number;
  credentials?: StudentCredential[];
  skills?: any; // Backend sends object with skill:level pairs
  skillsData?: Array<{skill: string, value: number}>; // Formatted for radar chart
  phone?: string;
  location?: string;
  bio?: string;
  projects?: any[];
  experience?: any[];
  resumeUrl?: string;
  resumeFileName?: string;
}

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentProfileModal({ student, isOpen, onClose }: StudentProfileModalProps) {
  if (!student) return null;

  // Handle resume download
  const handleResumeDownload = () => {
    if (student.resumeUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = student.resumeUrl;
      link.download = student.resumeFileName || `${student.fullName.firstName}_${student.fullName.lastName}_Resume.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Show message if no resume is available
      alert('No resume available for this student.');
    }
  };

  // Process skills data for radar chart
  const getSkillsData = () => {
    let skillsData: { skill: string; value: number }[] = [];

    // First, try to use skillsData array if available (from backend)
    if (student.skillsData && student.skillsData.length > 0) {
      skillsData = student.skillsData.slice(0, 6);
    }
    // Then try to use skills object if available (from backend)
    else if (student.skills && typeof student.skills === 'object') {
      skillsData = Object.entries(student.skills)
        .filter(([skill, level]) => typeof level === 'number')
        .slice(0, 6)
        .map(([skill, level]) => ({
          skill,
          value: level as number
        }));
    }
    // Otherwise, try to extract from credentials
    else if (student.credentials && student.credentials.length > 0) {
      const skillsMap = new Map<string, number>();
      
      student.credentials.forEach(credential => {
        if (credential.skills && credential.skills.length > 0) {
          credential.skills.forEach(skill => {
            const count = skillsMap.get(skill) || 0;
            skillsMap.set(skill, count + 1);
          });
        }
      });

      // Convert to radar chart format and limit to top 6 skills
      skillsData = Array.from(skillsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([skill, count]) => ({
          skill,
          value: Math.min(count * 20, 100) // Scale to 100 max
        }));
    }
    
    // Fallback to default skills if none found
    if (skillsData.length === 0) {
      skillsData = [
        { skill: 'JavaScript', value: 75 },
        { skill: 'React', value: 80 },
        { skill: 'Node.js', value: 65 },
        { skill: 'Python', value: 70 },
        { skill: 'SQL', value: 60 }
      ];
    }

    return skillsData;
  };

  const skillsData = getSkillsData();
  const verifiedCredentials = student.credentials?.filter(c => c.status === 'verified') || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="text-white/80 text-sm">Student Profile</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 p-6">
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Profile Picture */}
                      <div className="h-24 w-24 rounded-full mb-4 overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        {student.profilePic ? (
                          <img
                            src={student.profilePic}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">
                            {student.fullName.firstName[0]}{student.fullName.lastName[0]}
                          </span>
                        )}
                      </div>

                      {/* Name and Title */}
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {student.fullName.firstName} {student.fullName.lastName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        @{student.fullName.firstName.toLowerCase()}{student.fullName.lastName.toLowerCase()}
                      </p>
                      <p className="text-purple-600 dark:text-purple-400 font-medium mb-4">
                        Student • {student.institute.name}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-3 w-full">
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4" />
                          Contact
                        </button>
                        <button 
                          onClick={handleResumeDownload}
                          disabled={!student.resumeUrl}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                            student.resumeUrl 
                              ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Download className="h-4 w-4" />
                          Resume
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills Radar */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills Radar</h3>
                    {skillsData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={skillsData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="skill" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            <Radar
                              name="Skills"
                              dataKey="value"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No skills data available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Data */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Data</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{student.phone}</span>
                        </div>
                      )}
                      {student.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{student.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.isVerified 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {student.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Tabs Content */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <nav className="flex">
                        <button className="px-6 py-4 text-sm font-medium border-b-2 border-purple-500 text-purple-600 dark:text-purple-400">
                          Verified Credentials
                        </button>
                        <button className="px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                          Projects & Experience
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {/* Verified Credentials */}
                      <div className="space-y-4">
                        {verifiedCredentials.length > 0 ? (
                          verifiedCredentials.map((credential) => (
                            <motion.div
                              key={credential._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {credential.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    <span>Issued by: {credential.issuer}</span>
                                    <span>Date: {new Date(credential.issueDate).toLocaleDateString()}</span>
                                    {credential.nsqfLevel && (
                                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                                        NSQF Level {credential.nsqfLevel}
                                      </span>
                                    )}
                                  </div>
                                  {credential.skills && credential.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {credential.skills.slice(0, 6).map((skill, index) => (
                                        <span
                                          key={index}
                                          className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {credential.skills.length > 6 && (
                                        <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1">
                                          +{credential.skills.length - 6} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                                    Verified
                                  </span>
                                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No Verified Credentials
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              This student hasn&apos;t added any verified credentials yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}