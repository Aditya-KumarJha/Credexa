"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);

      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <p className="text-center mt-20 text-gray-700 dark:text-gray-300">
      Logging you in...
    </p>
  );
}
