"use client";

import React, { useMemo, useState, useEffect } from "react";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";
import { ConfigProvider, notification, theme } from "antd"; // Import Ant Design components
import { useTheme } from "next-themes"; // For dark mode
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";

// --- Icon Components (Inline SVG for simplicity) ---
const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const CodeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const GraduationCapIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 002-2v-5"></path>
  </svg>
);

const BarChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const XIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 ml-2 cursor-pointer hover:stroke-red-400 transition-transform duration-200 hover:scale-125"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Additional icons for new fields
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  </svg>
);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <path d="M4 4h16v16H4z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 mr-2 text-indigo-500"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.72-1.06a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

type FormState = {
  jobTitle: string;
  package: string;
  location: string;
  qualification: string;
  experience: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
};

type Job = {
  id: string;
  jobTitle: string;
  package: string;
  location: string;
  qualification: string;
  experience: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  skills: string[];
  createdAt: string;
  status?: 'active' | 'closed' | 'draft' | 'paused' | 'published';
};

// --- FIX 1: Create a context hook for notifications ---
const NotificationContext = React.createContext<{ 
    api: ReturnType<typeof notification.useNotification>[0]; 
} | null>(null);

const useAppNotification = () => {
    const context = React.useContext(NotificationContext);
    if (!context) {
        // Fallback for components rendered outside the provider, though in this structured app it should always be available.
        return { api: notification };
    }
    return context;
};

// Additional icons for job management
const PlayCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10,8 16,12 10,16 10,8"></polygon>
  </svg>
);

const PauseCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="10" y1="15" x2="10" y2="9"></line>
    <line x1="14" y1="15" x2="14" y2="9"></line>
  </svg>
);

const StopCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <rect x="9" y="9" width="6" height="6"></rect>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// Job Card Component
const JobCard: React.FC<{ job: Job; onJobUpdate: () => void }> = ({ job, onJobUpdate }) => {
  const { api: notificationApi } = useAppNotification();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateJobStatus = async (newStatus: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        notificationApi.error({
          message: 'Authentication Error',
          description: 'Please log in again.',
          placement: 'topRight',
        });
        return;
      }

      const url = `/api/jobs/${job.id}/status`;
      const response = await api.patch(url, { status: newStatus });

      if (response.data?.success) {
        notificationApi.success({
          message: 'Status Updated',
          description: `Job status changed to ${newStatus}`,
          placement: 'topRight',
          duration: 2,
        });
        onJobUpdate(); // Refresh the jobs list
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update job status. Please try again.';
      
      notificationApi.error({
        message: 'Update Failed',
        description: errorMessage,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const getStatusDisplayText = (status?: string) => {
    switch (status) {
      case 'published':
        return 'Active';
      case 'active':
        return 'Active';
      case 'closed':
        return 'Closed';
      case 'draft':
        return 'Draft';
      case 'paused':
        return 'Paused';
      default:
        return 'Active';
    }
  };

  const getStatusActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'active':
      case 'published':
        return [
          { label: 'Pause', action: () => updateJobStatus('paused'), icon: <PauseCircleIcon />, color: 'text-orange-600 hover:text-orange-700' },
          { label: 'Close', action: () => updateJobStatus('closed'), icon: <StopCircleIcon />, color: 'text-red-600 hover:text-red-700' }
        ];
      case 'paused':
        return [
          { label: 'Activate', action: () => updateJobStatus('active'), icon: <PlayCircleIcon />, color: 'text-green-600 hover:text-green-700' },
          { label: 'Close', action: () => updateJobStatus('closed'), icon: <StopCircleIcon />, color: 'text-red-600 hover:text-red-700' }
        ];
      case 'closed':
        return [
          { label: 'Reopen', action: () => updateJobStatus('active'), icon: <PlayCircleIcon />, color: 'text-green-600 hover:text-green-700' }
        ];
      case 'draft':
        return [
          { label: 'Publish', action: () => updateJobStatus('active'), icon: <PlayCircleIcon />, color: 'text-green-600 hover:text-green-700' }
        ];
      default:
        return [];
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'paused':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const statusActions = getStatusActions(job.status || 'active');

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md border border-white/30 dark:border-gray-700/30 p-4 space-y-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{job.jobTitle}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
            {getStatusDisplayText(job.status)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <DollarSignIcon />
          <span className="font-medium">Salary:</span>
          <span className="truncate">{job.package}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon />
          <span className="font-medium">Location:</span>
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCapIcon />
          <span className="font-medium">Qualification:</span>
          <span className="truncate">{job.qualification}</span>
        </div>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        Posted on {formatDate(job.createdAt)}
      </div>

      {/* Status Management Actions */}
      {statusActions.length > 0 && (
        <div className="flex gap-2 pt-2">
          {statusActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-600 transition-all duration-200 ${action.color}`}
              title={action.label}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function JobPostForm() {
  const initialFormState: FormState = {
    jobTitle: "",
    package: "",
    location: "",
    qualification: "",
    experience: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
  };

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // FIX 2: Use the Ant Design Notification API from the custom hook
  const { api: notificationApi } = useAppNotification();

  // Fetch employer's jobs
  const fetchJobs = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) return;

      const response = await api.get('/api/jobs/employer', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      // Silently handle error - user will see empty state
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSkill(e.target.value);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(currentSkill.trim())) {
        setSkills((prev) => [...prev, currentSkill.trim()]);
      }
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const finalData = { ...formData, skills };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        // FIX: Use notification for session expiry instead of alert
        notificationApi.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          placement: 'topRight',
        });
        router.push('/login');
        return;
      }

      const res = await api.post('/api/jobs', finalData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        // FIX: Use Ant Design notification (toast) for success
        notificationApi.success({
          message: 'Job Posted Successfully!',
          description: `Your job titled "${formData.jobTitle}" is now live.`,
          placement: 'topRight',
        });
        // Reset form
        setFormData(initialFormState);
        setSkills([]);
        setCurrentSkill("");
        // Refresh jobs list
        fetchJobs();
      } else {
        // FIX: Use Ant Design notification (toast) for API error
        notificationApi.error({
          message: 'Failed to Post Job',
          description: res.data?.message || 'There was an issue processing your request.',
          placement: 'topRight',
        });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An unexpected error occurred.';
      // FIX: Use Ant Design notification (toast) for network/catch error
      notificationApi.error({
        message: 'Network Error',
        description: message,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // This style tag defines custom animations local to this page
  const CustomStyles = () => (
    <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-in-out forwards; }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; opacity: 0; }
        .animate-popIn { animation: popIn 0.3s ease forwards; }
      `}</style>
  );

  return (
    <>
      <CustomStyles />
      <div className="w-full flex gap-6 p-4 md:p-10 font-sans bg-transparent dark:bg-transparent">
        {/* Left Side - Job Form (60%) */}
        <div className="w-3/5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-6 animate-fadeIn border border-white/30 dark:border-gray-700/30 relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-400/10 dark:to-purple-400/10 pointer-events-none"></div>
          <div className="relative z-10">
          {/* --- Header --- */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <BriefcaseIcon />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create a Job Posting</h1>
            <p className="text-gray-600 dark:text-gray-300">Fill out the details below to find your next great hire.</p>
          </div>

          {/* --- Form --- */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Form Fields --- */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group animate-slideIn" style={{ animationDelay: "0.2s" }}>
                <label htmlFor="jobTitle" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <BriefcaseIcon /> Job Title
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Senior Software Developer"
                  required
                />
              </div>

              <div className="form-group animate-slideIn" style={{ animationDelay: "0.3s" }}>
                <label htmlFor="package" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <DollarSignIcon /> Package / Perks
                </label>
                <input
                  type="text"
                  id="package"
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., $120k + Benefits"
                  required
                />
              </div>

              <div className="form-group animate-slideIn" style={{ animationDelay: "0.4s" }}>
                <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <MapPinIcon /> Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., San Francisco, CA (Remote)"
                  required
                />
              </div>

              <div className="form-group animate-slideIn" style={{ animationDelay: "0.5s" }}>
                <label htmlFor="qualification" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <GraduationCapIcon /> Qualification
                </label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Bachelor's in CS"
                  required
                />
              </div>

              <div className="form-group animate-slideIn" style={{ animationDelay: "0.6s" }}>
                <label htmlFor="experience" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <BarChartIcon /> Experience
                </label>
                <input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 3-5 Years"
                  required
                />
              </div>
            </div>

            {/* --- Job Description --- */}
            <div className="form-group animate-slideIn" style={{ animationDelay: "0.65s" }}>
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <FileTextIcon /> Job Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field min-h-[120px]"
                placeholder="Describe the role, responsibilities, required skills, and nice-to-haves"
                required
              />
            </div>

            {/* --- Contact Details --- */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group animate-slideIn" style={{ animationDelay: "0.7s" }}>
                <label htmlFor="contactEmail" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <MailIcon /> Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., hiring@company.com"
                  required
                />
              </div>
              <div className="form-group animate-slideIn" style={{ animationDelay: "0.75s" }}>
                <label htmlFor="contactPhone" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <PhoneIcon /> Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., +1 (555) 123-4567"
                  pattern="^[0-9+()\-\s]{7,}$"
                  title="Enter a valid phone number"
                  required
                />
              </div>
            </div>

            {/* --- Skills Section --- */}
            <div className="form-group animate-slideIn" style={{ animationDelay: "0.7s" }}>
              <label htmlFor="skills" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                <CodeIcon /> Skills Required
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="skills"
                  value={currentSkill}
                  onChange={handleSkillChange}
                  onKeyDown={handleSkillKeyDown}
                  className="input-field"
                  placeholder="Type a skill and press Enter"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill, index) => (
                    <div
                      key={`${skill}-${index}`}
                      className="flex items-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-sm font-medium px-3 py-1 rounded-full animate-popIn border border-transparent dark:border-indigo-800/60"
                    >
                      <span>{skill}</span>
                      <XIcon onClick={() => removeSkill(skill)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- Submit Button --- */}
            <div className="pt-4 animate-slideIn" style={{ animationDelay: "0.8s" }}>
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex justify-center items-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    Post Job
                    <SendIcon />
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>

        {/* Right Side - Posted Jobs (40%) */}
        <div className="w-2/5 space-y-6">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/30 dark:border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 dark:from-purple-400/10 dark:to-indigo-400/10 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BriefcaseIcon />
                  Your Posted Jobs
                </h2>
                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                  {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
                </span>
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <BriefcaseIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs posted yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Post your first job using the form to get started finding great candidates.
                    </p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <JobCard key={job.id} job={job} onJobUpdate={fetchJobs} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Utility CSS Class Definitions --- */}
      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 0.5rem; /* rounded-lg */
          font-size: 1rem;
          background-color: #ffffff; /* light */
          color: #111827; /* gray-900 */
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out;
        }
        .input-field::placeholder { color: #9ca3af; } /* gray-400 */
        .input-field:focus {
          outline: none;
          border-color: #6366f1; /* indigo-500 */
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        :global(.dark) .input-field {
          background-color: #111827; /* gray-900 */
          border-color: #374151; /* gray-700 */
          color: #f9fafb; /* gray-50 */
        }
        :global(.dark) .input-field::placeholder { color: #6b7280; } /* gray-500 */
        :global(.dark) .input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}

// --- FIX 3: Notification Provider Component ---
const NotificationProvider: React.FC<{ children: React.ReactNode; antTheme: any }> = ({ children, antTheme }) => {
  const [api, contextHolder] = notification.useNotification();
  
  const contextValue = React.useMemo(() => ({ api }), [api]);

  return (
    <ConfigProvider theme={antTheme}>
      {contextHolder} {/* This injects the notification service into the DOM */}
      <NotificationContext.Provider value={contextValue}>
        {children}
      </NotificationContext.Provider>
    </ConfigProvider>
  );
};
// --- END FIX 3 ---

export default function EmployerJobPostPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // FIX 4: Define Ant Design theme based on system theme
  const antTheme = useMemo(() => {
    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: "#4f46e5", // Indigo 600
        colorBgBase: isDark ? "#0f172a" : "#ffffff", // Slate 900
        colorBgContainer: isDark ? "#1e293b" : "#ffffff", // Slate 800
        colorText: isDark ? "rgba(255,255,255,0.92)" : "#111827",
        colorBorder: isDark ? "#334155" : "#e5e7eb",
        borderRadius: 8,
      },
    } as const;
  }, [isDark]);


  return (
    <RoleGuard allowedRole="employer">
      {/* FIX 5: Wrap the entire content with NotificationProvider */}
      <NotificationProvider antTheme={antTheme}>
        <div className="h-screen relative flex overflow-hidden">
          {/* Enhanced Background with Patterns and Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/40 to-teal-50 dark:from-gray-900 dark:via-indigo-900/30 dark:to-purple-900/20">
            {/* Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05]">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.8'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 dark:from-indigo-800/20 dark:to-purple-800/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-32 right-1/4 w-96 h-96 bg-gradient-to-r from-teal-200/15 to-emerald-200/15 dark:from-teal-800/15 dark:to-emerald-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/6 w-48 h-48 bg-gradient-to-r from-rose-200/20 to-pink-200/20 dark:from-rose-800/20 dark:to-pink-800/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Subtle Noise Texture */}
            <div 
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          </div>

          <EmployerSidebar />

          <div className="flex-1 overflow-y-auto relative z-10">
            {/* Top Bar with Theme Toggle - Enhanced with backdrop blur */}
            <div className="flex items-center justify-end p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>

            {/* Page Body */}
            <div className="relative">
              <JobPostForm />
            </div>
          </div>
        </div>
      </NotificationProvider>
    </RoleGuard>
  );
}
