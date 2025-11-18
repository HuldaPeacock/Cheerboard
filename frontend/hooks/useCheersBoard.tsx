"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { CheersBoardABI } from "@/abi/CheersBoardABI";
import { CheersBoardAddresses } from "@/abi/CheersBoardAddresses";

export type ClearValueType = { handle: string; clear: string | bigint | boolean };

type CheersBoardInfoType = {
  abi: typeof CheersBoardABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getCheersBoardByChainId(chainId: number | undefined): CheersBoardInfoType {
  if (!chainId) return { abi: CheersBoardABI.abi };
  const entry = CheersBoardAddresses[chainId.toString() as keyof typeof CheersBoardAddresses] as any;
  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: CheersBoardABI.abi, chainId };
  }
  return { address: entry.address as `0x${string}`, chainId: entry.chainId ?? chainId, chainName: entry.chainName, abi: CheersBoardABI.abi };
}

export const useCheersBoard = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const { instance, fhevmDecryptionSignatureStorage, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner } = parameters;

  const [message, setMessage] = useState<string>("");
  const [wallId, setWallId] = useState<number | undefined>(undefined);
  const [targetWallId, setTargetWallId] = useState<number | undefined>(undefined);
  const [walls, setWalls] = useState<
    { wallId: number; title: string; description: string; coverCID: string }[]
  >([]);
  const [posts, setPosts] = useState<{ postId: number; title: string }[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(undefined);
  const [postId, setPostId] = useState<number | undefined>(undefined);
  const [likeHandle, setLikeHandle] = useState<string | undefined>(undefined);
  const [clearLike, setClearLike] = useState<ClearValueType | undefined>(undefined);
  const clearLikeRef = useRef<ClearValueType>(undefined as any);

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const isBusyRef = useRef<boolean>(isBusy);
  useEffect(() => { isBusyRef.current = isBusy; }, [isBusy]);

  const cheersRef = useRef<CheersBoardInfoType | undefined>(undefined);

  const cheers = useMemo(() => {
    const c = getCheersBoardByChainId(chainId);
    cheersRef.current = c;
    if (!c.address) {
      setMessage(`CheersBoard not deployed on chainId=${chainId}.`);
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!cheers) return undefined;
    return Boolean(cheers.address) && cheers.address !== ethers.ZeroAddress;
  }, [cheers]);

  const canRead = useMemo(() => cheers.address && ethersReadonlyProvider, [cheers.address, ethersReadonlyProvider]);

  const refreshWalls = useCallback(async () => {
    try {
      if (!cheers.address || !ethersReadonlyProvider) return;
      const c = new ethers.Contract(cheers.address, cheers.abi, ethersReadonlyProvider);
      const next: bigint = await c.nextWallId();
      const list: { wallId: number; title: string; description: string; coverCID: string }[] = [];
      const max = Number(next);
      for (let i = 1; i < max; i++) {
        try {
          const w = await c.getWall(i);
          if (w.organizer !== ethers.ZeroAddress) {
            list.push({ wallId: i, title: w.title as string, description: w.description as string, coverCID: w.coverCID as string });
          }
        } catch {}
      }
      setWalls(list);
      if (!targetWallId && list.length > 0) {
        setTargetWallId(list[list.length - 1].wallId);
      }
    } catch {}
  }, [cheers.address, cheers.abi, ethersReadonlyProvider, targetWallId]);

  const refreshLikeHandle = useCallback(() => {
    const wId = targetWallId ?? wallId;
    const pId = selectedPostId ?? postId;
    if (!canRead || !pId || !wId) return;
    const c = new ethers.Contract(cheers.address!, cheers.abi, ethersReadonlyProvider);
    c.getEncryptedLikeCount(wId, pId)
      .then((value: string) => {
        setLikeHandle(value);
      })
      .catch((e: any) => setMessage("getEncryptedLikeCount failed: " + e?.message));
  }, [canRead, cheers.address, cheers.abi, ethersReadonlyProvider, wallId, targetWallId, postId, selectedPostId]);

  useEffect(() => { refreshLikeHandle(); }, [refreshLikeHandle]);
  useEffect(() => { refreshWalls(); }, [refreshWalls]);
  
  const refreshPosts = useCallback(async () => {
    try {
      const wId = targetWallId ?? wallId;
      if (!cheers.address || !ethersReadonlyProvider || !wId) return;
      const c = new ethers.Contract(cheers.address, cheers.abi, ethersReadonlyProvider);
      const ids: bigint[] = await c.getPostsByWall(wId);
      const list: { postId: number; title: string }[] = [];
      for (let i = 0; i < ids.length; i++) {
        const idn = Number(ids[i]);
        try {
          const p = await c.getPost(idn);
          list.push({ postId: idn, title: (p.title as string) || `#${idn}` });
        } catch {}
      }
      setPosts(list);
      if (list.length > 0 && !selectedPostId) {
        setSelectedPostId(list[list.length - 1].postId);
      }
    } catch {}
  }, [cheers.address, cheers.abi, ethersReadonlyProvider, targetWallId, wallId, selectedPostId]);

  useEffect(() => { refreshPosts(); }, [refreshPosts]);

  // Return post ids for current wall (without touching hook state)
  const listPostIds = useCallback(async (): Promise<number[]> => {
    try {
      const wId = targetWallId ?? wallId;
      if (!cheers.address || !ethersReadonlyProvider || !wId) return [];
      const c = new ethers.Contract(cheers.address, cheers.abi, ethersReadonlyProvider);
      const ids: bigint[] = await c.getPostsByWall(wId);
      return ids.map((x) => Number(x));
    } catch {
      return [];
    }
  }, [cheers.address, cheers.abi, ethersReadonlyProvider, targetWallId, wallId]);

  const decryptLike = useCallback(() => {
    if (!cheers.address || !instance || !ethersSigner || !likeHandle) return;
    if (likeHandle === clearLikeRef.current?.handle) return;
    const thisAddr = cheers.address; const thisChain = chainId; const thisSigner = ethersSigner; const thisHandle = likeHandle;
    setIsBusy(true); setMessage("Decrypting like...");
    (async () => {
      const isStale = () => thisAddr !== cheersRef.current?.address || !sameChain.current?.(thisChain) || !sameSigner.current?.(thisSigner);
      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [thisAddr],
          thisSigner,
          fhevmDecryptionSignatureStorage
        );
        if (!sig || isStale()) return;
        const res = await instance.userDecrypt(
          [{ handle: thisHandle, contractAddress: thisAddr }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        if (isStale()) return;
        setClearLike({ handle: thisHandle, clear: res[thisHandle] });
        clearLikeRef.current = { handle: thisHandle, clear: res[thisHandle] };
        setMessage("Decrypted like count: " + res[thisHandle]);
      } finally {
        setIsBusy(false);
      }
    })();
  }, [cheers.address, instance, ethersSigner, likeHandle, chainId, fhevmDecryptionSignatureStorage, sameChain, sameSigner]);

  const encryptedLike = useCallback((inc: number) => {
    const wId = targetWallId ?? wallId;
    const pId = selectedPostId ?? postId;
    if (!cheers.address || !instance || !ethersSigner || !pId || !wId) return;
    const op = inc > 0 ? inc : -inc;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersSigner);
    setIsBusy(true); setMessage(`Encrypt like +${op}...`);
    (async () => {
      try {
        const input = instance.createEncryptedInput(cheers.address!, ethersSigner.address!);
        input.add32(op);
        const enc = await input.encrypt();
        const tx: ethers.TransactionResponse = await c.likePost(wId, pId, enc.handles[0], enc.inputProof);
        setMessage(`Waiting tx ${tx.hash}...`);
        await tx.wait();
        setMessage(`Like +${op} done.`);
        refreshLikeHandle();
      } catch (e: any) {
        setMessage("Encrypted like failed: " + e?.message);
      } finally {
        setIsBusy(false);
      }
    })();
  }, [cheers.address, cheers.abi, instance, ethersSigner, wallId, targetWallId, postId, selectedPostId, refreshLikeHandle]);

  const createWall = useCallback((title: string, description: string, coverCID: string) => {
    if (!cheers.address || !ethersSigner) return;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersSigner);
    setIsBusy(true); setMessage("Creating wall...");
    (async () => {
      try {
        const tx = await c.createWall(title, description, coverCID, 0, 0, true, true, 0, false);
        const receipt = await tx.wait();
        let newWallId: number | undefined = undefined;
        for (const log of receipt?.logs || []) {
          try {
            const parsed = c.interface.parseLog(log);
            if (parsed?.name === "WallCreated") {
              newWallId = Number(parsed.args[0]);
              break;
            }
          } catch {}
        }
        if (newWallId) {
          setWallId(newWallId);
          setTargetWallId(newWallId);
          setMessage("Wall created: " + newWallId);
          await refreshWalls();
        } else {
          setMessage("Wall created (id not parsed) — check events");
        }
      } catch (e: any) {
        setMessage("Create wall failed: " + e?.message);
      } finally {
        setIsBusy(false);
      }
    })();
  }, [cheers.address, cheers.abi, ethersSigner, refreshWalls]);

  const postBlessing = useCallback((wId: number, title: string, content: string, mediaCID: string) => {
    if (!cheers.address || !ethersSigner || !wId) return;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersSigner);
    setIsBusy(true); setMessage("Posting blessing...");
    (async () => {
      try {
        const tx = await c.postBlessing(wId, title, content, mediaCID);
        const receipt = await tx.wait();
        let newPostId: number | undefined = undefined;
        for (const log of receipt?.logs || []) {
          try {
            const parsed = c.interface.parseLog(log);
            if (parsed?.name === "PostCreated") {
              newPostId = Number(parsed.args[1]);
              break;
            }
          } catch {}
        }
        if (newPostId) {
          setPostId(newPostId);
          setSelectedPostId(newPostId);
          setMessage("Post created: " + newPostId);
          setTimeout(() => refreshLikeHandle(), 300);
        } else {
          setMessage("Post created (id not parsed) — check events");
        }
      } catch (e: any) {
        setMessage("Post failed: " + e?.message);
      } finally {
        setIsBusy(false);
      }
    })();
  }, [cheers.address, cheers.abi, ethersSigner, refreshLikeHandle]);

  const canDecrypt = useMemo(() => cheers.address && instance && ethersSigner && likeHandle && likeHandle !== clearLike?.handle, [cheers.address, instance, ethersSigner, likeHandle, clearLike]);
  const canLike = useMemo(() => cheers.address && instance && ethersSigner && (targetWallId ?? wallId) && (selectedPostId ?? postId) && !isBusy, [cheers.address, instance, ethersSigner, wallId, targetWallId, postId, selectedPostId, isBusy]);

  // Helper: read single post details
  const getPostById = useCallback(async (pId: number) => {
    if (!cheers.address || !ethersReadonlyProvider) return undefined;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersReadonlyProvider);
    try {
      const p = await c.getPost(pId);
      return {
        postId: Number(pId),
        wallId: Number(p.wallId),
        author: p.author as string,
        title: p.title as string,
        content: p.content as string,
        mediaCID: p.mediaCID as string,
        timestamp: Number(p.timestamp),
      } as const;
    } catch {
      return undefined;
    }
  }, [cheers.address, cheers.abi, ethersReadonlyProvider]);

  // Helper: like for a specific post id
  const likeForPost = useCallback(async (pId: number) => {
    const wId = targetWallId ?? wallId;
    if (!cheers.address || !instance || !ethersSigner || !wId || !pId) return;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersSigner);
    const input = instance.createEncryptedInput(cheers.address, ethersSigner.address);
    input.add32(1);
    const enc = await input.encrypt();
    const tx: ethers.TransactionResponse = await c.likePost(wId, pId, enc.handles[0], enc.inputProof);
    await tx.wait();
  }, [cheers.address, cheers.abi, instance, ethersSigner, targetWallId, wallId]);

  // Helper: get handle for a specific post id
  const getHandleForPost = useCallback(async (pId: number) => {
    const wId = targetWallId ?? wallId;
    if (!cheers.address || !ethersReadonlyProvider || !wId || !pId) return undefined;
    const c = new ethers.Contract(cheers.address, cheers.abi, ethersReadonlyProvider);
    try {
      const h = await c.getEncryptedLikeCount(wId, pId);
      return h as string;
    } catch {
      return undefined;
    }
  }, [cheers.address, cheers.abi, ethersReadonlyProvider, targetWallId, wallId]);

  // Helper: decrypt a handle (user signs EIP-712)
  const decryptHandle = useCallback(async (handle: string) => {
    if (!instance || !ethersSigner || !cheers.address || !handle) return undefined;
    const sig = await FhevmDecryptionSignature.loadOrSign(
      instance,
      [cheers.address as `0x${string}`],
      ethersSigner,
      fhevmDecryptionSignatureStorage
    );
    if (!sig) return undefined;
    const res = await instance.userDecrypt(
      [{ handle, contractAddress: cheers.address as `0x${string}` }],
      sig.privateKey,
      sig.publicKey,
      sig.signature,
      sig.contractAddresses,
      sig.userAddress,
      sig.startTimestamp,
      sig.durationDays
    );
    return res[handle];
  }, [instance, ethersSigner, cheers.address, fhevmDecryptionSignatureStorage]);

  return {
    isDeployed,
    wallId,
    targetWallId,
    posts,
    selectedPostId,
    walls,
    postId,
    likeHandle,
    clearLike: clearLike?.clear,
    canDecrypt,
    canLike,
    isBusy,
    message,
    actions: {
      setTargetWallId,
      setSelectedPostId,
      createWall,
      postBlessing,
      refreshLikeHandle,
      decryptLike,
      encryptedLike,
      refreshWalls,
      refreshPosts,
      listPostIds,
      getPostById,
      likeForPost,
      getHandleForPost,
      decryptHandle
    }
  } as const;
};


