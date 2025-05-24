import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

// Use the most basic form without custom types
export async function POST(request: Request, { params }: any) {
  const token = params.token;
  let redis = null;
  
  try {
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 404 });
    }
    
    // Parse token data to get response configuration
    const data = JSON.parse(tokenData);
    const config = data.config || {
      status: 200,
      type: 'json',
      body: '{"success": true}',
      headers: [{ key: "X-Powered-By", value: "DevTools" }]
    };
    
    // Store the request for later viewing
    const requestId = uuidv4();
    const timestamp = Date.now();
    
    // Get request body
    let body = null;
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } else {
        body = await request.text();
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = null;
    }
    
    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Extract query parameters
    const url = new URL(request.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    
    // Prepare response based on configuration
    const responseHeaders: HeadersInit = {};
    config.headers.forEach((header: { key: string; value: string }) => {
      if (header.key) {
        responseHeaders[header.key] = header.value;
      }
    });
    
    // Set content type based on response type
    switch (config.type) {
      case 'json':
        responseHeaders['Content-Type'] = 'application/json';
        break;
      case 'text':
        responseHeaders['Content-Type'] = 'text/plain';
        break;
      case 'xml':
        responseHeaders['Content-Type'] = 'application/xml';
        break;
      case 'html':
        responseHeaders['Content-Type'] = 'text/html';
        break;
    }
    
    // Create response
    const responseStatus = parseInt(config.status) || 200;
    const responseBody = config.body || '';
    
    // Store both request and response data in Redis
    await redis.set(
      `${REDIS_KEYS.REQUEST}${token}:${requestId}`,
      JSON.stringify({
        id: requestId,
        timestamp,
        method: request.method,
        path: url.pathname + url.search,
        headers,
        query,
        body,
        response: {
          status: responseStatus,
          headers: responseHeaders,
          body: responseBody
        }
      }),
      { EX: 60 * 60 * 24 * 7 } // Store for 7 days
    );
    
    return new NextResponse(responseBody, {
      status: responseStatus,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}