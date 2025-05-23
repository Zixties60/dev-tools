import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

// Get information about a specific token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  let redis = null;

  try {
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenKey = `${REDIS_KEYS.TOKEN}${token}`;
    const tokenExists = await redis.exists(tokenKey);
    
    if (!tokenExists) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // Get token creation timestamp
    const createdAt = await redis.get(`${tokenKey}:created`);
    
    return NextResponse.json({
      token,
      createdAt: createdAt ? parseInt(createdAt) : null
    });
  } catch (error) {
    console.error('Error fetching token info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch token information' 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}

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