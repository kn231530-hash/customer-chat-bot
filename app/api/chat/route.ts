import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ reply: "Please enter a question." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "The knowledge base is not connected yet. Please contact human support for this question.",
      });
    }

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a customer-service assistant. Only answer using verified business knowledge supplied to you. If the required information is not available, do not guess; tell the customer to contact human support.",
        },
        { role: "user", content: message.trim() },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "Please contact human support for help.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ reply: "The assistant is temporarily unavailable. Please contact human support." }, { status: 500 });
  }
}
