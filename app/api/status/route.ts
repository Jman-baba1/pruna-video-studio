import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const apiKey = process.env.PRUNA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PRUNA_API_KEY is not configured." }, { status: 500 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing prediction id." }, { status: 400 });

  try {
    const response = await fetch(`https://api.pruna.ai/v1/predictions/status/${encodeURIComponent(id)}`, {
      headers: { apikey: apiKey },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error || "Status request failed." }, { status: response.status });

    return NextResponse.json({
      status: data.status,
      message: data.message,
      error: data.error,
      generation_url: data.generation_url,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
