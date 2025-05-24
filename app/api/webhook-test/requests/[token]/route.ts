import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  // Extract token from URL path
  const token = request.nextUrl.pathname.split('/').pop();
  let redis: any = null;

  try {
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenExists = await redis.exists(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenExists) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // Get all requests for this token
    const requestKeys = await redis.keys(`${REDIS_KEYS.REQUEST}${token}:*`);
    
    if (requestKeys.length === 0) {
      return NextResponse.json({ requests: [] });
    }
    
    // Get all request data
    const requestsData = await Promise.all(
      requestKeys.map(async (key: string) => {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      })
    );
    
    // Filter out null values and sort by timestamp (newest first)
    const requests = requestsData
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch requests' 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}