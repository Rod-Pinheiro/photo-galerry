import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEvent, getEventById, deleteEventPhoto, uploadEventPhoto } from '@/lib/photo-service'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn()
  }
}))

// Mock MinIO functions
vi.mock('@/lib/minio', () => ({
  deletePhoto: vi.fn(),
  uploadPhoto: vi.fn()
}))

describe('photo-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const mockDb = await import('@/lib/db')
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{
          id: 'test-event-id',
          name: 'Test Event',
          date: new Date('2024-12-01'),
          thumbnail: '/placeholder.jpg',
          visible: true
        }]
      })
      mockDb.db.query = mockQuery

      const result = await createEvent('Test Event', new Date('2024-12-01'))

      expect(result).toEqual({
        id: 'test-event-id',
        name: 'Test Event',
        date: expect.any(Date),
        thumbnail: '/placeholder.jpg',
        photos: [],
        visible: true
      })
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe('getEventById', () => {
    it('should return undefined when event not found', async () => {
      const mockDb = await import('@/lib/db')
      const mockQuery = vi.fn().mockResolvedValue({
        rows: []
      })
      mockDb.db.query = mockQuery

      const result = await getEventById('non-existent-id')

      expect(result).toBeUndefined()
    })
  })

  // Skip upload test for now - focus on delete functionality
  // describe('uploadEventPhoto', () => {
  //   it('should create photo with unique ID and correct filename', async () => {
  //     // Test implementation here
  //   })
  // })

  describe('deleteEventPhoto', () => {
    it('should delete photo from database and MinIO', async () => {
      const mockDb = await import('@/lib/db')
      const mockMinio = await import('@/lib/minio')
      
      const mockQuery = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            filename: 'event-123/1234567890-test.jpg'
          }]
        })
        .mockResolvedValueOnce({ rowCount: 1 })
      
      mockDb.db.query = mockQuery
      mockMinio.deletePhoto = vi.fn().mockResolvedValue(undefined)

      await deleteEventPhoto('event-123', 'photo-unique-id')

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT filename FROM photos WHERE id = $1',
        ['photo-unique-id']
      )
      expect(mockMinio.deletePhoto).toHaveBeenCalledWith('event-123/1234567890-test.jpg')
    })

    it('should throw error when photo not found', async () => {
      const mockDb = await import('@/lib/db')
      
      const mockQuery = vi.fn().mockResolvedValue({
        rows: []
      })
      
      mockDb.db.query = mockQuery

      await expect(deleteEventPhoto('event-123', 'non-existent-id')).rejects.toThrow('Photo not found in database')
    })
  })
})