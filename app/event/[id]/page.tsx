import { notFound } from "next/navigation"
import { EventGallery } from "@/components/event-gallery"
import { getEventById } from "@/lib/photo-service"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams() {
  // Don't generate static pages for events
  return []
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id

  const event = await getEventById(id)

  if (!event) {
    notFound()
  }

  return <EventGallery event={event} />
}
