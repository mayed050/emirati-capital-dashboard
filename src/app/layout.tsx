import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import { LanguageProvider } from "@/context/languageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة الأسهم الإماراتية | سوق دبي وأبوظبي",
  description: "لوحة مالية عربية مدمجة لمتابعة أسهم سوق دبي وسوق أبوظبي.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <body>
        <LanguageProvider>
          <Layout>{children}</Layout>
        </LanguageProvider>
      </body>
    </html>
  );
}
