"use client";

import { FormEvent, useState } from "react";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I’m your customer-service assistant. Ask me a question about this business." },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: "bot", text: data.reply || "Please contact human support for help." }]);
    } catch {
      setMessages((current) => [...current, { role: "bot", text: "I couldn’t process that request. Please contact human support." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div>
            <div className="eyebrow">Customer Service AI</div>
            <h1>Help customers faster, with answers you control.</h1>
            <p className="lead">A website chatbot connected to your business knowledge base. FAQs, company information, documents and custom content can become one searchable support source.</p>
            <a className="admin-link" href="/admin">Open admin dashboard →</a>
          </div>
          <section className="card chat" aria-label="Customer service chatbot">
            <div className="chat-head"><strong>Support Assistant</strong><span className="status">● Online</span></div>
            <div className="messages">
              {messages.map((item, index) => <div key={index} className={`msg ${item.role === "user" ? "user" : "bot"}`}>{item.text}</div>)}
              {loading && <div className="msg bot">Thinking…</div>}
            </div>
            <form className="chat-form" onSubmit={sendMessage}>
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a support question…" aria-label="Message" />
              <button type="submit">Send</button>
            </form>
          </section>
        </section>
        <section className="features">
          <div className="card feature"><h3>Knowledge Base</h3><p>Manage FAQs, About Us, titles and custom business information.</p></div>
          <div className="card feature"><h3>Documents</h3><p>Prepare PDF and DOCX knowledge for searchable customer support.</p></div>
          <div className="card feature"><h3>Human Support</h3><p>When the answer is unavailable, the assistant can route customers to a person.</p></div>
          <div className="card feature"><h3>Admin Control</h3><p>Edit, publish and activate the content used by your chatbot.</p></div>
        </section>
      </div>
    </main>
  );
}
