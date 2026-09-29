"use client";

import { useMemo, useState } from "react";

type Job = {
  id: string;
  status: string;
  generation_url?: string;
  message?: string;
  error?: string;
};

const presets = {
  Cinematic: "Cinematic, realistic lighting, controlled camera movement, natural motion, premium film look.",
  Fashion: "High-end fashion editorial, elegant movement, premium studio lighting, realistic fabric motion, polished commercial look.",
  "Product Ad": "Premium product commercial, controlled camera movement, clean composition, realistic materials, luxury advertising aesthetic.",
  Social: "Dynamic social-media video, strong visual hook, natural camera movement, crisp subject separation, polished vertical composition.",
  "Story Scene": "Cinematic story scene, expressive character action, believable environment, natural motion, coherent beginning-to-end movement.",
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<keyof typeof presets>("Cinematic");
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("768p");
  const [ratio, setRatio] = useState("9:16");
  const [mode, setMode] = useState("speed");
  const [status, setStatus] = useState("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");

  const finalPrompt = useMemo(() => {
    const style = presets[preset];
    return prompt.trim() ? `${prompt.trim()}. ${style}` : "";
  }, [prompt, preset]);

  async function generate() {
    setError("");
    setJob(null);
    if (!prompt.trim()) {
      setError("Write a video idea first.");
      return;
    }

    setStatus("uploading");

    try {
      const form = new FormData();
      form.append("prompt", finalPrompt);
      form.append("duration", duration);
      form.append("resolution", resolution);
      form.append("aspect_ratio", ratio);
      form.append("mode", mode);
      if (firstFrame) form.append("image", firstFrame);
      if (lastFrame) form.append("last_frame_image", lastFrame);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation request failed.");

      const initial: Job = { id: data.id, status: data.status || "starting" };
      setJob(initial);
      setStatus("generating");

      poll(data.id);
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  async function poll(id: string) {
    for (;;) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`/api/status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setStatus("idle");
        setError(data.error || "Could not check generation status.");
        return;
      }

      setJob({ id, ...data });

      if (data.status === "succeeded") {
        setStatus("complete");
        return;
      }

      if (data.status === "failed" || data.status === "canceled") {
        setStatus("idle");
        setError(data.error || data.message || "Video generation failed.");
        return;
      }
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="dot" /> PRUNA <b>STUDIO</b></div>
        <span className="model">P-VIDEO-2-PRO</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">AI VIDEO CREATION</p>
          <h1>Turn an idea into<br /><em>moving pictures.</em></h1>
          <p className="sub">Generate cinematic videos from a prompt, an image, or both.</p>
        </div>
      </section>

      <section className="workspace">
        <div className="panel controls">
          <label>CREATIVE PRESET</label>
          <div className="preset-grid">
            {(Object.keys(presets) as Array<keyof typeof presets>).map((p) => (
              <button key={p} className={preset === p ? "preset active" : "preset"} onClick={() => setPreset(p)}>
                {p}
              </button>
            ))}
          </div>

          <label>VIDEO PROMPT</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the scene, subject, action and camera movement..."
            rows={6}
          />

          <div className="frames">
            <label className="upload">
              <span>FIRST FRAME</span>
              <strong>{firstFrame ? firstFrame.name : "+ Upload image"}</strong>
              <input type="file" accept="image/*" onChange={(e) => setFirstFrame(e.target.files?.[0] || null)} />
            </label>
            <label className="upload">
              <span>LAST FRAME <small>OPTIONAL</small></span>
              <strong>{lastFrame ? lastFrame.name : "+ Upload image"}</strong>
              <input type="file" accept="image/*" onChange={(e) => setLastFrame(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="options">
            <div><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{[5,6,8,10,12,15].map(x=><option key={x}>{x}</option>)}</select></div>
            <div><span>Resolution</span><select value={resolution} onChange={e => setResolution(e.target.value)}><option>768p</option><option>480p</option></select></div>
            <div><span>Ratio</span><select value={ratio} onChange={e => setRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:3</option><option>3:4</option></select></div>
            <div><span>Mode</span><select value={mode} onChange={e => setMode(e.target.value)}><option>speed</option><option>quality</option><option>cost</option></select></div>
          </div>

          <button className="generate" onClick={generate} disabled={status === "uploading" || status === "generating"}>
            {status === "uploading" ? "UPLOADING…" : status === "generating" ? "GENERATING…" : "✦ GENERATE VIDEO"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="panel result">
          <div className="result-head"><span>OUTPUT</span><span>{status === "complete" ? "READY" : status.toUpperCase()}</span></div>
          {job?.generation_url ? (
            <div className="video-wrap">
              <video src={job.generation_url} controls playsInline />
              <a className="download" href={job.generation_url} download>DOWNLOAD VIDEO</a>
            </div>
          ) : (
            <div className="empty">
              <div className="play">▶</div>
              <h2>Your creation will appear here.</h2>
              <p>Choose a preset, write your idea and generate.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
