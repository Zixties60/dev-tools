import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { REDIS_KEYS } from '@/lib/constants';

// Get all tokens
export async function GET(request: NextRequest) {
  let redis = null;

  try {
    redis = await getRedisClient();
    
    // Get all token keys
    const tokenKeys = await redis.keys(`${REDIS_KEYS.TOKEN}*`);
    
    if (!tokenKeys.length) {
      return NextResponse.json({ tokens: [] });
    }
    
    // Get all token data
    const tokensData = await Promise.all(
      tokenKeys.map(async (key) => {
        const tokenData = await redis.get(key);
        if (!tokenData) return null;
        
        const data = JSON.parse(tokenData);
        const token = key.replace(REDIS_KEYS.TOKEN, '');
        
        return {
          token,
          name: data.name || token,
          createdAt: data.created || Date.now(),
          config: data.config || null
        };
      })
    );
    
    // Filter out any null values and sort by createdAt (newest first)
    const validTokens = tokensData
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return NextResponse.json({ tokens: validTokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tokens',
      tokens: [] 
    }, { status: 500 });
  } finally {
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}