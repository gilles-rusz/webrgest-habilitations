import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Web RG Est / Habilitations",
  description: "Habilitations du personnel par poste, papiers signés et planning de rotation automatique.",
  metadataBase: new URL("https://webrgest-habilitations.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Web RG Est",
    title: "Web RG Est / Habilitations",
    description: "Habilitations du personnel par poste, papiers signés et planning de rotation automatique.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Web RG Est / Habilitations", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141729",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
