#!/usr/bin/env node

import { loadEventMetadata } from '../lib/minio.js'
import { prisma } from '../lib/prisma.js'

async function migrateData() {
  try {
    console.log('Starting data migration from MinIO metadata to database...')

    // Load existing metadata from MinIO
    const events = await loadEventMetadata()
    console.log(`Found ${events.length} events in metadata`)

    for (const eventData of events) {
      console.log(`Migrating event: ${eventData.name} (${eventData.id})`)

      // Create event in database
      const event = await prisma.event.upsert({
        where: { id: eventData.id },
        update: {
          name: eventData.name,
          date: new Date(eventData.date),
          thumbnail: eventData.thumbnail,
          visible: eventData.visible ?? true,
        },
        create: {
          id: eventData.id,
          name: eventData.name,
          date: new Date(eventData.date),
          thumbnail: eventData.thumbnail,
          visible: eventData.visible ?? true,
        }
      })

      // Create photos in database
      if (eventData.photos && eventData.photos.length > 0) {
        console.log(`  Migrating ${eventData.photos.length} photos...`)

        for (const photoData of eventData.photos) {
          await prisma.photo.upsert({
            where: { id: photoData.id },
            update: {
              filename: photoData.id,
              url: photoData.url,
              eventId: event.id,
            },
            create: {
              id: photoData.id,
              filename: photoData.id,
              url: photoData.url,
              eventId: event.id,
            }
          })
        }
      }
    }

    console.log('Migration completed successfully!')
    console.log(`Migrated ${events.length} events to database`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()