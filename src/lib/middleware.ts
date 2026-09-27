import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 60 * 1000, max: 100 },
  checkout: { windowMs: 60 * 60 * 1000, max: 10 },
  password: { windowMs: 60 * 60 * 1000, max: 3 },
};

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60 * 1000);

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      limit: config.max,
      remaining: config.max - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.blocked && entry.resetTime > now) {
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count += 1;

  if (entry.count > config.max) {
    entry.blocked = true;
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnecting) {
    return cfConnecting;
  }

  return 'unknown';
}

export function withRateLimit(
  type: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): (request: NextRequest) => NextResponse | null {
  return (request: NextRequest): NextResponse | null => {
    const clientId = getClientIdentifier(request);
    const result = checkRateLimit(clientId, type);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      );
    }

    return null;
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function addCSPHeader(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', cspDirectives);
  return response;
}

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';

export function generateCSRFToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const signature = Buffer.from(`${timestamp}${randomPart}${CSRF_SECRET}`)
    .toString('base64')
    .substring(0, 32);

  return `${timestamp}.${randomPart}.${signature}`;
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [timestamp, randomPart, signature] = parts;
  const expectedSignature = Buffer.from(`${timestamp}${randomPart}${CSRF_SECRET}`)
    .toString('base64')
    .substring(0, 32);

  if (signature !== expectedSignature) return false;

  const tokenTime = parseInt(timestamp, 36);
  const tokenAge = Date.now() - tokenTime;
  const MAX_AGE = 24 * 60 * 60 * 1000;

  return tokenAge < MAX_AGE;
}

const suspiciousPatterns = [
  /(\bunion\b.*\bselect\b)/i,
  /(\binsert\b.*\binto\b)/i,
  /(\bdelete\b.*\bfrom\b)/i,
  /(\bdrop\b.*\btable\b)/i,
  /(\bor\b\s+\d+\s*=\s*\d+)/i,
  /(\band\b\s+\d+\s*=\s*\d+)/i,
  /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi,
  /(javascript\s*:)/gi,
  /(on\w+\s*=)/gi,
];

export function sanitizeInput(input: string): string {
  let sanitized = input;

  sanitized = sanitized.replace(/</g, '&lt;');
  sanitized = sanitized.replace(/>/g, '&gt;');
  sanitized = sanitized.replace(/"/g, '&quot;');
  sanitized = sanitized.replace(/'/g, '&#x27;');

  return sanitized;
}

export function detectSuspiciousInput(input: string): boolean {
  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

export function validateRequestBody(
  body: unknown,
  schema: Record<string, unknown>
): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }

  for (const [key, expectedType] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)[key];

    if (expectedType === 'required' && value === undefined) {
      return false;
    }

    if (value !== undefined && typeof value !== expectedType) {
      return false;
    }
  }

  return true;
}

export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  request: NextRequest
): void {
  const clientId = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const path = request.nextUrl.pathname;

  console.warn({
    timestamp: new Date().toISOString(),
    event,
    clientId,
    userAgent,
    path,
    details,
  });
}
