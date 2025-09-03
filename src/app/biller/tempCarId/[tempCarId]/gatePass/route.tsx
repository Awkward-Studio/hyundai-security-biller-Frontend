import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { GatePassPDF } from "@/components/GatePassTest";

import {
  uploadInvoice,
  getInvoiceUrl,
  updateTempCarFieldsById,
  CarStatus,
  getTempCarById,
  getCarById,
} from "@/lib/appwrite";

import { base64Logo, base64MarutiLogo, streamToBuffer } from "@/lib/helper";

export async function POST(
  request: NextRequest,
  { params }: { params: { tempCarId: string } }
) {
  try {
    const tempCarDoc: any = await getTempCarById(params.tempCarId);
    const carDoc: any = await getCarById(tempCarDoc.carsTableId);

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

    // 2. Convert to buffer
    const buffer: Buffer = await streamToBuffer(stream);

    // ✅ Wrap in Uint8Array for TS-safe Blob creation
    const uint8 = new Uint8Array(buffer);
    const blob = new Blob([uint8], { type: "application/pdf" });

    // 3. Generate unique filename
    const uniqueStr = Math.random().toString(36).slice(2, 8);
    const file = new File(
      [blob],
      `${params.tempCarId}_gatePass_${uniqueStr}.pdf`,
      {
        type: "application/pdf",
      }
    );

    // 4. Upload to Appwrite
    const uploadResult = await uploadInvoice(file);
    if (!uploadResult) {
      throw new Error("Failed to upload invoice");
    }

    const fileResult = await getInvoiceUrl(uploadResult.$id);
    if (!fileResult) {
      throw new Error("Failed to fetch uploaded file URL");
    }

    const pdfUrl = fileResult.href;
    console.log("Gatepass uploaded:", pdfUrl);

    // 5. Save to TempCar
    await updateTempCarFieldsById(params.tempCarId, {
      gatePassPDF: pdfUrl,
      carStatus: CarStatus.GATEPASS_GENERATED,
    });

    return NextResponse.json({ pdfUrl }, { status: 201 });
  } catch (error) {
    console.error("Gatepass generation failed:", error);
    return NextResponse.json(
      { message: "Failed", status: false },
      { status: 500 }
    );
  }
}
