import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirWatch - Qualite de l'air",
  description: "Surveillance qualite de l'air interieur via LoRaWAN",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#f5f7fa]">
        {children}
      </body>
    </html>
  );
}
