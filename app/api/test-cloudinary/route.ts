import { NextResponse } from "next/server";
import { verifyCloudinaryConnection } from "@/lib/cloudinary";

export async function GET() {
  try {
    const result = await verifyCloudinaryConnection();
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        message: "Excepción al probar la conexión con Cloudinary",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
