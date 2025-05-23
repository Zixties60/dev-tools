import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

// GET endpoint to fetch the configuration for a token
export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  const params = await context.params;
  const token = params.token;
  let redis = null;

  try {
    redis = await getRedisClient();
    
    // Get the token data from Redis
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    const data = JSON.parse(tokenData);
    console.log('Retrieved token data from Redis:', data);
    
    return NextResponse.json({ 
      config: data.config || {
        status: 200,
        type: 'json',
        body: '{\n  "success": true\n}',
        headers: [{ key: "X-Powered-By", value: "DevTools" }]
      }
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch configuration' 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}

// POST endpoint to update the configuration for a token
export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  const params = await context.params;
  const token = params.token;
  let redis = null;

  try {
    const body = await request.json();
    console.log('Received config update request:', body);
    
    redis = await getRedisClient();
    
    // Get the existing token data
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    const data = JSON.parse(tokenData);
    console.log('Current token data:', data);
    
    // Update the configuration
    data.config = {
      status: body.status || 200,
      type: body.type || 'json',
      body: body.body || '',
      headers: body.headers || []
    };
    
    console.log('Updated token data:', data);
    
    // Save the updated data back to Redis
    await redis.set(`${REDIS_KEYS.TOKEN}${token}`, JSON.stringify(data), {
      KEEPTTL: true // Keep the original expiration time
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ 
      error: 'Failed to update configuration' 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}