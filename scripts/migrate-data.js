#!/usr/bin/env node

import { saveEventMetadata, ensureBucketExists } from '../lib/minio.ts'
import { MOCK_EVENTS } from '../lib/photo-service.ts'

async function migrateMockData() {
  try {
    console.log('Ensuring bucket exists...')
    await ensureBucketExists()

    console.log('MOCK_EVENTS:', MOCK_EVENTS)
    console.log('Type of MOCK_EVENTS:', typeof MOCK_EVENTS)
    console.log('Length:', MOCK_EVENTS?.length)

    console.log('Saving mock events to MinIO...')
    await saveEventMetadata(MOCK_EVENTS)

    console.log('Migration completed successfully!')
    console.log(`Migrated ${MOCK_EVENTS.length} events`)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateMockData()