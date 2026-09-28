"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/admin/login");
        return;
      }
      setEmail(data.user.email ?? "");
      setLoading(false);
    });
  }, [router, supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return <main className="admin"><p className="lead">Loading dashboard…</p></main>;
  }

  const sections = [
    ["Knowledge Base", "Create and edit the business information your assistant can use."],
    ["FAQs", "Add common customer questions and approved answers."],
    ["About Us", "Maintain company information, services, policies and contact details."],
    ["Documents", "Upload PDF and DOCX content for the knowledge base."],
    ["Custom Content", "Paste or edit any business-specific support material."],
    ["Human Support", "Configure where customers should go when AI cannot answer."],
  ];

  return (
    <main className="admin">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <div className="eyebrow">Admin Dashboard</div>
          <h1>Manage your support knowledge</h1>
          <p className="lead">Signed in as {email}</p>
        </div>
        <button className="admin-link" onClick={signOut}>Sign out</button>
      </div>
      <div className="admin-grid">
        {sections.map(([title, description]) => (
          <section className="card admin-card" key={title}>
            <span className="badge">Ready</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <a className="admin-link" href="/">← Back to chatbot</a>
    </main>
  );
}
