import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, _ctx?: any) {
  try {
    const { searchParams } = new URL(request.url);
    const sz = searchParams.get('sz') || 'w800';

    const path = request.nextUrl ? request.nextUrl.pathname : new URL(request.url).pathname;
    const parts = path.split('/').filter(Boolean);
    const id = parts[parts.length - 1];

    if (!id) {
      return NextResponse.json({ error: 'No file id provided' }, { status: 400 });
    }

    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${id}&sz=${sz}`;

    const response = await fetch(thumbnailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://drive.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable', // allow CDN caching safely per-file
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'x-proxied-url',
        'x-proxied-url': thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Drive image proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy drive image' }, { status: 500 });
  }
}
