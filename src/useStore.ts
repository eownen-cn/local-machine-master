import { useEffect, useRef, useState } from "react";
import {
  readStore,
  storeKey,
  mergeStores,
  validateStore,
  type Store,
} from "./store";
export function useLearningStore() {
  const [store, setStore] = useState(readStore);
  const [storageError, setStorageError] = useState("");
  const [syncStatus, setSyncStatus] = useState("尚未连接共享服务");
  const [connected, setConnected] = useState(false);
  const current = useRef(store);
  current.current = store;
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(store));
      setStorageError("");
    } catch {
      setStorageError("本机存储已满或不可用，请立即导出备份。");
    }
  }, [store]);
  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (e.key === storeKey && e.newValue) {
        try {
          const s = JSON.parse(e.newValue);
          if (validateStore(s)) setStore((old) => mergeStores(old, s));
        } catch {
          /* ignore corrupt external writes */
        }
      }
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);
  const syncBusy = useRef(false);
  async function sync() {
    if (syncBusy.current) return;
    syncBusy.current = true;
    setSyncStatus("正在同步…");
    try {
      const token = localStorage.getItem("grove-sync-token");
      if (!token) throw new Error("请在设置中输入启动窗口显示的配对码");
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(current.current),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "配对码不正确或已失效"
            : `共享服务不可用（${response.status}）`,
        );
      const remote: unknown = await response.json();
      if (!validateStore(remote)) throw new Error("服务返回了无效的学习数据");
      setStore((local) => mergeStores(local, remote));
      setConnected(true);
      setSyncStatus("已与电脑共享服务同步");
    } catch (e) {
      setConnected(false);
      setSyncStatus((e as Error).message);
    } finally {
      syncBusy.current = false;
    }
  }
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void sync();
    }, 10000);
    return () => clearInterval(id);
  }, [connected]);
  return { store, setStore, storageError, syncStatus, connected, sync };
}
