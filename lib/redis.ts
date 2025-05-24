import { createClient } from 'redis';

// This function creates and returns a Redis client with no automatic reconnection
export async function getRedisClient() {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 3000, // 3 second timeout
        reconnectStrategy: false // Disable automatic reconnection completely
      }
    });
    
    // Set up error handler that only logs once
    let hasLoggedError = false;
    client.on('error', (err) => {
      if (!hasLoggedError) {
        console.error('Redis connection error:', err);
        hasLoggedError = true;
      }
    });
    
    // Connect to Redis
    await client.connect();
    
    return client;
  } catch (error) {
    // Log the error once and rethrow
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// This function safely disconnects a Redis client
export async function disconnectRedis(client) {
  if (client) {
    try {
      if (client.isOpen) {
        await client.disconnect();
      }
      // Remove all listeners to prevent memory leaks
      client.removeAllListeners();
    } catch (error) {
      // Silently handle disconnect errors
    }
  }
}