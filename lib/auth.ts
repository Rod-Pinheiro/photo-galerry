import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export interface AdminSession {
  username: string
  role: 'admin'
  iat: number
  exp: number
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function createSession(username: string): Promise<string> {
  const session: Omit<AdminSession, 'iat' | 'exp'> = {
    username,
    role: 'admin'
  }

  return await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get('admin-session')?.value
  if (!token) return null

  return await verifySession(token)
}

export async function createAuthResponse(token: string): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })

  // Set HTTP-only cookie with the JWT token
  response.cookies.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Allow cross-site access for different IPs
    maxAge: 24 * 60 * 60 // 24 hours
  })

  return response
}

export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin-session')
  return response
}