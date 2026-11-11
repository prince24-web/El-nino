import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "El-Nino — AI Agricultural Intelligence & Plant Pathology",
  description: "Next-generation agricultural advisory and multimodal plant disease detection platform powered by Gemini AI for farmers in Nigeria and Sub-Saharan Africa.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
