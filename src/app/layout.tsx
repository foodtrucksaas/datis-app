import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ATIS.live — D-ATIS Europe en temps réel",
  description:
    "Le briefing D-ATIS européen, en temps réel, pour les pilotes de ligne.",
};

// Inline script to apply theme before paint (prevents flash)
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('atis-eu:theme');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${GeistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
