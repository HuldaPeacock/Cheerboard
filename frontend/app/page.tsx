import { CheersBoardDemo } from "@/components/CheersBoardDemo";

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,107,129,0.05), rgba(255,138,61,0.05))',
        border: '2px solid rgba(255,107,129,0.2)',
        textAlign: 'center',
        padding: '40px 24px'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #ff6b81, #ff8a3d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          CheersBoard — 祝福墙
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          fontWeight: 500,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          发布祝福、点赞（FHE加密）、解密查看 — 演示版
        </p>
      </div>
      <CheersBoardDemo />
    </div>
  );
}


