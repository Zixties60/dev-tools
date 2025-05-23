import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  let redis = null;

  try {
    redis = await getRedisClient();
    
    // Get all keys related to this token
    const tokenKey = `${REDIS_KEYS.TOKEN}${token}`;
    const requestKeys = await redis.keys(`${REDIS_KEYS.REQUEST}${token}:*`);
    
    // Check if token exists
    const tokenExists = await redis.exists(tokenKey);
    
    if (!tokenExists) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // Delete token and all associated requests
    const keysToDelete = [tokenKey, ...requestKeys];
    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ 
      error: 'Failed to delete token' 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}