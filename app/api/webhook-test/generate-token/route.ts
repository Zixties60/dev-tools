import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, disconnectRedis } from '@/lib/redis';
import { TOKEN_EXPIRATION, REDIS_KEYS } from '@/lib/constants';

export async function POST() {
  let redis = null;
  
  try {
    // Try to get Redis client - this will fail fast if Redis is unavailable
    redis = await getRedisClient();
    
    // Generate a unique token
    const timestamp = Date.now();
    const randomPart = uuidv4().replace(/-/g, '');
    const token = `${timestamp.toString(36)}${randomPart.substring(0, 8)}`;
    
    // Generate a default name with date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    const name = `New Token-${formattedDate}`;
    
    // Store token in Redis with expiration
    await redis.set(
      `${REDIS_KEYS.TOKEN}${token}`, 
      JSON.stringify({
        created: timestamp,
        name: name,
        config: {
          status: 200,
          type: 'json',
          body: '{\n  "success": true\n}',
          headers: [{ key: "X-Powered-By", value: "DevTools" }]
        }
      }), 
      { EX: TOKEN_EXPIRATION }
    );
    
    // Return the token
    return NextResponse.json({ token, name });
  } catch (error) {
    // Return a user-friendly error message
    return NextResponse.json({ 
      error: 'Cannot connect to database. Please try again later.' 
    }, { status: 500 });
  } finally {
    // Always clean up the Redis client
    if (redis) {
      await disconnectRedis(redis);
    }
  }
}