"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useCheersBoard } from "@/hooks/useCheersBoard";
import { PostsList } from "@/components/PostsList";
import { useMemo, useState } from "react";

export const CheersBoardDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const cheers = useCheersBoard({
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [wallTitle, setWallTitle] = useState("");
  const [wallDesc, setWallDesc] = useState("");
  const [wallCover, setWallCover] = useState("");
  const [targetWallIdInput, setTargetWallIdInput] = useState<string>("");

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postMedia, setPostMedia] = useState("");

  const statusBadge = useMemo(() => {
    let badgeClass = "badge ";
    let icon = "";
    let text = "";
    if (fhevmStatus === "ready") {
      badgeClass += "success";
      icon = "✓";
      text = "FHEVM Ready";
    } else if (fhevmStatus === "loading") {
      badgeClass += "warning";
      icon = "⏳";
      text = "Loading...";
    } else if (fhevmStatus === "error") {
      badgeClass += "error";
      icon = "✕";
      text = "Error";
    } else {
      return <span className="badge" style={{ background: "#e5e7eb", color: "#6b7280" }}>⏸ Idle</span>;
    }
    return (
      <span className={badgeClass}>
        <span>{icon}</span>
        {text}
      </span>
    );
  }, [fhevmStatus]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* 连接钱包 */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>🔗</span>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>连接钱包</h2>
        </div>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
          {isConnected ? (
            <span style={{ color: "#10b981", fontWeight: 600 }}>✓ 已连接 (chainId={chainId})</span>
          ) : (
            <span>请连接 MetaMask 钱包到本地节点（chainId=31337）</span>
          )}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={connect} disabled={isConnected}>
            {isConnected ? "✓ 已连接" : "连接 MetaMask"}
          </button>
          {statusBadge}
        </div>
        {fhevmError && (
          <div style={{
            marginTop: "12px",
            padding: "12px",
            background: "#fee",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "13px"
          }}>
            {String(fhevmError)}
          </div>
        )}
      </div>

      {/* 创建祝福墙 */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>🏛️</span>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>创建祝福墙</h2>
        </div>
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
          <input autoComplete="off" value={wallTitle} onChange={(e) => setWallTitle(e.target.value)} placeholder="墙标题" />
          <input autoComplete="off" value={wallCover} onChange={(e) => setWallCover(e.target.value)} placeholder="封面 CID（可选）" />
        </div>
        <div style={{ marginTop: 10 }}>
          <textarea autoComplete="off" value={wallDesc} onChange={(e) => setWallDesc(e.target.value)} placeholder="墙描述" />
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => cheers.actions.createWall(wallTitle, wallDesc, wallCover)} disabled={!ethersSigner || cheers.isBusy}>创建</button>
        </div>
        {cheers.wallId && (
          <div style={{
            padding: "12px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#059669"
          }}>
            ✓ 新建 wallId: <span style={{ fontFamily: "monospace" }}>{cheers.wallId}</span>（当前发帖目标：{cheers.targetWallId ?? "未设置"}）
          </div>
        )}
      </div>

      {/* 发布祝福 */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>💌</span>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>发布祝福</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>选择目标墙:</span>
          <select
            value={String(cheers.targetWallId ?? '')}
            onChange={(e) => cheers.actions.setTargetWallId(Number(e.target.value))}
            style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}
          >
            <option value="" disabled>请选择</option>
            {cheers.walls.map(w => (
              <option key={w.wallId} value={w.wallId}>
                #{w.wallId} {w.title}
              </option>
            ))}
          </select>
          <button className="secondary" onClick={cheers.actions.refreshWalls}>刷新</button>
        </div>
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
          <input autoComplete="off" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="标题" />
          <input autoComplete="off" value={postMedia} onChange={(e) => setPostMedia(e.target.value)} placeholder="mediaCID（可选）" />
        </div>
        <div style={{ marginTop: 10 }}>
          <textarea autoComplete="off" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="正文" />
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: 12 }}>
          <button
            onClick={() => cheers.actions.postBlessing(cheers.targetWallId ?? cheers.wallId!, postTitle, postContent, postMedia)}
            disabled={!ethersSigner || !(cheers.targetWallId ?? cheers.wallId) || cheers.isBusy}
          >
            发布
          </button>
        </div>
        {cheers.postId && (
          <div style={{
            padding: "12px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#059669"
          }}>
            ✓ 当前 postId: <span style={{ fontFamily: "monospace" }}>{cheers.postId}</span>
          </div>
        )}
      </div>

      {/* 点赞与解密 */}
      <PostsList cheersHook={cheers} />

      {/* 点赞与解密（单帖工具区，仍保留）*/}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "24px" }}>❤️</span>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>点赞（FHE 加密）与解密显示</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>选择祝福（Post）:</span>
          <select
            value={String(cheers.selectedPostId ?? '')}
            onChange={(e) => cheers.actions.setSelectedPostId(Number(e.target.value))}
            style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}
          >
            <option value="" disabled>请选择</option>
            {cheers.posts.map(p => (
              <option key={p.postId} value={p.postId}>
                #{p.postId} {p.title}
              </option>
            ))}
          </select>
          <button className="secondary" onClick={cheers.actions.refreshPosts}>刷新列表</button>
        </div>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
          like 计数使用 FHE 加密存储：调用合约前在本地加密，读取后用 userDecrypt 解密。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <button onClick={() => cheers.actions.encryptedLike(1)} disabled={!cheers.canLike}>
            <span style={{ marginRight: "6px" }}>👍</span>
            点赞 +1
          </button>
          <button className="secondary" onClick={cheers.actions.refreshLikeHandle} disabled={!cheers.selectedPostId}>
            <span style={{ marginRight: "6px" }}>🔄</span>
            刷新句柄
          </button>
          <button className="secondary" onClick={cheers.actions.decryptLike} disabled={!cheers.canDecrypt}>
            <span style={{ marginRight: "6px" }}>🔓</span>
            解密查看
          </button>
        </div>
        <div style={{
          display: "grid",
          gap: "12px",
          padding: "16px",
          background: "#f9fafb",
          borderRadius: "12px",
          fontSize: "14px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280", fontWeight: 600 }}>Like 句柄:</span>
            <span style={{ fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" }}>
              {cheers.likeHandle || "-"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontWeight: 600 }}>解密 Like:</span>
            <span style={{
              fontSize: "24px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #ff6b81, #ff8a3d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              {cheers.clearLike !== undefined ? String(cheers.clearLike) : "未解密"}
            </span>
          </div>
        </div>
      </div>

      {/* 消息日志 */}
      {cheers.message && (
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(147,51,234,0.05))",
          border: "1px solid rgba(59,130,246,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>消息</h3>
          </div>
          <div style={{
            padding: "12px 16px",
            background: "white",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "monospace",
            color: "#374151",
            wordBreak: "break-word"
          }}>
            {cheers.message}
          </div>
        </div>
      )}
    </div>
  );
};


