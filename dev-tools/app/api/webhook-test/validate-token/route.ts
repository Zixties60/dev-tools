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
    
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }
    
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}