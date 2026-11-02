import { NextResponse } from 'next/server'
import { getLiveBusinessBySlug } from '@/lib/sync/availability-engine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/public/b/[slug]/live
 * Endpoint ligero que devuelve los servicios y barberos activos en tiempo real.
 * Usado para refrescar listas sin recargar la página completa.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const data = await getLiveBusinessBySlug(slug)

    if (!data) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    console.error('Error fetching live business data:', error)
    return NextResponse.json({ error: 'Error al consultar datos en vivo' }, { status: 500 })
  }
}

