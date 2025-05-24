import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { TOKEN_EXPIRATION, REDIS_KEYS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  let redis;
  try {
    const body = await request.json();
    const { token, config } = body;
    
    if (!token || !config) {
      return NextResponse.json({ error: 'Token and config are required' }, { status: 400 });
    }
    
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenData = await redis.get(`${REDIS_KEYS.TOKEN}${token}`);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }
    
    // Update token config
    const tokenObj = JSON.parse(tokenData);
    tokenObj.config = config;
    
    // Get the remaining TTL of the token
    const ttl = await redis.ttl(`${REDIS_KEYS.TOKEN}${token}`);
    const expirationTime = ttl > 0 ? ttl : TOKEN_EXPIRATION;
    
    // Store updated config with the same expiration
    await redis.set(
      `${REDIS_KEYS.TOKEN}${token}`, 
      JSON.stringify(tokenObj), 
      { EX: expirationTime }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}