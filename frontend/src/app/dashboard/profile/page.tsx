"use client";

import { useEffect, useState, ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { Camera, Mail, Loader2, ShieldAlert, X } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

interface UserProfile {
  _id: string;
  fullName: { firstName: string; lastName: string; };
  email: string | null;
  profilePic: string;
  provider: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  const isSocialProvider = user && !['email', 'web3'].includes(user.provider);
  const isNameLocked = !!(isSocialProvider && user?.fullName?.firstName);
  const isEmailLocked = !!(isSocialProvider && user?.email);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return router.replace("/login");

    api.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const userData = res.data;
        setUser(userData);
        setFormData({
          firstName: userData.fullName?.firstName || "",
          lastName: userData.fullName?.lastName || "",
          email: userData.email || "",
        });
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        router.replace("/login?error=session_expired");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const hasTextChanged =
      formData.firstName !== (user.fullName?.firstName || "") ||
      formData.lastName !== (user.fullName?.lastName || "") ||
      formData.email !== (user.email || "");
    const hasFileChanged = !!profilePicFile;
    setIsFormDirty(hasTextChanged || hasFileChanged);
  }, [formData, profilePicFile, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Saving changes...");

    if (!user) {
        toast.error("User data not loaded.", { id: toastId });
        setIsSubmitting(false);
        return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Session expired.", { id: toastId });
      setIsSubmitting(false);
      return router.replace('/login');
    }

    const formPayload = new FormData();

    if (formData.firstName !== (user.fullName?.firstName || "")) formPayload.append("firstName", formData.firstName);
    if (formData.lastName !== (user.fullName?.lastName || "")) formPayload.append("lastName", formData.lastName);
    if (formData.email !== (user.email || "")) formPayload.append("email", formData.email);
    if (profilePicFile) formPayload.append("profilePic", profilePicFile);

    try {
      const response = await api.put("/api/users/me", formPayload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.emailVerificationRequired) {
        toast.success(response.data.message, { id: toastId, duration: 4000 });
        setEmailVerificationRequired(true);
        setCountdown(30); // Start the timer on the modal
      } else {
        setUser(response.data);
        setPreviewUrl(null);
        toast.success("Profile updated successfully!", { id: toastId });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update profile.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
      setProfilePicFile(null);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 6 || isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Verifying OTP...");
    const token = localStorage.getItem("authToken");

    try {
      const response = await api.post("/api/users/me/verify-email", { otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setFormData({ ...formData, email: response.data.user.email });
      toast.success(response.data.message, { id: toastId });
      setEmailVerificationRequired(false);
      setOtp("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "OTP verification failed.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const toastId = toast.loading("Resending OTP...");
    const token = localStorage.getItem("authToken");
     try {
       const response = await api.post("/api/users/me/resend-verify-email", {}, {
         headers: { Authorization: `Bearer ${token}` }
       });
       toast.success(response.data.message, { id: toastId });
       setCountdown(30); 
     } catch (error: any) {
       const errorMessage = error.response?.data?.message || "Failed to resend OTP.";
       toast.error(`Error: ${errorMessage}`, { id: toastId });
     }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOtpSubmit();
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
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        {emailVerificationRequired && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl max-w-sm w-full relative">
               <button onClick={() => setEmailVerificationRequired(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                  <X size={20}/>
               </button>
              <h3 className="text-xl font-bold mb-2">Verify Your New Email</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">An OTP has been sent to <span className="font-semibold text-cyan-500">{formData.email}</span>.</p>
              <input type="text" value={otp} onKeyDown={handleOtpKeyDown} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="w-full text-center text-2xl tracking-[0.5em] px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-cyan-500 focus:border-cyan-500 mb-4" />
              <button onClick={handleOtpSubmit} disabled={isSubmitting || otp.length < 6} className="w-full mb-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 flex items-center justify-center">
                 {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null} Verify & Update
              </button>
              <button onClick={handleResendOtp} disabled={countdown > 0} className="text-xs text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive code? Resend"}
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="relative">
                <img src={previewUrl || user?.profilePic || `https://avatar.vercel.sh/${user?._id}.png`} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500" onError={(e) => { e.currentTarget.src = `https://avatar.vercel.sh/${user?._id}.png`}} />
                <label htmlFor="profilePicInput" className="absolute bottom-1 right-1 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-gray-700 transition">
                  <Camera size={18} />
                  <input id="profilePicInput" type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleFileChange} disabled={isSubmitting} />
                </label>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{user?.fullName.firstName} {user?.fullName.lastName}</h2>
                <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail size={16} /> {user?.email || "No email provided"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} disabled={isSubmitting || isNameLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                  {isNameLocked && <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1"><ShieldAlert size={12}/>Your name is managed by your social provider.</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} disabled={isSubmitting || isNameLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                <div className="md:col-span-2">
                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                   <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={isSubmitting || isEmailLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                   {isEmailLocked && <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1"><ShieldAlert size={12}/>Your email is managed by your social provider.</p>}
                </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={!isFormDirty || isSubmitting} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

