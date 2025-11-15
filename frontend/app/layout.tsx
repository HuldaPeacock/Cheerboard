import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CheersBoard — FHE Blessing Wall",
  description: "Post blessings with privacy-preserving FHE likes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff5f7 0%, #fff8f0 50%, #ffe8e8 100%)',
        color: '#1f2937'
      }}>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 0',
            borderBottom: '1px solid rgba(255,107,129,0.1)'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ff6b81, #ff8a3d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '36px' }}>🎉</span>
              CheersBoard
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: 600
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ff6b81, #ff8a3d)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px'
              }}>FHE-enabled</span>
              <span>•</span>
              <span>Mock/Relayer</span>
            </div>
          </nav>
          <div style={{ paddingTop: '32px', paddingBottom: '60px' }}>
            <Providers>{children}</Providers>
          </div>
        </main>
      </body>
    </html>
  );
}


