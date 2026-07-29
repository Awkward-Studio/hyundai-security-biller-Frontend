import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { GatePassPDF } from "@/components/GatePassTest";
import { base64Logo, base64MarutiLogo, streamToBuffer } from "@/lib/helper";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

async function backendFetch<T>(
  path: string,
  authorization: string | null,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authorization) headers.set("Authorization", authorization);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Backend request failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tempCarId: string } }
) {
  try {
    const authorization = request.headers.get("authorization");
    const tempCarDoc: any = await backendFetch(
      `/api/temp-cars/${params.tempCarId}/`,
      authorization
    );
    const carDoc: any = await backendFetch(
      `/api/cars/${tempCarDoc.carsTableId}/`,
      authorization
    );

    const stream = await renderToStream(
      <GatePassPDF
        car={carDoc}
        tempCar={tempCarDoc}
        logo={base64Logo}
        marutiLogo={base64MarutiLogo}
        currentDate={new Date()}
        invoiceType="Gate Pass"
      />
    );

    const buffer: Buffer = await streamToBuffer(stream);
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/pdf",
    });
    const uniqueStr = Math.random().toString(36).slice(2, 8);
    const file = new File(
      [blob],
      `${params.tempCarId}_gatePass_${uniqueStr}.pdf`,
      { type: "application/pdf" }
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tempCarId", params.tempCarId);

    const uploadResult = await backendFetch<{ id: string; downloadUrl: string }>(
      "/api/gate-pass-files/",
      authorization,
      { method: "POST", body: formData }
    );

    await backendFetch(`/api/temp-cars/${params.tempCarId}/`, authorization, {
      method: "PATCH",
      body: JSON.stringify({
        gatePassPDF: uploadResult.downloadUrl,
        carStatus: "GATEPASS_GENERATED",
      }),
    });

    return NextResponse.json({ pdfUrl: uploadResult.downloadUrl }, { status: 201 });
  } catch (error) {
    console.error("Gatepass generation failed:", error);
    return NextResponse.json(
      { detail: "Failed to generate gate pass" },
      { status: 500 }
    );
  }
}
