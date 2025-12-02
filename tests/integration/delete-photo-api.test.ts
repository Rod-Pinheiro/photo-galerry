import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSessionFromRequest: vi.fn()
}))

vi.mock('@/lib/photo-service', () => ({
  deleteEventPhoto: vi.fn(),
  invalidateEventsCache: vi.fn()
}))

describe('/api/admin/events/[id]/photos/[photoId] DELETE', () => {
  let mockRequest: any
  let mockParams: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRequest = {
      headers: new Headers()
    }
    
    mockParams = Promise.resolve({
      id: 'test-event-id',
      photoId: 'test-photo-id'
    })
  })

  it('should delete photo successfully with valid session', async () => {
    const { getSessionFromRequest } = await import('@/lib/auth')
    const { deleteEventPhoto, invalidateEventsCache } = await import('@/lib/photo-service')
    
    vi.mocked(getSessionFromRequest).mockResolvedValue({ username: 'admin', role: 'admin', iat: 123, exp: 123456 })
    vi.mocked(deleteEventPhoto).mockResolvedValue(undefined)
    vi.mocked(invalidateEventsCache).mockResolvedValue(undefined)

    // Import route after mocking
    const { DELETE } = await import('@/app/api/admin/events/[id]/photos/[photoId]/route')
    
    const response = await DELETE(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(deleteEventPhoto).toHaveBeenCalledWith('test-event-id', 'test-photo-id')
    expect(invalidateEventsCache).toHaveBeenCalled()
  })

  it('should return 401 when no session', async () => {
    const { getSessionFromRequest } = await import('@/lib/auth')
    
    vi.mocked(getSessionFromRequest).mockResolvedValue(null)

    const { DELETE } = await import('@/app/api/admin/events/[id]/photos/[photoId]/route')
    
    const response = await DELETE(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should handle photoId with URL encoding', async () => {
    const { getSessionFromRequest } = await import('@/lib/auth')
    const { deleteEventPhoto, invalidateEventsCache } = await import('@/lib/photo-service')
    
    vi.mocked(getSessionFromRequest).mockResolvedValue({ username: 'admin', role: 'admin', iat: 123, exp: 123456 })
    vi.mocked(deleteEventPhoto).mockResolvedValue(undefined)
    vi.mocked(invalidateEventsCache).mockResolvedValue(undefined)

    mockParams = Promise.resolve({
      id: 'test-event-id',
      photoId: 'photo%20with%20spaces'
    })

    const { DELETE } = await import('@/app/api/admin/events/[id]/photos/[photoId]/route')
    
    const response = await DELETE(mockRequest, { params: mockParams })

    expect(response.status).toBe(200)
    expect(deleteEventPhoto).toHaveBeenCalledWith('test-event-id', 'photo with spaces')
  })

  it('should return 500 when deleteEventPhoto throws error', async () => {
    const { getSessionFromRequest } = await import('@/lib/auth')
    const { deleteEventPhoto } = await import('@/lib/photo-service')
    
    vi.mocked(getSessionFromRequest).mockResolvedValue({ username: 'admin', role: 'admin', iat: 123, exp: 123456 })
    vi.mocked(deleteEventPhoto).mockRejectedValue(new Error('Database error'))

    const { DELETE } = await import('@/app/api/admin/events/[id]/photos/[photoId]/route')
    
    const response = await DELETE(mockRequest, { params: mockParams })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})