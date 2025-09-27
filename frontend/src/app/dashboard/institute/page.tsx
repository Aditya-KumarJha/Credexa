"use client";

import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Award, 
  BookOpen, 
  BarChart3, 
  TrendingUp,
  GraduationCap,
  FileText,
  Shield,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
  ArrowUpRight,
  Crown,
  Lightbulb
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";

export default function InstituteDashboard() {
  const stats = [
    {
      title: "Total Students",
      value: "2,847",
      change: "+145 this semester",
      icon: <Users className="h-6 w-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Credentials Issued",
      value: "1,923",
      change: "+89 this month",
      icon: <Award className="h-6 w-6" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Courses",
      value: "156",
      change: "+12 new courses",
      icon: <BookOpen className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "NSQF Compliance",
      value: "98.5%",
      change: "+2.3% improvement",
      icon: <Shield className="h-6 w-6" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      action: "50 certificates issued for Data Science course",
      time: "1 hour ago",
      type: "issuance",
    },
    {
      action: "New course 'AI Fundamentals' approved",
      time: "3 hours ago",
      type: "course",
    },
    {
      action: "Student batch completed Web Development program",
      time: "1 day ago",
      type: "completion",
    },
    {
      action: "NSQF compliance report submitted",
      time: "2 days ago",
      type: "compliance",
    },
  ];

  const quickActions = [
    {
      title: "Issue Credentials",
      description: "Create and issue digital certificates",
      icon: <Award className="h-6 w-6" />,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/dashboard/institute/credentials/issue",
    },
    {
      title: "Manage Students",
      description: "View and manage student records",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/dashboard/institute/students",
    },
    {
      title: "Course Management",
      description: "Add and manage course offerings",
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-green-500 hover:bg-green-600",
      href: "/dashboard/institute/courses",
    },
    {
      title: "Analytics",
      description: "View institutional performance metrics",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "bg-orange-500 hover:bg-orange-600",
      href: "/dashboard/institute/analytics",
    },
  ];

  return (
    <RoleGuard allowedRole="institute">
      <div className="h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10 flex relative overflow-hidden">

        <InstituteSidebar />
        
        <div className="flex-1 overflow-y-auto relative">
        {/* Top Bar with Theme Toggle */}
        <div className="flex items-center justify-end p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>
        </div>

        <div className="p-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 relative"
          >
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 relative">
                Institute Dashboard
                <div className="absolute -top-2 -right-8">
                  <Crown className="h-8 w-8 text-purple-500" />
                </div>
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-500" />
              Welcome back! Manage your students, courses, and credential issuance. 🎓
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Quick Actions
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg text-white ${action.color} transition-colors`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {action.description}
                          </p>
                          <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                            Get Started <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </div>

          {/* NSQF Compliance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🏆 NSQF Compliance & Recognition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your institution maintains high standards in skill qualification alignment:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Digital Credentials
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Issue blockchain-verified certificates aligned with NSQF levels
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Progress Tracking
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor student progress across skill development pathways
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Regulatory Reporting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automated compliance reports for NCVET and other bodies
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </RoleGuard>
  );
}
