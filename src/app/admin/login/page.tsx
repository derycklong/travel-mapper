"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-muted)] px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border)] p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#4285F4]/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-[#4285F4]" />
          </div>

          <h1 className="text-xl font-medium text-center mb-1">
            Admin Access
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] text-center mb-6">
            Enter password to manage itinerary
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={cn(
                  "w-full h-11 px-4 rounded-xl border bg-transparent text-sm outline-none transition-colors",
                  "focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20",
                  error
                    ? "border-red-300"
                    : "border-[var(--color-border)]"
                )}
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-500 mt-1.5 ml-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-11 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#333] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {isLoading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
