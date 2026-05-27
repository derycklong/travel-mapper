"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }} className="p-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--color-accent-muted)" }}>
            <Lock className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
          </div>

          <h1 className="text-xl font-semibold text-center mb-1" style={{ color: "var(--color-text)" }}>
            Admin Access
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: "var(--color-muted)" }}>
            Enter password to manage itinerary
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  border: error ? "1px solid #EF4444" : "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: 14,
                  outline: "none",
                }}
                autoFocus
              />
              {error && (
                <p className="text-xs mt-1.5 ml-1" style={{ color: "#EF4444" }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-11 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "var(--color-accent)",
                color: "white",
                opacity: isLoading || !password ? 0.5 : 1,
              }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
