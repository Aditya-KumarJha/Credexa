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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    api
      .get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("authToken");
        router.replace("/login?error=session_expired");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleConnectWallet = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return router.replace("/login");
    }

    if (!window.ethereum) {
      toast.error("Please install a Web3 wallet like MetaMask.");
      return;
    }

    const toastId = toast.loading("Connecting wallet...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      toast.loading("Requesting challenge...", { id: toastId });

      const challengeResponse = await api.post(
        "/api/users/me/generate-link-challenge",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { message } = challengeResponse.data;

      toast.loading("Please sign the message in your wallet...", { id: toastId });
      const signature = await signer.signMessage(message);

      toast.loading("Verifying and linking wallet...", { id: toastId });

      const linkResponse = await api.post(
        "/api/users/me/link-wallet",
        { address, signature },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(linkResponse.data);
      toast.success("Wallet linked successfully!", { id: toastId });
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
