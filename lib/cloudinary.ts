import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiOptions } from "cloudinary";

// Configuración centralizada de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
export default cloudinary;

/**
 * Carpetas organizadas para BarberOS en Cloudinary
 */
export const CLOUDINARY_FOLDERS = {
  LOGOS: (businessId: string) => `barberos/${businessId}/logo`,
  BARBERS: (businessId: string) => `barberos/${businessId}/barbers`,
  COVERS: (businessId: string) => `barberos/${businessId}/covers`,
  GALLERY: (businessId: string) => `barberos/${businessId}/gallery`,
} as const;

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Servicio centralizado para subir un archivo (Buffer o Uint8Array) a Cloudinary
 */
export async function uploadImageFromBuffer(
  buffer: Buffer | Uint8Array,
  folder: string,
  options?: UploadApiOptions
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          ...(options?.transformation ? [options.transformation].flat() : []),
        ],
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Error desconocido al subir imagen a Cloudinary"));
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  });
}

/**
 * Subir una imagen desde string (URL remota o data:image/...;base64)
 */
export async function uploadImageFromString(
  dataUriOrUrl: string,
  folder: string,
  options?: UploadApiOptions
): Promise<UploadResult> {
  const result: UploadApiResponse = await cloudinary.uploader.upload(dataUriOrUrl, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      ...(options?.transformation ? [options.transformation].flat() : []),
    ],
    ...options,
  });

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Eliminar una imagen de Cloudinary por su public_id
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error(`[Cloudinary] Error eliminando imagen con public_id "${publicId}":`, error);
    return false;
  }
}

/**
 * Helper para extraer el public_id a partir de una URL de Cloudinary
 * Ejemplo: https://res.cloudinary.com/cloud/image/upload/v1234/barberos/123/logo/abc.jpg -> barberos/123/logo/abc
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Verifica si una imagen o identificador es un recurso predeterminado, preset o externo
 * que NUNCA debe eliminarse de Cloudinary.
 */
export function isDefaultOrPresetImage(urlOrPublicId: string): boolean {
  if (!urlOrPublicId) return true;
  const lower = urlOrPublicId.toLowerCase();
  if (lower.startsWith('/imagenes/') || lower.startsWith('/presets/') || lower.startsWith('/images/')) return true;
  if (lower.includes('images.unsplash.com') || lower.includes('unsplash') || lower.includes('dicebear.com')) return true;
  if (lower.includes('/presets/') || lower.includes('default') || lower.includes('placeholder')) return true;
  return false;
}

/**
 * Valida de forma estricta que una imagen pertenezca al espacio de nombres del negocio (tenant isolation)
 */
export function isBusinessOwnedCloudinaryImage(urlOrPublicId: string, businessId: string): boolean {
  if (!urlOrPublicId || !businessId) return false;
  if (isDefaultOrPresetImage(urlOrPublicId)) return false;

  const publicId = urlOrPublicId.includes('/upload/')
    ? extractPublicIdFromUrl(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) return false;
  return publicId.startsWith(`barberos/${businessId}/`);
}

/**
 * Eliminación segura y auditada de imágenes de Cloudinary para un tenant específico.
 * Protege contra:
 * 1. Intentos de borrar imágenes de otros negocios.
 * 2. Borrado accidental de imágenes predeterminadas o presets del sistema.
 * 3. URLs externas o recursos no pertenecientes a Cloudinary.
 */
export async function safeDeleteTenantImage(
  urlOrPublicId: string | null | undefined,
  businessId: string
): Promise<{ deleted: boolean; reason: string }> {
  if (!urlOrPublicId) {
    return { deleted: false, reason: 'empty_reference' };
  }

  if (isDefaultOrPresetImage(urlOrPublicId)) {
    return { deleted: false, reason: 'preset_or_default_image' };
  }

  if (!isBusinessOwnedCloudinaryImage(urlOrPublicId, businessId)) {
    return { deleted: false, reason: 'not_owned_by_tenant' };
  }

  const publicId = urlOrPublicId.includes('/upload/')
    ? extractPublicIdFromUrl(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) {
    return { deleted: false, reason: 'invalid_public_id' };
  }

  const ok = await deleteImage(publicId);
  return { deleted: ok, reason: ok ? 'deleted_successfully' : 'cloudinary_error' };
}

/**
 * Verificar conexión y credenciales de Cloudinary
 */
export async function verifyCloudinaryConnection(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    return { success: false, message: "CLOUDINARY_CLOUD_NAME no está configurada." };
  }
  if (!apiKey) {
    return { success: false, message: "CLOUDINARY_API_KEY no está configurada." };
  }
  if (!apiSecret || apiSecret === "TU_API_SECRET") {
    return {
      success: false,
      message: "CLOUDINARY_API_SECRET aún contiene el valor temporal o no está configurada.",
    };
  }

  try {
    const pingResult = await cloudinary.api.ping();
    return {
      success: true,
      message: "Conexión a Cloudinary establecida y verificada exitosamente.",
      details: {
        cloudName,
        apiKey: apiKey.slice(0, 4) + "...",
        pingStatus: pingResult.status,
      },
    };
  } catch (err: unknown) {
    const error = err as { message?: string; http_code?: number };
    return {
      success: false,
      message: `Error al conectar con Cloudinary: ${error.message || "Credenciales inválidas"}`,
      details: { httpCode: error.http_code },
    };
  }
}
