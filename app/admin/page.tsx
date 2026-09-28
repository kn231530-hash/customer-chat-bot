export default function AdminPage() {
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
      <div className="eyebrow">Admin Dashboard</div>
      <h1>Manage your support knowledge</h1>
      <p className="lead">This dashboard is the control center for the chatbot. Supabase authentication and database storage will be connected next.</p>
      <div className="admin-grid">
        {sections.map(([title, description]) => (
          <section className="card admin-card" key={title}>
            <span className="badge">Coming next</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <a className="admin-link" href="/">← Back to chatbot</a>
    </main>
  );
}
