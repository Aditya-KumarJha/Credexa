"use client";

import React from "react";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";
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

  const [formData, setFormData] = React.useState<FormState>(initialFormState);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = React.useState<string>("");
  const router = useRouter();

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
    const finalData = { ...formData, skills };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        alert('Your session has expired. Please login again.');
        router.push('/login');
        return;
      }

      const res = await api.post('/api/jobs', finalData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        alert('Job posted successfully!');
        // Reset form
        setFormData(initialFormState);
        setSkills([]);
        setCurrentSkill("");
        // Optionally navigate to a jobs list page later
        // router.push('/dashboard/employer/jobs');
      } else {
        alert(res.data?.message || 'Failed to post job');
      }
    } catch (err: unknown) {
      console.error('Job post error:', err);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to post job';
      alert(message);
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
      <div className="w-full flex items-start justify-center p-4 md:p-10 font-sans bg-transparent dark:bg-transparent">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 animate-fadeIn border border-gray-200/70 dark:border-gray-700/60">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="form-group md:col-span-2 animate-slideIn" style={{ animationDelay: "0.6s" }}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="group w-full flex justify-center items-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1"
              >
                Post Job
                <SendIcon />
              </button>
            </div>
          </form>
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
      `}</style>
    </>
  );
}

export default function EmployerJobPostPage() {
  return (
    <RoleGuard allowedRole="employer">
      <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">
        <EmployerSidebar />

        <div className="flex-1 overflow-y-auto relative">
          {/* Top Bar with Theme Toggle */}
          <div className="flex items-center justify-end p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>

          {/* Page Body */}
          <div className="p-6 md:p-10">
            <JobPostForm />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
