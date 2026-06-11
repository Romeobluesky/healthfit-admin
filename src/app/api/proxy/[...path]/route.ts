import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://healthfit.autocallup.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = `/${path.join("/")}`;
  return proxyRequest(endpoint, request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = `/${path.join("/")}`;
  return proxyRequest(endpoint, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = `/${path.join("/")}`;
  return proxyRequest(endpoint, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = `/${path.join("/")}`;
  return proxyRequest(endpoint, request);
}

async function proxyRequest(endpoint: string, request: NextRequest) {
  const url = `${API_BASE_URL}${endpoint}`;

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.startsWith("multipart/form-data");

  const init: RequestInit = {
    method: request.method,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (isMultipart) {
      // 파일 업로드: FormData 그대로 통과 (Content-Type은 fetch가 boundary 포함해 자동 설정)
      init.body = await request.formData();
    } else {
      init.headers = { "Content-Type": "application/json" };
      const body = await request.text();
      if (body) init.body = body;
    }
  } else {
    init.headers = { "Content-Type": "application/json" };
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Proxy request failed", detail: String(error) },
      { status: 502 }
    );
  }
}
