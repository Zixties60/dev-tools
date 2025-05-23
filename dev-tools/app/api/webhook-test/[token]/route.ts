import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { TOKEN_EXPIRATION, REDIS_KEYS } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    const tokenObj = JSON.parse(tokenData);
    
    // Store the request
    const requestId = uuidv4();
    const timestamp = Date.now();
    
    // Get request headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Get request body
    let body = '';
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const jsonBody = await request.json();
        body = JSON.stringify(jsonBody, null, 2);
      } catch (e) {
        body = '[Invalid JSON]';
      }
    } else if (contentType.includes('text/')) {
      body = await request.text();
    } else {
      body = '[Binary data not shown]';
    }
    
    // Store request data with the SAME expiration as the token
    const requestData = {
      id: requestId,
      token,
      timestamp,
      method: request.method,
      path: request.url,
      headers,
      body,
    };
    
    // Get the remaining TTL of the token to use for the request data
    const tokenTTL = await redis.ttl(`${REDIS_KEYS.TOKEN}${token}`);
    const expirationTime = tokenTTL > 0 ? tokenTTL : TOKEN_EXPIRATION;
    
    // Store in Redis with the same expiration as the token
    await redis.set(
      `${REDIS_KEYS.REQUEST}${token}:${requestId}`,
      JSON.stringify(requestData),
      { EX: expirationTime }
    );
    
    // Prepare response based on configuration
    const config = tokenObj.config;
    const responseHeaders: HeadersInit = {};
    
    if (config.headers && Array.isArray(config.headers)) {
      config.headers.forEach((header: { key: string; value: string }) => {
        if (header.key && header.value) {
          responseHeaders[header.key] = header.value;
        }
      });
    }
    
    let responseBody: string | null = null;
    
    if (config.type === 'json') {
      responseHeaders['Content-Type'] = 'application/json';
      responseBody = config.body || '{}';
    } else if (config.type === 'text') {
      responseHeaders['Content-Type'] = 'text/plain';
      responseBody = config.body || '';
    }
    
    if (responseBody === null) {
      return new NextResponse(null, {
        status: config.status || 200,
        headers: responseHeaders,
      });
    }
    
    return new NextResponse(responseBody, {
      status: config.status || 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}