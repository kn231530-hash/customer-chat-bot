"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type KnowledgeDocument = {
  id: string;
  name: string;
  file_type: string | null;
  storage_path: string;
  size_bytes: number | null;
  status: "pending" | "processing" | "ready" | "failed";
  active: boolean;
  created_at: string;
};

export default function KnowledgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const requestedType = searchParams.get("type") as KnowledgeItem["type"] | null;
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(requestedTab === "documents" ? "documents" : "knowledge");
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [type, setType] = useState<KnowledgeItem["type"]>(requestedType ?? "faq");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredItems = useMemo(() => {
    if (requestedType) return items.filter((item) => item.type === requestedType);
    return items;
  }, [items, requestedType]);

  async function requireUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.replace("/admin/login");
      return null;
    }
    return data.user;
  }

  async function loadAll() {
    const user = await requireUser();
    if (!user) return;
    const [itemsResult, docsResult] = await Promise.all([
      supabase.from("knowledge_items").select("id,type,title,content,tags,active,published").order("created_at", { ascending: false }),
      supabase.from("knowledge_documents").select("id,name,file_type,storage_path,size_bytes,status,active,created_at").order("created_at", { ascending: false }),
    ]);
    if (itemsResult.error) setError(itemsResult.error.message);
    else setItems((itemsResult.data ?? []) as KnowledgeItem[]);
    if (docsResult.error) setError(docsResult.error.message);
    else setDocuments((docsResult.data ?? []) as KnowledgeDocument[]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function addItem(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const user = await requireUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("knowledge_items").insert({
      type, title: title.trim(), content: content.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      active: true, published: true, created_by: user.id,
    });
    if (insertError) setError(insertError.message);
    else {
      setTitle(""); setContent(""); setTags("");
      setNotice("Knowledge saved successfully.");
      await loadAll();
    }
    setSaving(false);
  }

  async function uploadDocument(event: FormEvent) {
    event.preventDefault();
    if (!file) { setError("Please choose a PDF, DOCX, TXT, or Markdown file first."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File is too large. Maximum size is 20 MB."); return; }
    setUploading(true); setError(""); setNotice("");
    const user = await requireUser();
    if (!user) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("knowledge-documents").upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) { setError(uploadError.message); setUploading(false); return; }
    const { error: insertError } = await supabase.from("knowledge_documents").insert({
      name: file.name,
      file_type: file.type || file.name.split(".").pop() || "unknown",
      storage_path: path,
      size_bytes: file.size,
      status: "pending",
      active: true,
      uploaded_by: user.id,
    });
    if (insertError) {
      await supabase.storage.from("knowledge-documents").remove([path]);
      setError(insertError.message);
    } else {
      setFile(null);
      const input = document.getElementById("knowledge-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setNotice("Document uploaded and saved to the knowledge database. Text extraction can process it next.");
      await loadAll();
    }
    setUploading(false);
  }

  async function toggleItem(item: KnowledgeItem, field: "active" | "published") {
    const { error: updateError } = await supabase.from("knowledge_items").update({ [field]: !item[field] }).eq("id", item.id);
    if (updateError) setError(updateError.message); else await loadAll();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this knowledge item?")) return;
    const { error: deleteError } = await supabase.from("knowledge_items").delete().eq("id", id);
    if (deleteError) setError(deleteError.message); else await loadAll();
  }

  async function deleteDocument(doc: KnowledgeDocument) {
    if (!window.confirm(`Delete ${doc.name}?`)) return;
    const { error: storageError } = await supabase.storage.from("knowledge-documents").remove([doc.storage_path]);
    if (storageError) { setError(storageError.message); return; }
    const { error: deleteError } = await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (deleteError) setError(deleteError.message); else await loadAll();
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError(""); setNotice("");
  }

  return (
    <main className="admin">
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Knowledge Center</div>
          <h1>Business knowledge</h1>
          <p className="lead">Add approved information or upload source documents. Each record is stored in a structured Supabase table.</p>
        </div>
        <a className="admin-link" href="/admin">← Dashboard</a>
      </div>

      <div className="tabs">
        <button className={tab === "knowledge" ? "tab active" : "tab"} onClick={() => setTab("knowledge")}>Knowledge Entries</button>
        <button className={tab === "documents" ? "tab active" : "tab"} onClick={() => setTab("documents")}>Documents</button>
      </div>

      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}

      {tab === "knowledge" ? (
        <>
          <form className="card editor-card" onSubmit={addItem}>
            <div className="section-heading"><div><span className="badge">Structured record</span><h2>Add knowledge</h2></div><span className="muted">Saved to knowledge_items</span></div>
            <div className="form-grid">
              <label>Type<select value={type} onChange={(e) => setType(e.target.value as KnowledgeItem["type"])}><option value="faq">FAQ</option><option value="about">About Us</option><option value="section">Section</option><option value="custom">Custom Content</option></select></label>
              <label>Title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. What are your opening hours?" /></label>
            </div>
            <label>Approved information<textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the exact information the chatbot is allowed to use…" rows={7} /></label>
            <div className="form-grid"><label>Tags<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hours, support, contact" /></label><div className="form-action"><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save knowledge"}</button></div></div>
          </form>

          <div className="section-heading list-heading"><h2>{requestedType ? requestedType.toUpperCase() : "Saved knowledge"}</h2><span className="muted">{filteredItems.length} records</span></div>
          {loading ? <p className="lead">Loading…</p> : filteredItems.length === 0 ? <div className="card empty-state">No records yet. Add your first approved knowledge entry above.</div> : filteredItems.map((item) => (
            <section className="card item-card" key={item.id}>
              <div><span className="badge">{item.type}</span><h2>{item.title}</h2><p>{item.content}</p>{item.tags?.length ? <div className="tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}</div>
              <div className="item-actions"><button onClick={() => toggleItem(item, "published")}>{item.published ? "Unpublish" : "Publish"}</button><button onClick={() => toggleItem(item, "active")}>{item.active ? "Deactivate" : "Activate"}</button><button className="danger" onClick={() => deleteItem(item.id)}>Delete</button></div>
            </section>
          ))}
        </>
      ) : (
        <>
          <form className="card upload-card" onSubmit={uploadDocument}>
            <div className="upload-icon">↑</div>
            <h2>Upload a knowledge document</h2>
            <p className="muted">PDF, DOCX, TXT, or Markdown. Maximum 20 MB. The original file is kept securely in Supabase Storage.</p>
            <label className="file-drop"><input id="knowledge-file" type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile} />{file ? <strong>{file.name}</strong> : <span>Choose a file or drag it here</span>}</label>
            <button className="primary" type="submit" disabled={!file || uploading}>{uploading ? "Uploading…" : "Upload document"}</button>
          </form>
          <div className="section-heading list-heading"><h2>Uploaded documents</h2><span className="muted">{documents.length} files</span></div>
          {documents.length === 0 ? <div className="card empty-state">No documents uploaded yet.</div> : documents.map((doc) => (
            <section className="card item-card" key={doc.id}><div><span className="badge">{doc.status}</span><h2>{doc.name}</h2><p className="muted">{doc.file_type || "file"} · {doc.size_bytes ? `${(doc.size_bytes / 1024 / 1024).toFixed(2)} MB` : "size unknown"}</p></div><button className="danger" onClick={() => deleteDocument(doc)}>Delete</button></section>
          ))}
        </>
      )}
    </main>
  );
}
