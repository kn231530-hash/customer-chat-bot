import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Service AI",
  description: "Website customer-service chatbot with a managed knowledge base.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
