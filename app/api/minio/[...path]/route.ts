import { NextRequest, NextResponse } from 'next/server'
import { getMinioClient, BUCKET_NAME } from '@/lib/minio'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const client = getMinioClient()
    const filename = params.path.join('/')

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