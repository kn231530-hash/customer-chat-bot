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

const emptyForm = { type: "faq" as KnowledgeItem["type"], title: "", content: "", tags: "" };

export default function KnowledgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const requestedType = searchParams.get("type") as KnowledgeItem["type"] | null;
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(requestedTab === "documents" ? "documents" : "knowledge");
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredItems = useMemo(() => requestedType ? items.filter((item) => item.type === requestedType) : items, [items, requestedType]);

  async function requireUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.replace("/admin/login"); return null; }
    return data.user;
  }

  async function loadAll() {
    const user = await requireUser();
    if (!user) return;
    const [itemsResult, docsResult] = await Promise.all([
      supabase.from("knowledge_items").select("id,type,title,content,tags,active,published").order("created_at", { ascending: false }),
      supabase.from("knowledge_documents").select("id,name,file_type,storage_path,size_bytes,status,active,created_at").order("created_at", { ascending: false }),
    ]);
    if (itemsResult.error) setError(itemsResult.error.message); else setItems((itemsResult.data ?? []) as KnowledgeItem[]);
    if (docsResult.error) setError(docsResult.error.message); else setDocuments((docsResult.data ?? []) as KnowledgeDocument[]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function resetForm() { setForm(emptyForm); setEditingId(null); }

  function startEdit(item: KnowledgeItem) {
    setEditingId(item.id);
    setForm({ type: item.type, title: item.title, content: item.content, tags: item.tags?.join(", ") ?? "" });
    setTab("knowledge");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    const user = await requireUser();
    if (!user) return;
    const payload = {
      type: form.type, title: form.title.trim(), content: form.content.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    const result = editingId
      ? await supabase.from("knowledge_items").update(payload).eq("id", editingId)
      : await supabase.from("knowledge_items").insert({ ...payload, active: true, published: true, created_by: user.id });
    if (result.error) setError(result.error.message);
    else { setNotice(editingId ? "Knowledge updated successfully." : "Knowledge saved successfully."); resetForm(); await loadAll(); }
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
    const { error: insertError } = await supabase.from("knowledge_documents").insert({ name: file.name, file_type: file.type || file.name.split(".").pop() || "unknown", storage_path: path, size_bytes: file.size, status: "pending", active: true, uploaded_by: user.id });
    if (insertError) {
      await supabase.storage.from("knowledge-documents").remove([path]);
      setError(insertError.message);
    } else {
      setFile(null);
      const input = document.getElementById("knowledge-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setNotice("Document uploaded successfully. It is now stored in your knowledge library.");
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
    if (deleteError) setError(deleteError.message); else { setNotice("Knowledge deleted."); await loadAll(); }
  }

  async function deleteDocument(doc: KnowledgeDocument) {
    if (!window.confirm(`Delete ${doc.name}?`)) return;
    const { error: storageError } = await supabase.storage.from("knowledge-documents").remove([doc.storage_path]);
    if (storageError) { setError(storageError.message); return; }
    const { error: deleteError } = await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (deleteError) setError(deleteError.message); else { setNotice("Document deleted."); await loadAll(); }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setError(""); setNotice(""); }

  return (
    <main className="admin">
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Knowledge Center</div>
          <h1>Business knowledge</h1>
          <p className="lead">Manage the approved information your chatbot is allowed to use.</p>
        </div>
        <a className="secondary-button" href="/admin">← Dashboard</a>
      </div>

      <div className="tabs">
        <button className={tab === "knowledge" ? "tab active" : "tab"} onClick={() => setTab("knowledge")}>Knowledge Entries</button>
        <button className={tab === "documents" ? "tab active" : "tab"} onClick={() => setTab("documents")}>Documents</button>
      </div>

      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}

      {tab === "knowledge" ? (
        <>
          <form className="card editor-card" onSubmit={saveItem}>
            <div className="section-heading">
              <div><span className="badge">{editingId ? "Edit record" : "New record"}</span><h2>{editingId ? "Edit knowledge" : "Add knowledge"}</h2></div>
              {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel edit</button>}
            </div>
            <div className="form-grid">
              <label>Content type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as KnowledgeItem["type"] })}><option value="faq">FAQ</option><option value="about">About Us</option><option value="section">Section</option><option value="custom">Custom Content</option></select></label>
              <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. What are your opening hours?" /></label>
            </div>
            <label>Approved information<textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write the exact information the chatbot is allowed to use…" rows={7} /></label>
            <div className="form-grid"><label>Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hours, support, contact" /></label><div className="form-action"><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update knowledge" : "Save knowledge"}</button></div></div>
          </form>

          <div className="section-heading list-heading"><div><div className="eyebrow">Library</div><h2>{requestedType ? requestedType.toUpperCase() : "Saved knowledge"}</h2></div><span className="muted">{filteredItems.length} records</span></div>
          {loading ? <p className="lead">Loading…</p> : filteredItems.length === 0 ? <div className="card empty-state"><strong>No records yet.</strong><br />Add your first approved knowledge entry above.</div> : filteredItems.map((item) => (
            <section className="card item-card" key={item.id}>
              <div className="item-main"><div className="item-meta"><span className="badge">{item.type}</span><span className={item.published ? "status-pill live" : "status-pill"}>{item.published ? "Published" : "Draft"}</span><span className={item.active ? "status-pill live" : "status-pill"}>{item.active ? "Active" : "Inactive"}</span></div><h2>{item.title}</h2><p>{item.content}</p>{item.tags?.length ? <div className="tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}</div>
              <div className="item-actions"><button onClick={() => startEdit(item)}>Edit</button><button onClick={() => toggleItem(item, "published")}>{item.published ? "Unpublish" : "Publish"}</button><button onClick={() => toggleItem(item, "active")}>{item.active ? "Deactivate" : "Activate"}</button><button className="danger" onClick={() => deleteItem(item.id)}>Delete</button></div>
            </section>
          ))}
        </>
      ) : (
        <>
          <form className="card upload-card" onSubmit={uploadDocument}>
            <div className="upload-icon">↑</div><h2>Upload a knowledge document</h2><p className="muted">PDF, DOCX, TXT, or Markdown · maximum 20 MB · stored securely in Supabase Storage.</p>
            <label className="file-drop"><input id="knowledge-file" type="file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile} />{file ? <><strong>{file.name}</strong><span>Click to choose another file</span></> : <><strong>Choose file</strong><span>or drag and drop it here</span></>}</label>
            <button className="primary upload-button" type="submit" disabled={!file || uploading}>{uploading ? "Uploading…" : "Upload document"}</button>
          </form>
          <div className="section-heading list-heading"><div><div className="eyebrow">Library</div><h2>Uploaded documents</h2></div><span className="muted">{documents.length} files</span></div>
          {documents.length === 0 ? <div className="card empty-state">No documents uploaded yet.</div> : documents.map((doc) => (
            <section className="card item-card" key={doc.id}><div className="item-main"><div className="item-meta"><span className="badge">{doc.status}</span><span className="status-pill live">Stored</span></div><h2>{doc.name}</h2><p className="muted">{doc.file_type || "file"} · {doc.size_bytes ? `${(doc.size_bytes / 1024 / 1024).toFixed(2)} MB` : "size unknown"}</p></div><div className="item-actions"><button className="danger" onClick={() => deleteDocument(doc)}>Delete</button></div></section>
          ))}
        </>
      )}
    </main>
  );
}
