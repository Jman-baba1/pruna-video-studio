import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRUNA = "https://api.pruna.ai/v1";

export async function POST(request: Request) {
  const apiKey = process.env.PRUNA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PRUNA_API_KEY is not configured." }, { status: 500 });

  try {
    const form = await request.formData();
    const prompt = String(form.get("prompt") || "");
    if (!prompt.trim()) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });

    async function upload(file: FormDataEntryValue | null) {
      if (!(file instanceof File)) return null;
      const uploadForm = new FormData();
      uploadForm.append("content", file, file.name);
      const r = await fetch(`${PRUNA}/files`, {
        method: "POST",
        headers: { apikey: apiKey },
        body: uploadForm,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Pruna file upload failed.");
      return data.urls?.get || `${PRUNA}/files/${data.id}`;
    }

    const image = await upload(form.get("image"));
    const lastFrame = await upload(form.get("last_frame_image"));

    const input: Record<string, unknown> = {
      prompt,
      duration: Number(form.get("duration") || 5),
      resolution: String(form.get("resolution") || "768p"),
      aspect_ratio: String(form.get("aspect_ratio") || "9:16"),
      mode: String(form.get("mode") || "speed"),
      prompt_upsampler: "turbo",
    };
    if (image) input.image = image;
    if (lastFrame) input.last_frame_image = lastFrame;

    const response = await fetch(`${PRUNA}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Model: "p-video-2-pro",
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error || "Pruna generation request failed.", details: data }, { status: response.status });

    return NextResponse.json({
      id: data.id,
      status: data.status || "starting",
      get_url: data.get_url,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
