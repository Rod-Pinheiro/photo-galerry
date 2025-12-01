import { db } from '../lib/db.js'

async function createTables() {
  try {
    console.log('Creating tables...')

    // Create events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        thumbnail TEXT,
        visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create photos table
    await db.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create index on event_id for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id)
    `)

    console.log('Tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
  } finally {
    await db.end()
  }
}

createTables()