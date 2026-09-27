import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  orderId?: string;
  userRole?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit('api')(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: ContactFormData = await request.json();

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (body.message.trim().length < 20) {
      return NextResponse.json(
        { error: 'Message must be at least 20 characters' },
        { status: 400 }
      );
    }

    console.log('Contact form submission:', {
      timestamp: new Date().toISOString(),
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      orderId: body.orderId,
      userRole: body.userRole,
      messageLength: body.message.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will respond within 24-48 hours.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}
