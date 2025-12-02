import { NextRequest, NextResponse } from 'next/server'
import { getMinioClient, BUCKET_NAME } from '@/lib/minio'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    console.log('MinIO API called with params:', resolvedParams)
    if (!resolvedParams.path || resolvedParams.path.length === 0) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const client = getMinioClient()
    const filename = resolvedParams.path.join('/')
    console.log('Trying to get file:', BUCKET_NAME, filename)

    // Get the object from MinIO
    const stream = await client.getObject(BUCKET_NAME, filename)

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Get object metadata for content type
    const stat = await client.statObject(BUCKET_NAME, filename)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': stat.metaData?.['content-type'] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}