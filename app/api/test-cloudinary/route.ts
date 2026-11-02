import { NextResponse } from "next/server";
import { verifyCloudinaryConnection } from "@/lib/cloudinary";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession('SUPER_ADMIN')
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

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
