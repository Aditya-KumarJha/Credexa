"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import ProfileCard from "@/components/dashboard/ProfileCard";
import StatCard from "@/components/dashboard/StatCard";
import { BarChart3, KeyRound, CreditCard } from "lucide-react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface UserProject {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardUser {
  _id: string;
  fullName: { firstName: string; lastName: string; };
  username?: string;
  email: string | null;
  phone?: string;
  profilePic: string;
  provider: string;
  projects?: UserProject[];
  walletAddress?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch user data
    api
      .get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("User data fetched:", res.data.user);
        console.log("Projects:", res.data.user.projects);
        setUser(res.data.user);
      })
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
        localStorage.removeItem("authToken");
        router.replace("/login?error=session_expired");
      })
      .finally(() => setLoading(false));

    // Setup MetaMask event listeners
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
      }
    };

    const handleChainChanged = () => {
      // Handle chain changes by reloading the page
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check initial connection state
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err: any) => {
          console.error(err);
        });

      // Cleanup listeners
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [router]);

  const checkMetaMaskStatus = async () => {
    if (!window.ethereum?.isMetaMask) {
      throw new Error("MetaMask is not installed");
    }

    // Check if MetaMask is locked
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts' // This doesn't prompt, just checks current state
      });
      if (!accounts || accounts.length === 0) {
        throw new Error("MetaMask is locked or not connected");
      }
    } catch (error) {
      throw new Error("Failed to check MetaMask status");
    }
  };

  const handleConnectWallet = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return router.replace("/login");
    }

    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect your wallet.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    const toastId = toast.loading("Checking wallet status...");

    try {
      // Check MetaMask status first
      try {
        await checkMetaMaskStatus();
      } catch (error: any) {
        if (error.message.includes("not installed")) {
          toast.error("Please install MetaMask to continue", { id: toastId });
          window.open("https://metamask.io/download/", "_blank");
          return;
        } else if (error.message.includes("locked")) {
          toast.error("Please unlock your MetaMask wallet", { id: toastId });
          return;
        }
      }

      toast.loading("Connecting wallet...", { id: toastId });

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        toast.error("Please unlock MetaMask and connect to this site.", { id: toastId });
        return;
      }

      const address = accounts[0];
      toast.loading("Requesting challenge...", { id: toastId });

      // Get challenge message
      const challengeResponse = await api.post(
        "/api/users/me/generate-link-challenge",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { message } = challengeResponse.data;

      toast.loading("Please sign the message in your wallet...", { id: toastId });

      // Request signature using eth_sign
      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        });

        toast.loading("Verifying and linking wallet...", { id: toastId });

        const linkResponse = await api.post(
          "/api/users/me/link-wallet",
          { address, signature },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser(linkResponse.data);
        toast.success("Wallet linked successfully!", { id: toastId });
      } catch (signError: any) {
        if (signError.code === 4001) {
          toast.error("You rejected the signature request. Please try again.", { id: toastId });
        } else {
          toast.error("Failed to sign message: " + (signError.message || "Unknown error"), { id: toastId });
        }
      }
    } catch (error: any) {
      console.error("Wallet linking failed:", error);
      const errorMessage = 
        error.response?.data?.message || error.message || "An unknown error occurred.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <Header user={user} onConnectWallet={handleConnectWallet} />

        <ProfileCard user={user} />

        {/* Projects Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h2>
            <a
              href="/dashboard/learner/profile"
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
            >
              {user?.projects && user.projects.length > 0 ? "Manage Projects →" : "Add Projects →"}
            </a>
          </div>
          
          {user?.projects && user.projects.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9CA3AF #F3F4F6' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {user.projects.map((project) => (
                <div key={project._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  
                  {/* Project Image - Large and prominent */}
                  {project.imageUrl && (
                    <div className="h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 space-y-4">
                    {/* Project Title - Bold and prominent */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {project.title}
                    </h3>
                    
                    {/* Project Description - Only show if exists */}
                    {project.description && project.description.trim() && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    
                    {/* Technologies - Only show if exists */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs font-medium rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Links - Only show if URLs exist */}
                    {(project.projectUrl || project.githubUrl) && (
                      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {project.projectUrl && project.projectUrl.trim() && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 flex-1 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-md hover:from-cyan-700 hover:to-blue-700 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Website
                          </a>
                        )}
                        
                        {project.githubUrl && project.githubUrl.trim() && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 flex-1 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Code
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start building your portfolio by adding your first project.</p>
              <a
                href="/dashboard/learner/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Project
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          <StatCard
            icon={<BarChart3 className="h-8 w-8 text-cyan-500 mb-4" />}
            title="My Credentials"
            description="You have 12 verified micro-credentials."
            linkText="View Credentials"
          />
          <StatCard
            icon={<KeyRound className="h-8 w-8 text-cyan-500 mb-4" />}
            title="Skill Tracker"
            description="Tracking 8 skills across NSQF levels."
            linkText="View Skills"
          />
          <StatCard
            icon={<CreditCard className="h-8 w-8 text-cyan-500 mb-4" />}
            title="Learning Progress"
            description="You are 70% towards your next NSQF level."
            linkText="View Path"
          />
        </div>
      </main>
    </div>
  );
}
