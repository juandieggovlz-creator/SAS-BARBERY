import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      include: { page: true },
    })

    if (!business) {
      return {
        title: 'Barbería no encontrada | BarberOS',
        description: 'Página de reservas en línea para barberías.',
      }
    }

    const name = business.name
    const page = business.page as any
    const slogan = page?.slogan || page?.coverSubtitle || business.description || 'Reserva tu cita online 24/7'
    const title = `${name} | Barbería & Reservas Online`
    const description = `${name} - ${slogan}. Conoce nuestros servicios, elige a tu barbero y agenda tu cita al instante.`
    const logo = business.logo || undefined
    const banner = page?.bannerUrl || undefined
    const ogImage = banner || logo

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: name,
        images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
      icons: logo ? { icon: logo, apple: logo } : undefined,
    }
  } catch {
    return {
      title: 'Página de Reservas | BarberOS',
      description: 'Reserva tu cita en las mejores barberías.',
    }
  }
}

export default function PublicBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
