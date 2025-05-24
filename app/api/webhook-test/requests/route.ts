import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  let redis;
  
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }
  
  try {
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }
    
    // Get all requests for this token
    const requestKeys = await redis.keys(`${REDIS_KEYS.REQUEST}${token}:*`);
    const requests = [];
    
    for (const key of requestKeys) {
      const requestData = await redis.get(key);
      if (requestData) {
        requests.push(JSON.parse(requestData));
      }
    }
    
    // Sort by timestamp, newest first
    requests.sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}