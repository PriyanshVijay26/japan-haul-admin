import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic (runtime-only, not pre-rendered)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory store for demo purposes
// In production, use a proper database or authentication service
const authenticatedSessions = new Set<string>();

// Admin credentials from environment variables (REQUIRED for security)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // Should be bcrypt hash in production

if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD_HASH environment variables are required');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD_HASH) {
            // Generate session ID using Web Crypto API (works in both Node.js and Edge)
            const sessionId = Array.from(
                crypto.getRandomValues(new Uint8Array(32)),
                (byte) => byte.toString(16).padStart(2, '0')
            ).join('');

            // Store session (in production, use Redis or database)
            authenticatedSessions.add(sessionId);

            // Create response with session cookie
            const response = NextResponse.json({
                success: true,
                message: 'Login successful',
            });

            // Set HTTP-only cookie for security
            response.cookies.set('admin_session', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            return response;
        } else {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/admin/login - Check if user is authenticated
export async function GET(request: NextRequest) {
    const sessionId = request.cookies.get('admin_session');

    if (sessionId && authenticatedSessions.has(sessionId.value)) {
        return NextResponse.json({
            authenticated: true,
        });
    }

    return NextResponse.json({
        authenticated: false,
    });
}
