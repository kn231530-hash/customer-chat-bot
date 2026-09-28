"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const sections = [
  ["Knowledge Base", "Create and edit all approved business information.", "/admin/knowledge"],
  ["FAQs", "Add customer questions and approved answers.", "/admin/knowledge?type=faq"],
  ["About Us", "Maintain company information, services and policies.", "/admin/knowledge?type=about"],
  ["Documents", "Upload PDF, DOCX and other approved source files.", "/admin/knowledge?tab=documents"],
  ["Custom Content", "Store any business-specific support material.", "/admin/knowledge?type=custom"],
  ["Human Support", "Keep the fallback information for questions AI cannot answer.", "/admin/knowledge?type=custom"],
];

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
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) return <main className="admin"><p className="lead">Loading dashboard…</p></main>;

  return (
    <main className="admin">
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Admin Dashboard</div>
          <h1>Manage your support knowledge</h1>
          <p className="lead">Signed in as {email}</p>
        </div>
        <button className="secondary-button" onClick={signOut}>Sign out</button>
      </div>

      <div className="admin-panel">
        <div>
          <span className="badge">Knowledge Center</span>
          <h2>Build the chatbot knowledge base</h2>
          <p>Add FAQs, company information, custom content, or upload documents. Everything is saved in a structured database so the assistant can use approved information.</p>
        </div>
        <a className="primary" href="/admin/knowledge">Open Knowledge Manager →</a>
      </div>

      <div className="admin-grid">
        {sections.map(([title, description, href]) => (
          <a className="card admin-card admin-card-link" href={href} key={title}>
            <span className="badge">Open</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <strong>Manage →</strong>
          </a>
        ))}
      </div>
      <a className="admin-link" href="/">← Back to chatbot</a>
    </main>
  );
}
