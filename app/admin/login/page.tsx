export default function AdminLoginPage() {
  return (
    <main className="admin">
      <div className="card admin-card" style={{ maxWidth: 520, margin: "60px auto" }}>
        <div className="eyebrow">Admin Access</div>
        <h1>Sign in</h1>
        <p className="lead">Authentication will be connected to your new Supabase project in the next setup step.</p>
        <a className="admin-link" href="/admin">Continue to dashboard preview →</a>
      </div>
    </main>
  );
}
