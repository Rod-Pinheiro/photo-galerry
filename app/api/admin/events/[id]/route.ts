import { NextRequest, NextResponse } from 'next/server'
import { getAllEvents, deleteEvent, invalidateEventsCache } from '@/lib/photo-service'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/admin/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/admin/events/[id] called')
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      console.log('Unauthorized access')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    console.log('Looking for event ID:', eventId)

    const events = await getAllEvents()
    console.log('Loaded events count:', events.length)
    console.log('Available events:', events.map((e: any) => e.id))
    const event = events.find((e: any) => e.id === eventId)
    console.log('Found event:', event ? 'yes' : 'no')

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

// PUT /api/admin/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    console.log('Updating event:', eventId)

    const body = await request.json()
    const { name, date, visible } = body
    console.log('Update data:', { name, date, visible })

    // Update event in database
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (date !== undefined) {
      updateFields.push(`date = $${paramIndex++}`)
      values.push(new Date(date))
    }
    if (visible !== undefined) {
      updateFields.push(`visible = $${paramIndex++}`)
      values.push(visible)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(eventId) // for WHERE id = $paramIndex

    const updateQuery = `
      UPDATE events
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, name, date, thumbnail, visible
    `

    const result = await db.query(updateQuery, values)
    const updatedEvent = result.rows[0]

    // Get photos for the event
    const photosResult = await db.query(`
      SELECT id, url FROM photos WHERE event_id = $1 ORDER BY created_at ASC
    `, [eventId])

    // Clear cache
    invalidateEventsCache()

    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      date: updatedEvent.date,
      thumbnail: updatedEvent.thumbnail || '/placeholder.jpg',
      photos: photosResult.rows.map((photo: any) => ({
        id: photo.id,
        url: photo.url
      })),
      visible: updatedEvent.visible
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Check if event exists
    const events = await getAllEvents()
    const eventExists = events.some((e: any) => e.id === eventId)

    if (!eventExists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete the event and all its photos
    await deleteEvent(eventId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}