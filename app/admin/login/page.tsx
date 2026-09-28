"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin">
      <div className="card admin-card" style={{ maxWidth: 520, margin: "60px auto" }}>
        <div className="eyebrow">Admin Access</div>
        <h1>Sign in</h1>
        <p className="lead">Sign in with your admin email and password to open the dashboard.</p>
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14, marginTop: 24 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          />
          {error && <p style={{ color: "#b42318", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} className="admin-link" style={{ cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </main>
  );
}
