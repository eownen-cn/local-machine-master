import { useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { sentences, type Unit } from "./content";
const audioDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("grove-audio", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
async function audioFile(id: string, file?: File) {
  const db = await audioDB();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction("files", file ? "readwrite" : "readonly");
      const request = file
        ? tx.objectStore("files").put(file, id)
        : tx.objectStore("files").get(id);
      let result: Blob | undefined;
      request.onsuccess = () => {
        if (!file) result = request.result;
      };
      tx.oncomplete = () => resolve(file || result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function Audio({
  unit,
  onSentence,
}: {
  unit: Unit;
  onSentence?: (index: number) => void;
}) {
  const parts = sentences(unit);
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(0.85);
  const [accent, setAccent] = useState("en-GB");
  const [loop, setLoop] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    let objectURL = "";
    audioFile(unit.id)
      .then((f) => {
        if (f && active) {
          objectURL = URL.createObjectURL(f);
          setUrl(objectURL);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      URL.revokeObjectURL(objectURL);
      window.speechSynthesis?.cancel();
    };
  }, [unit.id]);
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    onSentence?.(index);
    return () => window.speechSynthesis?.cancel();
  }, [index, rate, accent]);
  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };
  const speak = (full = false) => {
    if (playing) {
      stop();
      return;
    }
    if (!window.speechSynthesis) {
      setError("此浏览器不支持合成朗读，可导入自己的音频。");
      return;
    }
    setError("");
    const utter = new SpeechSynthesisUtterance(
      full ? unit.passage : parts[index],
    );
    utter.lang = accent;
    utter.rate = rate;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === accent);
    if (voice) utter.voice = voice;
    utter.onend = () => {
      if (loop && !full) {
        window.speechSynthesis.speak(utter);
      } else setPlaying(false);
    };
    utter.onerror = () => {
      setPlaying(false);
      setError("语音播放失败，请检查设备英语语音或导入音频。");
    };
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  };
  return (
    <section className="audio-module">
      <div className="audio-player">
        <button
          className="play-button"
          aria-label={playing ? "停止分句朗读" : "播放当前句"}
          onClick={() => speak()}
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <div>
          <strong>
            第 {index + 1} / {parts.length} 句
          </strong>
          <span>设备合成语音 · 可切换英美口音</span>
        </div>
        <select
          aria-label="语速"
          value={rate}
          onChange={(e) => setRate(+e.target.value)}
        >
          {[0.6, 0.75, 0.85, 1, 1.2].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="toolbar">
        <button
          className="secondary"
          aria-label="上一句"
          disabled={!index}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          className="secondary"
          aria-label="下一句"
          disabled={index === parts.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          <ChevronRight size={15} />
        </button>
        <button
          className={loop ? "primary" : "secondary"}
          aria-pressed={loop}
          onClick={() => {
            stop();
            setLoop(!loop);
          }}
        >
          <Repeat size={15} />
          循环
        </button>
        <button className="secondary" onClick={() => speak(true)}>
          全文朗读
        </button>
        <select
          aria-label="英语口音"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
        >
          <option value="en-GB">英式英语</option>
          <option value="en-US">美式英语</option>
        </select>
      </div>
      <details>
        <summary>导入自己的音频</summary>
        <p className="subtle">
          音频保存在此设备
          IndexedDB，不上传或同步。请使用你有权使用的素材。导入音频支持原生播放和拖动，不提供自动分句。
        </p>
        <input
          aria-label="导入音频"
          type="file"
          accept="audio/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              !file.type.startsWith("audio/") ||
              file.size > 50 * 1024 * 1024
            ) {
              setError("请选择不超过 50 MB 的音频。");
              return;
            }
            try {
              await audioFile(unit.id, file);
              if (url) URL.revokeObjectURL(url);
              setUrl(URL.createObjectURL(file));
              setError("");
            } catch {
              setError("音频保存失败，请检查存储权限和剩余空间。");
            }
          }}
        />
        {url && <audio controls src={url} preload="metadata" />}
      </details>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </section>
  );
}
