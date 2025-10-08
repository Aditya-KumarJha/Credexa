import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  FileText, 
  User, 
  Shield, 
  Share,
  Trophy,
  Eye,
  Download,
  Search,
  Clock,
  Filter,
  X,
  ChevronDown,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Navbar from '@/components/Navbar';
import { Performance3DProvider } from '@/components/3d/Performance3DProvider';
import Ambient3DBackground from '@/components/3d/Ambient3DBackground';

dayjs.extend(relativeTime);

// Types
interface Activity {
  _id: string;
  activityType: string;
  description: string;
  createdAt: string;
  metadata?: {
    credentialTitle?: string;
    fraudPercentage?: number;
    nsqfLevel?: number;
    [key: string]: any;
  };
}

interface ActivityStats {
  totalActivities: number;
  stats: Array<{
    _id: string;
    count: number;
    lastActivity: string;
  }>;
  recentActivity?: {
    createdAt: string;
  };
}

interface Filters {
  activityType: string | null;
  dateRange: [Dayjs, Dayjs] | null;
  page: number;
  limit: number;
}

const MyActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    activityType: null,
    dateRange: null,
    page: 1,
    limit: 20
  });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in to view your activities');
      setLoading(false);
      return;
    }
    
    fetchActivities();
    fetchStats();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      if (filters.activityType) {
        params.append('activityType', filters.activityType);
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const data = await response.json();
      setActivities(data.data.activities);
      setTotalPages(data.data.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found for stats request');
        return; // Don't throw error for stats, just skip it
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/activities/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication failed for stats request');
          return; // Don't throw error for stats, just skip it
        }
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const getActivityIcon = (activityType: string) => {
    const iconMap = {
      credential_uploaded: <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />,
      credential_shared: <Share className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      profile_updated: <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      resume_uploaded: <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      resume_updated: <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      login: <User className="w-5 h-5 text-green-600 dark:text-green-400" />,
      logout: <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
      password_changed: <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />,
      password_reset: <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      email_changed: <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      account_created: <User className="w-5 h-5 text-green-600 dark:text-green-400" />,
      skill_assessment_completed: <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      career_recommendation_viewed: <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      certificate_downloaded: <Download className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
      forensics_analysis_performed: <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />,
      candidate_profile_viewed: <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      skill_search_performed: <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
    };
    return iconMap[activityType as keyof typeof iconMap] || <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };

  const getActivityBadgeColor = (activityType: string) => {
    const colorMap = {
      credential_uploaded: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      credential_shared: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      profile_updated: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      resume_uploaded: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      resume_updated: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      login: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      logout: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      password_changed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      password_reset: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      email_changed: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      account_created: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      skill_assessment_completed: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      career_recommendation_viewed: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      certificate_downloaded: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      forensics_analysis_performed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      candidate_profile_viewed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      skill_search_performed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    return colorMap[activityType as keyof typeof colorMap] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  const formatActivityType = (activityType: string) => {
    return activityType
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const loadMoreActivities = () => {
    if (filters.page < totalPages) {
      setFilters(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  };

  if (error) {
    return (
      <Performance3DProvider>
        <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen relative">
          <Ambient3DBackground intensity={0.3} />
          <div className="relative z-10">
            <Navbar />
            <div className="container mx-auto px-6 py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Error Loading Activities</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                {error.includes('log in') && (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Go to Login
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </Performance3DProvider>
    );
  }

  return (
    <Performance3DProvider>
      <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen relative">
        <Ambient3DBackground intensity={0.3} />
        <div className="relative z-10">
          <Navbar />
          
          <div className="container mx-auto px-6 py-20">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full text-blue-600 dark:text-blue-400 font-medium mb-4">
                <Activity className="w-5 h-5" />
                Activity Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Activity
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Track your interactions and progress on the platform
              </p>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              >
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                      <p className="text-2xl font-bold">{stats.totalActivities}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                      <p className="text-2xl font-bold">{stats.stats.reduce((sum: number, stat: any) => sum + stat.count, 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Most Active</p>
                      <p className="text-lg font-bold">{stats.stats[0]?.count || 0}</p>
                      <p className="text-xs text-gray-500">{stats.stats[0] ? formatActivityType(stats.stats[0]._id) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Activity</p>
                      <p className="text-lg font-bold">{stats.recentActivity ? dayjs(stats.recentActivity.createdAt).fromNow() : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700 mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Activity Type</label>
                  <select
                    onChange={(e) => handleFilterChange('activityType', e.target.value || null)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Activities</option>
                    <option value="credential_uploaded">Credential Uploaded</option>
                    <option value="credential_shared">Credential Shared</option>
                    <option value="profile_updated">Profile Updated</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="password_changed">Password Changed</option>
                    <option value="resume_uploaded">Resume Uploaded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        if (e.target.value && filters.dateRange?.[1]) {
                          handleFilterChange('dateRange', [dayjs(e.target.value), filters.dateRange[1]]);
                        }
                      }}
                    />
                    <input
                      type="date"
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        if (e.target.value && filters.dateRange?.[0]) {
                          handleFilterChange('dateRange', [filters.dateRange[0], dayjs(e.target.value)]);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ activityType: null, dateRange: null, page: 1, limit: 20 })}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-bold">Activity Timeline</h3>
                </div>
              </div>

              <div className="p-6">
                {loading && activities.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-16">
                    <Activity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No activities found. Start using the platform to see your activity here!</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <motion.div
                          key={activity._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              {getActivityIcon(activity.activityType)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{activity.description}</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityBadgeColor(activity.activityType)}`}>
                                {formatActivityType(activity.activityType)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {dayjs(activity.createdAt).format('MMM DD, YYYY HH:mm')}
                              </span>
                              <span>({dayjs(activity.createdAt).fromNow()})</span>
                            </div>
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {activity.metadata.credentialTitle && (
                                  <span className="inline-block mr-4">📄 {activity.metadata.credentialTitle}</span>
                                )}
                                {activity.metadata.fraudPercentage !== undefined && (
                                  <span className="inline-block mr-4">🔍 Fraud: {activity.metadata.fraudPercentage.toFixed(1)}%</span>
                                )}
                                {activity.metadata.nsqfLevel && (
                                  <span className="inline-block mr-4">🎓 NSQF Level: {activity.metadata.nsqfLevel}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {filters.page < totalPages && (
                      <div className="text-center mt-8">
                        <button
                          onClick={loadMoreActivities}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Load More Activities
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Performance3DProvider>
  );
};

export default MyActivity;