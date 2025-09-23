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

    // Fetch user data
    api
      .get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {
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
