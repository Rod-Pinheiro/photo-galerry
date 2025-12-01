import { NextRequest, NextResponse } from 'next/server'
import { getAllEvents, createEvent } from '@/lib/photo-service'
import { saveEventMetadata, loadEventMetadata } from '@/lib/minio'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/admin/events - List all events (including hidden ones)
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await getAllEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/admin/events - Create new event
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const dateStr = formData.get('date') as string
    const thumbnail = formData.get('thumbnail') as File

    if (!name || !dateStr) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const event = await createEvent(name, date, thumbnail)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}