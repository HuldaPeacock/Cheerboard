"use client";

import { useEffect, useState } from "react";

type PostItem = {
  postId: number;
  title: string;
  content: string;
  author: string;
  mediaCID: string;
  timestamp: number;
  handle?: string;
  clear?: string | bigint | boolean;
  isLoading?: boolean;
};

type PostsListProps = {
  cheersHook: any;
};

export const PostsList: React.FC<PostsListProps> = ({ cheersHook }) => {
  const [items, setItems] = useState<PostItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const ids: number[] = await cheersHook.actions.listPostIds();
      const detailed: PostItem[] = [];
      for (let i = 0; i < ids.length; i++) {
        const d = await cheersHook.actions.getPostById(ids[i]);
        if (d) detailed.push({
          postId: d.postId,
          title: d.title,
          content: d.content,
          author: d.author,
          mediaCID: d.mediaCID,
          timestamp: d.timestamp,
        });
      }
      setItems(detailed.reverse());
    };
    load();
  }, [cheersHook.targetWallId]);

  const like = async (postId: number) => {
    const next = items.map((it) => it.postId === postId ? { ...it, isLoading: true } : it);
    setItems(next);
    try {
      await cheersHook.actions.likeForPost(postId);
    } finally {
      const n2 = items.map((it) => it.postId === postId ? { ...it, isLoading: false } : it);
      setItems(n2);
    }
  };

  const refreshHandle = async (postId: number) => {
    const h = await cheersHook.actions.getHandleForPost(postId);
    setItems((prev) => prev.map((it) => it.postId === postId ? { ...it, handle: h } : it));
  };

  const decrypt = async (postId: number) => {
    const it = items.find((i) => i.postId === postId);
    if (!it?.handle) return;
    const clear = await cheersHook.actions.decryptHandle(it.handle);
    setItems((prev) => prev.map((p) => p.postId === postId ? { ...p, clear } : p));
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>📜</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>祝福列表</h2>
        <div style={{ marginLeft: "auto" }}>
          <button className="secondary" onClick={async () => {
            const ids: number[] = await cheersHook.actions.listPostIds();
            const detailed: PostItem[] = [];
            for (let i = 0; i < ids.length; i++) {
              const d = await cheersHook.actions.getPostById(ids[i]);
              if (d) detailed.push({
                postId: d.postId,
                title: d.title,
                content: d.content,
                author: d.author,
                mediaCID: d.mediaCID,
                timestamp: d.timestamp,
              });
            }
            setItems(detailed.reverse());
          }}>刷新</button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((p) => (
          <div key={p.postId} className="card" style={{ border: "1px solid #fbd5d5", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{p.title || `#${p.postId}`}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>作者: {p.author.slice(0,6)}…{p.author.slice(-4)} · {new Date(p.timestamp * 1000).toLocaleString()}</div>
            </div>
            <div style={{ marginTop: 8, color: "#374151" }}>{p.content || "(无正文)"}</div>
            {p.mediaCID && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>mediaCID: {p.mediaCID}</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginTop: 10 }}>
              <button onClick={() => like(p.postId)} disabled={p.isLoading}>👍 点赞 +1</button>
              <button className="secondary" onClick={() => refreshHandle(p.postId)}>🔄 刷新句柄</button>
              <button className="secondary" onClick={() => decrypt(p.postId)} disabled={!p.handle}>🔓 解密查看</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>句柄: <span style={{ fontFamily: "monospace" }}>{p.handle || "-"}</span></div>
            <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>解密 Like: {p.clear !== undefined ? String(p.clear) : "未解密"}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: "#6b7280" }}>暂无祝福，先发布一条吧。</div>
        )}
      </div>
    </div>
  );
};


