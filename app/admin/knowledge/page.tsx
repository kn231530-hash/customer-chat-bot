"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type KnowledgeItem = {
  id: string;
  type: "faq" | "about" | "section" | "custom";
  title: string;
  content: string;
  tags: string[] | null;
  active: boolean;
  published: boolean;
};

export default function KnowledgePage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [type, setType] = useState<KnowledgeItem["type"]>("faq");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }
    const { data, error: queryError } = await supabase
      .from("knowledge_items")
      .select("id,type,title,content,tags,active,published")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setItems((data ?? []) as KnowledgeItem[]);
    setLoading(false);
  }

  useEffect(() => { loadItems(); }, []);

  async function addItem(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }
    const { error: insertError } = await supabase.from("knowledge_items").insert({
      type, title: title.trim(), content: content.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      active: true, published: true, created_by: userData.user.id,
    });
    if (insertError) setError(insertError.message);
    else { setTitle(""); setContent(""); setTags(""); await loadItems(); }
    setSaving(false);
  }

  async function toggleItem(item: KnowledgeItem, field: "active" | "published") {
    const { error: updateError } = await supabase.from("knowledge_items").update({ [field]: !item[field] }).eq("id", item.id);
    if (updateError) setError(updateError.message);
    else await loadItems();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this knowledge item?")) return;
    const { error: deleteError } = await supabase.from("knowledge_items").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
    else await loadItems();
  }

  return (
    <main className="admin">
      <div className="eyebrow">Knowledge Base</div>
      <h1>Business knowledge</h1>
      <p className="lead">Add approved information that the chatbot can use when answering customers.</p>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={addItem} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <select value={type} onChange={(e) => setType(e.target.value as KnowledgeItem["type"])}>
          <option value="faq">FAQ</option><option value="about">About</option><option value="section">Section</option><option value="custom">Custom</option>
        </select>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Approved answer or business information" rows={6} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" />
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Add knowledge"}</button>
      </form>
      {loading ? <p>Loading…</p> : items.map((item) => (
        <section className="card" key={item.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div><span className="badge">{item.type}</span><h2>{item.title}</h2></div>
            <button onClick={() => deleteItem(item.id)}>Delete</button>
          </div>
          <p>{item.content}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => toggleItem(item, "published")}>{item.published ? "Unpublish" : "Publish"}</button>
            <button onClick={() => toggleItem(item, "active")}>{item.active ? "Deactivate" : "Activate"}</button>
          </div>
        </section>
      ))}
      <a className="admin-link" href="/admin">← Dashboard</a>
    </main>
  );
}
