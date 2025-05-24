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
    const tokenData = await redis.get(tokenKey);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // Parse token data
    const data = JSON.parse(tokenData);
    
    return NextResponse.json({
      token,
      name: data.name || token,
      createdAt: data.created || Date.now(),
      config: data.config || null
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

// Update token information (e.g., name)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  let redis = null;

  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    redis = await getRedisClient();
    
    // Check if token exists
    const tokenKey = `${REDIS_KEYS.TOKEN}${token}`;
    const tokenData = await redis.get(tokenKey);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    // Update token data with new name
    const data = JSON.parse(tokenData);
    data.name = name.trim();
    
    // Save updated data
    await redis.set(tokenKey, JSON.stringify(data), { 
      KEEPTTL: true // Keep the existing TTL
    });
    
    return NextResponse.json({
      token,
      name: data.name,
      updated: true
    });
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json({ 
      error: 'Failed to update token information' 
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