import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocUtility Pro - ビジネス文書処理クラウドサービス",
  description: "PDF結合、分割、文章校正AIなど、ビジネスに役立つ文書処理ツールを提供するクラウドサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storageKey = 'doc-utility-v1-theme';
                  let theme = 'system';
                  try {
                    const stored = localStorage.getItem(storageKey);
                    if (stored === 'light' || stored === 'dark' || stored === 'system') {
                      theme = stored;
                    }
                  } catch (e) {
                    // localStorage unavailable (private mode, cookies disabled)
                  }
                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fallback: ensure document renders even if script fails
                  console.error('Theme initialization failed:', e);
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
